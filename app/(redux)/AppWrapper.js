import { Stack } from 'expo-router';
import { loadUser } from './authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import AuthLoadingScreen from '../components/AuthLoadingScreen';
import { useRouter, useSegments } from 'expo-router';

const AppWrapper = () => {
  const dispatch = useDispatch();
  const { isLoading, user } = useSelector((state) => state.auth);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('[AppWrapper] Initializing app - loading user');

    // Load user
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    // Wait for auth state to fully load before making routing decisions
    if (isLoading) {
      console.log('[AppWrapper] Still loading auth state, waiting...');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const onRootPage = segments.length === 0;
    const currentPath = segments.join('/');

    console.log('[AppWrapper] Auth redirect check (after loading):', {
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
      console.log(
        '[AppWrapper] Redirecting unauthenticated user from tabs to landing page'
      );
      router.push('/');
    } else if (!user && inAuthGroup) {
      // User is not signed in and on auth pages - allow access
      console.log('[AppWrapper] Unauthenticated user on auth pages - allowing access');
    } else if (user && (onRootPage || inAuthGroup)) {
      // User is signed in but on landing/auth pages, redirect to dashboard
      console.log('[AppWrapper] Redirecting authenticated user to dashboard');
      router.push('/(tabs)');
    } else if (user && inTabsGroup) {
      console.log(
        '[AppWrapper] Authenticated user accessing tabs - allowing access'
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
