import { createClient } from './supabase/server';
import type { ShootAsset } from './pipeline/run';

/**
 * Persists a shoot and its assets.
 *
 * Generated imagery is a brand's unreleased collection, so the bucket is
 * private and every object is stored under the owner's id — storage policies
 * key off that first path segment, which is what stops one brand reading
 * another's designs.
 */

const BUCKET = 'shoot-assets';

/** How long a download link stays valid. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export interface PersistedAsset {
  slot: string;
  kind: 'image' | 'video';
  /** Time-limited URL the browser can load directly. */
  src: string;
  providerId: string;
  cost: number;
  compliance?: unknown;
}

export interface ShootRecord {
  id: string;
  createdAt: string;
  sku: string | null;
  status: string;
  costUsd: number;
  assetCount: number;
}

function extensionFor(asset: ShootAsset) {
  return asset.kind === 'video' ? 'mp4' : 'png';
}

export async function persistShoot(params: {
  shootId: string;
  userId: string;
  sku?: string;
  category: string;
  length: string;
  audience: string;
  assets: ShootAsset[];
  totalCost: number;
}): Promise<PersistedAsset[]> {
  const supabase = await createClient();

  await supabase.from('shoots').insert({
    id: params.shootId,
    user_id: params.userId,
    sku: params.sku ?? null,
    // The uploaded garment is not retained; only what the brand can use.
    garment_front_url: '',
    garment_category: params.category,
    garment_length: params.length,
    audience: params.audience,
    status: 'complete',
    cost_usd: params.totalCost,
  });

  const persisted: PersistedAsset[] = [];

  for (const asset of params.assets) {
    const path = `${params.userId}/${params.shootId}/${asset.slot}.${extensionFor(asset)}`;

    if (asset.kind === 'video') {
      const uri = asset.uri ?? '';

      // Veo returns the clip inline as base64. Left as-is that lands several
      // megabytes of string in a database column, so it is decoded and stored
      // as a file like every other asset.
      if (uri.startsWith('data:')) {
        const bytes = Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64');
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, bytes, { contentType: 'video/mp4', upsert: true });
        if (error) throw new Error(`Could not store ${asset.slot}: ${error.message}`);

        await supabase.from('assets').insert({
          shoot_id: params.shootId,
          user_id: params.userId,
          slot: asset.slot,
          storage_path: path,
          kind: 'video',
          provider_id: asset.providerId,
          cost_usd: asset.cost,
        });

        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

        persisted.push({
          slot: asset.slot,
          kind: 'video',
          src: signed?.signedUrl ?? '',
          providerId: asset.providerId,
          cost: asset.cost,
        });
        continue;
      }

      // A provider-hosted URI is recorded by reference.
      await supabase.from('assets').insert({
        shoot_id: params.shootId,
        user_id: params.userId,
        slot: asset.slot,
        storage_path: uri,
        kind: 'video',
        provider_id: asset.providerId,
        cost_usd: asset.cost,
      });
      persisted.push({
        slot: asset.slot,
        kind: 'video',
        src: uri,
        providerId: asset.providerId,
        cost: asset.cost,
      });
      continue;
    }

    if (!asset.image) continue;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, asset.image, { contentType: 'image/png', upsert: true });
    if (error) throw new Error(`Could not store ${asset.slot}: ${error.message}`);

    await supabase.from('assets').insert({
      shoot_id: params.shootId,
      user_id: params.userId,
      slot: asset.slot,
      storage_path: path,
      kind: 'image',
      provider_id: asset.providerId,
      cost_usd: asset.cost,
      compliance: asset.compliance ?? null,
    });

    const { data: signed } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    persisted.push({
      slot: asset.slot,
      kind: 'image',
      src: signed?.signedUrl ?? '',
      providerId: asset.providerId,
      cost: asset.cost,
      compliance: asset.compliance,
    });
  }

  return persisted;
}

export async function listShoots(): Promise<ShootRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shoots')
    .select('id, created_at, sku, status, cost_usd, assets(count)')
    .order('created_at', { ascending: false })
    .limit(50);

  // An unreachable database must not render as an empty library: a brand would
  // read that as their work having been lost.
  if (error) throw new Error(`Could not load your shoots: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id as string,
    createdAt: row.created_at as string,
    sku: row.sku as string | null,
    status: row.status as string,
    costUsd: Number(row.cost_usd ?? 0),
    assetCount: (row.assets as { count: number }[] | null)?.[0]?.count ?? 0,
  }));
}

export async function loadShoot(shootId: string): Promise<PersistedAsset[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('assets')
    .select('slot, storage_path, kind, provider_id, cost_usd, compliance')
    .eq('shoot_id', shootId);

  const rows = data ?? [];
  return Promise.all(
    rows.map(async (row) => {
      const path = row.storage_path as string;
      let src = path;

      // Provider-hosted media is recorded by absolute URI; everything stored in
      // the bucket needs a fresh signed link on each read.
      if (!/^https?:|^gs:/.test(path)) {
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
        src = signed?.signedUrl ?? '';
      }

      return {
        slot: row.slot as string,
        kind: row.kind as 'image' | 'video',
        src,
        providerId: (row.provider_id as string) ?? '',
        cost: Number(row.cost_usd ?? 0),
        compliance: row.compliance,
      };
    }),
  );
}
