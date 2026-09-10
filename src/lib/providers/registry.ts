import {
  vertexImage,
  vertexImagePro,
  vertexTryOn,
  vertexVideo,
} from './implementations';
import type {
  ImageProvider,
  RoutingPolicy,
  Tier,
  TryOnProvider,
  VideoProvider,
} from './types';

const TRYON: TryOnProvider[] = [vertexTryOn];
const IMAGE: ImageProvider[] = [vertexImage, vertexImagePro];
const VIDEO: VideoProvider[] = [vertexVideo];

/**
 * Which model each tier gets. Raising quality, or reacting to a vendor price
 * change, is an edit to this table and nothing else.
 */
const TIER_PLAN: Record<Tier, { image: string; video: string }> = {
  free: { image: vertexImage.id, video: vertexVideo.id },
  starter: { image: vertexImage.id, video: vertexVideo.id },
  pro: { image: vertexImagePro.id, video: vertexVideo.id },
  scale: { image: vertexImagePro.id, video: vertexVideo.id },
  enterprise: { image: vertexImagePro.id, video: vertexVideo.id },
};

function pick<T extends { id: string; region: string }>(
  list: T[],
  preferredId: string,
  policy: RoutingPolicy,
  kind: string,
): T {
  const pool = policy === 'western-only' ? list.filter((p) => p.region !== 'cn') : list;
  if (pool.length === 0) {
    throw new Error(`No ${kind} provider satisfies the ${policy} routing policy`);
  }
  return pool.find((p) => p.id === preferredId) ?? pool[0];
}

export interface Selection {
  tier: Tier;
  routing: RoutingPolicy;
}

export function selectTryOn({ routing }: Selection): TryOnProvider {
  return pick(TRYON, vertexTryOn.id, routing, 'try-on');
}

export function selectImage({ tier, routing }: Selection): ImageProvider {
  return pick(IMAGE, TIER_PLAN[tier].image, routing, 'image');
}

export function selectVideo({ tier, routing }: Selection): VideoProvider {
  return pick(VIDEO, TIER_PLAN[tier].video, routing, 'video');
}
