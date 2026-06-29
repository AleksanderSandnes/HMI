import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';

import GlassCard from '../../src/components/ui/GlassCard';
import Button from '../../src/components/ui/Button';
import AccountCard from '../../src/components/settings/cards/AccountCard';
import GrowattCredentialsCard from '../../src/components/settings/cards/GrowattCredentialsCard';
import WeatherCredentialsCard from '../../src/components/settings/cards/WeatherCredentialsCard';
import { theme } from '../../src/theme/theme';
import { logoutAction } from '../../src/redux/authSlice';
import { subscribeSettings } from '../../src/services/settingsApiService';

export default function SettingsScreen(): React.ReactElement {
  const dispatch = useDispatch();
  const router = useRouter();

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width <= 768;
  const isWide = width >= 1600;

  // Live cross-device sync: bump a signal whenever this user's settings/profile change
  // on another device, so the cards below re-load their values.
  const [refreshSignal, setRefreshSignal] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeSettings(() =>
      setRefreshSignal((s) => s + 1)
    );
    return unsubscribe;
  }, []);

  const handleLogout = () => {
    const doLogout = () => {
      dispatch(logoutAction());
      if (Platform.OS === 'web') {
        window.location.href = '/';
      } else {
        router.push('/');
      }
    };

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?\n\nYou will be redirected to the home page.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: doLogout },
      ]
    );
  };

  const Header = (
    <View style={[styles.header, isMobile && styles.headerMobile]}>
      <View style={isMobile ? { alignItems: 'center' } : undefined}>
        <Text style={[styles.title, isWide && styles.titleWide]}>Settings</Text>
        <Text style={[styles.subtitle, isWide && styles.subtitleWide]}>
          Manage your account and connected services
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={theme.bg.gradient} style={StyleSheet.absoluteFill} />
      <Blob color={theme.bg.glowSolar} top={-120} right={-100} size={360} />
      <Blob color={theme.bg.glowEnergy} bottom={-140} left={-120} size={380} />
      <Blob color={theme.bg.glowViolet} top={240} left={width * 0.45} size={300} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: (Platform.OS === 'web' ? 28 : 14) + insets.top,
            paddingBottom: 48 + insets.bottom,
            paddingLeft: (isMobile ? 16 : 24) + insets.left,
            paddingRight: (isMobile ? 16 : 24) + insets.right,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          {Header}
          <AccountCard refreshSignal={refreshSignal} />
          <GrowattCredentialsCard refreshSignal={refreshSignal} />
          <WeatherCredentialsCard refreshSignal={refreshSignal} />

          {isMobile ? (
            <GlassCard style={styles.logoutCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logoutTitle}>Sign out</Text>
                <Text style={styles.logoutSub}>
                  You will be returned to the login screen.
                </Text>
              </View>
              <Button
                label="Logout"
                icon="sign-out-alt"
                variant="danger"
                onPress={handleLogout}
              />
            </GlassCard>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Blob({
  color,
  size,
  top,
  bottom,
  left,
  right,
}: {
  color: string;
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}) {
  return (
    <View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          bottom,
          left,
          right,
          opacity: 0.9,
        },
        Platform.OS === 'web' ? ({ filter: `blur(90px)` } as object) : { opacity: 0.35 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg.base },
  scroll: {
    paddingBottom: 48,
  },
  column: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: theme.space.lg,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerMobile: { flexDirection: 'column', alignItems: 'center' },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.text.primary,
    letterSpacing: -0.8,
  },
  titleWide: { fontSize: 38, letterSpacing: -1 },
  subtitle: {
    fontSize: 14.5,
    color: theme.text.muted,
    marginTop: 4,
    fontWeight: '500',
  },
  subtitleWide: { fontSize: 16.5, marginTop: 6 },

  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 22,
  },
  logoutTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.text.primary,
  },
  logoutSub: {
    fontSize: 13,
    color: theme.text.muted,
    marginTop: 3,
    fontWeight: '500',
  },
});
