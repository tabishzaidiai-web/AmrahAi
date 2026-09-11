import { z } from 'zod';
import { createClient, getUser, isSupabaseConfigured } from '@/lib/supabase/server';
import { DEFAULT_MODEL_ID } from '@/lib/pipeline/models-client';
import { loadAccount } from '@/lib/billing/credits';

/**
 * Queues a collection.
 *
 * Returns as soon as the pieces are stored rather than shooting them inline: a
 * drop is dozens of garments at roughly two minutes each, so the request that
 * starts it is long gone before the work finishes.
 */

const BUCKET = 'shoot-assets';
const MAX_PIECES = 200;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const settings = z.object({
  name: z.string().min(1).max(120),
  modelId: z.string().default(DEFAULT_MODEL_ID),
  category: z.enum(['top', 'bottom', 'one-piece']).default('one-piece'),
  length: z.enum(['top', 'mini', 'knee', 'midi', 'maxi']),
  audience: z.enum(['adult', 'kids']).default('adult'),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return Response.json({ message: 'Collections need an account.' }, { status: 503 });
  }

  const user = await getUser();
  if (!user) return Response.json({ message: 'Sign in first.' }, { status: 401 });

  const form = await request.formData();
  const parsed = settings.safeParse({
    name: form.get('name'),
    modelId: form.get('modelId') ?? undefined,
    category: form.get('category') ?? undefined,
    length: form.get('length'),
    audience: form.get('audience') ?? undefined,
  });
  if (!parsed.success) {
    // Naming the field matters: a required option quietly left behind by an
    // earlier change reads as "check the settings" and is invisible to whoever
    // has to fix it.
    const fields = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
    return Response.json(
      { message: `Check the collection settings: ${fields}.` },
      { status: 400 },
    );
  }

  const pieces = form.getAll('pieces').filter((f): f is File => f instanceof File);
  if (pieces.length === 0) {
    return Response.json({ message: 'Add at least one garment.' }, { status: 400 });
  }
  if (pieces.length > MAX_PIECES) {
    return Response.json(
      { message: `A collection can hold up to ${MAX_PIECES} pieces.` },
      { status: 413 },
    );
  }
  if (pieces.some((p) => p.size > MAX_UPLOAD_BYTES)) {
    return Response.json({ message: 'Each image must be under 10MB.' }, { status: 413 });
  }

  // Checked rather than reserved: credits are taken per piece as it is shot, so
  // a cancelled drop costs nothing. This only stops a brand queueing work the
  // account plainly cannot pay for.
  const account = await loadAccount(user.id);
  if (!account || account.creditsRemaining < pieces.length) {
    return Response.json(
      {
        message: `This drop needs ${pieces.length} shoots and the account has ${account?.creditsRemaining ?? 0}.`,
      },
      { status: 402 },
    );
  }

  const supabase = await createClient();

  const { data: collection, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      model_id: parsed.data.modelId,
    })
    .select('id')
    .single();

  if (error || !collection) {
    return Response.json({ message: 'Could not start the collection.' }, { status: 502 });
  }

  const rows: Record<string, unknown>[] = [];

  for (const piece of pieces) {
    // The filename is the only SKU most brands hand over, so it is kept.
    const sku = piece.name.replace(/\.[^.]+$/, '').slice(0, 120);
    const path = `${user.id}/collections/${collection.id}/${crypto.randomUUID()}.png`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, piece, { contentType: piece.type || 'image/png', upsert: false });

    if (uploadError) {
      return Response.json(
        { message: `Could not store ${piece.name}: ${uploadError.message}` },
        { status: 502 },
      );
    }

    rows.push({
      collection_id: collection.id,
      user_id: user.id,
      sku,
      garment_front_path: path,
      category: parsed.data.category,
      garment_length: parsed.data.length,
      audience: parsed.data.audience,
    });
  }

  const { error: itemsError } = await supabase.from('collection_items').insert(rows);
  if (itemsError) {
    return Response.json({ message: 'Could not queue the pieces.' }, { status: 502 });
  }

  return Response.json({ collectionId: collection.id, queued: rows.length });
}
