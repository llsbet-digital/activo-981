import { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ConfirmEmail() {
  const router = useRouter();
  const { confirmStatus, confirmMessage, isAuthenticated } = useAuth();

  useEffect(() => {
    if (confirmStatus === 'success' && isAuthenticated) {
      const timer = setTimeout(() => router.replace('/(tabs)'), 2000);
      return () => clearTimeout(timer);
    }
    if (confirmStatus === 'error') {
      const timer = setTimeout(() => router.replace('/login' as any), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmStatus, isAuthenticated, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {(confirmStatus === 'verifying' || confirmStatus === 'idle') && (
          <ActivityIndicator size="large" color="#007AFF" />
        )}
        {confirmStatus === 'success' && <Text style={styles.successIcon}>✓</Text>}
        {confirmStatus === 'error' && <Text style={styles.errorIcon}>✕</Text>}
        <Text style={[
          styles.message,
          confirmStatus === 'success' && styles.successText,
          confirmStatus === 'error' && styles.errorText,
        ]}>
          {confirmMessage || 'Confirming your email...'}
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
