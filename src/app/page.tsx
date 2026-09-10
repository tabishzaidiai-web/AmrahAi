import Link from 'next/link';
import { SKU_BUNDLE } from '@/lib/pipeline/bundle';

const SHOOT_COSTS = [
  { line: 'Model booking', traditional: '$1,000–3,000' },
  { line: 'Studio hire', traditional: '$500–1,500' },
  { line: 'Photographer', traditional: '$500–2,000' },
  { line: 'Styling and crew', traditional: '$300–800' },
  { line: 'Retouching', traditional: '$200–500' },
];

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    shoots: '25 shoots a month',
    features: ['Full 8-asset bundle per garment', 'Ghost mannequin packshots', 'Marketplace compliance checks'],
  },
  {
    name: 'Pro',
    price: '$99',
    shoots: '90 shoots a month',
    features: ['Everything in Starter', 'Premium motion engine for video', 'Brand kit and locked house model', 'Multiple body profiles per garment'],
    featured: true,
  },
  {
    name: 'Scale',
    price: '$199',
    shoots: '180 shoots a month',
    features: ['Everything in Pro', 'Catalogue batch import', 'API access', 'Priority queue'],
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-lg tracking-tight">Amrah Studio</span>
          <div className="flex items-center gap-6 text-sm">
            <Link href="#how" className="hidden text-muted transition-colors hover:text-foreground sm:block">
              How it works
            </Link>
            <Link href="#pricing" className="hidden text-muted transition-colors hover:text-foreground sm:block">
              Pricing
            </Link>
            <Link
              href="/studio"
              className="rounded-full bg-ink px-4 py-2 text-background transition-opacity hover:opacity-90"
            >
              Start free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero ------------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs tracking-wide text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Built for fashion brands
        </p>
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Every stitch intact.
          <br />
          <span className="text-muted">On any model. From every angle.</span>
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted">
          Upload a garment and get a complete, campaign-ready shoot in minutes — front,
          back, three-quarter, detail, ghost-mannequin packshots and a runway walk.
          No studio, no crew, no shoot day.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/studio"
            className="rounded-full bg-ink px-7 py-3.5 text-center text-background transition-opacity hover:opacity-90"
          >
            Shoot your first garment free
          </Link>
          <span className="text-sm text-muted sm:ml-3">No card required</span>
        </div>
      </section>

      {/* The differentiator ------------------------------------------------ */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
            <div>
              <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                Other tools redraw your garment. We don&rsquo;t.
              </h2>
              <p className="mt-6 leading-relaxed text-muted">
                Most AI photography generates the whole picture, garment included — so
                buttons change colour, prints rescale and embroidery becomes something
                that was never in your collection. That is a returned order and a
                misleading-advertising problem.
              </p>
              <p className="mt-4 leading-relaxed text-muted">
                Amrah uses purpose-built try-on models that treat your garment as fixed
                input. We generate the model, the light and the room around it. Your
                design is carried through, not reinterpreted.
              </p>
            </div>

            <div className="space-y-px overflow-hidden rounded-2xl border border-line">
              {[
                { label: 'Colourway', detail: 'Matched against your original, pixel for pixel' },
                { label: 'Print and pattern', detail: 'Scale and placement preserved, never regenerated' },
                { label: 'Closures and hardware', detail: 'Button count and position checked automatically' },
                { label: 'Trims and embroidery', detail: 'Held through every angle in the bundle' },
              ].map((row) => (
                <div key={row.label} className="flex gap-4 bg-background p-5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="font-medium">{row.label}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{row.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What you get ----------------------------------------------------- */}
      <section id="how" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          One upload. A complete shoot.
        </h2>
        <p className="mt-5 max-w-2xl leading-relaxed text-muted">
          The industry average is around eight images per product page. That is what a
          shoot returns here — every slot named, so it maps straight onto your product
          template and marketplace feeds.
        </p>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line sm:grid-cols-2 lg:grid-cols-3">
          {SKU_BUNDLE.map((slot) => (
            <div key={slot.id} className="bg-surface p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-medium">{slot.label}</h3>
                {slot.required && (
                  <span className="shrink-0 text-[10px] uppercase tracking-widest text-accent">
                    Core
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{slot.purpose}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cost ------------------------------------------------------------- */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
                What a shoot day actually costs
              </h2>
              <p className="mt-6 leading-relaxed text-muted">
                Zalando has said roughly 70% of its 2024 campaign imagery was
                AI-generated, cutting production costs by up to 90%. That capability is
                no longer reserved for retailers with in-house AI teams.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-line bg-background">
              {SHOOT_COSTS.map((row) => (
                <div
                  key={row.line}
                  className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 text-sm"
                >
                  <span className="text-muted">{row.line}</span>
                  <span className="tabular-nums">{row.traditional}</span>
                </div>
              ))}
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <span className="font-medium">Traditional, per day</span>
                <span className="font-display text-lg tabular-nums">$5,000–15,000</span>
              </div>
              <div className="flex items-center justify-between gap-4 bg-accent-soft px-5 py-4">
                <span className="font-medium">Amrah Studio</span>
                <span className="font-display text-lg tabular-nums text-accent">
                  From $29/month
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance ------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              Listing-ready, and ready for the AI Act
            </h2>
            <p className="mt-6 leading-relaxed text-muted">
              Every asset is checked before it reaches you. Background purity, frame
              fill, resolution floors, aspect ratios and the apparel rules that differ
              by marketplace — including the ghost-mannequin packshot Amazon and Zalando
              structurally require, which no on-model image can satisfy.
            </p>
            <p className="mt-4 leading-relaxed text-muted">
              EU AI Act transparency duties have applied to commercial imagery since
              August 2026. Provenance marking is embedded at generation, and disclosure
              wording is produced for the market you are publishing into.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-2xl border border-line sm:grid-cols-3">
            {['Amazon', 'Shopify', 'Zalando', 'Meta Shops', 'TikTok Shop', 'Google'].map((m) => (
              <div
                key={m}
                className="flex min-h-24 items-center justify-center bg-surface p-4 text-center text-sm text-muted"
              >
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing ---------------------------------------------------------- */}
      <section id="pricing" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            Pricing
          </h2>
          <p className="mt-5 max-w-2xl leading-relaxed text-muted">
            A shoot is one garment turned into a full bundle. Start free with three
            shoots — no card.
          </p>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col rounded-2xl border p-7 ${
                  plan.featured
                    ? 'border-accent bg-background shadow-sm'
                    : 'border-line bg-background'
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="font-medium">{plan.name}</h3>
                  {plan.featured && (
                    <span className="text-[10px] uppercase tracking-widest text-accent">
                      Most chosen
                    </span>
                  )}
                </div>
                <p className="mt-5 font-display text-4xl tracking-tight">
                  {plan.price}
                  <span className="text-base text-muted">/mo</span>
                </p>
                <p className="mt-2 text-sm text-muted">{plan.shoots}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3 leading-relaxed text-muted">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/studio"
                  className={`mt-8 rounded-full px-5 py-3 text-center text-sm transition-opacity hover:opacity-90 ${
                    plan.featured
                      ? 'bg-ink text-background'
                      : 'border border-line text-foreground'
                  }`}
                >
                  Choose {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-foreground">Amrah Studio</span>
          <span>Imagery generated with Amrah is marked as AI-generated.</span>
        </div>
      </footer>
    </main>
  );
}
