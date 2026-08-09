import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://pcxakufvfewarwrcjerj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeGFrdWZ2ZmV3YXJ3cmNqZXJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMzkyMTEsImV4cCI6MjEwMDgxNTIxMX0.KdlfimmAcBWAwZrjv6rctNLAXNJvywJMD45ptUUFGA4';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

// Initialize Supabase client with working defaults
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
