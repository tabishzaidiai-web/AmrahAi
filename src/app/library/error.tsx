'use client';

import { AlertCircle } from 'lucide-react';

/** Shown when the library cannot be loaded, so an outage never reads as data
 *  loss. */
export default function LibraryError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <AlertCircle size={22} className="mx-auto text-accent" aria-hidden />
        <h1 className="mt-4 font-display text-2xl tracking-tight">
          We couldn&rsquo;t load your library
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your shoots are safe. This is a problem reaching them, not a problem with
          the work itself.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-ink px-6 py-3 text-sm text-background transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
