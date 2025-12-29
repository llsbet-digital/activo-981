import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables missing!');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
}

console.log('🔧 Initializing Supabase client...');
console.log('Supabase URL:', supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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
