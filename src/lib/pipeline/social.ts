import sharp from 'sharp';
import { SOCIAL_FORMATS, type FormatSpec } from './social-formats';

/**
 * Social crops of a finished asset.
 *
 * Fashion brands sell their collections through Instagram, so the deliverable
 * is not one image but the same frame in the shapes the platform actually
 * renders. Cropping a finished render costs nothing and keeps every format
 * identical to the one that was approved, which regenerating per aspect would
 * not.
 */

export { SOCIAL_FORMATS, type FormatSpec, type SocialFormat } from './social-formats';

/**
 * Crops toward the top of the frame rather than the centre.
 *
 * A full-length fashion render puts the model's head near the top, and a
 * centred crop to a taller shape cuts it off. Biasing upward keeps the face and
 * the garment's neckline, losing floor instead.
 */
export async function socialCrop(image: Buffer, format: FormatSpec): Promise<Buffer> {
  return sharp(image)
    .resize({
      width: format.width,
      height: format.height,
      fit: 'cover',
      position: 'top',
    })
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toBuffer();
}

export async function socialSet(image: Buffer) {
  return Promise.all(
    SOCIAL_FORMATS.map(async (format) => ({
      format: format.id,
      image: await socialCrop(image, format),
    })),
  );
}
