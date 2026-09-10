'use client';

import { useState } from 'react';
import { Check, ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
import { SCENES } from '@/lib/scenes';
import { planFor } from '@/lib/pipeline/bundle';
import { Results, type ShootResult } from './results';
import { HOUSE_MODELS, DEFAULT_MODEL_ID } from '@/lib/pipeline/models-client';

type Category = 'top' | 'bottom' | 'one-piece';
type Audience = 'adult' | 'kids';
type Length = 'top' | 'mini' | 'knee' | 'midi' | 'maxi';
type Source = 'photo' | 'sketch';

interface Upload {
  file: File;
  previewUrl: string;
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'one-piece', label: 'Dress / one-piece' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
];

/** A flat lay carries no scale reference, so length is declared rather than
 *  inferred, then checked against every render. */
const LENGTHS: { id: Length; label: string }[] = [
  { id: 'mini', label: 'Mini' },
  { id: 'knee', label: 'Knee' },
  { id: 'midi', label: 'Midi' },
  { id: 'maxi', label: 'Maxi' },
  { id: 'top', label: 'Hip / top length' },
];

export function ShootComposer() {
  const [front, setFront] = useState<Upload | null>(null);
  const [back, setBack] = useState<Upload | null>(null);
  const [category, setCategory] = useState<Category>('one-piece');
  // No default: a silently-assumed length gets every render rejected for not
  // matching it, which reads as the app failing rather than a wrong setting.
  const [length, setLength] = useState<Length | null>(null);
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [customModel, setCustomModel] = useState<Upload | null>(null);
  const [source, setSource] = useState<Source>('photo');
  const [reading, setReading] = useState<{ description: string } | null>(null);
  const [material, setMaterial] = useState('');
  const [audience, setAudience] = useState<Audience>('adult');
  const [scene, setScene] = useState(SCENES[0].id);
  const [includeVideo, setIncludeVideo] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShootResult | null>(null);

  const slots = planFor(audience).filter((s) => s.kind === 'image' || includeVideo);

  async function inspect(upload: Upload) {
    setFront(upload);
    // A photograph can be read; a line drawing has no fabric or scale to judge.
    if (source === 'sketch') return;

    try {
      const body = new FormData();
      body.append('image', upload.file);
      const response = await fetch('/api/inspect', { method: 'POST', body });
      if (!response.ok) return;

      const data = await response.json();
      // Pre-filled as a visible suggestion, not applied behind the scenes: the
      // reading is often right and occasionally confuses a long shirt-dress
      // with a top, and a wrong length gets every render discarded.
      setCategory(data.category);
      setLength(data.length);
      setAudience(data.audience);
      setReading({ description: data.description });
    } catch {
      // Reading is a convenience; the studio still asks for everything.
    }
  }

  async function start() {
    if (!front || !length) return;
    if (source === 'sketch' && !material.trim()) return;
    setRunning(true);
    setError(null);

    const body = new FormData();
    body.append('front', front.file);
    if (back) body.append('back', back.file);
    body.append('category', category);
    body.append('length', length);
    body.append('modelId', modelId);
    body.append('source', source);
    if (source === 'sketch') body.append('material', material);
    if (customModel) body.append('modelImage', customModel.file);
    body.append('audience', audience);
    body.append('scene', scene);
    body.append('includeVideo', String(includeVideo));

    try {
      const response = await fetch('/api/shoot', { method: 'POST', body });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'The shoot could not be started.');
      setResult(data as ShootResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setRunning(false);
    }
  }

  if (result) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Results result={result} onReset={() => setResult(null)} />
      </div>
    );
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
        <div className="mt-5 flex flex-wrap gap-2">
          <Chip selected={source === 'photo'} onClick={() => setSource('photo')}>
            I have a photo
          </Chip>
          <Chip selected={source === 'sketch'} onClick={() => setSource('sketch')}>
            I have a technical flat
          </Chip>
        </div>

        {source === 'sketch' && (
          <div className="mt-4 max-w-xl">
            <label className="block">
              <span className="mb-1.5 block text-sm">What is it made of?</span>
              <input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="mid-weight rust linen, soft matte finish"
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
              />
            </label>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">
              A drawing shows construction but not cloth, so the fabric has to be
              described. Silhouette and construction follow your flat closely;
              exact closure counts can drift, so check them before a buyer does.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Dropzone
            label="Front"
            hint={
              source === 'sketch'
                ? 'A front technical flat, line art on white'
                : 'Flat lay, hanger or mannequin'
            }
            required
            upload={front}
            onChange={(u) => {
              setReading(null);
              if (u) void inspect(u);
              else setFront(null);
            }}
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
        {reading && (
          <div className="mt-4 rounded-xl border border-line bg-surface p-4">
            <p className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Sparkles size={15} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <span>
                <span className="text-muted">We read this as:</span>{' '}
                {reading.description}
              </span>
            </p>
            <p className="mt-2 pl-6 text-xs leading-relaxed text-muted">
              We have filled in the answers below from that. Check them —
              especially the length, which decides whether a render is kept.
            </p>
          </div>
        )}
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
        <p className="mt-6 text-sm text-muted">How long is it?</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {LENGTHS.map((l) => (
            <Chip key={l.id} selected={length === l.id} onClick={() => setLength(l.id)}>
              {l.label}
            </Chip>
          ))}
        </div>
        <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-muted">
          A flat photo has nothing to judge scale against, so we check every render
          against the length you pick and reshoot any that come out wrong. Pick the
          wrong one and the on-model shots will be rejected.
        </p>

        {audience === 'kids' && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            Kids&rsquo; apparel is generated flat and off-model, because marketplaces
            prohibit child models in listing imagery.
          </p>
        )}
      </section>

      {/* Step 3 — model */}
      <section className="mt-12">
        <StepHeading n={3} title="Who wears it?" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {HOUSE_MODELS.map((m) => {
            const selected = !customModel && modelId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setModelId(m.id);
                  if (customModel) {
                    URL.revokeObjectURL(customModel.previewUrl);
                    setCustomModel(null);
                  }
                }}
                aria-pressed={selected}
                className={`overflow-hidden rounded-xl border text-left transition-colors ${
                  selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-muted'
                }`}
              >
                {/* Served from the app's own assets, not an optimised route. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/models/${m.id}.jpg`}
                  alt={m.name}
                  className="aspect-3/4 w-full bg-background object-cover"
                />
                <span className="block px-3 py-2.5">
                  <span className="block text-sm">{m.name}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    {m.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 max-w-sm">
          <Dropzone
            label={customModel ? 'Your model' : 'Or use your own model'}
            hint="A full-length photo of the person, head to feet. Gives the front view only."
            upload={customModel}
            onChange={setCustomModel}
          />
        </div>
        {customModel && (
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
            One photo shows one viewpoint, so the back and three-quarter shots
            cannot be produced from it. Pick a house model above if you need the
            full set.
          </p>
        )}
      </section>

      {/* Step 4 — scene */}
      <section className="mt-12">
        <StepHeading n={4} title="Pick a setting" />
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
            Include a 6-second runway walk
          </label>
        )}
      </section>

      {/* Step 5 — confirm */}
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
          disabled={!front || !length || running || (source === 'sketch' && !material.trim())}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-3.5 text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {running && <Loader2 size={16} className="animate-spin" aria-hidden />}
          {running ? 'Shooting…' : 'Generate shoot'}
        </button>
        {(!front || !length) && (
          <p className="mt-3 text-sm text-muted">
            {!front
              ? 'Upload a front image to continue.'
              : 'Choose the garment length to continue.'}
          </p>
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
