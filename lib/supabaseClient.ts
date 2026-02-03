// AMRAH LOCAL MODE - SUPABASE STUB
// This file provides a no-op mock of the Supabase client to prevent DNS errors 
// when the project URL is missing or set to a placeholder.

export const isSupabaseConfigured = false;

const noop = async () => ({ data: null, error: null });

// Mock Supabase Client to keep the application running without a database connection
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: { user: { id: 'local-guest' } } }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ error: new Error("Maison Local Mode Active") }),
    signUp: async () => ({ error: new Error("Maison Local Mode Active") }),
    signOut: async () => ({}),
    signInWithOAuth: async () => ({}),
    getUser: async () => ({ data: { user: { id: 'local-guest' } }, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: noop,
        maybeSingle: noop
      }),
      order: () => ({ limit: noop })
    }),
    insert: noop,
    update: () => ({ eq: noop }),
    upsert: noop,
    delete: () => ({ eq: noop })
  })
} as any;
