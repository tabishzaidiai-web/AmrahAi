import sharp from 'sharp';

/**
 * Forces an asset into marketplace-legal geometry.
 *
 * Generated packshots land close to spec but rarely on it: backgrounds come out
 * a point or two off pure white, and the garment floats in too much empty
 * frame. Amazon suppresses listings for exactly those two things, so rather
 * than prompting the model harder and hoping, the output is corrected
 * deterministically afterwards.
 */

export interface NormalizeOptions {
  /** Output edge length in pixels. */
  size: number;
  /** Fraction of the frame the product should span. */
  fill: number;
  aspect?: '1:1' | '3:4';
  /** Hard file-size cap. Zalando rejects anything over 2MB, which a PNG at
   *  catalogue resolution exceeds, so the encoder steps down to fit. */
  maxBytes?: number;
}

/** Bounding box of everything that is not background. */
export async function productBounds(input: Buffer) {
  const { data, info } = await sharp(input).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * ch;
      // Anything meaningfully darker than paper-white counts as product.
      if (data[i] < 246 || data[i + 1] < 246 || data[i + 2] < 246) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) throw new Error('Image appears to be blank');
  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    imageWidth: info.width,
    imageHeight: info.height,
  };
}

export async function normalizeForMarketplace(
  input: Buffer,
  { size, fill, aspect = '1:1', maxBytes }: NormalizeOptions,
): Promise<Buffer> {
  const bounds = await productBounds(input);

  const canvasWidth = size;
  const canvasHeight = aspect === '3:4' ? Math.round((size * 4) / 3) : size;

  // Scale so the garment's longest edge spans the requested fraction of the
  // frame, which is how marketplaces express their fill rules.
  const scale = Math.min(
    (canvasWidth * fill) / bounds.width,
    (canvasHeight * fill) / bounds.height,
  );

  const product = await sharp(input)
    .extract({
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
      height: bounds.height,
    })
    .resize({
      width: Math.max(1, Math.round(bounds.width * scale)),
      height: Math.max(1, Math.round(bounds.height * scale)),
      fit: 'fill',
    })
    .toBuffer();

  const { width = 0, height = 0 } = await sharp(product).metadata();

  // Compositing onto a fresh canvas makes the background pure white by
  // construction, rather than by thresholding pixels and risking damage to
  // white detail inside the garment itself.
  const canvas = sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  }).composite([
    {
      input: product,
      left: Math.round((canvasWidth - width) / 2),
      top: Math.round((canvasHeight - height) / 2),
    },
  ]);

  const png = await canvas.png().toBuffer();
  if (!maxBytes || png.byteLength <= maxBytes) return png;

  // JPEG at descending quality until it fits. Chroma subsampling is disabled
  // because it smears exactly the fine print detail this product promises to
  // preserve.
  for (const quality of [95, 90, 85, 78, 70, 60]) {
    const jpeg = await canvas.jpeg({ quality, chromaSubsampling: '4:4:4' }).toBuffer();
    if (jpeg.byteLength <= maxBytes) return jpeg;
  }

  throw new Error('Could not encode the asset within the marketplace size limit');
}
