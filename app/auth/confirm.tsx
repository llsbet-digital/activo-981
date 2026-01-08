import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function ConfirmEmail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        console.log('Email confirmation params:', params);

        const token = params.token as string;
        const type = params.type as string;

        if (!token || type !== 'signup') {
          setStatus('error');
          setMessage('Invalid confirmation link');
          setTimeout(() => router.replace('/login' as any), 3000);
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage('Failed to confirm email. Please try again.');
          setTimeout(() => router.replace('/login' as any), 3000);
        } else {
          setStatus('success');
          setMessage('Email confirmed successfully!');
          setTimeout(() => router.replace('/(tabs)'), 2000);
        }
      } catch (error) {
        console.error('Confirmation exception:', error);
        setStatus('error');
        setMessage('An error occurred. Please try again.');
        setTimeout(() => router.replace('/login' as any), 3000);
      }
    };

    confirmEmail();
  }, [params, router]);

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
