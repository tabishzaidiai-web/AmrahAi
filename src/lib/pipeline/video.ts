import { selectVideo } from '../providers/registry';
import { admin, type VideoJob } from './queue';

/**
 * Makes the clip a designer asked for, from the shot they chose.
 *
 * Vertex accepts one video request a minute for this project and will not
 * raise that until the project has usage history, so clips are queued and
 * produced here, one per worker pass, and appended to the shoot they belong to.
 *
 * The clip is generated from a still the designer has already seen and
 * approved, so the piece cannot drift between the images a brand publishes and
 * the video beside them.
 */

const BUCKET = 'shoot-assets';

export async function runQueuedVideo(job: VideoJob): Promise<void> {
  const db = admin();

  const { data: front, error: frontError } = await db
    .from('assets')
    .select('storage_path')
    .eq('shoot_id', job.shoot_id)
    .eq('slot', job.source_slot)
    .maybeSingle();

  if (frontError) throw new Error(`Could not find the shot: ${frontError.message}`);
  if (!front) throw new Error('That shot is no longer in this shoot');

  const { data: file, error: downloadError } = await db.storage
    .from(BUCKET)
    .download(front.storage_path as string);
  if (downloadError || !file) {
    throw new Error(`Could not read the front render: ${downloadError?.message ?? 'missing'}`);
  }

  const image = Buffer.from(await file.arrayBuffer());

  // Generous, because this job exists precisely to wait: it is not holding a
  // person or a piece's stills up, and the whole point is to catch a slot.
  const result = await selectVideo({ tier: 'free', routing: 'any' }).run({
    image: { data: image.toString('base64'), mimeType: 'image/png' },
    prompt: job.prompt,
    durationSeconds: 6,
    aspectRatio: '9:16',
    waitBudgetMs: 130_000,
  });

  const path = `${job.user_id}/${job.shoot_id}/video-${job.source_slot}.mp4`;
  const uri = result.uri ?? '';

  if (uri.startsWith('data:')) {
    const bytes = Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64');
    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: 'video/mp4', upsert: true });
    if (error) throw new Error(`Could not store the clip: ${error.message}`);
  }

  await db.from('assets').insert({
    shoot_id: job.shoot_id,
    user_id: job.user_id,
    slot: `video-${job.source_slot}`,
    // Stored in the bucket when returned inline, referenced when the provider
    // hosts it — the same split the rest of the pipeline uses.
    storage_path: uri.startsWith('data:') ? path : uri,
    kind: 'video',
    provider_id: result.providerId,
    cost_usd: result.cost,
  });

  // The clip is real spend, and a shoot's recorded cost should account for it.
  const { data: shoot } = await db
    .from('shoots')
    .select('cost_usd')
    .eq('id', job.shoot_id)
    .maybeSingle();

  await db
    .from('shoots')
    .update({ cost_usd: Number(shoot?.cost_usd ?? 0) + result.cost })
    .eq('id', job.shoot_id);
}
