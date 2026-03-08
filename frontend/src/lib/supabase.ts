import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

function initSupabase() {
  try {
    if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
      return createClient(supabaseUrl, supabaseAnonKey);
    }
  } catch (err) {
    console.warn('Supabase init skipped:', err);
  }
  return null;
}

export const supabase = initSupabase();
export const isSupabaseConfigured = !!supabase;
