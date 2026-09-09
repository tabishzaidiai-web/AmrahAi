import { GoogleAuth } from 'google-auth-library';

/**
 * Vertex AI REST access.
 *
 * The generative image and video models are reached through `:predict` rather
 * than the Gemini SDK, so this calls the endpoints directly and keeps auth in
 * one place.
 */

const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

export const VERTEX_MODELS = {
  tryOn: 'virtual-try-on-001',
  image: 'gemini-3.1-flash-image',
  video: 'veo-3.1-fast-generate-preview',
} as const;

export function vertexConfig() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION ?? 'us-central1';
  return { project, location, configured: Boolean(project) };
}

let auth: GoogleAuth | undefined;

async function token(): Promise<string> {
  auth ??= new GoogleAuth({ scopes: [SCOPE] });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Could not obtain a Google Cloud access token');
  return token;
}

function endpoint(model: string, method: 'predict' | 'predictLongRunning') {
  const { project, location } = vertexConfig();
  return `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:${method}`;
}

async function call(url: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Vertex ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response.json();
}

export async function predict(model: string, body: unknown) {
  return call(endpoint(model, 'predict'), body);
}

/** Vertex returns base64 rather than a URL, so images come back as buffers and
 *  are persisted by the caller. */
export function firstPredictionBytes(data: Record<string, unknown>): Buffer {
  const predictions = data.predictions as { bytesBase64Encoded?: string }[] | undefined;
  const b64 = predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('Vertex returned no image data');
  return Buffer.from(b64, 'base64');
}

/** Video generation is long-running: start the operation, then poll it. */
export async function generateVideo(
  body: unknown,
  { timeoutMs = 300_000, intervalMs = 8_000 } = {},
): Promise<string> {
  const started = await call(endpoint(VERTEX_MODELS.video, 'predictLongRunning'), body);
  const operation = started.name as string | undefined;
  if (!operation) throw new Error('Vertex did not return a video operation');

  const { project, location } = vertexConfig();
  const fetchUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${VERTEX_MODELS.video}:fetchPredictOperation`;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const status = await call(fetchUrl, { operationName: operation });

    if (status.error) {
      const err = status.error as { message?: string };
      throw new Error(err.message ?? 'Video generation failed');
    }
    if (status.done) {
      const response = status.response as
        | { videos?: { gcsUri?: string; bytesBase64Encoded?: string }[] }
        | undefined;
      const video = response?.videos?.[0];
      const uri = video?.gcsUri;
      if (uri) return uri;
      throw new Error('Video completed without a retrievable URI');
    }
  }

  throw new Error('Video generation timed out');
}
