import { fal } from '@fal-ai/client';

if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

/**
 * Vendor endpoint ids, isolated here because they change far more often than
 * our own code. Swapping a model version is an edit to this map.
 */
export const FAL_ENDPOINTS = {
  tryon: 'fal-ai/fashn/tryon/v1.6',
  seedream: 'fal-ai/bytedance/seedream/v4/edit',
  flux: 'fal-ai/flux-pro/v1.1-ultra',
  seedance: 'fal-ai/bytedance/seedance/v1/lite/image-to-video',
  kling: 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
} as const;

export async function falRun<T>(endpoint: string, input: Record<string, unknown>): Promise<T> {
  const result = await fal.subscribe(endpoint, { input });
  return result.data as T;
}

/** fal returns either a single `image`/`video` object or an `images` array. */
export function firstMediaUrl(data: unknown): string {
  const d = data as {
    images?: { url?: string }[];
    image?: { url?: string };
    video?: { url?: string };
  };
  const url = d?.images?.[0]?.url ?? d?.image?.url ?? d?.video?.url;
  if (!url) throw new Error('Provider returned no media URL');
  return url;
}
