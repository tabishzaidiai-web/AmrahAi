import sharp from 'sharp';
import { MARKETPLACES, type MarketplaceId } from './specs';

export interface Finding {
  severity: 'fail' | 'warn';
  code: string;
  message: string;
}

export interface ComplianceReport {
  marketplace: MarketplaceId;
  passed: boolean;
  findings: Finding[];
}

interface ImageFacts {
  width: number;
  height: number;
  bytes: number;
  /** True when all four corners are exactly RGB(255,255,255). */
  pureWhiteCorners: boolean;
  /**
   * How much of the frame the product spans, measured from its bounding box.
   * Marketplaces mean span rather than coverage: a dress never occupies 85% of
   * the pixels even when it correctly fills the frame.
   */
  fillRatio: number;
}

/** Corners are sampled rather than the whole frame: a halo from a bad cut-out
 *  shows up at the edges, which is what actually triggers marketplace rejection. */
async function inspect(buffer: Buffer): Promise<ImageFacts> {
  const image = sharp(buffer);
  const { width = 0, height = 0 } = await image.metadata();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const at = (x: number, y: number) => {
    const idx = (y * info.width + x) * channels;
    return [data[idx], data[idx + 1], data[idx + 2]] as const;
  };

  const inset = Math.max(1, Math.floor(Math.min(info.width, info.height) * 0.02));
  const corners = [
    at(inset, inset),
    at(info.width - inset - 1, inset),
    at(inset, info.height - inset - 1),
    at(info.width - inset - 1, info.height - inset - 1),
  ];
  const pureWhiteCorners = corners.every(([r, g, b]) => r === 255 && g === 255 && b === 255);

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * channels;
      // Anything meaningfully darker than paper-white counts as product.
      if (data[idx] < 246 || data[idx + 1] < 246 || data[idx + 2] < 246) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const fillRatio =
    maxX < 0
      ? 0
      : Math.max((maxX - minX + 1) / info.width, (maxY - minY + 1) / info.height);

  return {
    width,
    height,
    bytes: buffer.byteLength,
    pureWhiteCorners,
    fillRatio,
  };
}

function ratioOf(width: number, height: number) {
  const r = width / height;
  if (Math.abs(r - 1) < 0.02) return '1:1';
  if (Math.abs(r - 3 / 4) < 0.02) return '3:4';
  return 'other';
}

export async function validate(
  buffer: Buffer,
  marketplace: MarketplaceId,
  options: { isMainImage?: boolean } = {},
): Promise<ComplianceReport> {
  const spec = MARKETPLACES[marketplace];
  const facts = await inspect(buffer);
  const findings: Finding[] = [];
  const isMain = options.isMainImage ?? true;

  const longest = Math.max(facts.width, facts.height);
  if (longest < spec.minLongestEdge) {
    findings.push({
      severity: 'fail',
      code: 'resolution-below-minimum',
      message: `${longest}px on the longest edge is below ${spec.label}'s ${spec.minLongestEdge}px minimum.`,
    });
  } else if (longest < spec.recommendedLongestEdge) {
    findings.push({
      severity: 'warn',
      code: 'resolution-below-recommended',
      message: `${longest}px works but ${spec.recommendedLongestEdge}px is recommended for ${spec.label}.`,
    });
  }

  if (facts.bytes > spec.maxFileBytes) {
    findings.push({
      severity: 'fail',
      code: 'file-too-large',
      message: `${(facts.bytes / 1024 / 1024).toFixed(1)}MB exceeds ${spec.label}'s ${(spec.maxFileBytes / 1024 / 1024).toFixed(0)}MB cap.`,
    });
  }

  if (spec.aspectRatio !== 'any' && ratioOf(facts.width, facts.height) !== spec.aspectRatio) {
    findings.push({
      severity: 'fail',
      code: 'wrong-aspect-ratio',
      message: `${spec.label} requires ${spec.aspectRatio}; this image is ${facts.width}x${facts.height}.`,
    });
  }

  if (isMain && spec.requiresWhiteBackground && !facts.pureWhiteCorners) {
    findings.push({
      severity: 'fail',
      code: 'background-not-pure-white',
      message: `${spec.label} main images need a pure white RGB(255,255,255) background. Off-white or a cut-out halo will be suppressed.`,
    });
  }

  if (isMain && spec.minFillRatio && facts.fillRatio < spec.minFillRatio) {
    findings.push({
      severity: 'fail',
      code: 'fill-ratio-too-low',
      message: `Product fills ${(facts.fillRatio * 100).toFixed(0)}% of the frame; ${spec.label} requires ${(spec.minFillRatio * 100).toFixed(0)}%.`,
    });
  }

  return {
    marketplace,
    passed: findings.every((f) => f.severity !== 'fail'),
    findings,
  };
}
