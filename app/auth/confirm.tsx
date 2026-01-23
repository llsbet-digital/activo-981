import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export default function ConfirmEmail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log('Email confirmation params from router:', params);
        
        let tokenHash = params.token_hash as string || params.token as string;
        let type = params.type as string;
        
        // Handle web URL parameters (including hash fragments)
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          console.log('Web URL:', window.location.href);
          
          // Check query params first
          tokenHash = tokenHash || url.searchParams.get('token_hash') || url.searchParams.get('token') || '';
          type = type || url.searchParams.get('type') || '';
          
          // Also check hash fragment (Supabase sometimes uses this)
          if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            tokenHash = tokenHash || hashParams.get('token_hash') || hashParams.get('access_token') || '';
            type = type || hashParams.get('type') || '';
            
            // If we have access_token in hash, Supabase handles it automatically
            if (hashParams.get('access_token')) {
              console.log('Access token found in hash, checking session...');
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                console.log('Session found after hash auth');
                setStatus('success');
                setMessage('Email confirmed successfully!');
                setTimeout(() => router.replace('/(tabs)'), 2000);
                return;
              }
            }
          }
        } else {
          // Native: use Linking
          const initialUrl = await Linking.getInitialURL();
          console.log('Initial URL:', initialUrl);
          
          if (initialUrl) {
            const parsed = Linking.parse(initialUrl);
            console.log('Parsed URL:', parsed);
            
            if (parsed.queryParams) {
              tokenHash = tokenHash || (parsed.queryParams.token_hash as string) || (parsed.queryParams.token as string);
              type = type || (parsed.queryParams.type as string);
            }
          }
        }
        
        console.log('Token hash:', tokenHash);
        console.log('Type:', type);

        if (!tokenHash) {
          setStatus('error');
          setMessage('Invalid confirmation link - missing token');
          setTimeout(() => router.replace('/login' as any), 3000);
          return;
        }

        const validTypes = ['signup', 'email', 'magiclink', 'recovery', 'invite'];
        const otpType = validTypes.includes(type) ? type : 'signup';
        
        console.log('Verifying OTP with type:', otpType);

        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType as any,
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Failed to confirm email. Please try again.');
          setTimeout(() => router.replace('/login' as any), 3000);
        } else {
          console.log('Email confirmed successfully, session:', data.session?.user?.email);
          setStatus('success');
          setMessage('Email confirmed successfully!');
          setTimeout(() => router.replace('/(tabs)'), 2000);
        }
      } catch (error: any) {
        console.error('Confirmation exception:', error);
        setStatus('error');
        setMessage(error?.message || 'An error occurred. Please try again.');
        setTimeout(() => router.replace('/login' as any), 3000);
      }
    };

    confirmEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'loading' && <ActivityIndicator size="large" color="#007AFF" />}
        {status === 'success' && <Text style={styles.successIcon}>✓</Text>}
        {status === 'error' && <Text style={styles.errorIcon}>✕</Text>}
        <Text style={[
          styles.message,
          status === 'success' && styles.successText,
          status === 'error' && styles.errorText,
        ]}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    fontSize: 64,
    color: '#4CAF50',
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 64,
    color: '#F44336',
    marginBottom: 20,
  },
  message: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
});
