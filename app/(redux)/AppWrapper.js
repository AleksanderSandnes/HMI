import { Stack } from 'expo-router';
import { loadUser } from './authSlice';
import { loadSettings } from './settingsSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import AuthLoadingScreen from '../components/AuthLoadingScreen';
import { setStoreReference } from '../services/dataConfig';
import { store } from './store';
import { useRouter, useSegments } from 'expo-router';
import { logInfo, logError, logWarn } from '../services/graylogService';

const AppWrapper = () => {
  const dispatch = useDispatch();
  const { isLoading, user } = useSelector((state) => state.auth);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    logInfo('Initializing app - loading user and settings', 'AppWrapper');
    logInfo('Initial auth state:', 'AppWrapper', {
      isLoading,
      user: !!user,
      userEmail: user?.email,
    });

    // Set store reference for data config
    setStoreReference(store);

    // Load user and settings
    dispatch(loadUser());
    dispatch(loadSettings());
  }, [dispatch]);

  useEffect(() => {
    // Wait for auth state to fully load before making routing decisions
    if (isLoading) {
      logInfo('Still loading auth state, waiting...', 'AppWrapper');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const onRootPage = segments.length === 0;
    const currentPath = segments.join('/');

    logInfo('Auth redirect check (after loading):', 'AppWrapper', {
      user: !!user,
      userEmail: user?.email || 'none',
      segments,
      currentPath,
      inAuthGroup,
      inTabsGroup,
      onRootPage,
      isLoading,
    });

    // Handle routing based on authentication state
    if (!user && inTabsGroup) {
      // User is not signed in but trying to access protected pages, redirect to landing page
      logInfo(
        'Redirecting unauthenticated user from tabs to landing page',
        'AppWrapper'
      );
      router.push('/');
    } else if (!user && inAuthGroup) {
      // User is not signed in and on auth pages - allow access
      logInfo(
        'Unauthenticated user on auth pages - allowing access',
        'AppWrapper'
      );
    } else if (user && (onRootPage || inAuthGroup)) {
      // User is signed in but on landing/auth pages, redirect to dashboard
      logInfo('Redirecting authenticated user to dashboard', 'AppWrapper');
      router.push('/(tabs)');
    } else if (user && inTabsGroup) {
      logInfo(
        'Authenticated user accessing tabs - allowing access',
        'AppWrapper'
      );
    }
  }, [user, segments, isLoading, router]);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1e3a8a' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, title: 'Home' }}
      />
      <Stack.Screen
        name="auth"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1e3a8a' },
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
};

export default AppWrapper;
