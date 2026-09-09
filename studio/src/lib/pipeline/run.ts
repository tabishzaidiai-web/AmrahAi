import { selectImage, selectTryOn, selectVideo, type Selection } from '../providers/registry';
import type { GarmentRef, ModelPersona } from '../providers/types';
import { planFor, type SlotId, type SlotSpec } from './bundle';

export interface ShootRequest extends Selection {
  garmentFront: GarmentRef;
  /** Supplying the back view converts an invented back into a real try-on. */
  garmentBack?: GarmentRef;
  persona: ModelPersona;
  audience: 'adult' | 'kids';
  scene: string;
  includeVideo: boolean;
}

export interface ShootAsset {
  slot: SlotId;
  url: string;
  kind: 'image' | 'video';
  providerId: string;
  cost: number;
}

export interface ShootOutcome {
  assets: ShootAsset[];
  failures: { slot: SlotId; reason: string }[];
  totalCost: number;
}

/** Camera direction per slot. Kept beside the pipeline because it is generation
 *  instruction, not marketplace policy. */
const ANGLE_PROMPTS: Partial<Record<SlotId, string>> = {
  'on-model-back': 'the same model photographed from directly behind, full length',
  'on-model-three-quarter': 'the same model turned to a three-quarter view, full length',
  'detail-macro': 'a close macro study of the garment fabric, seams and closures',
  'ghost-front': 'the garment alone as an invisible-mannequin packshot, front view, on pure white',
  'ghost-back': 'the garment alone as an invisible-mannequin packshot, back view, on pure white',
  cropped: 'the same model cropped from mid-thigh up',
  lifestyle: 'the same model in a wider environmental frame',
};

/**
 * Ghost-mannequin slots must land on pure white to clear Amazon and Zalando
 * packshot rules, so they never inherit the chosen scene.
 */
function promptFor(slot: SlotSpec, scene: string): string {
  const angle = ANGLE_PROMPTS[slot.id] ?? 'the same model, full length';
  const setting = slot.id.startsWith('ghost')
    ? 'isolated on a pure white background, no model, no mannequin, no hanger'
    : scene;
  return `${angle}, ${setting}. Preserve the garment exactly: colour, print scale, closures and trims must not change.`;
}

export async function runShoot(request: ShootRequest): Promise<ShootOutcome> {
  const selection: Selection = { tier: request.tier, routing: request.routing };
  const tryOn = selectTryOn(selection);
  const image = selectImage(selection);
  const video = selectVideo(selection);

  const assets: ShootAsset[] = [];
  const failures: { slot: SlotId; reason: string }[] = [];

  // The front try-on anchors everything: later angles reference it, so if this
  // fails there is nothing consistent to propagate and the shoot cannot proceed.
  const front = await tryOn.run({
    garment: request.garmentFront,
    person: request.persona,
  });
  assets.push({
    slot: 'on-model-front',
    url: front.url,
    kind: 'image',
    providerId: front.providerId,
    cost: front.cost,
  });

  const plan = planFor(request.audience).filter(
    (s) => s.id !== 'on-model-front' && s.kind === 'image',
  );

  for (const slot of plan) {
    try {
      // Back views are genuinely unobserved data. When the brand supplied a back
      // flat-lay we run a real try-on instead of letting the model invent one.
      if (slot.id === 'on-model-back' && request.garmentBack) {
        const result = await tryOn.run({
          garment: request.garmentBack,
          person: request.persona,
        });
        assets.push({
          slot: slot.id,
          url: result.url,
          kind: 'image',
          providerId: result.providerId,
          cost: result.cost,
        });
        continue;
      }

      const references = [front.url, request.garmentFront.url, request.persona.referenceUrl];
      if (request.garmentBack) references.push(request.garmentBack.url);

      const result = await image.run({
        prompt: promptFor(slot, request.scene),
        references,
        aspectRatio: '3:4',
      });
      assets.push({
        slot: slot.id,
        url: result.url,
        kind: 'image',
        providerId: result.providerId,
        cost: result.cost,
      });
    } catch (error) {
      // One weak angle should not cost the brand the whole bundle.
      failures.push({
        slot: slot.id,
        reason: error instanceof Error ? error.message : 'Generation failed',
      });
    }
  }

  if (request.includeVideo && request.audience === 'adult') {
    try {
      const result = await video.run({
        // Animating the approved still is what keeps the garment from drifting
        // across frames.
        imageUrl: front.url,
        prompt:
          'The model walks toward camera with a natural, confident stride. The fabric moves and drapes naturally with the walk.',
        durationSeconds: 5,
        aspectRatio: '9:16',
      });
      assets.push({
        slot: 'walk-video',
        url: result.url,
        kind: 'video',
        providerId: result.providerId,
        cost: result.cost,
      });
    } catch (error) {
      failures.push({
        slot: 'walk-video',
        reason: error instanceof Error ? error.message : 'Video generation failed',
      });
    }
  }

  return {
    assets,
    failures,
    totalCost: assets.reduce((sum, a) => sum + a.cost, 0),
  };
}
