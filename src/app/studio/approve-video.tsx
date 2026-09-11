'use client';

import { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';

/**
 * Approving a preview into a finished clip.
 *
 * The preview exists to answer one question — is this the right direction for
 * this garment — cheaply. Answering yes is the only thing that should cost
 * full price, so the expensive render happens here and nowhere else.
 *
 * The direction is not resent. The server reuses the prompt of the preview
 * being approved, so what gets published cannot quietly differ from what was
 * watched.
 */
export function ApproveVideo({ shootId, slot }: { shootId: string; slot: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'queued' | 'error'>('idle');

  async function approve() {
    setState('sending');
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shootId, slot, quality: 'final' }),
      });
      setState(response.ok ? 'queued' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'queued') {
    return (
      <p className="mt-2.5 flex items-center gap-1.5 text-xs text-accent">
        <Check size={13} aria-hidden />
        Full-resolution render queued.
      </p>
    );
  }

  return (
    <div className="mt-2.5">
      <button
        type="button"
        onClick={approve}
        disabled={state === 'sending'}
        className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs text-background transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {state === 'sending' ? (
          <Loader2 size={12} className="animate-spin" aria-hidden />
        ) : (
          <Sparkles size={12} aria-hidden />
        )}
        Looks right — render it properly
      </button>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        This 4-second clip is already usable for Reels. Approving renders the
        same direction longer and at 1080p, for a hero piece.
      </p>
      {state === 'error' && (
        <p role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          That did not go through. Try again in a moment.
        </p>
      )}
    </div>
  );
}
