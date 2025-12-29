import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Alert, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔧 Supabase Configuration:');
console.log('URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('Anon Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
console.log('Full URL:', supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials!');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  if (Platform.OS !== 'web') {
    Alert.alert('Configuration Error', 'Supabase credentials are missing. Please check your environment variables.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

supabase.auth.onAuthStateChange((event, session) => {
  console.log('🔐 Auth State Changed:', event);
  
  if (event === 'SIGNED_IN' && session) {
    console.log('✅ User signed in:');
    console.log('  - Email:', session.user.email);
    console.log('  - Email Confirmed:', session.user.email_confirmed_at ? '✓' : '✗');
    console.log('  - User ID:', session.user.id);
  }
  
  if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  }
  
  if (event === 'USER_UPDATED') {
    console.log('🔄 User updated');
    if (session?.user) {
      console.log('  - Email Confirmed:', session.user.email_confirmed_at ? '✓' : '✗');
    }
  }
  
  if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token refreshed');
  }
});

const handleDeepLink = async (url: string) => {
  console.log('🔗 Deep link received:', url);
  
  try {
    const { path, queryParams } = Linking.parse(url);
    console.log('📍 Parsed path:', path);
    console.log('📋 Query params:', queryParams);
    
    if (path === 'auth/confirm' || path === 'confirm') {
      console.log('✉️ Email confirmation link detected');
      
      if (queryParams) {
        const token_hash = queryParams.token_hash as string || queryParams.token as string;
        const type = queryParams.type as string;
        
        console.log('🎫 Token hash:', token_hash ? '✓ Present' : '✗ Missing');
        console.log('📝 Type:', type);
        
        if (token_hash && type) {
          console.log('⏳ Verifying email...');
          
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as any,
          });
          
          if (error) {
            console.error('❌ Email confirmation error:', error.message);
            Alert.alert('Confirmation Failed', error.message);
          } else {
            console.log('✅ Email confirmed successfully!');
            console.log('👤 User:', data.user?.email);
            Alert.alert('Success! ✓', 'Your email has been confirmed. You can now sign in.');
          }
        } else {
          console.error('❌ Missing token or type in confirmation link');
          Alert.alert('Invalid Link', 'The confirmation link is missing required parameters.');
        }
      } else {
        console.error('❌ No query params in confirmation link');
      }
    } else if (path === 'auth/reset' || path === 'reset') {
      console.log('🔐 Password reset link detected');
    }
  } catch (error) {
    console.error('❌ Error processing deep link:', error);
  }
};

if (Platform.OS !== 'web') {
  Linking.addEventListener('url', async ({ url }) => {
    await handleDeepLink(url);
  });

  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('🔗 Initial URL detected:', url);
      handleDeepLink(url);
    }
  });
}
