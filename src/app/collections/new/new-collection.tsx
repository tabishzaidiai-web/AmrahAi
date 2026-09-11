'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { HOUSE_MODELS, DEFAULT_MODEL_ID } from '@/lib/pipeline/models-client';
import { SCENES } from '@/lib/scenes';
import { LENGTHS, type GarmentLength as Length } from '@/lib/garment-lengths';

export function NewCollection() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [pieces, setPieces] = useState<File[]>([]);
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const [scene, setScene] = useState(SCENES[0].id);
  const [length, setLength] = useState<Length | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function queue() {
    if (!name.trim() || pieces.length === 0 || !length) return;
    setBusy(true);
    setError(null);

    const body = new FormData();
    body.append('name', name);
    body.append('modelId', modelId);
    body.append('scene', scene);
    body.append('length', length);
    pieces.forEach((p) => body.append('pieces', p));

    try {
      const response = await fetch('/api/collections', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Could not queue the collection.');
      router.push(`/collections/${data.collectionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 space-y-10">
      <label className="block max-w-md">
        <span className="mb-1.5 block text-sm">Collection name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Summer Lawn 26"
          className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
        />
      </label>

      <section>
        <h2 className="font-display text-xl tracking-tight">The pieces</h2>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface p-10 text-center transition-colors hover:border-muted">
          <ImagePlus size={20} className="text-muted" aria-hidden />
          <span className="font-medium">Choose every garment at once</span>
          <span className="max-w-sm text-sm leading-relaxed text-muted">
            One image per piece. The filename becomes the SKU, so whatever your
            files are already called carries through.
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => setPieces(Array.from(e.target.files ?? []))}
          />
        </label>

        {pieces.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-muted">{pieces.length} pieces</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {pieces.map((p, i) => (
                <li
                  key={`${p.name}-${i}`}
                  className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs"
                >
                  <span className="max-w-[14rem] truncate">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => setPieces(pieces.filter((_, j) => j !== i))}
                    aria-label={`Remove ${p.name}`}
                    className="text-muted transition-colors hover:text-foreground"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl tracking-tight">Settings for the whole drop</h2>

        <p className="mt-5 text-sm text-muted">Model</p>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {HOUSE_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModelId(m.id)}
              aria-pressed={modelId === m.id}
              className={`overflow-hidden rounded-xl border text-left transition-colors ${
                modelId === m.id
                  ? 'border-accent bg-accent-soft'
                  : 'border-line bg-surface hover:border-muted'
              }`}
            >
              {/* Served from the app's own assets, not an optimised route. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/models/${m.id}.jpg`}
                alt={m.name}
                className="aspect-3/4 w-full bg-background object-cover"
              />
              <span className="block px-3 py-2 text-sm">{m.name}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 text-sm text-muted">Length</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {LENGTHS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLength(l.id)}
              aria-pressed={length === l.id}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                length === l.id ? 'border-accent bg-accent-soft' : 'border-line hover:border-muted'
              }`}
            >
              {l.label} <span className="opacity-60">· {l.hint}</span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted">
          One length for the whole drop. Shoot pieces of different lengths as
          separate collections, so each is checked against the right one.
        </p>

        <p className="mt-6 text-sm text-muted">Setting</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScene(s.id)}
              aria-pressed={scene === s.id}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                scene === s.id ? 'border-accent bg-accent-soft' : 'border-line hover:border-muted'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

      </section>

      <section className="rounded-2xl border border-line bg-surface p-6">
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={queue}
          disabled={busy || !name.trim() || pieces.length === 0 || !length}
          className="flex items-center justify-center gap-2 rounded-full bg-ink px-7 py-3.5 text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {busy ? 'Queueing…' : `Shoot ${pieces.length || ''} pieces`.trim()}
        </button>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Queued, not held open. Each piece takes a couple of minutes and you can
          close the page once it starts.
        </p>
      </section>
    </div>
  );
}
