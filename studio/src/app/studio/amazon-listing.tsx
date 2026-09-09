'use client';

import { AlertCircle, BadgeCheck, Download } from 'lucide-react';
import { AMAZON_SLOTS } from '@/lib/pipeline/amazon-slots';
import type { ResultAsset } from './results';
import type { SlotId } from '@/lib/pipeline/bundle';

/**
 * Presents a finished shoot as an Amazon listing.
 *
 * Positions are filled from assets the shoot already produced; the two that
 * need artwork are shown as gaps rather than hidden, so a brand knows exactly
 * what is left before the listing goes live.
 */
export function AmazonListing({ assets }: { assets: ResultAsset[] }) {
  const bySlot = new Map(assets.map((a) => [a.slot as SlotId, a]));

  return (
    <div>
      <h3 className="font-display text-xl tracking-tight">Amazon listing</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
        Position one is the only image Amazon suppresses a listing over. It needs a
        live model on pure white — flat lay is not accepted for adult apparel.
      </p>

      <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AMAZON_SLOTS.map((slot) => {
          const asset = slot.source ? bySlot.get(slot.source) : undefined;

          return (
            <li
              key={slot.id}
              className={`overflow-hidden rounded-xl border bg-surface ${
                slot.isMain ? 'border-accent' : 'border-line'
              }`}
            >
              {asset ? (
                // Generated data URLs, so next/image optimisation does not apply.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.src}
                  alt={slot.label}
                  className="aspect-square w-full bg-background object-contain"
                />
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center gap-2 bg-background p-5 text-center">
                  <AlertCircle size={18} className="text-muted" aria-hidden />
                  <p className="text-xs leading-relaxed text-muted">{slot.purpose}</p>
                </div>
              )}

              <div className="border-t border-line px-4 py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm">
                    <span className="text-muted">{slot.position}.</span> {slot.label}
                  </span>
                  {asset && (
                    <a
                      href={asset.src}
                      download={`amazon-${slot.position}-${slot.id}`}
                      className="text-muted transition-colors hover:text-foreground"
                      aria-label={`Download ${slot.label}`}
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>

                {slot.isMain && (
                  <p className="mt-1.5 text-xs text-accent">Main image</p>
                )}
                {asset?.compliance?.passed && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-accent">
                    <BadgeCheck size={12} aria-hidden />
                    Meets Amazon spec
                  </p>
                )}
                {!asset && (
                  <p className="mt-1.5 text-xs text-muted">Not filled</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
