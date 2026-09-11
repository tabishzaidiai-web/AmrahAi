'use client';

import { useState } from 'react';
import { AlertCircle, BadgeCheck, Download, Film } from 'lucide-react';
import { SOCIAL_FORMATS } from '@/lib/pipeline/social-formats';
import { SKU_BUNDLE, type SlotId } from '@/lib/pipeline/bundle';
import { AmazonListing } from './amazon-listing';
import { MakeVideo } from './make-video';
import { canAnimate } from '@/lib/pipeline/directions';

export interface ResultAsset {
  slot: SlotId;
  kind: 'image' | 'video';
  src: string;
  providerId: string;
  cost: number;
  compliance?: { passed: boolean; findings: { severity: string; message: string }[] };
  /** Worth telling the brand, without the shot being a failure. */
  notice?: string;
}

export interface ShootResult {
  shootId: string;
  assets: ResultAsset[];
  failures: { slot: SlotId; reason: string }[];
  /** Slots no input was supplied for, kept apart from things that went wrong. */
  skipped?: { slot: SlotId; reason: string }[];
  totalCost: number;
}

const LABELS = new Map(SKU_BUNDLE.map((s) => [s.id, s.label]));

/** Clips are named after the shot they were made from, so a shoot can hold
 *  several and the designer can tell which is which. */
function labelFor(slot: string): string {
  if (slot.startsWith('video-')) {
    const source = slot.slice('video-'.length);
    return `Video — ${LABELS.get(source as SlotId) ?? source}`;
  }
  return LABELS.get(slot as SlotId) ?? slot;
}

export function Results({ result, onReset }: { result: ShootResult; onReset: () => void }) {
  const [view, setView] = useState<'shoot' | 'amazon'>('shoot');

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Your shoot</h2>
          <p className="mt-1.5 text-sm text-muted">
            {result.assets.length} asset{result.assets.length === 1 ? '' : 's'} ready
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-muted"
        >
          Shoot another garment
        </button>
      </div>

      <div className="mt-7 flex gap-2" role="tablist">
        {(
          [
            ['shoot', 'All assets'],
            ['amazon', 'Amazon listing'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              view === id ? 'border-accent bg-accent-soft' : 'border-line hover:border-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'amazon' && (
        <div className="mt-8">
          <AmazonListing assets={result.assets} />
        </div>
      )}

      <div
        className={`mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${view === 'shoot' ? '' : 'hidden'}`}
      >
        {result.assets.map((asset) => (
          <figure
            key={asset.slot}
            className="overflow-hidden rounded-xl border border-line bg-surface"
          >
            {asset.kind === 'video' ? (
              <VideoAsset src={asset.src} />
            ) : (
              // Generated data URLs, so next/image optimisation does not apply.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asset.src}
                alt={labelFor(asset.slot)}
                className="aspect-3/4 w-full bg-background object-contain"
              />
            )}
            <figcaption className="border-t border-line px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{labelFor(asset.slot)}</span>
                <a
                  href={asset.src}
                  download={`${result.shootId}-${asset.slot}`}
                  className="text-muted transition-colors hover:text-foreground"
                  aria-label={`Download ${labelFor(asset.slot)}`}
                >
                  <Download size={15} />
                </a>
              </div>
              {asset.compliance?.passed && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-accent">
                  <BadgeCheck size={13} aria-hidden />
                  Marketplace ready
                </p>
              )}
              {asset.notice && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{asset.notice}</p>
              )}
              {asset.kind === 'image' && <SocialDownloads src={asset.src} />}
              {asset.kind === 'image' && canAnimate(asset.slot) && (
                <MakeVideo shootId={result.shootId} slot={asset.slot} />
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      {view === 'shoot' && (result.skipped?.length ?? 0) > 0 && (
        <div className="mt-8 rounded-xl border border-line bg-surface p-5">
          <p className="text-sm font-medium">To get more from this garment</p>
          <ul className="mt-3 space-y-2">
            {result.skipped!.map((s) => (
              <li key={s.slot} className="text-sm leading-relaxed text-muted">
                <span className="text-foreground">{labelFor(s.slot)}</span>
                {' — '}
                {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === 'shoot' && result.failures.length > 0 && (
        <div className="mt-8 rounded-xl border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={15} className="text-accent" aria-hidden />
            Not generated
          </p>
          <ul className="mt-3 space-y-2">
            {result.failures.map((f) => (
              <li key={f.slot} className="text-sm leading-relaxed text-muted">
                <span className="text-foreground">{labelFor(f.slot)}</span>
                {' — '}
                {f.reason}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function VideoAsset({ src }: { src: string }) {
  // Video is returned as a storage URI, which the browser cannot play directly
  // until object storage and signed URLs are in place.
  const playable = src.startsWith('http') || src.startsWith('data:');

  if (!playable) {
    return (
      <div className="flex aspect-3/4 flex-col items-center justify-center gap-2 bg-background p-6 text-center">
        <Film size={20} className="text-muted" aria-hidden />
        <p className="text-sm text-muted">Video ready in storage</p>
      </div>
    );
  }

  return <video src={src} controls loop muted playsInline className="aspect-3/4 w-full bg-background object-contain" />;
}

/** Instagram is where these collections sell, so every frame is offered in the
 *  shapes the platform renders rather than one generic export. */
function SocialDownloads({ src }: { src: string }) {
  const [busy, setBusy] = useState<string | null>(null);

  async function download(format: string, label: string) {
    setBusy(format);
    try {
      const response = await fetch('/api/crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src, format }),
      });
      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${label.toLowerCase().replace(/[^a-z]+/g, '-')}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {SOCIAL_FORMATS.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => download(f.id, f.label)}
          disabled={busy !== null}
          title={f.where}
          className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-muted hover:text-foreground disabled:opacity-50"
        >
          {busy === f.id ? '…' : f.label}
        </button>
      ))}
    </div>
  );
}
