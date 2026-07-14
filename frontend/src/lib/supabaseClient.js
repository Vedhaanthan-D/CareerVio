import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Prevents Supabase from re-parsing the URL hash on every tab focus,
    // which can spuriously re-fire SIGNED_IN and cause a visible "reload".
    detectSessionInUrl: false,
    // Keep the session alive across page loads via localStorage (default, made explicit).
    persistSession: true,
    storage: window.localStorage,
  },
});
