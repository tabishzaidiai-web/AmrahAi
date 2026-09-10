import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadShoot } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase/server';
import { ShootView } from './shoot-view';
import type { ResultAsset } from '@/app/studio/results';
import type { SlotId } from '@/lib/pipeline/bundle';

export const dynamic = 'force-dynamic';

export default async function ShootPage(props: PageProps<'/library/[shootId]'>) {
  const { shootId } = await props.params;
  if (!isSupabaseConfigured) notFound();

  const stored = await loadShoot(shootId);
  if (stored.length === 0) notFound();

  const assets = stored.map((a) => ({
    slot: a.slot as SlotId,
    kind: a.kind,
    src: a.src,
    providerId: a.providerId,
    cost: a.cost,
    compliance: a.compliance as ResultAsset['compliance'],
  }));

  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/library" className="font-display text-lg tracking-tight">
            Amrah Studio
          </Link>
          <Link href="/library" className="text-sm text-muted hover:text-foreground">
            Back to library
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-12">
        <ShootView shootId={shootId} assets={assets} />
      </div>
    </main>
  );
}
