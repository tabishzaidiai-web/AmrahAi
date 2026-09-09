'use client';

import { useState } from 'react';
import { Check, ImagePlus, Loader2, X } from 'lucide-react';
import { SCENES } from '@/lib/scenes';
import { planFor } from '@/lib/pipeline/bundle';

type Category = 'top' | 'bottom' | 'one-piece';
type Audience = 'adult' | 'kids';

interface Upload {
  file: File;
  previewUrl: string;
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'one-piece', label: 'Dress / one-piece' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
];

export function ShootComposer() {
  const [front, setFront] = useState<Upload | null>(null);
  const [back, setBack] = useState<Upload | null>(null);
  const [category, setCategory] = useState<Category>('one-piece');
  const [audience, setAudience] = useState<Audience>('adult');
  const [scene, setScene] = useState(SCENES[0].id);
  const [includeVideo, setIncludeVideo] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slots = planFor(audience).filter((s) => s.kind === 'image' || includeVideo);

  async function start() {
    if (!front) return;
    setRunning(true);
    setError(null);

    const body = new FormData();
    body.append('front', front.file);
    if (back) body.append('back', back.file);
    body.append('category', category);
    body.append('audience', audience);
    body.append('scene', scene);
    body.append('includeVideo', String(includeVideo));

    try {
      const response = await fetch('/api/shoot', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'The shoot could not be started.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">New shoot</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-muted">
        Upload the garment, pick a setting, and Amrah returns the full bundle. No prompt
        writing.
      </p>

      {/* Step 1 — garment */}
      <section className="mt-12">
        <StepHeading n={1} title="Upload the garment" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Dropzone
            label="Front"
            hint="Flat lay, hanger or mannequin"
            required
            upload={front}
            onChange={setFront}
          />
          <Dropzone
            label="Back"
            hint="Optional, but makes back views accurate instead of invented"
            upload={back}
            onChange={setBack}
          />
        </div>
      </section>

      {/* Step 2 — garment type */}
      <section className="mt-12">
        <StepHeading n={2} title="What is it?" />
        <div className="mt-5 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} selected={category === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip selected={audience === 'adult'} onClick={() => setAudience('adult')}>
            Adult
          </Chip>
          <Chip selected={audience === 'kids'} onClick={() => setAudience('kids')}>
            Kids
          </Chip>
        </div>
        {audience === 'kids' && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Kids&rsquo; apparel is generated flat and off-model, because marketplaces
            prohibit child models in listing imagery.
          </p>
        )}
      </section>

      {/* Step 3 — scene */}
      <section className="mt-12">
        <StepHeading n={3} title="Pick a setting" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCENES.map((s) => {
            const selected = scene === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setScene(s.id)}
                aria-pressed={selected}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  selected
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-surface hover:border-muted'
                }`}
              >
                <span className="block font-medium">{s.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">
                  {s.description}
                </span>
              </button>
            );
          })}
        </div>

        {audience === 'adult' && (
          <label className="mt-5 flex w-fit cursor-pointer items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={includeVideo}
              onChange={(e) => setIncludeVideo(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Include a 5-second runway walk
          </label>
        )}
      </section>

      {/* Step 4 — confirm */}
      <section className="mt-12 rounded-2xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">This shoot returns</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center gap-2.5 text-sm">
              <Check size={15} className="shrink-0 text-accent" aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>

        {error && (
          <p role="alert" className="mt-5 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={start}
          disabled={!front || running}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {running && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {running ? 'Shooting…' : 'Generate shoot'}
        </button>
        {!front && (
          <p className="mt-3 text-sm text-muted">Upload a front image to continue.</p>
        )}
      </section>
    </div>
  );
}

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-xs text-muted">
        {n}
      </span>
      <h2 className="font-display text-xl tracking-tight">{title}</h2>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-4 py-2 text-sm transition-colors ${
        selected ? 'border-accent bg-accent-soft' : 'border-line hover:border-muted'
      }`}
    >
      {children}
    </button>
  );
}

function Dropzone({
  label,
  hint,
  required,
  upload,
  onChange,
}: {
  label: string;
  hint: string;
  required?: boolean;
  upload: Upload | null;
  onChange: (u: Upload | null) => void;
}) {
  function accept(file: File | undefined) {
    if (!file) return;
    if (upload) URL.revokeObjectURL(upload.previewUrl);
    onChange({ file, previewUrl: URL.createObjectURL(file) });
  }

  if (upload) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
        {/* Object URL of a local file, so next/image optimisation does not apply. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={upload.previewUrl}
          alt={`${label} view of the garment`}
          className="h-56 w-full object-contain"
        />
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
          <span className="text-sm">{label}</span>
          <button
            type="button"
            onClick={() => {
              URL.revokeObjectURL(upload.previewUrl);
              onChange(null);
            }}
            className="text-muted transition-colors hover:text-foreground"
            aria-label={`Remove ${label} image`}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <label className="flex h-[17.4rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface p-6 text-center transition-colors hover:border-muted">
      <ImagePlus size={20} className="text-muted" aria-hidden />
      <span className="font-medium">
        {label}
        {required && <span className="text-accent"> *</span>}
      </span>
      <span className="max-w-[16rem] text-sm leading-relaxed text-muted">{hint}</span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => accept(e.target.files?.[0])}
      />
    </label>
  );
}
