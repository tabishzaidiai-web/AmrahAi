import { VERTEX_MODELS, vertexConfig } from '../providers/vertex';
import { GoogleAuth } from 'google-auth-library';

/**
 * Reads a garment so the studio can pre-fill what it would otherwise ask.
 *
 * The reading is offered as a suggestion, never applied silently. Tested
 * against real garments it identifies construction well but confuses a long
 * shirt-dress flat lay with a top, and a wrong length is not a cosmetic error:
 * every on-model render gets measured against it and discarded. A visible
 * guess someone can correct is safe; an invisible one is how a shoot fails for
 * reasons nobody can see.
 */

const READER = VERTEX_MODELS.reader;

export interface GarmentReading {
  category: 'top' | 'bottom' | 'one-piece';
  length: 'top' | 'mini' | 'knee' | 'midi' | 'maxi';
  audience: 'adult' | 'kids';
  /** Plain-language summary, usable as alt text or listing copy. */
  description: string;
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    category: { type: 'STRING', enum: ['top', 'bottom', 'one-piece'] },
    length: { type: 'STRING', enum: ['top', 'mini', 'knee', 'midi', 'maxi'] },
    audience: { type: 'STRING', enum: ['adult', 'kids'] },
    description: { type: 'STRING' },
  },
  required: ['category', 'length', 'audience', 'description'],
};

let auth: GoogleAuth | undefined;

export async function readGarment(
  image: { data: string; mimeType: string },
): Promise<GarmentReading> {
  const { project } = vertexConfig();
  if (!project) throw new Error('Vertex is not configured');

  auth ??= process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    ? new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      })
    : new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

  const { token } = await (await auth.getClient()).getAccessToken();

  const response = await fetch(
    `https://${READER.location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${READER.location}/publishers/google/models/${READER.id}:generateContent`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: image.data, mimeType: image.mimeType } },
              {
                text: 'Identify this garment. For length, judge where the hem would fall on a standing adult body. Answer as JSON.',
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Could not read the garment: ${response.status}`);
  }

  const body = await response.json();
  const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('The garment reader returned nothing');

  return JSON.parse(text) as GarmentReading;
}
