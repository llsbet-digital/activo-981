import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/constants/colors';
import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const { signIn, signUp, resendConfirmationEmail, resetPassword } = useAuth();
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showResendEmail, setShowResendEmail] = useState<boolean>(false);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    console.log(`🚀 ${isSignUp ? 'Sign up' : 'Sign in'} initiated for:`, email);

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        console.error('❌ Auth failed:', error.message);
        
        if (error.message.includes('Email not confirmed')) {
          setPendingEmail(email);
          setShowResendEmail(true);
          Alert.alert(
            'Email Not Confirmed',
            'Please check your email and click the confirmation link before signing in. You can also request a new confirmation email below.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        if (isSignUp) {
          console.log('✅ Sign up successful, email confirmation required');
          setPendingEmail(email);
          setShowResendEmail(true);
          Alert.alert(
            'Check Your Email 📧',
            `We've sent a confirmation link to ${email}.\n\nPlease check your inbox (and spam folder) and click the link to verify your email.`,
            [{ text: 'OK' }]
          );
        } else {
          console.log('✅ Sign in successful');
        }
      }
    } catch (error) {
      console.error('❌ Auth exception:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!pendingEmail) {
      Alert.alert('Error', 'No pending email found');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resendConfirmationEmail(pendingEmail);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Email Sent ✓',
          'A new confirmation email has been sent. Please check your inbox.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to resend email');
      console.error('Resend email error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail || !resetEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert(
          'Check Your Email 📧',
          `We've sent password reset instructions to ${resetEmail}.\n\nPlease check your inbox and follow the link to reset your password.`,
          [
            {
              text: 'OK',
              onPress: () => {
                setShowForgotPassword(false);
                setResetEmail('');
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send reset email');
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Start your fitness journey today'
              : 'Sign in to continue your journey'}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              testID="email-input"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              testID="password-input"
            />
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                testID="confirm-password-input"
              />
            </View>
          )}

          {!isSignUp && (
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() => {
                setResetEmail(email);
                setShowForgotPassword(true);
              }}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={isLoading}
            testID="auth-button"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {showResendEmail && (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendEmail}
              disabled={isLoading}
              testID="resend-email-button"
            >
              <Text style={styles.resendText}>
                Didn&apos;t receive the email? <Text style={styles.resendTextBold}>Resend</Text>
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsSignUp(!isSignUp);
              setShowResendEmail(false);
              setPendingEmail('');
            }}
            disabled={isLoading}
            testID="switch-auth-mode"
          >
            <Text style={styles.switchText}>
              {isSignUp
                ? 'Already have an account? '
                : "Don't have an account? "}
              <Text style={styles.switchTextBold}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        {showForgotPassword && (
          <View style={styles.modal}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <Text style={styles.modalDescription}>
                Enter your email address and we&apos;ll send you instructions to reset your password.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleForgotPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowForgotPassword(false);
                  setResetEmail('');
                }}
                disabled={isLoading}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  switchTextBold: {
    fontWeight: '600' as const,
    color: colors.primary,
  },
  resendButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resendText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  resendTextBold: {
    fontWeight: '600' as const,
    color: colors.primary,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalCancelButton: {
    marginTop: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600' as const,
  },
});
