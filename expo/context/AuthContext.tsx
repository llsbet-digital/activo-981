import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Session, User, AuthError } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

const APP_ORIGIN = 'https://p_52apzaa5go3z18qrndmlu.rork.live';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [confirmMessage, setConfirmMessage] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get('token_hash') || url.searchParams.get('token');
        const type = url.searchParams.get('type');
        const accessToken = url.hash
          ? new URLSearchParams(url.hash.substring(1)).get('access_token')
          : null;

        if (tokenHash || accessToken) {
          console.log('🔐 Detected email confirmation params, verifying OTP before auth guard...');
          setConfirmStatus('verifying');

          if (accessToken && session) {
            console.log('✅ Session already exists from hash auth');
            setSession(session);
            setUser(session.user ?? null);
            setConfirmStatus('success');
            setConfirmMessage('Email confirmed successfully!');
            setIsLoading(false);

            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', window.location.pathname);
            }
            return;
          }

          try {
            const validTypes = ['signup', 'email', 'magiclink', 'recovery', 'invite'];
            const otpType = validTypes.includes(type ?? '') ? type! : 'signup';

            console.log('🔑 Verifying OTP with type:', otpType, 'token_hash:', tokenHash);
            const { data, error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash!,
              type: otpType as any,
            });

            if (error) {
              console.error('❌ OTP verification error:', error.message);
              setConfirmStatus('error');
              setConfirmMessage(error.message || 'Failed to confirm email.');
              setSession(session);
              setUser(session?.user ?? null);
            } else {
              console.log('✅ OTP verified, user:', data.session?.user?.email);
              setSession(data.session);
              setUser(data.session?.user ?? null);
              setConfirmStatus('success');
              setConfirmMessage('Email confirmed successfully!');
            }
          } catch (err: any) {
            console.error('❌ OTP verification exception:', err);
            setConfirmStatus('error');
            setConfirmMessage(err?.message || 'An error occurred during confirmation.');
            setSession(session);
            setUser(session?.user ?? null);
          }

          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', window.location.pathname);
          }
          setIsLoading(false);
          return;
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('🔐 Attempting sign up...');
      console.log('Email:', email);
      console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('❌ Environment variables not set!');
        return {
          error: {
            name: 'ConfigError',
            message: 'Supabase is not configured. Please set up your environment variables in the project settings.',
            status: 0,
          } as unknown as AuthError
        };
      }
      
      const redirectUrl = Platform.OS === 'web' 
        ? window.location.origin
        : APP_ORIGIN;
      
      console.log('📧 Email redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      if (error) {
        console.error('❌ Sign up error:', error.message);
        console.error('Error details:', error);
      } else {
        console.log('✅ Sign up successful');
      }
      return { error };
    } catch (error: any) {
      console.error('❌ Sign up exception:', error);
      console.error('Error type:', typeof error);
      console.error('Error keys:', Object.keys(error || {}));
      
      let errorMessage = 'Failed to connect to the server.';
      if (error?.message?.includes('fetch')) {
        errorMessage = 'Cannot connect to Supabase. Please check:\n1. Your internet connection\n2. Supabase environment variables are set\n3. Your Supabase project is active';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      return { 
        error: {
          name: error?.name || 'AuthError',
          message: errorMessage,
          status: error?.status || 0,
        } as unknown as AuthError
      };
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      const redirectUrl = Platform.OS === 'web'
        ? window.location.origin
        : APP_ORIGIN;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      return { error };
    } catch (error) {
      console.error('Resend confirmation error:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('🔐 Attempting sign in...');
      
      if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('❌ Environment variables not set!');
        return {
          error: {
            name: 'ConfigError',
            message: 'Supabase is not configured. Please set up your environment variables in the project settings.',
            status: 0,
          } as unknown as AuthError
        };
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error('❌ Sign in error:', error.message);
      } else {
        console.log('✅ Sign in successful');
      }
      return { error };
    } catch (error: any) {
      console.error('❌ Sign in exception:', error);
      
      let errorMessage = 'Failed to connect to the server.';
      if (error?.message?.includes('fetch')) {
        errorMessage = 'Cannot connect to Supabase. Please check:\n1. Your internet connection\n2. Supabase environment variables are set\n3. Your Supabase project is active';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      return { 
        error: {
          name: error?.name || 'AuthError',
          message: errorMessage,
          status: error?.status || 0,
        } as unknown as AuthError
      };
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as AuthError };
    }
  };

  return {
    session,
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    resendConfirmationEmail,
    isAuthenticated: !!user,
    isEmailConfirmed: user?.email_confirmed_at ? true : false,
    confirmStatus,
    confirmMessage,
  };
});
