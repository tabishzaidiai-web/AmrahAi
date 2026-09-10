'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface PieceState {
  id: string;
  sku: string;
  status: 'pending' | 'running' | 'complete' | 'failed';
  shootId: string | null;
  error: string | null;
}

/**
 * Live view of a drop being shot.
 *
 * A collection takes minutes per piece, so the page has to keep itself current
 * rather than showing whatever was true when it loaded. Updates arrive over the
 * database's own change stream, with a slow poll behind it because a dropped
 * socket should not leave someone staring at a stalled progress bar.
 */
export function CollectionProgress({
  collectionId,
  initial,
}: {
  collectionId: string;
  initial: PieceState[];
}) {
  const [pieces, setPieces] = useState(initial);

  useEffect(() => {
    const supabase = createClient();

    async function refresh() {
      const { data } = await supabase
        .from('collection_items')
        .select('id, sku, status, shoot_id, error')
        .eq('collection_id', collectionId)
        .order('created_at');

      if (!data) return;
      setPieces(
        data.map((i) => ({
          id: i.id as string,
          sku: (i.sku as string) ?? 'Untitled',
          status: i.status as PieceState['status'],
          shootId: (i.shoot_id as string) ?? null,
          error: (i.error as string) ?? null,
        })),
      );
    }

    const channel = supabase
      .channel(`collection-${collectionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collection_items',
          filter: `collection_id=eq.${collectionId}`,
        },
        () => void refresh(),
      )
      .subscribe();

    const poll = setInterval(refresh, 20_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
    };
  }, [collectionId]);

  const done = pieces.filter((p) => p.status === 'complete').length;
  const failed = pieces.filter((p) => p.status === 'failed').length;
  const working = pieces.some((p) => p.status === 'pending' || p.status === 'running');

  return (
    <div>
      <p className="mt-2 text-sm text-muted">
        {done} of {pieces.length} shot
        {failed > 0 && ` · ${failed} failed`}
        {working && ' · still working'}
      </p>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${pieces.length ? (done / pieces.length) * 100 : 0}%` }}
        />
      </div>

      {working && (
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">
          Each piece takes a couple of minutes. You can close this page — the
          shoot carries on without you and the results land in your library.
        </p>
      )}

      <ul className="mt-8 overflow-hidden rounded-2xl border border-line">
        {pieces.map((piece) => (
          <li
            key={piece.id}
            className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-3.5 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{piece.sku}</p>
              {piece.error && (
                <p className="mt-1 truncate text-xs text-muted">{piece.error}</p>
              )}
            </div>
            <PieceStatus piece={piece} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PieceStatus({ piece }: { piece: PieceState }) {
  if (piece.status === 'complete' && piece.shootId) {
    return (
      <Link
        href={`/library/${piece.shootId}`}
        className="flex shrink-0 items-center gap-1.5 text-sm text-accent"
      >
        <Check size={14} aria-hidden />
        View
      </Link>
    );
  }
  if (piece.status === 'failed') {
    return (
      <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
        <AlertCircle size={14} aria-hidden />
        Failed
      </span>
    );
  }
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted">
      <Loader2
        size={14}
        className={piece.status === 'running' ? 'animate-spin' : ''}
        aria-hidden
      />
      {piece.status === 'running' ? 'Shooting' : 'Queued'}
    </span>
  );
}
