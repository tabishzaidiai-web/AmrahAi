import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase - providing valid fallback strings to prevent initialization crashes
const supabaseUrl = 'https://placeholder-url.supabase.co';
const supabaseAnonKey = 'placeholder-anon-key';

// The app will initialize with these placeholders if actual keys are missing.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);