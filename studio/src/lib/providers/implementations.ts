import { FAL_ENDPOINTS, falRun, firstMediaUrl } from './fal';
import type {
  ImageProvider,
  TryOnProvider,
  VideoProvider,
} from './types';

async function timed(fn: () => Promise<string>) {
  const started = Date.now();
  const url = await fn();
  return { url, latencyMs: Date.now() - started };
}

/**
 * Try-on is the product's core guarantee: the garment must survive generation
 * unchanged. Purpose-built try-on models are used here rather than general
 * image models, which hallucinate garment detail.
 */
export const fashnTryOn: TryOnProvider = {
  kind: 'tryon',
  id: 'fashn-v1.6',
  name: 'FASHN v1.6',
  region: 'us',
  unitCost: 0.075,
  async run(input) {
    const { url, latencyMs } = await timed(async () =>
      firstMediaUrl(
        await falRun(FAL_ENDPOINTS.tryon, {
          model_image: input.person.referenceUrl,
          garment_image: input.garment.url,
          category: input.garment.category === 'one-piece' ? 'one-pieces' : `${input.garment.category}s`,
          mode: 'quality',
        }),
      ),
    );
    return { url, providerId: this.id, cost: this.unitCost, latencyMs };
  },
};

/** Multi-reference image model used to propagate a look to further angles. */
export const seedreamImage: ImageProvider = {
  kind: 'image',
  id: 'seedream-4.0',
  name: 'Seedream 4.0',
  region: 'cn',
  unitCost: 0.03,
  async run(input) {
    const { url, latencyMs } = await timed(async () =>
      firstMediaUrl(
        await falRun(FAL_ENDPOINTS.seedream, {
          prompt: input.prompt,
          image_urls: input.references,
          image_size: aspectToSize(input.aspectRatio, input.resolution),
        }),
      ),
    );
    return { url, providerId: this.id, cost: this.unitCost, latencyMs };
  },
};

/** Western-region alternative for customers who forbid CN routing. */
export const fluxImage: ImageProvider = {
  kind: 'image',
  id: 'flux-pro-1.1-ultra',
  name: 'FLUX Pro 1.1 Ultra',
  region: 'eu',
  unitCost: 0.06,
  async run(input) {
    const { url, latencyMs } = await timed(async () =>
      firstMediaUrl(
        await falRun(FAL_ENDPOINTS.flux, {
          prompt: input.prompt,
          image_prompt: input.references[0],
          aspect_ratio: input.aspectRatio,
        }),
      ),
    );
    return { url, providerId: this.id, cost: this.unitCost, latencyMs };
  },
};

/**
 * Video always animates an already-approved still, so first-frame adherence
 * matters more than raw generative quality — which is what makes the cheap
 * tier viable without garment drift.
 */
export const seedanceVideo: VideoProvider = {
  kind: 'video',
  id: 'seedance-lite',
  name: 'Seedance Lite',
  region: 'cn',
  unitCost: 0.014,
  async run(input) {
    const { url, latencyMs } = await timed(async () =>
      firstMediaUrl(
        await falRun(FAL_ENDPOINTS.seedance, {
          image_url: input.imageUrl,
          prompt: input.prompt,
          duration: String(input.durationSeconds),
          resolution: '720p',
        }),
      ),
    );
    return {
      url,
      providerId: this.id,
      cost: this.unitCost * input.durationSeconds,
      latencyMs,
    };
  },
};

/** Premium motion tier: best human gait and fabric drape in blind testing. */
export const klingVideo: VideoProvider = {
  kind: 'video',
  id: 'kling-2.5-turbo',
  name: 'Kling 2.5 Turbo',
  region: 'cn',
  unitCost: 0.084,
  async run(input) {
    const { url, latencyMs } = await timed(async () =>
      firstMediaUrl(
        await falRun(FAL_ENDPOINTS.kling, {
          image_url: input.imageUrl,
          prompt: input.prompt,
          duration: String(input.durationSeconds),
        }),
      ),
    );
    return {
      url,
      providerId: this.id,
      cost: this.unitCost * input.durationSeconds,
      latencyMs,
    };
  },
};

function aspectToSize(aspect: string, resolution = 2048) {
  const ratios: Record<string, [number, number]> = {
    '1:1': [1, 1],
    '3:4': [3, 4],
    '4:5': [4, 5],
    '9:16': [9, 16],
    '16:9': [16, 9],
  };
  const [w, h] = ratios[aspect] ?? [1, 1];
  const scale = resolution / Math.max(w, h);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}
