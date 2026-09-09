/**
 * Marketplace image requirements.
 *
 * These are external rules we do not control; when a marketplace changes its
 * policy this table is the single place to update.
 */

export type MarketplaceId = 'amazon' | 'shopify' | 'meta' | 'tiktok' | 'google' | 'zalando';

export interface MarketplaceSpec {
  id: MarketplaceId;
  label: string;
  aspectRatio: '1:1' | '3:4' | 'any';
  /** Longest edge, pixels. Below this the listing is rejected. */
  minLongestEdge: number;
  /** Below this the listing is accepted but loses zoom or looks soft. */
  recommendedLongestEdge: number;
  maxFileBytes: number;
  /** Main image must sit on pure white. */
  requiresWhiteBackground: boolean;
  /** Fraction of the frame the product must fill on the main image. */
  minFillRatio?: number;
  notes: string[];
}

export const MARKETPLACES: Record<MarketplaceId, MarketplaceSpec> = {
  amazon: {
    id: 'amazon',
    label: 'Amazon',
    aspectRatio: '1:1',
    minLongestEdge: 1000,
    recommendedLongestEdge: 1600,
    maxFileBytes: 10 * 1024 * 1024,
    requiresWhiteBackground: true,
    minFillRatio: 0.85,
    notes: [
      'Main image background must be pure white, RGB(255,255,255).',
      'Adult apparel main images must be on a live model; flat lay is not permitted.',
      "Kids' and baby apparel must be shot flat, never on a live child model.",
      'Hangers and visible mannequins are banned; ghost mannequin is accepted.',
      'Below 1600px the product page loses zoom.',
    ],
  },
  shopify: {
    id: 'shopify',
    label: 'Shopify',
    aspectRatio: 'any',
    minLongestEdge: 800,
    recommendedLongestEdge: 2048,
    maxFileBytes: 20 * 1024 * 1024,
    requiresWhiteBackground: false,
    notes: [
      'Zoom requires images above 800x800.',
      'Keep one aspect ratio across a gallery or themes letterbox the odd one out.',
    ],
  },
  meta: {
    id: 'meta',
    label: 'Meta Shops',
    aspectRatio: '1:1',
    minLongestEdge: 500,
    recommendedLongestEdge: 1024,
    maxFileBytes: 8 * 1024 * 1024,
    requiresWhiteBackground: false,
    notes: ['Catalog and carousel placements render square.'],
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok Shop',
    aspectRatio: '1:1',
    minLongestEdge: 600,
    recommendedLongestEdge: 1000,
    maxFileBytes: 5 * 1024 * 1024,
    requiresWhiteBackground: false,
    notes: ['Main image must be clean, with no promotional text or graphics.'],
  },
  google: {
    id: 'google',
    label: 'Google Shopping',
    aspectRatio: 'any',
    // Google raises the apparel floor to 500px on 31 Jan 2027; validating
    // against the future floor now so customers are never caught out.
    minLongestEdge: 500,
    recommendedLongestEdge: 1500,
    maxFileBytes: 16 * 1024 * 1024,
    requiresWhiteBackground: false,
    notes: [
      'Promotional text, watermarks, logos and borders are prohibited in feed images.',
      'The apparel minimum rises to 500px on 31 January 2027.',
    ],
  },
  zalando: {
    id: 'zalando',
    label: 'Zalando',
    aspectRatio: '3:4',
    minLongestEdge: 1600,
    recommendedLongestEdge: 2133,
    maxFileBytes: 2 * 1024 * 1024,
    requiresWhiteBackground: true,
    notes: [
      'Portrait 3:4 only; max 1600x2133.',
      'Packshots must not show the mannequin or hanger.',
      'Models must wear shoes except for swim, underwear, nightwear and sportswear.',
      'Minimum three compliant images per article.',
    ],
  },
};

/**
 * Master render dimensions. Everything else is derived by cropping down, so a
 * single generation satisfies every destination.
 */
export const MASTER_RENDER = { width: 3000, height: 4000 } as const;
