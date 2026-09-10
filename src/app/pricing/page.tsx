import Link from 'next/link';
import { PAID_PLANS } from '@/lib/billing/plans';
import { UpgradeButton } from './upgrade-button';

export const metadata = { title: 'Pricing — Amrah Studio' };

export default function PricingPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-lg tracking-tight">
            Amrah Studio
          </Link>
          <Link href="/studio" className="text-sm text-muted hover:text-foreground">
            Studio
          </Link>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-14">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">Pricing</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-muted">
          A shoot is one garment turned into a full bundle. Retries we run to hold your
          garment&rsquo;s length are on us — you are never charged for our second attempt.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PAID_PLANS.map((plan) => (
            <div
              key={plan.tier}
              className={`flex flex-col rounded-2xl border p-7 ${
                plan.tier === 'pro' ? 'border-accent' : 'border-line'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="font-medium">{plan.name}</h2>
                {plan.tier === 'pro' && (
                  <span className="text-[10px] uppercase tracking-widest text-accent">
                    Most chosen
                  </span>
                )}
              </div>
              <p className="mt-5 font-display text-4xl tracking-tight">
                ${plan.price}
                <span className="text-base text-muted">/mo</span>
              </p>
              <p className="mt-2 text-sm text-muted">
                {plan.shootsPerMonth} shoots a month
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-3 leading-relaxed text-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <UpgradeButton tier={plan.tier} featured={plan.tier === 'pro'} />
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted">
          Larger catalogue, or need processing kept out of certain regions?{' '}
          <a href="mailto:hello@amrah.studio" className="text-foreground underline underline-offset-4">
            Talk to us about Enterprise
          </a>
          .
        </p>
      </div>
    </main>
  );
}
