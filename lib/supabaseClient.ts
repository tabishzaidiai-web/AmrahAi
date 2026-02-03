import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase - providing safe defaults to prevent initialization errors
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// The app will now initialize even if keys are missing, 
// though actual DB calls will fail gracefully until keys are provided.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);