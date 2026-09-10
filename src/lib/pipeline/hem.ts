import sharp from 'sharp';

/**
 * Garment length verification.
 *
 * Try-on does not preserve hem length: identical inputs return mini, knee and
 * maxi across runs, because a flat lay carries no scale reference for the model
 * to work from. Length is therefore declared by the brand and checked against
 * the render rather than trusted.
 *
 * The hem is found by locating where bare leg begins, and "bare leg" is matched
 * against the wearer's own skin tone sampled from her reference photograph. An
 * earlier version used a generic warm-tone heuristic and read rust, terracotta
 * and ochre garments as skin — which is most of a South Asian collection — so
 * every render of them was rejected at the hip.
 *
 * The measurement reports its own confidence, because it has a known blind
 * spot: a garment close in tone to the wearer's skin cannot be told from her
 * leg. Asking a vision model instead was tried and was worse — it returned
 * four different lengths for one dress across four poses — so the boundary
 * between adjacent lengths is genuinely ambiguous rather than merely hard to
 * compute. An unreliable reading must therefore never reject a render: the
 * cost of discarding good work exceeds the cost of letting a borderline
 * length through.
 */

// One definition, shared with the picker the brand actually chooses from, so
// the bands here and the labels there cannot drift apart.
export type { GarmentLength } from '../garment-lengths';
import type { GarmentLength } from '../garment-lengths';

/**
 * Where the hem should fall, as a fraction of the distance from the top of the
 * head to the floor, measured against the model library's framing.
 */
const EXPECTED_HEM: Record<GarmentLength, { min: number; max: number }> = {
  top: { min: 0.36, max: 0.56 },
  mini: { min: 0.54, max: 0.67 },
  knee: { min: 0.65, max: 0.78 },
  midi: { min: 0.76, max: 0.88 },
  maxi: { min: 0.86, max: 1.0 },
};

export interface HemMeasurement {
  /** Hem position as a fraction of body height, 0 at the head. */
  position: number;
  matches: boolean;
  expected: { min: number; max: number };
  /**
   * False when the garment is too close in tone to the wearer's skin for the
   * hem to be located. The caller must not reject on an unconfident reading.
   */
  confident: boolean;
}

type Rgb = readonly [number, number, number];

/** Loose filter used only to find candidate skin pixels in the reference
 *  photograph, where the wearer is in plain grey and nothing warm competes. */
function looksLikeSkin([r, g, b]: Rgb): boolean {
  return r > 60 && r > g + 10 && g > b && r - b > 15 && r - b < 140;
}

function distance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

/**
 * The wearer's own skin tone, taken from her reference photograph.
 *
 * Sampling the median of candidate pixels rather than one point keeps a stray
 * shadow or highlight from setting the reference.
 */
export async function sampleSkinTone(person: Buffer): Promise<Rgb> {
  const { data, info } = await sharp(person)
    .resize(200, 260, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const candidates: Rgb[] = [];

  // Head and upper body only: in the reference the legs are clothed, and hands
  // are small and often shadowed.
  const from = Math.round(info.height * 0.02);
  const to = Math.round(info.height * 0.25);

  for (let y = from; y < to; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * ch;
      const p: Rgb = [data[i], data[i + 1], data[i + 2]];
      if (looksLikeSkin(p)) candidates.push(p);
    }
  }

  if (candidates.length === 0) throw new Error('Could not read the model’s skin tone');

  const median = (channel: 0 | 1 | 2) => {
    const values = candidates.map((c) => c[channel]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  };
  return [median(0), median(1), median(2)];
}

export async function measureHem(
  render: Buffer,
  person: Buffer,
  declared: GarmentLength,
): Promise<HemMeasurement> {
  const skin = await sampleSkinTone(person);

  const { data, info } = await sharp(render).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const pixel = (x: number, y: number): Rgb => {
    const i = (y * info.width + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const background = pixel(2, Math.floor(info.height / 2));
  const isBackground = (p: Rgb) => distance(p, background) < 34;

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

  // Sleeves and hands sit at hem height and dilute the reading, so only the
  // central band where the legs are is sampled.
  const centre = (subjectLeft + subjectRight) / 2;
  const band = (subjectRight - subjectLeft) * 0.16;
  const from = Math.max(0, Math.round(centre - band));
  const to = Math.min(info.width - 1, Math.round(centre + band));

  // Tight enough that a warm garment does not read as the wearer's skin, loose
  // enough to survive the lighting difference between reference and render.
  const TOLERANCE = 52;

  // The garment's own tone, taken as the median across a band of the torso
  // where it is certainly cloth. A single sample lands on a placket, a button
  // or a fold as often as on the fabric.
  const garmentTone = ((): Rgb => {
    const samples: Rgb[] = [];
    const bandTop = subjectTop + Math.round(bodyHeight * 0.32);
    const bandBottom = subjectTop + Math.round(bodyHeight * 0.46);
    for (let y = bandTop; y <= bandBottom; y += 2) {
      for (let x = from; x <= to; x += 2) {
        const p = pixel(x, y);
        if (!isBackground(p)) samples.push(p);
      }
    }
    if (samples.length === 0) return [0, 0, 0];
    const median = (c: 0 | 1 | 2) => {
      const v = samples.map((s) => s[c]).sort((a, b) => a - b);
      return v[Math.floor(v.length / 2)];
    };
    return [median(0), median(1), median(2)];
  })();

  // When the cloth sits within reach of the wearer's skin tone — a terracotta
  // dress on a warm-skinned model — leg and fabric cannot be told apart and the
  // reading below must not be used to reject anything.
  const confident = distance(garmentTone, skin) > TOLERANCE * 1.4;

  const bareFraction = (y: number) => {
    let bare = 0;
    let subject = 0;
    for (let x = from; x <= to; x++) {
      const p = pixel(x, y);
      if (isBackground(p)) continue;
      subject++;
      if (distance(p, skin) < TOLERANCE) bare++;
    }
    return subject > 4 ? bare / subject : 0;
  };

  // Search below the hips so the face and hands cannot be mistaken for leg, and
  // stop above the shoes.
  const searchFrom = subjectTop + Math.round(bodyHeight * 0.5);
  const searchTo = subjectTop + Math.round(bodyHeight * 0.95);

  let hemRow = subjectBottom;
  for (let y = searchFrom; y <= searchTo; y++) {
    // The first mostly-bare row marks uncovered leg; the hem sits just above.
    if (bareFraction(y) > 0.5) {
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
    confident,
  };
}
