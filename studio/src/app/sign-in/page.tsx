import Link from 'next/link';
import { AuthForm } from './auth-form';

export const metadata = { title: 'Sign in — Amrah Studio' };

export default async function SignInPage(props: PageProps<'/sign-in'>) {
  const { next } = await props.searchParams;

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-line">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <Link href="/" className="font-display text-lg tracking-tight">
            Amrah Studio
          </Link>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Three shoots free, no card required.
          </p>
          <AuthForm next={typeof next === 'string' ? next : '/studio'} />
        </div>
      </div>
    </main>
  );
}
