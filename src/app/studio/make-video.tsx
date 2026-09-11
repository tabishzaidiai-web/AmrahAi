'use client';

import { useState } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { DIRECTIONS, DEFAULT_DIRECTION } from '@/lib/pipeline/directions';

/**
 * Asking for a clip from one shot.
 *
 * Deliberately shut until someone wants it. Video used to be made for every
 * piece automatically, which cost more than all the stills together and was
 * usually unwanted; the decision belongs here, next to the picture the designer
 * is already looking at.
 *
 * Directions are offered as a short list of things a model can be asked to do,
 * because that is how a photographer is briefed. Writing a prompt is available
 * for anyone who wants it, and hidden for everyone who does not.
 */
export function MakeVideo({ shootId, slot }: { shootId: string; slot: string }) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState(DEFAULT_DIRECTION);
  const [custom, setCustom] = useState('');
  const [writing, setWriting] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'queued' | 'error'>('idle');

  async function order() {
    setState('sending');
    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shootId, slot, direction, custom: custom.trim() || undefined }),
      });
      setState(response.ok ? 'queued' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'queued') {
    return (
      <p className="mt-2.5 flex items-center gap-1.5 text-xs text-accent">
        <Film size={13} aria-hidden />
        Video queued — it lands in your library shortly.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2.5 flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
      >
        <Film size={13} aria-hidden />
        Make a video from this shot
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-line p-3">
      <p className="text-xs text-muted">What should she do?</p>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {DIRECTIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            title={d.hint}
            onClick={() => {
              setDirection(d.id);
              setWriting(false);
            }}
            aria-pressed={!writing && direction === d.id}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              !writing && direction === d.id
                ? 'border-accent bg-accent-soft'
                : 'border-line hover:border-muted'
            }`}
          >
            {d.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setWriting(true)}
          aria-pressed={writing}
          className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
            writing ? 'border-accent bg-accent-soft' : 'border-line hover:border-muted'
          }`}
        >
          Describe it myself
        </button>
      </div>

      {writing ? (
        <textarea
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          rows={2}
          maxLength={600}
          placeholder="She walks slowly along a marble corridor, turning once to look back."
          className="mt-2.5 w-full resize-none rounded-lg border border-line bg-surface px-2.5 py-2 text-xs outline-none transition-colors focus:border-accent"
        />
      ) : (
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {DIRECTIONS.find((d) => d.id === direction)?.hint}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={order}
          disabled={state === 'sending' || (writing && !custom.trim())}
          className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-xs text-background transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {state === 'sending' && <Loader2 size={12} className="animate-spin" aria-hidden />}
          Make the video
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted transition-colors hover:text-foreground"
        >
          Cancel
        </button>
      </div>

      {state === 'error' && (
        <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">
          That did not go through. Try again in a moment.
        </p>
      )}
    </div>
  );
}
