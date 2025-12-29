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
      console.log('📝 Attempting to sign up user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'rork-app://auth/confirm',
        },
      });
      
      if (error) {
        console.error('❌ Sign up error:', error.message);
      } else {
        console.log('✅ Sign up successful!');
        console.log('👤 User ID:', data.user?.id);
        console.log('✉️ Email confirmed:', data.user?.email_confirmed_at ? '✓' : '✗ Needs confirmation');
        console.log('📧 Confirmation email should be sent to:', email);
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { error: error as AuthError };
    }
  };

  const resendConfirmationEmail = async (email: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('📧 Resending confirmation email to:', email);
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: 'rork-app://auth/confirm',
        },
      });
      
      if (error) {
        console.error('❌ Resend error:', error.message);
      } else {
        console.log('✅ Confirmation email resent successfully');
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Resend exception:', error);
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    try {
      console.log('🔐 Attempting to sign in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error.message);
        if (error.message.includes('Email not confirmed')) {
          console.log('⚠️ Email not confirmed yet');
        }
      } else {
        console.log('✅ Sign in successful!');
        console.log('👤 User:', data.user?.email);
        console.log('✉️ Email confirmed:', data.user?.email_confirmed_at ? '✓' : '✗');
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error: error as AuthError };
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
