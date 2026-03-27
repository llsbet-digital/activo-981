import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 Checking Supabase configuration...');
console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl || '❌ NOT SET');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set (length: ' + supabaseAnonKey.length + ')' : '❌ NOT SET');

if (supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    console.log('✓ URL hostname:', url.hostname);
    console.log('✓ URL protocol:', url.protocol);
    if (!url.hostname.includes('supabase.co')) {
      console.warn('⚠️ Warning: URL does not appear to be a Supabase URL');
    }
  } catch (e) {
    console.error('❌ Invalid URL format:', e);
    console.error('Please check your EXPO_PUBLIC_SUPABASE_URL');
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = '\n\n' +
    '═══════════════════════════════════════════════\n' +
    '❌ SUPABASE CONFIGURATION ERROR\n' +
    '═══════════════════════════════════════════════\n' +
    'Environment variables are missing!\n\n' +
    'Missing variables:\n' +
    (!supabaseUrl ? '  • EXPO_PUBLIC_SUPABASE_URL\n' : '') +
    (!supabaseAnonKey ? '  • EXPO_PUBLIC_SUPABASE_ANON_KEY\n' : '') +
    '\n' +
    'To fix this:\n' +
    '1. Go to your Supabase project dashboard\n' +
    '2. Copy your project URL and anon key\n' +
    '3. Add them as environment variables in Rork\n' +
    '4. Make sure to restart the app after adding env vars\n' +
    '═══════════════════════════════════════════════\n';
  console.error(errorMsg);
  throw new Error('Supabase environment variables not configured');
}

if (!supabaseUrl.startsWith('https://')) {
  console.error('❌ CRITICAL: Supabase URL must start with https://');
  console.error('Current URL:', supabaseUrl);
  throw new Error('Invalid Supabase URL format');
}

if (!supabaseUrl.endsWith('.supabase.co') && !supabaseUrl.includes('supabase.co')) {
  console.warn('⚠️ Warning: This does not look like a standard Supabase URL');
  console.warn('Expected format: https://YOUR-PROJECT-ID.supabase.co');
  console.warn('Current URL:', supabaseUrl);
}

console.log('🔧 Initializing Supabase client...');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export async function testSupabaseConnection() {
  try {
    console.log('🧪 Testing Supabase connection...');
    console.log('Testing URL:', supabaseUrl);
    
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('⚠️ Supabase query error:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        console.error('\n🔴 Network Error Detected!');
        console.error('This usually means:');
        console.error('1. The Supabase URL is incorrect');
        console.error('2. Your Supabase project is paused');
        console.error('3. There are CORS issues (web only)');
        console.error('4. Network connectivity problems');
        console.error('\nPlease verify:');
        console.error('- Your Supabase URL is correct');
        console.error('- Your project is active in Supabase dashboard');
        console.error('- You have internet connection\n');
      }
      return false;
    }
    
    console.log('✅ Supabase connected successfully!');
    console.log('Connection test result:', data);
    return true;
  } catch (err: any) {
    console.error('❌ Supabase connection failed with exception:', err);
    console.error('Error name:', err?.name);
    console.error('Error message:', err?.message);
    console.error('Error stack:', err?.stack);
    return false;
  }
}

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  if (event === 'SIGNED_IN' && session) {
    console.log('User signed in:', session.user.email);
  }
  if (event === 'USER_UPDATED') {
    console.log('User updated');
  }
});

Linking.addEventListener('url', ({ url }) => {
  console.log('Deep link received:', url);
  const { path, queryParams } = Linking.parse(url);
  console.log('Parsed deep link - path:', path, 'params:', queryParams);
});
