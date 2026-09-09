import {
  fashnTryOn,
  fluxImage,
  klingVideo,
  seedanceVideo,
  seedreamImage,
} from './implementations';
import type {
  ImageProvider,
  RoutingPolicy,
  Tier,
  TryOnProvider,
  VideoProvider,
} from './types';

const TRYON: TryOnProvider[] = [fashnTryOn];
const IMAGE: ImageProvider[] = [seedreamImage, fluxImage];
const VIDEO: VideoProvider[] = [seedanceVideo, klingVideo];

/**
 * Which model each tier gets. Upgrading the product's quality — or reacting to
 * a vendor price change — is an edit to this table and nothing else.
 */
const TIER_PLAN: Record<Tier, { image: string; video: string }> = {
  free: { image: 'seedream-4.0', video: 'seedance-lite' },
  starter: { image: 'seedream-4.0', video: 'seedance-lite' },
  pro: { image: 'seedream-4.0', video: 'kling-2.5-turbo' },
  scale: { image: 'seedream-4.0', video: 'kling-2.5-turbo' },
  enterprise: { image: 'flux-pro-1.1-ultra', video: 'kling-2.5-turbo' },
};

function allowed<T extends { region: string }>(list: T[], policy: RoutingPolicy) {
  return policy === 'western-only' ? list.filter((p) => p.region !== 'cn') : list;
}

function pick<T extends { id: string; region: string }>(
  list: T[],
  preferredId: string,
  policy: RoutingPolicy,
  kind: string,
): T {
  const pool = allowed(list, policy);
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
  return pick(TRYON, fashnTryOn.id, routing, 'try-on');
}

export function selectImage({ tier, routing }: Selection): ImageProvider {
  return pick(IMAGE, TIER_PLAN[tier].image, routing, 'image');
}

export function selectVideo({ tier, routing }: Selection): VideoProvider {
  return pick(VIDEO, TIER_PLAN[tier].video, routing, 'video');
}
