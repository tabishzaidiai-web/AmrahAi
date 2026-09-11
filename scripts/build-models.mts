/**
 * Generates the house-model library.
 *
 * Run: `npx tsx scripts/build-models.mts [modelId ...]`
 *
 * TypeScript so it can share the app's own framing check rather than keeping a
 * second copy of it: a pose cropped at the ankles is exactly as useless here as
 * a shoot cropped at the ankles, and the rule for deciding should not drift
 * between the two.
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
import { checkFraming } from '../src/lib/pipeline/framing';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const MODEL = 'gemini-3-pro-image';
const OUT = path.join(process.cwd(), 'assets', 'models');

if (!PROJECT) {
  console.error('Set GOOGLE_CLOUD_PROJECT');
  process.exit(1);
}

/**
 * Held constant so every model is framed and lit identically.
 *
 * The old version asked for a neutral expression and got exactly that: a
 * library of people who looked like passport photographs. A garment is sold by
 * someone who looks like they want to be wearing it, so the brief now asks for
 * warmth and presence. Everything about the frame, the lighting and the plain
 * basics stays fixed, because that consistency is what lets a drop read as one
 * photoshoot.
 */
const BASE = [
  // Framing first, and in these words, because the editorial language below
  // pulls hard toward a portrait crop: asked for "a top runway model" without
  // this, the men came back cropped at mid-thigh.
  'FULL-LENGTH HEAD-TO-TOE PHOTOGRAPH. This is a full-body shot, not a portrait: the entire figure is in frame from the top of the head to the shoes on the floor.',
  'Clear empty space above the head and visible floor below the feet. Never crop the head, the legs or the feet. The figure occupies about 80% of the frame height, standing at a distance.',
  'A top international runway model signed to a major agency — the calibre of face that books magazine covers.',
  'Exceptional bone structure: high sculpted cheekbones, a defined jawline, a strong symmetrical face, large luminous eyes, full lips.',
  'Tall, long-limbed runway proportions, roughly seven and a half heads tall. The head is not enlarged relative to the body.',
  'Professional hair and makeup: glossy well-styled hair, flawless natural glam, groomed brows, subtle highlighter on the cheekbones.',
  'Skin flawless and radiant but still real — fine natural texture, not plastic or over-retouched.',
  'Simple plain flat shoes.',
  'Plain seamless light-grey studio cyclorama. Soft directional beauty lighting with a large key and gentle fill, giving quiet shape to the face rather than flat even light.',
  'NOTHING else in the frame: no studio lights, softboxes, stands, reflectors, cables, furniture or props. Nobody else.',
  'Confident, magnetic, engaged — the look of someone who knows the camera loves them.',
  'Anatomically correct hands with exactly five fingers.',
  'Photorealistic, tack sharp, shot on an 85mm lens. Vertical 3:4 composition. Editorial fashion quality.',
].join(' ');

/** What each model wears, so the garment being fitted later has a plain base. */
const BASICS = {
  women:
    'She wears plain fitted neutral light-grey basics: a simple short-sleeve top and slim trousers, no pattern, no logo, no jewellery.',
  men: 'He wears plain fitted neutral light-grey basics: a simple short-sleeve crew-neck t-shirt and slim trousers, no pattern, no logo, no jewellery.',
};

/**
 * Who each model is. Invented people, described by look rather than by
 * resemblance to anyone: nothing here names or points at a real person.
 */
export const MODEL_BRIEFS = {
  // Women
  aditi: { gender: 'women', brief: 'A strikingly beautiful Indian woman in her late twenties with warm medium-brown skin, large expressive dark eyes, defined cheekbones and long glossy black hair drawn back.' },
  zara: { gender: 'women', brief: 'A strikingly beautiful Pakistani woman in her mid twenties with fair wheatish skin, light hazel eyes, elegant features and dark brown hair drawn back.' },
  yuki: { gender: 'women', brief: 'A strikingly beautiful Japanese woman in her mid twenties with fair porcelain skin, delicate refined features and sleek straight black hair drawn back.' },
  lin: { gender: 'women', brief: 'A strikingly beautiful Chinese woman in her late twenties with fair warm skin, high cheekbones, elegant almond eyes and dark hair in a sleek low bun.' },
  anastasia: { gender: 'women', brief: 'A strikingly beautiful Russian woman in her mid twenties with pale skin, clear blue-grey eyes, sculpted cheekbones and light ash-blonde hair drawn back.' },
  greta: { gender: 'women', brief: 'A strikingly beautiful German woman in her late twenties with fair skin, green eyes, strong clean features and dark blonde hair drawn back.' },
  leila: { gender: 'women', brief: 'A strikingly beautiful Middle Eastern woman in her late twenties with olive skin, deep brown eyes, strong elegant features and long dark hair drawn back.' },
  nala: { gender: 'women', brief: 'A strikingly beautiful Black woman in her late twenties with deep brown skin, luminous features, sculpted cheekbones and short natural hair.' },

  // Men
  arjun: { gender: 'men', brief: 'A strikingly handsome Indian man in his late twenties with warm medium-brown skin, a defined jawline, dark expressive eyes, short dark hair and a neat short beard. Tall and lean.' },
  bilal: { gender: 'men', brief: 'A strikingly handsome Pakistani man in his early thirties with wheatish skin, a strong jawline, dark eyes, short dark hair and a well-groomed beard. Tall and broad-shouldered.' },
  haruto: { gender: 'men', brief: 'A strikingly handsome Japanese man in his late twenties with fair skin, refined features, dark eyes and soft short black hair. Tall and slim.' },
  chen: { gender: 'men', brief: 'A strikingly handsome Chinese man in his late twenties with fair warm skin, sharp cheekbones, dark eyes and short neatly cut black hair. Tall and lean.' },
  maksim: { gender: 'men', brief: 'A strikingly handsome Russian man in his early thirties with fair skin, blue eyes, a strong jawline and short light-brown hair. Tall and athletic.' },
  lukas: { gender: 'men', brief: 'A strikingly handsome German man in his late twenties with fair skin, grey-blue eyes, clean strong features and short dark-blond hair. Tall and athletic.' },
};

/**
 * Written for "the model" rather than "she", because the library now has men in
 * it, and each pose carries its own expression: a library where every shot
 * wears the same face is the thing being fixed.
 */
const POSES = [
  { id: 'front', direction: 'The model stands facing the camera directly, front view, arms relaxed at their sides, weight even. Looking straight down the lens with a warm, confident, engaged expression and the faintest natural smile.' },
  { id: 'back', direction: 'The model stands with their back fully to the camera, rear view, head facing away, arms relaxed at their sides.' },
  { id: 'three-quarter', direction: 'The model stands turned roughly 45 degrees from the camera in a three-quarter view, head turned back toward the lens with a relaxed half-smile, chin slightly lifted.' },
  { id: 'lifestyle', direction: 'The model stands in a relaxed natural stance, weight on one leg, one hand loose at their side, glancing slightly off-camera with an easy candid expression, as if caught mid-conversation.' },
];

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

/**
 * Retries, patiently enough for a rate limit rather than just a network blip.
 *
 * A fourteen-model run is fifty-six generations, which is well past the image
 * model's per-minute allowance. The first version backed off four, eight and
 * twelve seconds, which is the right shape for a dropped connection and far too
 * quick for a quota: it burned its three attempts inside half a minute and took
 * the whole batch down at the fifth model. Quotas refill on the minute, so the
 * waits are now measured in minutes too.
 */
async function generateWithRetry(prompt, reference, attempts = 6) {
  for (let i = 1; ; i++) {
    try {
      return await generate(prompt, reference);
    } catch (error) {
      if (i >= attempts) throw error;
      const exhausted = /429|RESOURCE_EXHAUSTED/.test(String(error.message));
      const waitMs = exhausted ? 45_000 * i : 4_000 * i;
      process.stdout.write(`${exhausted ? 'quota' : 'retry'} ${i} (${waitMs / 1000}s)… `);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

/** Spacing between generations, so a long run stays under the per-minute
 *  allowance instead of sprinting into it and then waiting out a penalty. */
const PACE_MS = 12_000;

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
        generationConfig: {
          responseModalities: ['IMAGE'],
          // Portrait, matching the shape every shoot is rendered at.
          imageConfig: { aspectRatio: '3:4' },
        },
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
  const entry = MODEL_BRIEFS[id];
  if (!entry) {
    console.error(`Unknown model "${id}"`);
    continue;
  }
  const brief = `${entry.brief} ${BASICS[entry.gender]}`;

  const dir = path.join(OUT, id);
  await mkdir(dir, { recursive: true });
  console.log(`\n${id}`);

  let reference;
  for (const pose of POSES) {
    const isFront = pose.id === 'front';
    const prompt = isFront
      ? `${BASE} ${brief} ${pose.direction}`
      : `Using the supplied photograph as the reference for the person, generate the SAME person — identical face, hair, body proportions, skin tone and identical clothing — photographed again in the same studio with the same lighting and framing. ${pose.direction} ${BASE}`;

    process.stdout.write(`  ${pose.id}… `);

    // Up to three goes at a frame that holds the whole person. The back pose is
    // exempt: with the model facing away there is no face to anchor on and the
    // check has nothing useful to say about a figure seen from behind.
    let image;
    for (let attempt = 1; attempt <= 3; attempt++) {
      image = await generateWithRetry(prompt, isFront ? undefined : reference);
      await new Promise((r) => setTimeout(r, PACE_MS));
      if (pose.id === 'back' || attempt === 3) break;
      const framing = await checkFraming(image);
      if (framing.ok) break;
      process.stdout.write('reframe… ');
    }
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
