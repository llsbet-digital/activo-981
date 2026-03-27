import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="add-activity" options={{ presentation: "modal", headerShown: true, title: "Add Activity" }} />
        <Stack.Screen name="auth/confirm" options={{ headerShown: false, animation: "fade" }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        let url = '';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          url = window.location.href;
        }

        if (!url) {
          return;
        }

        const parsedUrl = new URL(url);
        const tokenHash = parsedUrl.searchParams.get('token_hash');
        const type = parsedUrl.searchParams.get('type');

        if (tokenHash && type) {
          console.log('Email confirmation detected, verifying OTP...');
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'email',
          });

          if (error) {
            console.error('Email verification failed:', error.message);
          } else {
            console.log('Email verified successfully');
            setEmailVerified(true);
          }

          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
          }
        }
      } catch (err) {
        console.error('Error handling email confirmation:', err);
      }
    };

    handleEmailConfirmation();
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AppProvider>
            <RootLayoutNav />
          </AppProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
