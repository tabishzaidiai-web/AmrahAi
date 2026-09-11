import { createClient } from '@supabase/supabase-js';

/**
 * The collection queue.
 *
 * A drop is forty pieces at roughly two minutes each, which no web request can
 * hold open, so queueing a collection returns immediately and a worker picks
 * the pieces up afterwards.
 *
 * Workers run with the service role because they act on a brand's behalf long
 * after that brand's session has gone.
 */

const BUCKET = 'shoot-assets';

export interface QueuedItem {
  id: string;
  collection_id: string;
  user_id: string;
  sku: string | null;
  garment_front_path: string;
  garment_back_path: string | null;
  category: 'top' | 'bottom' | 'one-piece';
  garment_length: 'top' | 'mini' | 'knee' | 'midi' | 'maxi';
  audience: 'adult' | 'kids';
  attempts: number;
}

export interface CollectionSettings {
  model_id: string;
  scene: string;
  include_video: boolean;
}

export function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Worker credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false } });
}

export function isWorkerConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Takes the next queued piece, or null when the queue is empty. */
export async function claimNext(): Promise<QueuedItem | null> {
  const { data, error } = await admin().rpc('claim_collection_item');
  if (error) throw new Error(`Could not claim work: ${error.message}`);
  return (data as QueuedItem | null) ?? null;
}

export async function loadSettings(collectionId: string): Promise<CollectionSettings> {
  const { data, error } = await admin()
    .from('collections')
    .select('model_id, scene, include_video')
    .eq('id', collectionId)
    .single();

  if (error || !data) throw new Error('That collection no longer exists');
  return data as CollectionSettings;
}

export async function readGarment(path: string): Promise<{ data: string; mimeType: string }> {
  const { data, error } = await admin().storage.from(BUCKET).download(path);
  if (error || !data) throw new Error(`Could not read the uploaded garment: ${error?.message}`);

  return {
    data: Buffer.from(await data.arrayBuffer()).toString('base64'),
    mimeType: data.type || 'image/png',
  };
}

export async function markComplete(itemId: string, shootId: string) {
  await admin()
    .from('collection_items')
    .update({ status: 'complete', shoot_id: shootId, error: null })
    .eq('id', itemId);
}

/** Retried while attempts remain, because most failures here are transient
 *  provider errors rather than anything wrong with the garment. */
export async function markFailed(item: QueuedItem, reason: string, maxAttempts = 3) {
  const exhausted = item.attempts >= maxAttempts;
  await admin()
    .from('collection_items')
    .update({
      status: exhausted ? 'failed' : 'pending',
      claimed_at: null,
      error: reason.slice(0, 500),
    })
    .eq('id', item.id);
}

/**
 * The video submission gate.
 *
 * Returns the seconds to wait before a clip may be submitted; 0 means now.
 * Held in the database rather than in memory because the worker runs as
 * several serverless invocations that share no state, and Vertex counts their
 * requests together.
 */
export async function claimVideoSlot(minIntervalSeconds = 60): Promise<number> {
  const { data, error } = await admin().rpc('claim_video_slot', {
    min_interval_seconds: minIntervalSeconds,
  });
  if (error) throw new Error(`Could not reach the video queue: ${error.message}`);
  return Number(data ?? 0);
}

export interface VideoJob {
  id: string;
  shoot_id: string;
  user_id: string;
  /** Which shot of the shoot this clip animates. */
  source_slot: string;
  prompt: string;
  attempts: number;
}

/** Leaves a clip for a later worker run, since at one a minute a drop's videos
 *  cannot all be made inside a single invocation. */
export async function enqueueVideo(job: {
  shootId: string;
  userId: string;
  prompt: string;
}): Promise<void> {
  const { error } = await admin().from('video_jobs').insert({
    shoot_id: job.shootId,
    user_id: job.userId,
    prompt: job.prompt,
  });
  if (error) throw new Error(`Could not queue the video: ${error.message}`);
}

export async function claimNextVideo(): Promise<VideoJob | null> {
  const { data, error } = await admin().rpc('claim_video_job');
  if (error) throw new Error(`Could not claim a video: ${error.message}`);
  const row = (data as VideoJob[] | null)?.[0];
  return row ?? null;
}

export async function markVideoDone(id: string): Promise<void> {
  await admin().from('video_jobs').update({ status: 'complete' }).eq('id', id);
}

/** Three attempts, then the clip is left alone rather than retried forever. */
export async function markVideoFailed(job: VideoJob, reason: string): Promise<void> {
  await admin()
    .from('video_jobs')
    .update({
      status: job.attempts >= 3 ? 'failed' : 'pending',
      claimed_at: null,
      error: reason,
    })
    .eq('id', job.id);
}
