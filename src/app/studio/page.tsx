import Link from 'next/link';
import { ShootComposer } from './shoot-composer';

export const metadata = {
  title: 'Studio — Amrah',
};

export default function StudioPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-line">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-lg tracking-tight">
            Amrah Studio
          </Link>
          <span className="text-sm text-muted">3 free shoots remaining</span>
        </nav>
      </header>

      <ShootComposer />
    </main>
  );
}
