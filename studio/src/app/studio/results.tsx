'use client';

import { AlertCircle, Download, Film } from 'lucide-react';
import { SKU_BUNDLE, type SlotId } from '@/lib/pipeline/bundle';

export interface ResultAsset {
  slot: SlotId;
  kind: 'image' | 'video';
  src: string;
  providerId: string;
  cost: number;
}

export interface ShootResult {
  shootId: string;
  assets: ResultAsset[];
  failures: { slot: SlotId; reason: string }[];
  totalCost: number;
}

const LABELS = new Map(SKU_BUNDLE.map((s) => [s.id, s.label]));

export function Results({ result, onReset }: { result: ShootResult; onReset: () => void }) {
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

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                alt={LABELS.get(asset.slot) ?? asset.slot}
                className="aspect-3/4 w-full bg-background object-contain"
              />
            )}
            <figcaption className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
              <span className="text-sm">{LABELS.get(asset.slot) ?? asset.slot}</span>
              <a
                href={asset.src}
                download={`${result.shootId}-${asset.slot}`}
                className="text-muted transition-colors hover:text-foreground"
                aria-label={`Download ${LABELS.get(asset.slot) ?? asset.slot}`}
              >
                <Download size={15} />
              </a>
            </figcaption>
          </figure>
        ))}
      </div>

      {result.failures.length > 0 && (
        <div className="mt-8 rounded-xl border border-line bg-surface p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={15} className="text-accent" aria-hidden />
            Not generated
          </p>
          <ul className="mt-3 space-y-2">
            {result.failures.map((f) => (
              <li key={f.slot} className="text-sm leading-relaxed text-muted">
                <span className="text-foreground">{LABELS.get(f.slot) ?? f.slot}</span>
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
