import { Nav } from '@/app/nav';
import Link from 'next/link';
import { listShoots } from '@/lib/storage';
import { isSupabaseConfigured } from '@/lib/supabase/server';

export const metadata = { title: 'Library — Amrah Studio' };

// Shoots are per-account, so this must not be cached across requests.
export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const shoots = isSupabaseConfigured ? await listShoots() : [];

  return (
    <main className="min-h-screen">
      <Nav current="library" />

      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight">Library</h1>

        {shoots.length === 0 ? (
          <p className="mt-6 max-w-md leading-relaxed text-muted">
            Nothing here yet. Your shoots are kept privately against your account, so
            you can come back to them any time.
          </p>
        ) : (
          <ul className="mt-8 overflow-hidden rounded-2xl border border-line">
            {shoots.map((shoot) => (
              <li key={shoot.id} className="border-b border-line last:border-b-0">
                <Link
                  href={`/library/${shoot.id}`}
                  className="flex items-center justify-between gap-4 bg-surface px-5 py-4 transition-colors hover:bg-accent-soft"
                >
                  <div>
                    <p className="text-sm">{shoot.sku ?? 'Untitled garment'}</p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(shoot.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {' · '}
                      {shoot.assetCount} asset{shoot.assetCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <span className="text-xs text-muted">{shoot.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
