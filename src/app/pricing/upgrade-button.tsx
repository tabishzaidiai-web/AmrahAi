'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function UpgradeButton({
  tier,
  featured,
}: {
  tier: 'starter' | 'pro' | 'scale';
  featured?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Could not start checkout.');
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        disabled={busy}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm transition-opacity hover:opacity-90 disabled:opacity-50 ${
          featured ? 'bg-ink text-background' : 'border border-line text-foreground'
        }`}
      >
        {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
        {busy ? 'Opening checkout…' : 'Choose plan'}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </>
  );
}
