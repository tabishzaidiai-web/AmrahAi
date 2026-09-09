import {
  VERTEX_MODELS,
  firstPredictionBytes,
  generateVideo,
  predict,
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
    const { value, latencyMs } = await timed(async () =>
      firstPredictionBytes(
        await predict(VERTEX_MODELS.tryOn, {
          instances: [
            {
              personImage: { image: { bytesBase64Encoded: input.personImage } },
              productImages: [{ image: { bytesBase64Encoded: input.garment.data } }],
            },
          ],
          parameters: { sampleCount: 1 },
        }),
      ),
    );
    return { image: value, providerId: this.id, cost: this.unitCost, latencyMs };
  },
};

/** Used only for garment-alone packshots and scene work, never to redraw a
 *  garment already placed by try-on. */
export const vertexImage: ImageProvider = {
  kind: 'image',
  id: 'gemini-flash-image',
  name: 'Gemini Flash Image',
  region: 'us',
  unitCost: 0.067,
  async run(input) {
    const { value, latencyMs } = await timed(async () =>
      firstPredictionBytes(
        await predict(VERTEX_MODELS.image, {
          instances: [
            {
              prompt: input.prompt,
              referenceImages: input.references.map((r) => ({
                image: { bytesBase64Encoded: r.data },
              })),
            },
          ],
          parameters: { sampleCount: 1, aspectRatio: input.aspectRatio },
        }),
      ),
    );
    return { image: value, providerId: this.id, cost: this.unitCost, latencyMs };
  },
};

export const vertexVideo: VideoProvider = {
  kind: 'video',
  id: 'veo-3.1-fast',
  name: 'Veo 3.1 Fast',
  region: 'us',
  // Billed per second of output; confirm the unit with Google before pricing
  // customer plans against it.
  unitCost: 0.1,
  async run(input) {
    const { value, latencyMs } = await timed(async () =>
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
          durationSeconds: input.durationSeconds,
          aspectRatio: input.aspectRatio,
          generateAudio: false,
        },
      }),
    );
    return {
      uri: value,
      providerId: this.id,
      cost: this.unitCost * input.durationSeconds,
      latencyMs,
    };
  },
};
