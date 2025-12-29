import { useState, useEffect } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import createContextHook from '@nkzw/create-context-hook';
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'myapp://auth/confirm',
        },
      });
      if (error) {
        console.error('❌ Sign up error:', error.message);
      } else {
        console.log('✅ Sign up successful');
      }
      return { error };
    } catch (error: any) {
      console.error('❌ Sign up exception:', error);
      return { 
        error: {
          name: error?.name || 'AuthError',
          message: error?.message || 'Failed to connect to authentication service. Please check your internet connection and try again.',
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
      return { 
        error: {
          name: error?.name || 'AuthError',
          message: error?.message || 'Failed to connect to authentication service. Please check your internet connection and try again.',
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
