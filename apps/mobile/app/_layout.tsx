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
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  ThemeProvider as NavigationThemeProvider,
  type Theme as NavigationTheme,
} from "@react-navigation/native";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, type ReactNode } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import PushRegistrar from "../src/components/PushRegistrar";
import { AuthProvider, useAuth } from "../src/lib/auth";
import { QueryProvider } from "../src/lib/query";
import { ThemeProvider, useThemeBootstrap, useThemeColors } from "../src/lib/theme";

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

/** Reads the active theme to drive the native status bar chrome. */
function ThemedStatusBar() {
  const { mode, colors } = useThemeColors();
  return <StatusBar style={mode === "dark" ? "light" : "dark"} backgroundColor={colors.bgBase} />;
}

/**
 * Bridges our theme into React Navigation's own ThemeProvider (used
 * internally by expo-router's `<Tabs>`/`<Stack>`). Without this, React
 * Navigation falls back to its own `DefaultTheme` — a light, opaque
 * `rgb(242,242,242)` scene background — which bleeds through anywhere our
 * screens don't fully repaint over it, regardless of our own dark/light
 * mode. `background` is forced transparent so our GlassCard/ScreenBackground
 * colors are always what's visible.
 */
function AppNavigationTheme({ children }: { children: ReactNode }) {
  const { mode, colors } = useThemeColors();
  const base = mode === "dark" ? NavDarkTheme : NavDefaultTheme;
  const navTheme: NavigationTheme = {
    ...base,
    dark: mode === "dark",
    colors: {
      ...base.colors,
      background: "transparent",
      card: colors.panelBg,
      text: colors.textPrimary,
      border: colors.glassBorder,
      notification: colors.negative,
    },
  };
  return <NavigationThemeProvider value={navTheme}>{children}</NavigationThemeProvider>;
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
  const { mode: themeMode, ready: themeReady } = useThemeBootstrap();

  if ((!fontsLoaded && !fontError) || !themeReady) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-base">
        <ActivityIndicator color="#f59e0b" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemeProvider mode={themeMode}>
            <AppNavigationTheme>
              <QueryProvider>
                <AuthProvider>
                  <ThemedStatusBar />
                  <PushRegistrar />
                  <AuthGate />
                </AuthProvider>
              </QueryProvider>
            </AppNavigationTheme>
          </ThemeProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
