import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { CollectionProgress, type PieceState } from './progress';

export const dynamic = 'force-dynamic';

export default async function CollectionPage(props: PageProps<'/collections/[collectionId]'>) {
  const { collectionId } = await props.params;
  if (!isSupabaseConfigured) notFound();

  const supabase = await createClient();

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, created_at')
    .eq('id', collectionId)
    .single();

  if (!collection) notFound();

  const { data: items } = await supabase
    .from('collection_items')
    .select('id, sku, status, shoot_id, error')
    .eq('collection_id', collectionId)
    .order('created_at');

  const pieces: PieceState[] = (items ?? []).map((i) => ({
    id: i.id as string,
    sku: (i.sku as string) ?? 'Untitled',
    status: i.status as PieceState['status'],
    shootId: (i.shoot_id as string) ?? null,
    error: (i.error as string) ?? null,
  }));

  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/library" className="font-display text-lg tracking-tight">
            Amrah Studio
          </Link>
          <Link href="/library" className="text-sm text-muted hover:text-foreground">
            Library
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight">{collection.name as string}</h1>
        <CollectionProgress collectionId={collectionId} initial={pieces} />
      </div>
    </main>
  );
}
