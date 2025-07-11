import { Stack } from 'expo-router';
import { loadUser } from './authSlice';
import { loadSettings } from './settingsSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import AuthLoadingScreen from '../components/AuthLoadingScreen';
import { setStoreReference } from '../services/dataConfig';
import { store } from './store';
import { useRouter, useSegments } from 'expo-router';

const AppWrapper = () => {
  const dispatch = useDispatch();
  const { isLoading, user } = useSelector((state) => state.auth);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Set store reference for data config
    setStoreReference(store);

    // Load user and settings
    dispatch(loadUser());
    dispatch(loadSettings());
  }, [dispatch]);

  useEffect(() => {
    if (isLoading) return; // Wait for auth state to load

    const inAuthGroup = segments[0] === 'auth';
    const inTabsGroup = segments[0] === '(tabs)';
    const onRootPage = segments.length === 0;
    const currentPath = segments.join('/');

    console.log('[AppWrapper] Auth redirect check:', {
      user: !!user,
      segments,
      currentPath,
      inAuthGroup,
      inTabsGroup,
      onRootPage,
      isLoading,
    });

    // Only redirect unauthenticated users away from protected tabs
    // Allow authenticated users to access any page including the landing page
    if (!user && inTabsGroup) {
      // User is not signed in but trying to access protected pages, redirect to landing page
      console.log(
        '[AppWrapper] Redirecting unauthenticated user from tabs to landing page'
      );
      router.push('/');
    }

    // Note: Removed the redirect from auth pages for authenticated users
    // This allows users to access the landing page even when logged in
  }, [user, segments, isLoading]);

  useEffect(() => {
    // Set store reference for data config
    setStoreReference(store);

    // Load user and settings
    dispatch(loadUser());
    dispatch(loadSettings());
  }, [dispatch]);

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
