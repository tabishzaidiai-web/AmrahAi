import { selectImage, type Selection } from '../providers/registry';
import type { GarmentRef } from '../providers/types';

/**
 * Turns a technical flat into a photographable garment.
 *
 * Studios and manufacturers work from CAD flats long before a sample exists,
 * so a shoot that requires a finished garment arrives too late to help them
 * sell a collection. Rendering the flat first produces a packshot the rest of
 * the pipeline treats exactly like an uploaded photograph.
 *
 * The render becomes the reference every later angle is anchored to, so
 * construction only has to be interpreted once rather than re-invented per
 * camera position.
 */

export interface FabricSpec {
  /** Free text as a studio would write it: "mid-weight rust linen, matte". */
  material: string;
  colour?: string;
}

function renderPrompt({ material, colour }: FabricSpec): string {
  return [
    'The supplied image is a flat technical fashion sketch. Produce a photorealistic product photograph of this exact garment as it would be manufactured.',
    `Fabric: ${[colour, material].filter(Boolean).join(' ')}, with realistic weave texture and drape for that cloth.`,
    'Follow the sketch exactly: identical silhouette, identical collar and neckline, the same closures in the same positions, the same sleeve length and cuff detail, the same seams, pockets and hem length.',
    'Present it as a ghost-mannequin packshot with natural three-dimensional volume, as if worn by an invisible person, with the inner back collar visible through the neck opening.',
    'No person, no mannequin, no hanger. Isolated on a pure white background.',
    'Studio product photography, sharp focus, soft even lighting, square composition.',
  ].join(' ');
}

export interface RenderedGarment {
  garment: GarmentRef;
  providerId: string;
  cost: number;
}

export async function renderFromSketch(
  sketch: { data: string; mimeType: string },
  fabric: FabricSpec,
  category: GarmentRef['category'],
  selection: Selection,
): Promise<RenderedGarment> {
  const image = selectImage(selection);

  const result = await image.run({
    prompt: renderPrompt(fabric),
    references: [sketch],
    aspectRatio: '1:1',
  });

  return {
    garment: {
      data: result.image.toString('base64'),
      mimeType: 'image/png',
      view: 'front',
      category,
    },
    providerId: result.providerId,
    cost: result.cost,
  };
}
