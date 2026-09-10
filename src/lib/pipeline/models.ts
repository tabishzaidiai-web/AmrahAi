import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { PoseId } from '../providers/types';

/**
 * The house-model library.
 *
 * A brand's audience decides which model suits its clothes, so this is a choice
 * rather than a fixed default. Each model is captured once per camera position;
 * holding a fixed set of poses is what lets every angle be an independent
 * try-on against the brand's original garment instead of a chain that
 * compounds error.
 */

// The list itself lives in a browser-safe module so the picker can render it.
export { HOUSE_MODELS, DEFAULT_MODEL_ID, type HouseModel } from './models-client';
import { HOUSE_MODELS } from './models-client';

const MODEL_DIR = path.join(process.cwd(), 'assets', 'models');

const POSE_FILES: Record<PoseId, string> = {
  front: 'front.jpg',
  back: 'back.jpg',
  'three-quarter': 'three-quarter.jpg',
  lifestyle: 'lifestyle.jpg',
};

const cache = new Map<string, Partial<Record<PoseId, string>>>();

export async function loadModelPoses(
  modelId: string,
): Promise<Partial<Record<PoseId, string>>> {
  const cached = cache.get(modelId);
  if (cached) return cached;

  const entries = await Promise.all(
    (Object.entries(POSE_FILES) as [PoseId, string][]).map(async ([pose, file]) => {
      try {
        const data = await readFile(path.join(MODEL_DIR, modelId, file));
        return [pose, data.toString('base64')] as const;
      } catch {
        // A missing pose costs that one angle, not the whole shoot.
        return null;
      }
    }),
  );

  const poses = Object.fromEntries(entries.filter((e) => e !== null));
  cache.set(modelId, poses);
  return poses;
}

export function isHouseModel(id: string): boolean {
  return HOUSE_MODELS.some((m) => m.id === id);
}

/** True when at least one model is installed and usable. */
export async function hasModelLibrary(): Promise<boolean> {
  for (const model of HOUSE_MODELS) {
    const poses = await loadModelPoses(model.id);
    if (poses.front) return true;
  }
  return false;
}
