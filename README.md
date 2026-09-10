# Amrah Studio

Fashion photography without the photoshoot. A brand uploads a garment and gets a
campaign-ready shoot back: on-model views, ghost-mannequin packshots, detail
crops and a runway walk, checked against marketplace rules before delivery.

## Why it holds the garment

Most AI product photography generates the whole picture, garment included, so
prints rescale and closures change. Here the garment is fixed input: a
purpose-built try-on model dresses a stored pose with the brand's own image, and
each angle is an independent try-on against that same original rather than a
generative propagation from the previous view, so error cannot compound across a
bundle.

Two things are verified rather than trusted:

- **Garment length.** Try-on returns a different hem on each run — a flat lay
  carries no scale reference. The brand declares the length, every render is
  measured against it, and anything that misses is reshot. A slot that never
  lands fails rather than shipping a maxi render of a knee-length dress.
- **Marketplace geometry.** Generated packshots land near spec but rarely on it,
  and a single off-white pixel gets an Amazon listing suppressed. Output is
  trimmed, reframed and composited onto a fresh white canvas so compliance is
  structural rather than hoped for.

## Layout

```
src/lib/providers/   Vendor adapters behind one interface, chosen per tier
src/lib/pipeline/    Bundle definition, shoot orchestration, hem measurement
src/lib/compliance/  Marketplace specs, validation, geometry, AI Act provenance
src/lib/billing/     Plans and credit accounting
src/app/             Routes
assets/poses/        The house model, one image per camera position
supabase/migrations/ Schema and storage policies
```

Swapping an AI vendor is an edit to `src/lib/providers/registry.ts`. Nothing in
the pipeline names a vendor.

## Running it

```bash
npm install
cp .env.example .env.local   # fill in credentials
npm run dev
```

Generation needs a Google Cloud project with Vertex AI enabled and billing
active; `virtual-try-on-001` has no free tier. Without credentials the app runs
and the studio reports that generation is unconfigured.

Regenerate the house model with `node scripts/build-poses.mjs`.

## Known limits

- On-model **back and three-quarter** views fail for many garments and are
  refused rather than shipped. Ghost-mannequin packshots cover the same need and
  are what marketplaces require anyway.
- The Amazon listing fills seven of nine positions. Feature callouts and the
  size guide need artwork the shoot does not produce.
- Hem measurement assumes the pose library's framing: model centred, head to
  floor in frame.
