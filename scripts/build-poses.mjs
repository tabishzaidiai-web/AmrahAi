/**
 * Generates the house-model pose library.
 *
 * Run once: `node scripts/build-poses.mjs`
 *
 * The front pose is generated first and then passed as a reference into every
 * other pose, so the same person appears throughout. Identity consistency here
 * is what lets a bundle read as one photoshoot rather than four unrelated ones.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GoogleAuth } from 'google-auth-library';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const MODEL = 'gemini-3-pro-image';
const OUT = path.join(process.cwd(), 'assets', 'poses');

if (!PROJECT) {
  console.error('Set GOOGLE_CLOUD_PROJECT');
  process.exit(1);
}

// Held constant across every pose so lighting, framing and wardrobe match.
const BASE = [
  'Full-length fashion e-commerce photograph of a single female model, head to feet fully in frame with headroom above and shoes visible.',
  'She wears plain fitted neutral light-grey basics: a simple short-sleeve top and slim trousers, no pattern, no logo, no jewellery.',
  'Plain seamless light-grey studio background. Soft even diffused studio lighting, no harsh shadows.',
  'Natural realistic skin texture with visible pores, not airbrushed. Anatomically correct hands with exactly five fingers. Photorealistic, sharp focus, shot on an 85mm lens.',
  'Vertical 3:4 portrait composition.',
].join(' ');

const POSES = [
  { id: 'front', direction: 'She stands facing the camera directly, front view, arms relaxed at her sides, weight even, neutral expression.' },
  { id: 'back', direction: 'She stands with her back fully to the camera, rear view, head facing away, arms relaxed at her sides.' },
  { id: 'three-quarter', direction: 'She stands turned roughly 45 degrees away from the camera in a three-quarter view, head turned back toward the lens.' },
  { id: 'lifestyle', direction: 'She stands in a relaxed natural stance, weight on one leg, one hand loose at her side, facing slightly off-camera.' },
];

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

async function generate(prompt, reference) {
  const { token } = await (await auth.getClient()).getAccessToken();
  const parts = [];
  if (reference) {
    parts.push({ inlineData: { data: reference.toString('base64'), mimeType: 'image/png' } });
  }
  parts.push({ text: prompt });

  const response = await fetch(
    `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/global/publishers/google/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['IMAGE'] },
      }),
    },
  );

  if (!response.ok) throw new Error(`${response.status}: ${(await response.text()).slice(0, 300)}`);

  const body = await response.json();
  const image = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!image) throw new Error('No image returned');
  return Buffer.from(image.inlineData.data, 'base64');
}

await mkdir(OUT, { recursive: true });

let frontReference;
for (const pose of POSES) {
  const isFront = pose.id === 'front';
  const prompt = isFront
    ? `${BASE} ${pose.direction}`
    : `Using the supplied photograph as the reference for the person, generate the SAME woman — identical face, hair, body proportions, skin tone and identical clothing — photographed again in the same studio with the same lighting and framing. ${pose.direction} ${BASE}`;

  process.stdout.write(`${pose.id}… `);
  const image = await generate(prompt, isFront ? undefined : frontReference);
  if (isFront) frontReference = image;

  await writeFile(path.join(OUT, `${pose.id}.png`), image);
  console.log(`${(image.length / 1024).toFixed(0)}KB`);
}

console.log(`\nPose library written to ${OUT}`);
