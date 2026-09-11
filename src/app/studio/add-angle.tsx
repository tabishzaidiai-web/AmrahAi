'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';

/**
 * Adding a shot the shoot did not produce.
 *
 * Every angle is a full-price render, so the shoot makes the ones a listing
 * needs and leaves the rest here, next to the pictures — where wanting another
 * one is a decision someone can actually make. Nothing is re-uploaded: the
 * angle is rendered from the packshot the shoot already stored.
 */
export function AddAngle({ shootId, pose, label }: { shootId: string; pose: string; label: string }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function add() {
    setState('working');
    setMessage(null);
    try {
      const response = await fetch('/api/angle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shootId, pose }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(data.message ?? 'That did not work.');
        setState('error');
        return;
      }
      // The new shot is stored against the shoot, so the page re-reads rather
      // than trying to splice it in from here.
      router.refresh();
    } catch {
      setMessage('That did not work.');
      setState('error');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={add}
        disabled={state === 'working'}
        className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-muted disabled:opacity-40"
      >
        {state === 'working' ? (
          <Loader2 size={14} className="animate-spin" aria-hidden />
        ) : (
          <ImagePlus size={14} aria-hidden />
        )}
        {state === 'working' ? 'Shooting…' : label}
      </button>
      {message && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          {message}
        </p>
      )}
    </div>
  );
}
