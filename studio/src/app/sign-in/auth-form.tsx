'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn, signInWithGoogle, signUp, type AuthState } from '../auth/actions';

export function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const action = mode === 'sign-in' ? signIn : signUp;
  const [state, formAction] = useActionState<AuthState, FormData>(action, {});

  return (
    <div className="mt-8">
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="w-full rounded-full border border-line px-5 py-3 text-sm transition-colors hover:border-muted"
        >
          Continue with Google
        </button>
      </form>

      <div className="my-6 flex items-center gap-4 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        <Field label="Email" name="email" type="email" autoComplete="email" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
        />

        {state.error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        )}
        {state.notice && <p className="text-sm text-accent">{state.notice}</p>}

        <Submit label={mode === 'sign-in' ? 'Sign in' : 'Create account'} />
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === 'sign-in' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
          className="text-foreground underline underline-offset-4"
        >
          {mode === 'sign-in' ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 outline-none transition-colors focus:border-accent"
      />
    </label>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-ink px-5 py-3 text-sm text-background transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Working…' : label}
    </button>
  );
}
