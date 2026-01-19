/**
 * Supabase Client for Social Queue
 *
 * Singleton client instance for database operations.
 */

import { createClient } from '@supabase/supabase-js';

// These should be set as environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SupabaseClient] Missing environment variables. Social queue features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, // Rate limit for real-time updates
    },
  },
});
