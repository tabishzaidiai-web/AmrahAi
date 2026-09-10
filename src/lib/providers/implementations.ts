import {
  VERTEX_MODELS,
  generateImage,
  generateVideo,
  predictTryOn,
} from './vertex';
import type { ImageProvider, TryOnProvider, VideoProvider } from './types';
import { claimVideoSlot } from '../pipeline/queue';

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
 * Video submissions are spaced by a gate held in the database.
 *
 * Vertex allows this project one video request per minute per model
 * (LongRunningPredictRequestsPerMinutePerProjectPerBaseModel = 1), and the
 * limit is not raisable until the project has built up usage history. An
 * earlier in-process queue could not hold the line, because the worker runs as
 * several serverless invocations that share no memory: a six-piece drop asked
 * for six clips at once and four came back as a raw 429.
 *
 * The gate therefore lives where every process can see it. Waiting is the
 * correct behaviour rather than a workaround — at one a minute, a clip that
 * cannot start yet has genuinely nowhere to go.
 */
const VIDEO_INTERVAL_SECONDS = 60;

export class VideoBusyError extends Error {
  constructor(waitSeconds: number) {
    super(
      `The video queue is busy: Vertex accepts one clip a minute for this project and the next slot is ${waitSeconds}s away.`,
    );
  }
}

/**
 * Waits for a submission slot, giving up once waiting would outlast the
 * caller's budget so the piece's stills are not held hostage to its clip.
 */
async function awaitVideoSlot(budgetMs: number): Promise<void> {
  const deadline = Date.now() + budgetMs;

  for (;;) {
    const wait = await claimVideoSlot(VIDEO_INTERVAL_SECONDS);
    if (wait === 0) return;

    // A second of headroom, so a slot is not missed by rounding.
    const sleepMs = (wait + 1) * 1000;
    if (Date.now() + sleepMs > deadline) throw new VideoBusyError(wait);
    await new Promise((r) => setTimeout(r, sleepMs));
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

    // Raises rather than submitting when no slot is free in time, so the caller
    // can leave the clip for a later run instead of burning it on a 429.
    await awaitVideoSlot(input.waitBudgetMs ?? 90_000);

    const { value, latencyMs } = await timed(() =>
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
    );
    return {
      uri: value,
      providerId: this.id,
      cost: this.unitCost * duration,
      latencyMs,
    };
  },
};
