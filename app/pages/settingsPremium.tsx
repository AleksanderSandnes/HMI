import React from 'react';
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
import { useDispatch } from 'react-redux';
import { useRouter } from 'expo-router';

import GlassCard from '../components/premium/GlassCard';
import PremiumButton from '../components/premium/PremiumButton';
import AccountCard from '../components/settings/premium/AccountCard';
import GrowattCredentialsCard from '../components/settings/premium/GrowattCredentialsCard';
import WeatherCredentialsCard from '../components/settings/premium/WeatherCredentialsCard';
import { premiumTheme } from '../theme/premiumTheme';
import { logoutAction } from '../(redux)/authSlice';

export default function SettingsPremium(): React.ReactElement {
  const dispatch = useDispatch();
  const router = useRouter();

  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const isWide = width >= 1600;

  const handleLogout = () => {
    const doLogout = () => {
      dispatch(logoutAction());
      if (typeof window !== 'undefined') {
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
      <LinearGradient colors={premiumTheme.bg.gradient} style={StyleSheet.absoluteFill} />
      <Blob color={premiumTheme.bg.glowSolar} top={-120} right={-100} size={360} />
      <Blob color={premiumTheme.bg.glowEnergy} bottom={-140} left={-120} size={380} />
      <Blob color={premiumTheme.bg.glowViolet} top={240} left={width * 0.45} size={300} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: isMobile ? 16 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.column}>
          {Header}
          <AccountCard />
          <GrowattCredentialsCard />
          <WeatherCredentialsCard />

          {isMobile ? (
            <GlassCard style={styles.logoutCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.logoutTitle}>Sign out</Text>
                <Text style={styles.logoutSub}>
                  You will be returned to the login screen.
                </Text>
              </View>
              <PremiumButton
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
  root: { flex: 1, backgroundColor: premiumTheme.bg.base },
  scroll: {
    paddingTop: Platform.OS === 'web' ? 28 : 54,
    paddingBottom: 48,
  },
  column: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    gap: premiumTheme.space.lg,
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
    color: premiumTheme.text.primary,
    letterSpacing: -0.8,
  },
  titleWide: { fontSize: 38, letterSpacing: -1 },
  subtitle: {
    fontSize: 14.5,
    color: premiumTheme.text.muted,
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
    color: premiumTheme.text.primary,
  },
  logoutSub: {
    fontSize: 13,
    color: premiumTheme.text.muted,
    marginTop: 3,
    fontWeight: '500',
  },
});
