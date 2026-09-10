import Link from 'next/link';
import { NewCollection } from './new-collection';

export const metadata = { title: 'New collection — Amrah Studio' };

export default function NewCollectionPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/library" className="font-display text-lg tracking-tight">
            Amrah Studio
          </Link>
          <Link href="/studio" className="text-sm text-muted hover:text-foreground">
            Single garment
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Shoot a collection
        </h1>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">
          Drop in the whole line. Settings are answered once and applied to every
          piece, which is how a collection is shot in a studio.
        </p>
        <NewCollection />
      </div>
    </main>
  );
}
