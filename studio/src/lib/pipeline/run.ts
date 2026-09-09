import sharp from 'sharp';
import { selectImage, selectTryOn, selectVideo, type Selection } from '../providers/registry';
import type { GarmentRef, ModelPersona, PoseId } from '../providers/types';
import { stamp } from '../compliance/provenance';
import { normalizeForMarketplace } from '../compliance/normalize';
import { validate, type ComplianceReport } from '../compliance/validate';
import { planFor, type SlotId } from './bundle';

export interface ShootRequest extends Selection {
  shootId: string;
  garmentFront: GarmentRef;
  /** Supplying the back view turns an invented back into a real try-on. */
  garmentBack?: GarmentRef;
  persona: ModelPersona;
  audience: 'adult' | 'kids';
  scene: string;
  includeVideo: boolean;
}

export interface ShootAsset {
  slot: SlotId;
  kind: 'image' | 'video';
  /** Present for images; video assets carry a uri instead. */
  image?: Buffer;
  uri?: string;
  providerId: string;
  cost: number;
  /** Present on packshot slots, which are the ones a marketplace will police. */
  compliance?: ComplianceReport;
}

export interface ShootOutcome {
  assets: ShootAsset[];
  failures: { slot: SlotId; reason: string }[];
  totalCost: number;
}

/** Which stored pose each on-model slot is generated against. */
const SLOT_POSE: Partial<Record<SlotId, PoseId>> = {
  'on-model-front': 'front',
  'on-model-back': 'back',
  'on-model-three-quarter': 'three-quarter',
  lifestyle: 'lifestyle',
};

const PACKSHOT_PROMPT = [
  'Ghost mannequin product photograph of this exact garment: presented as if worn by an invisible person, holding natural three-dimensional shape and volume, with the inner back collar visible through the neck opening.',
  'No person, no mannequin, no hanger, no body.',
  'Isolated on a pure white background, RGB 255 255 255, seamless. The garment fills most of the frame.',
  'Preserve the garment exactly: identical colour, identical print at identical scale, identical hem length, identical collar, sleeves, buttons and trims.',
  'Square 1:1 composition, e-commerce packshot, sharp focus, soft even lighting with a subtle contact shadow.',
].join(' ');

/**
 * Runs one garment through the full bundle.
 *
 * Every on-model angle is an independent try-on against a stored pose, so the
 * garment is re-anchored to the brand's original image each time instead of
 * being propagated — and therefore degraded — from a previously generated view.
 */
export async function runShoot(request: ShootRequest): Promise<ShootOutcome> {
  const selection: Selection = { tier: request.tier, routing: request.routing };
  const tryOn = selectTryOn(selection);
  const image = selectImage(selection);
  const video = selectVideo(selection);

  const assets: ShootAsset[] = [];
  const failures: { slot: SlotId; reason: string }[] = [];
  const plan = planFor(request.audience);
  const wanted = new Set(plan.map((s) => s.id));

  const record = async (slot: SlotId, buffer: Buffer, providerId: string, cost: number) => {
    // Packshots are the assets marketplaces police, and generated output lands
    // near spec but rarely on it, so geometry and background are corrected
    // deterministically rather than left to the model.
    const isPackshot = slot.startsWith('ghost');
    const normalized = isPackshot
      ? await normalizeForMarketplace(buffer, { size: 2000, fill: 0.88 })
      : buffer;

    // Provenance is applied here rather than at export so an asset cannot leave
    // the system unmarked.
    const marked = await stamp(normalized, {
      shootId: request.shootId,
      providerIds: [providerId],
      generatedAt: new Date(),
      depictsSyntheticModel:
        slot.startsWith('on-model') || slot === 'lifestyle' || slot === 'cropped',
    });

    assets.push({
      slot,
      kind: 'image',
      image: marked,
      providerId,
      cost,
      compliance: isPackshot ? await validate(marked, 'amazon') : undefined,
    });
  };

  // On-model angles ---------------------------------------------------------
  let frontImage: Buffer | undefined;

  for (const [slot, pose] of Object.entries(SLOT_POSE) as [SlotId, PoseId][]) {
    if (!wanted.has(slot)) continue;

    const personImage = request.persona.poses[pose];
    if (!personImage) {
      failures.push({ slot, reason: `No stored ${pose} pose for this model` });
      continue;
    }

    // The back of a garment is unobserved data. When the brand supplied a back
    // flat-lay it is used directly; otherwise the front is the only truth we
    // have and the back view is skipped rather than invented.
    const garment = slot === 'on-model-back' ? request.garmentBack : request.garmentFront;
    if (!garment) {
      failures.push({
        slot,
        reason: 'Upload a back image of the garment to generate an accurate back view',
      });
      continue;
    }

    try {
      const result = await tryOn.run({
        garment,
        personImage,
        personMimeType: 'image/png',
      });
      if (slot === 'on-model-front') frontImage = result.image;
      await record(slot, result.image, result.providerId, result.cost);
    } catch (error) {
      // One weak angle should not cost the brand the whole bundle.
      failures.push({ slot, reason: reasonOf(error) });
    }
  }

  // Derived crops -----------------------------------------------------------
  // Cropping the approved front render is both free and exactly consistent with
  // it, which regenerating these slots would not be.
  if (frontImage) {
    for (const slot of ['cropped', 'detail-macro'] as SlotId[]) {
      if (!wanted.has(slot)) continue;
      try {
        const cropped = await cropFrom(frontImage, slot);
        await record(slot, cropped, 'derived', 0);
      } catch (error) {
        failures.push({ slot, reason: reasonOf(error) });
      }
    }
  }

  // Ghost-mannequin packshots ----------------------------------------------
  for (const slot of ['ghost-front', 'ghost-back'] as SlotId[]) {
    if (!wanted.has(slot)) continue;
    const garment = slot === 'ghost-back' ? request.garmentBack : request.garmentFront;
    if (!garment) {
      failures.push({ slot, reason: 'Upload a back image to generate the back packshot' });
      continue;
    }

    try {
      const result = await image.run({
        prompt: PACKSHOT_PROMPT,
        references: [{ data: garment.data, mimeType: garment.mimeType }],
        aspectRatio: '1:1',
      });
      await record(slot, result.image, result.providerId, result.cost);
    } catch (error) {
      failures.push({ slot, reason: reasonOf(error) });
    }
  }

  // Runway walk -------------------------------------------------------------
  if (request.includeVideo && frontImage && request.audience === 'adult') {
    try {
      const result = await video.run({
        image: { data: frontImage.toString('base64'), mimeType: 'image/png' },
        prompt:
          'The model walks toward camera with a natural, confident stride. The fabric moves and drapes naturally with the walk. The garment does not change.',
        // Six seconds clears Amazon's minimum for product video and suits
        // Reels and TikTok without trimming.
        durationSeconds: 6,
        aspectRatio: '9:16',
      });
      assets.push({
        slot: 'walk-video',
        kind: 'video',
        uri: result.uri,
        providerId: result.providerId,
        cost: result.cost,
      });
    } catch (error) {
      failures.push({ slot: 'walk-video', reason: reasonOf(error) });
    }
  }

  return {
    assets,
    failures,
    totalCost: assets.reduce((sum, a) => sum + a.cost, 0),
  };
}

async function cropFrom(source: Buffer, slot: SlotId): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(source).metadata();
  if (!width || !height) throw new Error('Could not read the source render');

  // Upper body for the styling frame; a tighter central crop for fabric detail.
  const region =
    slot === 'cropped'
      ? { left: 0, top: 0, width, height: Math.round(height * 0.62) }
      : {
          left: Math.round(width * 0.28),
          top: Math.round(height * 0.3),
          width: Math.round(width * 0.44),
          height: Math.round(height * 0.28),
        };

  return sharp(source).extract(region).toBuffer();
}

function reasonOf(error: unknown) {
  return error instanceof Error ? error.message : 'Generation failed';
}
