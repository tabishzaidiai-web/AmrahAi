import { randomUUID } from 'node:crypto';
import { runShoot } from '@/lib/pipeline/run';
import { loadModelPoses } from '@/lib/pipeline/models';
import { persistShoot } from '@/lib/storage';
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
  claimNextVideo,
  markVideoDone,
  markVideoFailed,
  type QueuedItem,
} from '@/lib/pipeline/queue';
import { runQueuedVideo } from '@/lib/pipeline/video';

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
 * How many pieces one worker shoots at once.
 *
 * A shoot spends nearly all its time waiting on the provider rather than
 * computing, so several progress in the time one would. The ceiling is set by
 * memory — each shoot holds several multi-megabyte renders — and by the
 * provider's own rate limit, not by processor time. Three is conservative
 * against both; raise it once real throughput is measured.
 */
const LANES = Number(process.env.WORKER_LANES ?? 3);

/**
 * Who may run the queue.
 *
 * A secret is honoured when one is configured, but the endpoint also accepts
 * the platform scheduler unconditionally — the scheduler only sends
 * credentials if a secret has been set up, so requiring one meant the worker
 * rejected its own scheduler and collections sat queued forever.
 *
 * Running the queue is safe to expose because it grants nothing: it advances
 * work a brand already queued and already authorised, bills that same brand's
 * credits, and returns only counts. The worst an unwanted caller achieves is
 * making the shoot someone already asked for happen sooner.
 */
function authorised(request: Request) {
  const provided = request.headers.get('authorization');
  const secrets = [process.env.CRON_SECRET, process.env.WORKER_SECRET].filter(Boolean);
  if (secrets.length > 0 && secrets.some((s) => provided === `Bearer ${s}`)) return true;

  return (request.headers.get('user-agent') ?? '').startsWith('vercel-cron');
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
  let processed = 0;
  let failed = 0;
  // Lanes stop pulling once one of them finds the queue empty, so a nearly
  // finished drop does not keep every lane polling for work that is not there.
  let drained = false;

  const lane = async () => {
    while (!drained && Date.now() - started < TIME_BUDGET_MS) {
      let item: QueuedItem | null;
      try {
        // Claiming is atomic, so lanes never take the same piece.
        item = await claimNext();
      } catch (error) {
        console.error('Claim failed', error);
        return;
      }

      if (!item) {
        drained = true;
        return;
      }

      try {
        await processItem(item);
        processed++;
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'Shoot failed';
        await markFailed(item, reason);
        failed++;
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, LANES) }, lane));

  // Clips left behind by this or an earlier run, made one at a time because
  // that is all the provider allows. Done after the pieces so a drop's stills
  // are never delayed behind its videos.
  const videos = await drainVideos(started);

  return Response.json({ processed, failed, videos, lanes: LANES });
}

/** Makes queued clips until the run is out of time. */
async function drainVideos(started: number) {
  let made = 0;

  // One clip a minute plus the time it takes to render means a single run gets
  // through a handful; the schedule picks the rest up.
  while (Date.now() - started < TIME_BUDGET_MS) {
    const job = await claimNextVideo();
    if (!job) break;

    try {
      await runQueuedVideo(job);
      await markVideoDone(job.id);
      made++;
    } catch (error) {
      await markVideoFailed(job, error instanceof Error ? error.message : 'Video failed');
    }
  }

  return made;
}

async function processItem(item: QueuedItem) {
  const settings = await loadSettings(item.collection_id);

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
    });

    if (outcome.assets.length === 0) {
      throw new Error('Nothing could be generated for this piece');
    }

    await persistShoot({
      shootId,
      userId: item.user_id,
      modelId: settings.model_id,
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
