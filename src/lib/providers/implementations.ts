import {
  VERTEX_MODELS,
  generateImage,
  generateVideo,
  predictTryOn,
} from './vertex';
import type { ImageProvider, TryOnProvider, VideoProvider } from './types';

async function timed<T>(fn: () => Promise<T>): Promise<{ value: T; latencyMs: number }> {
  const started = Date.now();
  const value = await fn();
  return { value, latencyMs: Date.now() - started };
}

/**
 * Try-on is the product's core guarantee: the garment must survive generation
 * unchanged. A purpose-built try-on model is used rather than a general image
 * model, which would redraw garment detail.
 */
export const vertexTryOn: TryOnProvider = {
  kind: 'tryon',
  id: 'vertex-vto-001',
  name: 'Google Virtual Try-On',
  region: 'us',
  unitCost: 0.06,
  async run(input) {
    const { value, latencyMs } = await timed(() =>
      predictTryOn(input.personImage, input.garment.data),
    );
    return { image: value, providerId: this.id, cost: this.unitCost, latencyMs };
  },
};

/** Used for garment-alone packshots and for building the pose library, never
 *  to redraw a garment already placed by try-on. */
export const vertexImage: ImageProvider = {
  kind: 'image',
  id: 'gemini-flash-image',
  name: 'Gemini Flash Image',
  region: 'global',
  unitCost: 0.067,
  async run(input) {
    const { value, latencyMs } = await timed(() =>
      generateImage(VERTEX_MODELS.image, input.prompt, input.references),
    );
    return { image: value, providerId: this.id, cost: this.unitCost, latencyMs };
  },
};

/** Higher-fidelity option, notably better where a garment carries legible text
 *  or a logo that must survive. */
export const vertexImagePro: ImageProvider = {
  kind: 'image',
  id: 'gemini-pro-image',
  name: 'Gemini Pro Image',
  region: 'global',
  unitCost: 0.134,
  async run(input) {
    const { value, latencyMs } = await timed(() =>
      generateImage(VERTEX_MODELS.imagePro, input.prompt, input.references),
    );
    return { image: value, providerId: this.id, cost: this.unitCost, latencyMs };
  },
};

/** Veo accepts only these image-to-video lengths and errors on anything else. */
const VEO_DURATIONS = [4, 6, 8];

/**
 * Video generation is queued behind a single slot.
 *
 * The provider limits concurrent long-running video jobs per model, and
 * shooting several pieces of a collection at once exceeds it immediately —
 * every lane asks for a clip in the same moment. Waiting costs a collection
 * nothing, since the stills for other pieces continue in parallel.
 */
let videoQueue: Promise<unknown> = Promise.resolve();

function inVideoQueue<T>(work: () => Promise<T>): Promise<T> {
  const next = videoQueue.then(work, work);
  // Kept unbroken by failures, so one rejected clip does not wedge the queue.
  videoQueue = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

/** Retries a clip the provider refused for capacity rather than content. */
async function withCapacityRetry<T>(work: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await work();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (i >= attempts || !message.includes('429')) throw error;
      await new Promise((r) => setTimeout(r, 20_000 * i));
    }
  }
}

function nearestSupportedDuration(requested: number) {
  return VEO_DURATIONS.reduce((best, d) =>
    Math.abs(d - requested) < Math.abs(best - requested) ? d : best,
  );
}

export const vertexVideo: VideoProvider = {
  kind: 'video',
  id: 'veo-3.1-fast',
  name: 'Veo 3.1 Fast',
  region: 'us',
  // Billed per second of output; confirm the unit with Google before pricing
  // customer plans against it.
  unitCost: 0.1,
  async run(input) {
    const duration = nearestSupportedDuration(input.durationSeconds);

    const { value, latencyMs } = await timed(() =>
      inVideoQueue(() =>
        withCapacityRetry(() =>
          generateVideo({
        instances: [
          {
            prompt: input.prompt,
            image: {
              bytesBase64Encoded: input.image.data,
              mimeType: input.image.mimeType,
            },
          },
        ],
        parameters: {
          sampleCount: 1,
          durationSeconds: duration,
          aspectRatio: input.aspectRatio,
          generateAudio: false,
        },
          }),
        ),
      ),
    );
    return {
      uri: value,
      providerId: this.id,
      cost: this.unitCost * duration,
      latencyMs,
    };
  },
};
