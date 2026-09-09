import { normalizeForMarketplace } from '../compliance/normalize';
import { validate, type ComplianceReport } from '../compliance/validate';
import { AMAZON_SLOTS, type AmazonSlot } from './amazon-slots';
import type { SlotId } from './bundle';

/**
 * Assembles a finished shoot into an Amazon listing.
 *
 * Server-only: it reaches image processing. The listing's shape lives in
 * `amazon-slots.ts` so the UI can render it without pulling sharp into the
 * browser bundle.
 *
 * Most of what a listing needs has already been produced by the shoot, so
 * positions are filled from existing assets rather than regenerated, and gaps
 * are reported rather than filled with something invented.
 */

export interface FilledSlot extends AmazonSlot {
  image?: Buffer;
  compliance?: ComplianceReport;
  /** Why the position is empty, when it is. */
  gap?: string;
}

/** Amazon's own requirements, applied to every position. */
const AMAZON_GEOMETRY = { size: 2000, fill: 0.88 } as const;

export async function buildListing(
  assets: { slot: SlotId; image?: Buffer }[],
): Promise<FilledSlot[]> {
  const bySlot = new Map(
    assets.filter((a) => a.image).map((a) => [a.slot, a.image as Buffer]),
  );

  return Promise.all(
    AMAZON_SLOTS.map(async (slot) => {
      if (!slot.source) {
        return { ...slot, gap: 'Needs artwork, which the shoot does not produce.' };
      }

      const source = bySlot.get(slot.source);
      if (!source) {
        return { ...slot, gap: 'The matching shot was not generated for this garment.' };
      }

      try {
        // Every position is squared and re-framed, because Amazon renders the
        // whole gallery to one aspect and mixed ratios letterbox badly.
        const image = await normalizeForMarketplace(source, AMAZON_GEOMETRY);
        return {
          ...slot,
          image,
          compliance: await validate(image, 'amazon', { isMainImage: slot.isMain }),
        };
      } catch (error) {
        return {
          ...slot,
          gap: error instanceof Error ? error.message : 'Could not prepare this image.',
        };
      }
    }),
  );
}
