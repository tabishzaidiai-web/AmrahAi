import sharp from 'sharp';
import { selectImage, selectTryOn, selectVideo, type Selection } from '../providers/registry';
import type { GarmentRef, ModelPersona, PoseId } from '../providers/types';
import { stamp } from '../compliance/provenance';
import { normalizeForMarketplace } from '../compliance/normalize';
import { validate, type ComplianceReport } from '../compliance/validate';
import { measureHem, type GarmentLength } from './hem';
import { VideoBusyError } from '../providers/implementations';
import { SKU_BUNDLE, planFor, type SlotId } from './bundle';

export interface ShootRequest extends Selection {
  shootId: string;
  garmentFront: GarmentRef;
  /** Supplying the back view turns an invented back into a real try-on. */
  garmentBack?: GarmentRef;
  persona: ModelPersona;
  audience: 'adult' | 'kids';
  scene: string;
  includeVideo: boolean;
  /**
   * Declared by the brand, because a flat lay carries no scale reference and
   * try-on will otherwise return a different length on every run.
   */
  length: GarmentLength;
  /** How long this run can wait for a video submission slot. Left unset by an
   *  interactive shoot, which has a person watching and no queue behind it. */
  videoWaitBudgetMs?: number;
}

/** One prompt, used whether the clip is made now or queued for later. */
const WALK_PROMPT =
  'The model walks toward camera with a natural, confident stride. The fabric moves and drapes naturally with the walk. The garment does not change.';

/** How many times a wrong-length render is regenerated before giving up. */
const LENGTH_ATTEMPTS = 3;

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
  /** Something the brand should know about this shot without it being a failure. */
  notice?: string;
}

export interface ShootOutcome {
  assets: ShootAsset[];
  /** Slots that were attempted and went wrong. */
  failures: { slot: SlotId; reason: string }[];
  /** Slots that could not be attempted, because an input was not supplied. */
  skipped: { slot: SlotId; reason: string }[];
  /**
   * Set when the runway clip could not be started before this run had to end.
   * Vertex accepts one clip a minute for the project, so a drop's videos cannot
   * all be made in one pass; the caller queues this for a later one instead of
   * reporting the piece as broken.
   */
  deferredVideo?: { prompt: string };
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
  /** Slots that were never possible, as distinct from ones that went wrong. */
  const skipped: { slot: SlotId; reason: string }[] = [];
  // A slot that fails has usually still called a provider, and that spend is
  // real. Counting only successful assets under-reports what a shoot cost and
  // hides exactly the failures worth knowing about.
  let wastedCost = 0;
  const plan = planFor(request.audience);
  const wanted = new Set(plan.map((s) => s.id));

  const record = async (
    slot: SlotId,
    buffer: Buffer,
    providerId: string,
    cost: number,
    notice?: string,
  ) => {
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
      notice,
    });
  };

  // Generation --------------------------------------------------------------
  // On-model angles and packshots are independent of each other, so they all
  // run together rather than in sequence. Only the derived crops and the video
  // need the front render, and they wait for it.
  let frontImage: Buffer | undefined;

  const onModel = (Object.entries(SLOT_POSE) as [SlotId, PoseId][]).map(
    async ([slot, pose]) => {
      if (!wanted.has(slot)) return;

      const personImage = request.persona.poses[pose];
      if (!personImage) {
        failures.push({ slot, reason: `No stored ${pose} pose for this model` });
        return;
      }

      // The back of a garment is unobserved data. When the brand supplied a
      // back flat-lay it is used directly; otherwise the front is the only
      // truth we have and the back view is skipped rather than invented.
      const garment = slot === 'on-model-back' ? request.garmentBack : request.garmentFront;
      if (!garment) {
        // No back photograph was supplied, so this view was never on offer.
        // Reporting it as a failure buries the ones that need attention.
        skipped.push({
          slot,
          reason: 'Add a back photo of the garment to include back views',
        });
        return;
      }

      try {
        const result = await tryOnAtDeclaredLength(
          () => tryOn.run({ garment, personImage, personMimeType: 'image/png' }),
          Buffer.from(personImage, 'base64'),
          request.length,
        );
        if (slot === 'on-model-front') frontImage = result.image;
        await record(slot, result.image, result.providerId, result.cost, result.notice);
      } catch (error) {
        // One weak angle should not cost the brand the whole bundle.
        wastedCost += spentOn(error);
        failures.push({ slot, reason: reasonOf(error) });
      }
    },
  );

  const packshots = (['ghost-front', 'ghost-back'] as SlotId[]).map(async (slot) => {
    if (!wanted.has(slot)) return;
    const garment = slot === 'ghost-back' ? request.garmentBack : request.garmentFront;
    if (!garment) {
      skipped.push({ slot, reason: 'Add a back photo of the garment to include back views' });
      return;
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
  });

  await Promise.all([...onModel, ...packshots]);

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


  // Runway walk -------------------------------------------------------------
  let deferredVideo: { prompt: string } | undefined;

  if (request.includeVideo && frontImage && request.audience === 'adult') {
    try {
      const result = await video.run({
        image: { data: frontImage.toString('base64'), mimeType: 'image/png' },
        prompt: WALK_PROMPT,
        // Six seconds clears Amazon's minimum for product video and suits
        // Reels and TikTok without trimming.
        durationSeconds: 6,
        aspectRatio: '9:16',
        waitBudgetMs: request.videoWaitBudgetMs,
      });
      assets.push({
        slot: 'walk-video',
        kind: 'video',
        uri: result.uri,
        providerId: result.providerId,
        cost: result.cost,
      });
    } catch (error) {
      // A clip that never got a submission slot has not gone wrong, it has not
      // happened yet. Recording it as a failure sent a brand looking for a
      // fault in a piece whose stills were all fine.
      if (error instanceof VideoBusyError) {
        deferredVideo = { prompt: WALK_PROMPT };
      } else {
        failures.push({ slot: 'walk-video', reason: reasonOf(error) });
      }
    }
  }

  // Parallel generation completes out of order, so the bundle is returned in
  // its documented slot order and the gallery stays stable between shoots.
  const order = new Map(SKU_BUNDLE.map((s, i) => [s.id, i]));
  assets.sort((a, b) => (order.get(a.slot) ?? 0) - (order.get(b.slot) ?? 0));
  failures.sort((a, b) => (order.get(a.slot) ?? 0) - (order.get(b.slot) ?? 0));
  skipped.sort((a, b) => (order.get(a.slot) ?? 0) - (order.get(b.slot) ?? 0));

  return {
    assets,
    failures,
    skipped,
    deferredVideo,
    totalCost: assets.reduce((sum, a) => sum + a.cost, 0) + wastedCost,
  };
}

class WrongLengthError extends Error {
  constructor(readonly declared: GarmentLength, readonly measured: number, readonly spent: number) {
    super(
      `Could not hold the declared ${declared} length after ${LENGTH_ATTEMPTS} attempts; the garment kept rendering at ${measured.toFixed(2)} of body height.`,
    );
  }
}

/** How closely repeated measurements must agree before they are read as the
 *  garment's true length rather than as try-on drifting between runs. */
const AGREEMENT = 0.08;

/**
 * Regenerates until the rendered hem matches what the brand declared — unless
 * the renders agree with each other and disagree with the declaration.
 *
 * Try-on can return a different length on each run from identical input, which
 * is what the retries are for. But when every attempt lands in the same place
 * that is not drift, it is the garment: a Lamhey kurta declared as "hip / top
 * length" rendered at 1.00 of body height three times running, because it is a
 * floor-length kurta. Retrying could never have fixed that, and the only
 * renders that could have satisfied the declaration were ones where try-on had
 * wrongly shortened the piece. So a consistent disagreement is resolved in
 * favour of the measurement, the paid render is kept, and the brand is told
 * what length the garment actually appears to be. An inconsistent one still
 * fails the slot: publishing a maxi render of a knee-length dress earns the
 * return and the misleading-advertising exposure.
 */
async function tryOnAtDeclaredLength(
  attempt: () => Promise<{ image: Buffer; providerId: string; cost: number }>,
  person: Buffer,
  declared: GarmentLength,
): Promise<{ image: Buffer; providerId: string; cost: number; notice?: string }> {
  let spent = 0;
  const readings: number[] = [];
  let last: { image: Buffer; providerId: string; cost: number } | undefined;

  for (let i = 0; i < LENGTH_ATTEMPTS; i++) {
    const result = await attempt();
    spent += result.cost;
    last = result;

    try {
      const hem = await measureHem(result.image, person, declared);
      // A garment close in tone to the wearer's skin cannot be measured, and
      // discarding good work on an unreadable instrument is worse than letting
      // a borderline length through.
      if (!hem.confident || hem.matches) return { ...result, cost: spent };
      readings.push(hem.position);
    } catch {
      // Measurement needs a clear silhouette. If it cannot read one, accept the
      // render rather than burn attempts on an unmeasurable pose.
      return { ...result, cost: spent };
    }
  }

  const measured = readings[readings.length - 1] ?? 0;
  const spread = Math.max(...readings) - Math.min(...readings);

  if (last && readings.length === LENGTH_ATTEMPTS && spread <= AGREEMENT) {
    return {
      ...last,
      cost: spent,
      notice: `Shot at ${describeLength(measured)}, not the ${declared} length selected — every render put the hem in the same place, which is the garment's own length. Change the setting if these should be shorter.`,
    };
  }

  throw new WrongLengthError(declared, measured, spent);
}

/** The length band a measured hem position falls in, in the brand's words. */
function describeLength(position: number): GarmentLength {
  if (position >= 0.86) return 'maxi';
  if (position >= 0.76) return 'midi';
  if (position >= 0.65) return 'knee';
  if (position >= 0.54) return 'mini';
  return 'top';
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

/** Provider spend already incurred by an attempt that then failed. */
function spentOn(error: unknown) {
  return error instanceof WrongLengthError ? error.spent : 0;
}
