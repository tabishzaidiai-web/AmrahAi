import sharp from 'sharp';

/**
 * Garment length verification.
 *
 * Try-on does not preserve hem length: identical inputs produce mini, knee and
 * maxi across runs, because a flat lay carries no scale reference for the model
 * to work from. Length is therefore declared by the brand and checked against
 * the render rather than trusted.
 *
 * The hem is located by finding where bare leg begins, not by looking for the
 * garment itself. Matching garment colour fails on white or grey pieces and
 * cannot separate fabric from skin, which is similarly saturated; the leg below
 * a hem is the one signal that holds whatever the garment looks like.
 *
 * Verified against renders of the same garment that came back mini, knee and
 * maxi from identical inputs: all three measure to their true length. The
 * measurement assumes the pose library's framing, where the model is centred
 * and shot head to floor.
 */

export type GarmentLength = 'top' | 'mini' | 'knee' | 'midi' | 'maxi';

/**
 * Where the hem should fall, as a fraction of the distance from the top of the
 * head to the floor, measured against the pose library's framing.
 */
const EXPECTED_HEM: Record<GarmentLength, { min: number; max: number }> = {
  top: { min: 0.36, max: 0.56 },
  mini: { min: 0.54, max: 0.67 },
  knee: { min: 0.65, max: 0.76 },
  midi: { min: 0.74, max: 0.87 },
  maxi: { min: 0.86, max: 1.0 },
};

export interface HemMeasurement {
  /** Hem position as a fraction of body height, 0 at the head. */
  position: number;
  matches: boolean;
  expected: { min: number; max: number };
}

type Rgb = readonly [number, number, number];

/**
 * Skin has red above green above blue with a narrow spread. Sampling the
 * model's own face would be tighter, but this generalises across the pose
 * library without needing landmarks.
 */
function isSkin([r, g, b]: Rgb): boolean {
  return (
    r > 70 &&
    r > g + 8 &&
    g > b &&
    r - b > 12 &&
    r - b < 130 &&
    Math.max(r, g, b) - Math.min(r, g, b) > 12
  );
}

export async function measureHem(
  render: Buffer,
  declared: GarmentLength,
): Promise<HemMeasurement> {
  const { data, info } = await sharp(render).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const pixel = (x: number, y: number): Rgb => {
    const i = (y * info.width + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const background = pixel(2, Math.floor(info.height / 2));
  const isBackground = (p: Rgb) =>
    Math.abs(p[0] - background[0]) < 20 &&
    Math.abs(p[1] - background[1]) < 20 &&
    Math.abs(p[2] - background[2]) < 20;

  // Subject extent gives the head-to-floor span the hem is measured against.
  let subjectTop = info.height;
  let subjectBottom = 0;
  let subjectLeft = info.width;
  let subjectRight = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (!isBackground(pixel(x, y))) {
        if (y < subjectTop) subjectTop = y;
        if (y > subjectBottom) subjectBottom = y;
        if (x < subjectLeft) subjectLeft = x;
        if (x > subjectRight) subjectRight = x;
      }
    }
  }

  const bodyHeight = subjectBottom - subjectTop;
  if (bodyHeight <= 0) throw new Error('Could not locate the model in the render');

  // Sleeves and hands sit at the sides at hem height and dilute the reading, so
  // only the central band where the legs are is sampled.
  const centre = (subjectLeft + subjectRight) / 2;
  const band = (subjectRight - subjectLeft) * 0.16;
  const from = Math.max(0, Math.round(centre - band));
  const to = Math.min(info.width - 1, Math.round(centre + band));

  const skinFraction = (y: number) => {
    let skin = 0;
    let subject = 0;
    for (let x = from; x <= to; x++) {
      const p = pixel(x, y);
      if (isBackground(p)) continue;
      subject++;
      if (isSkin(p)) skin++;
    }
    return subject > 4 ? skin / subject : 0;
  };

  // Search below the hips so the face, neck and hands cannot be mistaken for
  // leg, and stop above the shoes.
  const searchFrom = subjectTop + Math.round(bodyHeight * 0.5);
  const searchTo = subjectTop + Math.round(bodyHeight * 0.95);

  let hemRow = subjectBottom;
  for (let y = searchFrom; y <= searchTo; y++) {
    // The first mostly-bare row marks uncovered leg; the hem sits just above.
    if (skinFraction(y) > 0.5) {
      hemRow = y;
      break;
    }
  }

  const position = Math.min(1, (hemRow - subjectTop) / bodyHeight);
  const expected = EXPECTED_HEM[declared];

  return {
    position,
    matches: position >= expected.min && position <= expected.max,
    expected,
  };
}
