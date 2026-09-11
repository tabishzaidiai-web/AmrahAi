/**
 * A shoot produces a SKU bundle, not a single image.
 *
 * Slot names are stable identifiers: brands map them to PDP templates and
 * marketplace feeds, so renaming a slot is a breaking change for customers.
 */

export type SlotId =
  | 'on-model-front'
  | 'on-model-back'
  | 'on-model-three-quarter'
  | 'detail-macro'
  | 'ghost-front'
  | 'ghost-back'
  | 'cropped'
  | 'lifestyle'
  | 'walk-video';

export interface SlotSpec {
  id: SlotId;
  label: string;
  /** Why the slot exists, surfaced in the UI so brands understand the bundle. */
  purpose: string;
  required: boolean;
  /** Ghost-mannequin and packshot slots must be marketplace-main-image safe. */
  marketplaceMain: boolean;
  kind: 'image' | 'video';
}

export const SKU_BUNDLE: SlotSpec[] = [
  {
    id: 'on-model-front',
    label: 'On-model front',
    purpose: 'Hero image. Amazon requires a live model for adult apparel main images.',
    required: true,
    marketplaceMain: true,
    kind: 'image',
  },
  {
    id: 'on-model-back',
    label: 'On-model back',
    purpose: 'Answers the most common pre-purchase question and cuts returns.',
    required: true,
    marketplaceMain: false,
    kind: 'image',
  },
  {
    id: 'on-model-three-quarter',
    label: 'Three-quarter',
    purpose: 'Shows silhouette, drape and volume that a flat front view hides.',
    required: true,
    marketplaceMain: false,
    kind: 'image',
  },
  {
    id: 'detail-macro',
    label: 'Detail macro',
    purpose: 'Fabric texture, closures and print scale. Biggest driver of fabric-quality confidence.',
    required: true,
    marketplaceMain: false,
    kind: 'image',
  },
  {
    id: 'ghost-front',
    label: 'Ghost mannequin front',
    purpose: 'The marketplace-safe packshot. Amazon bans visible mannequins and hangers but accepts this.',
    required: true,
    marketplaceMain: true,
    kind: 'image',
  },
  {
    id: 'ghost-back',
    label: 'Ghost mannequin back',
    purpose: 'Completes the packshot pair required by Zalando-style catalogue feeds.',
    required: true,
    marketplaceMain: true,
    kind: 'image',
  },
  {
    id: 'cropped',
    label: 'Cropped styling frame',
    purpose: 'Feeds PDP thumbnails and social crops without re-rendering.',
    required: false,
    marketplaceMain: false,
    kind: 'image',
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle frame',
    purpose: 'In-context brand storytelling for ad creative.',
    required: false,
    marketplaceMain: false,
    kind: 'image',
  },
  {
    id: 'walk-video',
    label: 'Runway walk',
    purpose: 'Loopable walk clip for Reels, TikTok and PDP autoplay.',
    required: false,
    marketplaceMain: false,
    kind: 'video',
  },
];

export const REQUIRED_SLOTS = SKU_BUNDLE.filter((s) => s.required);

/**
 * Slots a shoot does not produce unless asked.
 *
 * Each one is a full-price render, and both are extras rather than catalogue
 * requirements: the lifestyle frame is ad creative, the walk is social. Making
 * them on-demand takes a piece from three paid renders to two, and a six-piece
 * drop from about $2.40 to $1.60, without touching the angles a marketplace
 * listing actually needs.
 */
export const ON_DEMAND_SLOTS: SlotId[] = ['lifestyle', 'walk-video'];

/**
 * Amazon forbids live child models and requires kids' apparel to be shot flat,
 * while adult apparel main images must be on a live model. Enforced at planning
 * time so a non-compliant bundle is never generated in the first place.
 */
export function planFor(audience: 'adult' | 'kids'): SlotSpec[] {
  const included = SKU_BUNDLE.filter((s) => !ON_DEMAND_SLOTS.includes(s.id));
  if (audience === 'kids') {
    return included.filter((s) => !s.id.startsWith('on-model'));
  }
  return included;
}
