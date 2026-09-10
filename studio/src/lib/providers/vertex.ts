import { GoogleAuth } from 'google-auth-library';

/**
 * Vertex AI REST access.
 *
 * Models are not uniformly available: try-on is served from a regional
 * endpoint while the Gemini image models are served from `global`, and the two
 * families use different request shapes. Both differences are absorbed here so
 * providers stay declarative.
 */

const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

export interface ModelRef {
  id: string;
  location: string;
}

export const VERTEX_MODELS = {
  tryOn: { id: 'virtual-try-on-001', location: 'us-central1' },
  image: { id: 'gemini-3.1-flash-image', location: 'global' },
  imagePro: { id: 'gemini-3-pro-image', location: 'global' },
  video: { id: 'veo-3.1-fast-generate-001', location: 'us-central1' },
} as const satisfies Record<string, ModelRef>;

export function vertexConfig() {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  return { project, configured: Boolean(project) };
}

let auth: GoogleAuth | undefined;

/**
 * Serverless hosts have no filesystem to hold a key file, so the service
 * account is read from the environment when present and falls back to
 * application default credentials locally.
 */
function googleAuth(): GoogleAuth {
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    return new GoogleAuth({ scopes: [SCOPE], credentials: JSON.parse(inline) });
  }
  return new GoogleAuth({ scopes: [SCOPE] });
}

async function token(): Promise<string> {
  auth ??= googleAuth();
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Could not obtain a Google Cloud access token');
  return token;
}

/** `global` is reached on the bare host; every other location is prefixed. */
function host(location: string) {
  return location === 'global'
    ? 'aiplatform.googleapis.com'
    : `${location}-aiplatform.googleapis.com`;
}

function url(model: ModelRef, method: string) {
  const { project } = vertexConfig();
  return `https://${host(model.location)}/v1/projects/${project}/locations/${model.location}/publishers/google/models/${model.id}:${method}`;
}

async function call(endpoint: string, body: unknown): Promise<Record<string, unknown>> {
  const response = await fetch(endpoint, {
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

/** Try-on uses the prediction shape and returns base64 in `predictions`. */
export async function predictTryOn(personBase64: string, garmentBase64: string): Promise<Buffer> {
  const data = await call(url(VERTEX_MODELS.tryOn, 'predict'), {
    instances: [
      {
        personImage: { image: { bytesBase64Encoded: personBase64 } },
        productImages: [{ image: { bytesBase64Encoded: garmentBase64 } }],
      },
    ],
    parameters: { sampleCount: 1 },
  });

  const predictions = data.predictions as { bytesBase64Encoded?: string }[] | undefined;
  const b64 = predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('Try-on returned no image');
  return Buffer.from(b64, 'base64');
}

export interface ImagePart {
  data: string;
  mimeType: string;
}

/** Gemini image models use generateContent and return inline image parts. */
export async function generateImage(
  model: ModelRef,
  prompt: string,
  references: ImagePart[] = [],
): Promise<Buffer> {
  const parts: Record<string, unknown>[] = references.map((r) => ({
    inlineData: { data: r.data, mimeType: r.mimeType },
  }));
  parts.push({ text: prompt });

  const data = await call(url(model, 'generateContent'), {
    contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });

  const candidates = data.candidates as
    | { content?: { parts?: { inlineData?: { data?: string } }[] } }[]
    | undefined;
  const image = candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!image?.inlineData?.data) throw new Error('Image model returned no image');
  return Buffer.from(image.inlineData.data, 'base64');
}

/** Video generation is long-running: start the operation, then poll it. */
export async function generateVideo(
  body: unknown,
  { timeoutMs = 360_000, intervalMs = 10_000 } = {},
): Promise<string> {
  const started = await call(url(VERTEX_MODELS.video, 'predictLongRunning'), body);
  const operation = started.name as string | undefined;
  if (!operation) throw new Error('Vertex did not return a video operation');

  const fetchUrl = url(VERTEX_MODELS.video, 'fetchPredictOperation');
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
      if (video?.gcsUri) return video.gcsUri;
      if (video?.bytesBase64Encoded) return `data:video/mp4;base64,${video.bytesBase64Encoded}`;
      throw new Error('Video completed without a retrievable result');
    }
  }

  throw new Error('Video generation timed out');
}
