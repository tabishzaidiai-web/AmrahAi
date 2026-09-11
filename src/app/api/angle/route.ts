import { z } from 'zod';
import sharp from 'sharp';
import { createClient, getUser, isSupabaseConfigured } from '@/lib/supabase/server';
import { admin } from '@/lib/pipeline/queue';
import { loadModelPoses, isHouseModel } from '@/lib/pipeline/models';
import { selectTryOn } from '@/lib/providers/registry';
import { stamp } from '@/lib/compliance/provenance';
import { reserveShoot, refundShoot } from '@/lib/billing/credits';

/**
 * Adds an angle to a shoot that has already happened.
 *
 * The lifestyle frame is ad creative rather than a catalogue requirement, and
 * every angle is a full-price render, so a shoot no longer produces one unless
 * someone wants it. Wanting it is a decision best made looking at the pictures,
 * which is here.
 *
 * Nothing is re-uploaded to do this. The shoot already stored its packshot —
 * the brand's own garment cut free of its backdrop — and that is exactly the
 * reference the pipeline dresses the model from, so an angle added weeks later
 * is generated from the same source as the ones made on the day.
 */

const BUCKET = 'shoot-assets';

// One image against a provider, plus fetching and storing it.
export const maxDuration = 120;

const schema = z.object({
  shootId: z.string().uuid(),
  pose: z.enum(['lifestyle', 'three-quarter', 'back']),
});

/** Which slot each extra pose is filed under. */
const SLOT_FOR = {
  lifestyle: 'lifestyle',
  'three-quarter': 'on-model-three-quarter',
  back: 'on-model-back',
} as const;

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return Response.json({ message: 'Not configured yet.' }, { status: 503 });
  }

  const user = await getUser();
  if (!user) return Response.json({ message: 'Sign in first.' }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ message: 'Invalid request.' }, { status: 400 });
  }
  const { shootId, pose } = parsed.data;
  const slot = SLOT_FOR[pose];

  // Read as the designer, so row-level security decides whether this is theirs.
  const supabase = await createClient();

  const { data: shoot } = await supabase
    .from('shoots')
    .select('id, model_id')
    .eq('id', shootId)
    .maybeSingle();

  if (!shoot) return Response.json({ message: 'Shoot not found.' }, { status: 404 });

  const modelId = shoot.model_id as string | null;
  if (!modelId || !isHouseModel(modelId)) {
    return Response.json(
      { message: 'This shoot used an uploaded model, so extra angles are not available.' },
      { status: 409 },
    );
  }

  const { data: existing } = await supabase
    .from('assets')
    .select('id')
    .eq('shoot_id', shootId)
    .eq('slot', slot)
    .maybeSingle();

  if (existing) return Response.json({ added: false, alreadyExists: true });

  // The packshot is the garment, already cut free of its backdrop.
  const { data: packshot } = await supabase
    .from('assets')
    .select('storage_path')
    .eq('shoot_id', shootId)
    .eq('slot', 'ghost-front')
    .maybeSingle();

  if (!packshot) {
    return Response.json(
      { message: 'This shoot has no packshot to render a new angle from.' },
      { status: 409 },
    );
  }

  const poses = await loadModelPoses(modelId);
  const personImage = poses[pose];
  if (!personImage) {
    return Response.json({ message: 'No stored pose for that angle.' }, { status: 409 });
  }

  const check = await reserveShoot(user.id);
  if (!check.allowed) return Response.json({ message: check.reason }, { status: 402 });

  // Service role for storage: the bucket is private and the read is on the
  // designer's own already-authorised shoot.
  const db = admin();

  try {
    const { data: file, error } = await db.storage
      .from(BUCKET)
      .download(packshot.storage_path as string);
    if (error || !file) throw new Error('Could not read the packshot');

    const garment = await sharp(Buffer.from(await file.arrayBuffer()))
      // Same size the shoot itself sends: enough for embroidery, small enough
      // not to ship six megabytes of base64 per request.
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();

    const result = await selectTryOn({
      tier: check.account?.tier ?? 'free',
      routing: check.account?.routingPolicy ?? 'any',
    }).run({
      garment: {
        data: garment.toString('base64'),
        mimeType: 'image/png',
        view: 'front',
        category: 'one-piece',
      },
      personImage,
      personMimeType: 'image/png',
    });

    const marked = await stamp(result.image, {
      shootId,
      providerIds: [result.providerId],
      generatedAt: new Date(),
      depictsSyntheticModel: true,
    });

    const path = `${user.id}/${shootId}/${slot}.png`;
    const upload = await db.storage
      .from(BUCKET)
      .upload(path, marked, { contentType: 'image/png', upsert: true });
    if (upload.error) throw new Error(upload.error.message);

    await db.from('assets').insert({
      shoot_id: shootId,
      user_id: user.id,
      slot,
      storage_path: path,
      kind: 'image',
      provider_id: result.providerId,
      cost_usd: result.cost,
    });

    return Response.json({ added: true, slot });
  } catch (err) {
    // An angle that produced nothing should not cost the brand a credit.
    await refundShoot(user.id);
    console.error('Extra angle failed', err);
    return Response.json({ message: 'That angle could not be rendered.' }, { status: 502 });
  }
}
