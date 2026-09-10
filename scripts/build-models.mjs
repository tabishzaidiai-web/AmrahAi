/**
 * Generates the house-model library.
 *
 * Run: `node scripts/build-models.mjs [modelId ...]`
 *
 * For each model the front pose is generated first and then passed as the
 * reference for every other pose, so the same person appears throughout. That
 * consistency is what lets a bundle read as one photoshoot.
 *
 * Output is JPEG rather than PNG: these are inputs to try-on, where the
 * difference is invisible, and it keeps the library small enough to deploy.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GoogleAuth } from 'google-auth-library';
import sharp from 'sharp';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const MODEL = 'gemini-3-pro-image';
const OUT = path.join(process.cwd(), 'assets', 'models');

if (!PROJECT) {
  console.error('Set GOOGLE_CLOUD_PROJECT');
  process.exit(1);
}

/** Held constant so every model is framed and lit identically. */
const BASE = [
  'Full-length fashion e-commerce photograph, head to feet fully in frame with headroom above and shoes visible.',
  'She wears plain fitted neutral light-grey basics: a simple short-sleeve top and slim trousers, no pattern, no logo, no jewellery.',
  'Plain seamless light-grey studio background. Soft even diffused studio lighting, no harsh shadows.',
  'Natural realistic skin texture with visible pores, not airbrushed or plastic. Anatomically correct hands with exactly five fingers.',
  'Poised, confident, editorial fashion presence. Photorealistic, sharp focus, shot on an 85mm lens.',
  'Vertical 3:4 portrait composition.',
].join(' ');

export const MODEL_BRIEFS = {
  amira: 'A South Asian woman in her late twenties with warm medium-brown skin, dark brown hair drawn back, refined editorial features.',
  leila: 'A Middle Eastern woman in her late twenties with olive skin, long dark hair drawn back, strong elegant features.',
  mei: 'An East Asian woman in her mid twenties with fair warm skin and dark hair drawn back into a sleek low bun.',
  nala: 'A Black woman in her late twenties with deep brown skin and short natural hair, striking editorial features.',
  sofia: 'A White woman in her late twenties with light skin and dark blonde hair drawn back, classic editorial features.',
};

const POSES = [
  { id: 'front', direction: 'She stands facing the camera directly, front view, arms relaxed at her sides, weight even, neutral expression.' },
  { id: 'back', direction: 'She stands with her back fully to the camera, rear view, head facing away, arms relaxed at her sides.' },
  { id: 'three-quarter', direction: 'She stands turned roughly 45 degrees from the camera in a three-quarter view, head turned back toward the lens.' },
  { id: 'lifestyle', direction: 'She stands in a relaxed natural stance, weight on one leg, one hand loose at her side, facing slightly off-camera.' },
];

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

/** Image generation is slow enough that a transient network blip is likely
 *  across a twenty-image run, and losing the whole batch to one is wasteful. */
async function generateWithRetry(prompt, reference, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      return await generate(prompt, reference);
    } catch (error) {
      if (i >= attempts) throw error;
      process.stdout.write(`retry ${i}… `);
      await new Promise((r) => setTimeout(r, 4000 * i));
    }
  }
}

async function generate(prompt, reference) {
  const { token } = await (await auth.getClient()).getAccessToken();
  const parts = [];
  if (reference) {
    parts.push({ inlineData: { data: reference.toString('base64'), mimeType: 'image/jpeg' } });
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

  return sharp(Buffer.from(image.inlineData.data, 'base64'))
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

const requested = process.argv.slice(2);
const ids = requested.length > 0 ? requested : Object.keys(MODEL_BRIEFS);

for (const id of ids) {
  const brief = MODEL_BRIEFS[id];
  if (!brief) {
    console.error(`Unknown model "${id}"`);
    continue;
  }

  const dir = path.join(OUT, id);
  await mkdir(dir, { recursive: true });
  console.log(`\n${id}`);

  let reference;
  for (const pose of POSES) {
    const isFront = pose.id === 'front';
    const prompt = isFront
      ? `${BASE} ${brief} ${pose.direction}`
      : `Using the supplied photograph as the reference for the person, generate the SAME woman — identical face, hair, body proportions, skin tone and identical clothing — photographed again in the same studio with the same lighting and framing. ${pose.direction} ${BASE}`;

    process.stdout.write(`  ${pose.id}… `);
    const image = await generateWithRetry(prompt, isFront ? undefined : reference);
    if (isFront) reference = image;

    await writeFile(path.join(dir, `${pose.id}.jpg`), image);
    console.log(`${(image.length / 1024).toFixed(0)}KB`);
  }
}

// Thumbnails for the picker. Served as static files rather than read through
// the API, so choosing a model costs nothing.
const THUMBS = path.join(process.cwd(), 'public', 'models');
await mkdir(THUMBS, { recursive: true });

for (const id of ids) {
  if (!MODEL_BRIEFS[id]) continue;
  await sharp(path.join(OUT, id, 'front.jpg'))
    .resize(300, 400, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 82 })
    .toFile(path.join(THUMBS, `${id}.jpg`));
}

console.log(`\nModel library written to ${OUT}`);
console.log(`Thumbnails written to ${THUMBS}`);
