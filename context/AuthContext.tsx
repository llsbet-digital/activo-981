import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { Session, User, AuthError } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

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
        ? `${window.location.origin}/auth/confirm`
        : Linking.createURL('auth/confirm');
      
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
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
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
  };
});
