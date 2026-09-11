import sharp from 'sharp';

/**
 * The product shot, cut rather than drawn.
 *
 * The white-background packshot used to be generated: the garment photograph
 * went to an image model with a prompt asking for a ghost-mannequin rendering
 * that preserved every detail. Measured, it did not. Asked for a floor-length
 * kurta with five embroidered motif pairs it returned a knee-length one, and
 * the stronger model invented a brand label at the neckline that existed
 * nowhere in the garment.
 *
 * But this is the one slot that never needed a model at all. The brand has
 * already photographed the garment; a catalogue packshot is that photograph
 * lifted onto clean white and framed to the marketplace's rules. Done by
 * cutting, every thread is the brand's own and hallucination is not reduced,
 * it is impossible.
 *
 * It only works on a flat-lay already shot against a plain light background,
 * which is how studios shoot them but not a guarantee. When the background is
 * busy, dark, or too close to the garment's own colour to separate, this
 * returns null rather than a damaged cut-out, and the caller falls back to
 * generation.
 */

/** Longest edge used for analysis. The mask is scaled back up afterwards. */
const ANALYSIS_EDGE = 900;

/** How far a pixel may sit from the background colour and still be background. */
const TOLERANCE = 34;

/** Below this, the border is not one flat colour and the cut cannot be trusted. */
const MIN_BORDER_UNIFORMITY = 0.9;

/** A plain backdrop is lit; anything darker is a styled scene, not a flat lay. */
const MIN_BACKGROUND_LIGHTNESS = 200;

type Rgb = readonly [number, number, number];

function distance(a: Rgb, b: Rgb) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export async function packshotFromFlatLay(input: Buffer): Promise<Buffer | null> {
  const meta = await sharp(input).metadata();
  if (!meta.width || !meta.height) return null;

  const scale = ANALYSIS_EDGE / Math.max(meta.width, meta.height);
  const aw = Math.max(1, Math.round(meta.width * Math.min(1, scale)));
  const ah = Math.max(1, Math.round(meta.height * Math.min(1, scale)));

  const { data, info } = await sharp(input)
    .resize(aw, ah, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const at = (x: number, y: number): Rgb => {
    const i = (y * info.width + x) * ch;
    return [data[i], data[i + 1], data[i + 2]];
  };

  // The backdrop's colour, taken from the frame's edge where the garment is
  // not, as a median so a stray shadow cannot set it.
  const border: Rgb[] = [];
  for (let x = 0; x < info.width; x++) {
    border.push(at(x, 0), at(x, info.height - 1));
  }
  for (let y = 0; y < info.height; y++) {
    border.push(at(0, y), at(info.width - 1, y));
  }

  const median = (c: 0 | 1 | 2) => {
    const v = border.map((p) => p[c]).sort((a, b) => a - b);
    return v[Math.floor(v.length / 2)];
  };
  const background: Rgb = [median(0), median(1), median(2)];

  if (Math.min(...background) < MIN_BACKGROUND_LIGHTNESS) return null;

  const uniform = border.filter((p) => distance(p, background) < TOLERANCE).length / border.length;
  if (uniform < MIN_BORDER_UNIFORMITY) return null;

  // Background is what the backdrop's colour reaches from the frame's edge.
  // Flooding inward rather than thresholding everywhere is the whole point:
  // white thread, ivory panels and pale lining inside the garment are the same
  // colour as the backdrop and must survive.
  const isBackground = new Uint8Array(info.width * info.height);
  const queue: number[] = [];

  const consider = (x: number, y: number) => {
    const idx = y * info.width + x;
    if (isBackground[idx]) return;
    if (distance(at(x, y), background) >= TOLERANCE) return;
    isBackground[idx] = 1;
    queue.push(idx);
  };

  for (let x = 0; x < info.width; x++) {
    consider(x, 0);
    consider(x, info.height - 1);
  }
  for (let y = 0; y < info.height; y++) {
    consider(0, y);
    consider(info.width - 1, y);
  }

  for (let head = 0; head < queue.length; head++) {
    const idx = queue[head];
    const x = idx % info.width;
    const y = (idx - x) / info.width;
    if (x > 0) consider(x - 1, y);
    if (x < info.width - 1) consider(x + 1, y);
    if (y > 0) consider(x, y - 1);
    if (y < info.height - 1) consider(x, y + 1);
  }

  const garmentPixels = isBackground.length - isBackground.reduce((n, v) => n + v, 0);
  const coverage = garmentPixels / isBackground.length;

  // Nothing found, or nothing removed: either way this is not a flat lay on a
  // plain backdrop and the caller should not be handed a cut-out of it.
  if (coverage < 0.03 || coverage > 0.98) return null;

  // Opaque where the garment is. Blurred a little on the way up so the edge
  // lands soft against white instead of showing the analysis grid.
  const mask = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < mask.length; i++) mask[i] = isBackground[i] ? 0 : 255;

  const alpha = await sharp(mask, {
    raw: { width: info.width, height: info.height, channels: 1 },
  })
    .resize(meta.width, meta.height, { fit: 'fill' })
    .blur(1.2)
    .raw()
    .toBuffer();

  return sharp(input)
    .removeAlpha()
    .joinChannel(alpha, {
      raw: { width: meta.width, height: meta.height, channels: 1 },
    })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();
}
