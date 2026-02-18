import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Linking from 'expo-linking';
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { StatusBar } from "expo-status-bar";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const router = useRouter();
  const hasHandledConfirm = useRef(false);

  useEffect(() => {
    const checkForConfirmParams = () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && !hasHandledConfirm.current) {
        const url = new URL(window.location.href);
        const tokenHash = url.searchParams.get('token_hash') || url.searchParams.get('token');
        const type = url.searchParams.get('type');
        const accessToken = url.hash ? new URLSearchParams(url.hash.substring(1)).get('access_token') : null;

        if (tokenHash || accessToken) {
          hasHandledConfirm.current = true;
          console.log('Detected email confirmation params at root, navigating to confirm screen');
          router.replace({
            pathname: '/auth/confirm',
            params: {
              token_hash: tokenHash || '',
              type: type || 'email',
              ...(accessToken ? { access_token: accessToken } : {}),
            },
          } as any);
        }
      }
    };

    const timer = setTimeout(checkForConfirmParams, 100);

    const handleDeepLink = (event: { url: string }) => {
      console.log('Deep link received:', event.url);
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('Initial URL:', url);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [router]);

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
  useEffect(() => {
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
