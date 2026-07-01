import "../global.css";
import "../src/font";
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  Geist_800ExtraBold,
  Geist_900Black,
  useFonts,
} from "@expo-google-fonts/geist";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import PushRegistrar from "../src/components/PushRegistrar";
import { AuthProvider, useAuth } from "../src/lib/auth";
import { QueryProvider } from "../src/lib/query";

/**
 * Auth gate (replaces the old Redux AppWrapper). Redirects between the `(auth)`
 * and `(tabs)` route groups based on the Supabase session, once it has loaded.
 */
function AuthGate() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    // Protect the app: send signed-out users to login. Authenticated users are
    // NOT auto-redirected off the (auth) group so the multi-step register flow
    // (which signs in at step 1) can finish; login/register navigate explicitly.
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    }
  }, [session, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#f59e0b" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  // Load Geist per-weight on native (the web build loads it via CSS in `font.ts`).
  const [fontsLoaded, fontError] = useFonts(
    Platform.OS === "web"
      ? {}
      : {
          Geist_400Regular,
          Geist_500Medium,
          Geist_600SemiBold,
          Geist_700Bold,
          Geist_800ExtraBold,
          Geist_900Black,
        },
  );

  if (!fontsLoaded && !fontError) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#f59e0b" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <AuthProvider>
            <StatusBar style="light" backgroundColor="#070b16" />
            <PushRegistrar />
            <AuthGate />
          </AuthProvider>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
