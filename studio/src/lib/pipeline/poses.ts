import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PoseId } from '../providers/types';

/**
 * The house model, captured once per camera position.
 *
 * Holding a fixed set of poses is what lets every angle in a bundle be an
 * independent try-on against the brand's original garment. Generating each
 * angle from the previous one would compound drift across the set, which is
 * exactly the failure this product exists to avoid.
 *
 * Poses live on disk as a one-time asset. Brands on paid tiers can replace them
 * with their own house model.
 */

const POSE_DIR = path.join(process.cwd(), 'assets', 'poses');

const POSE_FILES: Record<PoseId, string> = {
  front: 'front.png',
  back: 'back.png',
  'three-quarter': 'three-quarter.png',
  lifestyle: 'lifestyle.png',
};

let cached: Partial<Record<PoseId, string>> | undefined;

export async function POSE_LIBRARY(): Promise<Partial<Record<PoseId, string>>> {
  if (cached) return cached;

  const entries = await Promise.all(
    (Object.entries(POSE_FILES) as [PoseId, string][]).map(async ([pose, file]) => {
      try {
        const data = await readFile(path.join(POSE_DIR, file));
        return [pose, data.toString('base64')] as const;
      } catch {
        // A missing pose degrades that one angle rather than the whole shoot.
        return null;
      }
    }),
  );

  cached = Object.fromEntries(entries.filter((e) => e !== null));
  return cached;
}

export async function hasPoseLibrary(): Promise<boolean> {
  const poses = await POSE_LIBRARY();
  return Boolean(poses.front);
}
