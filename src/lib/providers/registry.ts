import {
  geminiTryOn,
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

// Reference-conditioned generation leads, with Virtual Try-On kept behind it:
// try-on reshaped garments — a floor-length kurta to the knee, elbow sleeves to
// the wrist — which is the one failure this product cannot ship.
const TRYON: TryOnProvider[] = [geminiTryOn, vertexTryOn];
const IMAGE: ImageProvider[] = [vertexImage, vertexImagePro];
const VIDEO: VideoProvider[] = [vertexVideo];

/**
 * Which model each tier gets. Raising quality, or reacting to a vendor price
 * change, is an edit to this table and nothing else.
 *
 * Every tier gets the stronger image model, and that is deliberate. The cheaper
 * one was given to the free and starter tiers, which made how faithfully a
 * brand's own garment survives into a thing they had to pay more for. Fidelity
 * is the product — a packshot whose embroidery has been reinvented is not a
 * cheaper photograph, it is the wrong garment — so it cannot be the upsell.
 * Volume and turnaround are what the tiers are for.
 *
 * The difference is $0.067 against $0.134 on one slot of a bundle that costs
 * around $0.25 in stills, which is a small price for the only promise the
 * product actually makes.
 */
const TIER_PLAN: Record<Tier, { image: string; video: string }> = {
  free: { image: vertexImagePro.id, video: vertexVideo.id },
  starter: { image: vertexImagePro.id, video: vertexVideo.id },
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
  return pick(TRYON, geminiTryOn.id, routing, 'try-on');
}

export function selectImage({ tier, routing }: Selection): ImageProvider {
  return pick(IMAGE, TIER_PLAN[tier].image, routing, 'image');
}

export function selectVideo({ tier, routing }: Selection): VideoProvider {
  return pick(VIDEO, TIER_PLAN[tier].video, routing, 'video');
}
