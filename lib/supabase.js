/**
 * Supabase Client Configuration
 * 
 * This file creates the Supabase client for authentication.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Replace the placeholder values below with your actual credentials
 * 4. Enable Google OAuth in Authentication > Providers > Google
 * 5. Add your redirect URL in Authentication > URL Configuration:
 *    - For local: http://localhost:19006
 *    - For production: your production URL
 */

import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase credentials
// Get these from: Supabase Dashboard > Settings > API
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Check if Supabase is configured
const isConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' && 
                     !SUPABASE_URL.includes('YOUR_') &&
                     SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
                     !SUPABASE_ANON_KEY.includes('YOUR_');

// Create and export the Supabase client
// Use dummy values if not configured to prevent errors
export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        // For Expo Web, we need to handle redirects properly
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

// Log connection status for debugging
if (isConfigured) {
  console.log('✅ Supabase client initialized');
  console.log('   URL:', SUPABASE_URL);
  console.log('   Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
  
  // Test connection
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', error.message);
    } else {
      console.log('✅ Supabase connection test passed');
    }
  }).catch((err) => {
    console.error('❌ Supabase connection error:', err);
  });
} else {
  console.warn('⚠️ Supabase not configured - using placeholder client');
  console.warn('   Please check your .env file has EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
}
