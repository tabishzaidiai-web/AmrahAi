'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

export interface AuthState {
  error?: string;
  notice?: string;
}

function readCredentials(form: FormData) {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  return { email, password };
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: 'Sign-in is not configured yet.' };

  const { email, password } = readCredentials(form);
  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(String(form.get('next') || '/studio'));
}

export async function signUp(_prev: AuthState, form: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured) return { error: 'Sign-up is not configured yet.' };

  const { email, password } = readCredentials(form);
  if (!email || !password) return { error: 'Enter your email and password.' };
  if (password.length < 8) return { error: 'Use at least 8 characters.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };

  // With email confirmation on, no session is returned until the link is used.
  if (!data.session) {
    return { notice: 'Check your email to confirm your account.' };
  }

  redirect('/studio');
}

export async function signInWithGoogle() {
  // The provider returns a redirect URL even when it is disabled, and following
  // it lands the visitor on a raw provider error, so this refuses to start the
  // flow unless Google has actually been configured.
  if (!isSupabaseConfigured || process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH !== 'true') return;

  const origin = (await headers()).get('origin');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) return;
  redirect(data.url);
}

export async function signOut() {
  if (!isSupabaseConfigured) redirect('/');
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
