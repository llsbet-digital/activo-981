import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 Checking Supabase configuration...');
console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl || '❌ NOT SET');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set (length: ' + supabaseAnonKey.length + ')' : '❌ NOT SET');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRITICAL: Supabase environment variables missing!');
  console.error('Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY');
  console.error('Current values:');
  console.error('  EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl || 'MISSING');
  console.error('  EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
}

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ CRITICAL: Supabase URL must start with https://');
  console.error('Current URL:', supabaseUrl);
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
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.log('⚠️ Supabase connection test:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection failed:', err);
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
  
  if (path === 'auth/confirm' && queryParams) {
    const token = queryParams.token as string;
    const type = queryParams.type as string;
    
    if (token && type === 'email') {
      supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      }).then(({ error }) => {
        if (error) {
          console.error('Email confirmation error:', error);
        } else {
          console.log('Email confirmed successfully');
        }
      });
    }
  }
});
