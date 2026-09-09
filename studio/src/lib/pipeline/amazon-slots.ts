import type { SlotId } from './bundle';

/**
 * The shape of an Amazon apparel listing.
 *
 * Kept free of image-processing imports so client components can render the
 * listing layout; the server-side assembly lives in `amazon.ts`.
 */

export interface AmazonSlot {
  position: number;
  id: string;
  label: string;
  purpose: string;
  /** Which shoot asset fills this position, when one can. */
  source?: SlotId;
  /** Position one is the only image Amazon suppresses listings over. */
  isMain: boolean;
}

export const AMAZON_SLOTS: AmazonSlot[] = [
  {
    position: 1,
    id: 'main',
    label: 'Main image',
    purpose:
      'On a live model against pure white. Amazon does not accept flat lay here for adult apparel.',
    source: 'on-model-front',
    isMain: true,
  },
  {
    position: 2,
    id: 'packshot',
    label: 'Ghost mannequin',
    purpose: 'Shows true garment shape without a body influencing fit perception.',
    source: 'ghost-front',
    isMain: false,
  },
  {
    position: 3,
    id: 'three-quarter',
    label: 'Three-quarter',
    purpose: 'Silhouette, drape and volume.',
    source: 'on-model-three-quarter',
    isMain: false,
  },
  {
    position: 4,
    id: 'back',
    label: 'Back view',
    purpose: 'Answers the most common pre-purchase question.',
    source: 'ghost-back',
    isMain: false,
  },
  {
    position: 5,
    id: 'detail',
    label: 'Fabric detail',
    purpose: 'Texture, weave and closures. The strongest driver of quality confidence.',
    source: 'detail-macro',
    isMain: false,
  },
  {
    position: 6,
    id: 'styling',
    label: 'Styling frame',
    purpose: 'Cropped view for thumbnails and mobile.',
    source: 'cropped',
    isMain: false,
  },
  {
    position: 7,
    id: 'lifestyle',
    label: 'Lifestyle',
    purpose: 'The garment in context, for brand storytelling.',
    source: 'lifestyle',
    isMain: false,
  },
  {
    position: 8,
    id: 'infographic',
    label: 'Feature callouts',
    purpose: 'Fabric composition, fit and care, laid over the garment.',
    isMain: false,
  },
  {
    position: 9,
    id: 'sizing',
    label: 'Size guide',
    purpose: 'Measurements. Reduces the returns that size uncertainty causes.',
    isMain: false,
  },
];
