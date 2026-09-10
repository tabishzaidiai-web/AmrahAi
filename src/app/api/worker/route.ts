import { randomUUID } from 'node:crypto';
import { runShoot } from '@/lib/pipeline/run';
import { loadModelPoses } from '@/lib/pipeline/models';
import { persistShoot } from '@/lib/storage';
import { SCENES } from '@/lib/scenes';
import { vertexConfig } from '@/lib/providers/vertex';
import { refundShoot, reserveShoot } from '@/lib/billing/credits';
import {
  admin,
  claimNext,
  isWorkerConfigured,
  loadSettings,
  markComplete,
  markFailed,
  readGarment,
  type QueuedItem,
} from '@/lib/pipeline/queue';

/**
 * Processes queued collection pieces.
 *
 * Invoked on a schedule rather than by a person, so it takes as many pieces as
 * fit in its time budget and leaves the rest for the next run. Stopping early
 * matters more than draining the queue: a worker killed mid-shoot leaves a
 * piece claimed but unfinished, which only the stale-claim timeout recovers.
 */

// A single shoot runs about two minutes, so the function needs room for one
// piece plus the margin to record it.
export const maxDuration = 300;

/** Leaves enough time to finish and record the piece in flight. */
const TIME_BUDGET_MS = 200_000;

/**
 * The scheduler sends CRON_SECRET; WORKER_SECRET covers manual runs and any
 * other scheduler. Without either configured the endpoint stays shut rather
 * than running the queue for anyone who finds the URL.
 */
function authorised(request: Request) {
  const provided = request.headers.get('authorization');
  const secrets = [process.env.CRON_SECRET, process.env.WORKER_SECRET].filter(Boolean);
  if (secrets.length === 0) return false;
  return secrets.some((secret) => provided === `Bearer ${secret}`);
}

/** Vercel's scheduler issues a GET. */
export async function GET(request: Request) {
  return drain(request);
}

export async function POST(request: Request) {
  return drain(request);
}

async function drain(request: Request) {
  if (!authorised(request)) {
    return Response.json({ message: 'Not authorised.' }, { status: 401 });
  }
  if (!isWorkerConfigured() || !vertexConfig().configured) {
    return Response.json({ message: 'Worker is not configured.' }, { status: 503 });
  }

  const started = Date.now();
  const processed: string[] = [];
  const failed: string[] = [];

  while (Date.now() - started < TIME_BUDGET_MS) {
    let item: QueuedItem | null;
    try {
      item = await claimNext();
    } catch (error) {
      console.error('Claim failed', error);
      break;
    }
    if (!item) break;

    try {
      await processItem(item);
      processed.push(item.id);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Shoot failed';
      await markFailed(item, reason);
      failed.push(item.id);
    }
  }

  return Response.json({ processed: processed.length, failed: failed.length });
}

async function processItem(item: QueuedItem) {
  const settings = await loadSettings(item.collection_id);
  const scene = SCENES.find((s) => s.id === settings.scene) ?? SCENES[0];

  // The credit is taken here rather than when the collection was queued, so a
  // brand that cancels a drop half way is not billed for pieces never shot.
  const db = admin();
  const check = await reserveShoot(item.user_id, db);
  if (!check.allowed) throw new Error(check.reason ?? 'No shoot credits remaining');

  const shootId = randomUUID();

  try {
    const front = await readGarment(item.garment_front_path);
    const back = item.garment_back_path
      ? await readGarment(item.garment_back_path)
      : undefined;

    const outcome = await runShoot({
      shootId,
      tier: check.account?.tier ?? 'free',
      routing: check.account?.routingPolicy ?? 'any',
      garmentFront: { ...front, view: 'front', category: item.category },
      garmentBack: back ? { ...back, view: 'back', category: item.category } : undefined,
      persona: {
        poses: await loadModelPoses(settings.model_id),
        bodyProfile: settings.model_id,
      },
      audience: item.audience,
      length: item.garment_length,
      scene: scene.prompt,
      includeVideo: settings.include_video,
    });

    if (outcome.assets.length === 0) {
      throw new Error('Nothing could be generated for this piece');
    }

    await persistShoot({
      shootId,
      userId: item.user_id,
      sku: item.sku ?? undefined,
      category: item.category,
      length: item.garment_length,
      audience: item.audience,
      assets: outcome.assets,
      totalCost: outcome.totalCost,
      failures: outcome.failures,
      db,
    });

    await markComplete(item.id, shootId);
  } catch (error) {
    // A piece that produced nothing should not cost the brand a credit.
    await refundShoot(item.user_id, db);
    throw error;
  }
}
