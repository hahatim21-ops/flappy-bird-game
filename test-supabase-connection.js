/**
 * Quick test script to verify Supabase connection
 * Run this in browser console at http://localhost:19006
 * 
 * Copy and paste this into browser console (F12 -> Console tab):
 */

// Test 1: Check if Supabase client is loaded
console.log('=== Testing Supabase Connection ===');

// Import supabase (if using modules)
// Or test directly in browser console after importing

// Test 2: Check environment variables
const SUPABASE_URL = process?.env?.EXPO_PUBLIC_SUPABASE_URL || 'NOT_LOADED';
const SUPABASE_KEY = process?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'NOT_LOADED';

console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key:', SUPABASE_KEY.substring(0, 20) + '...');

// Test 3: Try to connect
// In browser console, after the page loads, run:
// supabase.auth.getSession().then(console.log).catch(console.error);
