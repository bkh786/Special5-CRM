import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing in .env.local');
}

// Using createBrowserClient ensured that the session is correctly 
// synced to cookies for the Next.js middleware to pick up.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
