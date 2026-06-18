import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Animated,
  Platform,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { solarTheme } from '../theme/solarTheme';
import { SPACING, TYPOGRAPHY, ANIMATION_DURATION } from '../constants';

const BACKGROUND_VIDEO_URI =
  'https://cdn.pixabay.com/video/2023/11/13/188912-884171167_large.mp4';

const Home = () => {
  const player = useVideoPlayer(BACKGROUND_VIDEO_URI, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });
  const router = useRouter();
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;

  // Re-assert playback after the VideoView mounts (the setup-callback play()
  // runs before the web <video> element exists, so it's a no-op there).
  useEffect(() => {
    player.play();
  }, [player]);
  const [buttonPressed, setButtonPressed] = useState({
    login: false,
    register: false,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const loginButtonScale = useRef(new Animated.Value(1)).current;
  const registerButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleButtonPress = (buttonType, isPressed) => {
    const animValue =
      buttonType === 'login' ? loginButtonScale : registerButtonScale;

    Animated.timing(animValue, {
      toValue: isPressed ? 0.95 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();

    setButtonPressed((prev) => ({ ...prev, [buttonType]: isPressed }));
  };

  const dynamicStyles = {
    container: {
      ...styles.container,
      minHeight: isMobile ? windowDimensions.height : '100vh',
    },
    mainText: {
      ...styles.mainText,
      fontSize: isMobile ? TYPOGRAPHY.mobile.hero : TYPOGRAPHY.desktop.hero,
      marginBottom: isMobile ? SPACING.sm : SPACING.md,
    },
    subText: {
      ...styles.subText,
      fontSize: isMobile
        ? TYPOGRAPHY.mobile.subtitle
        : TYPOGRAPHY.desktop.subtitle,
      marginBottom: isMobile ? SPACING.xs : SPACING.sm,
    },
    tagline: {
      ...styles.tagline,
      fontSize: isMobile ? TYPOGRAPHY.mobile.body : TYPOGRAPHY.desktop.body,
      marginTop: isMobile ? SPACING.md : SPACING.lg,
      paddingHorizontal: isMobile ? SPACING.md : SPACING.lg,
    },
    buttonsContainer: {
      ...styles.buttonsContainer,
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? SPACING.md : SPACING.lg,
      paddingHorizontal: isMobile ? SPACING.xl : SPACING.lg,
      bottom: isMobile ? SPACING.xl : SPACING.xxl,
    },
    button: {
      ...styles.button,
      paddingVertical: isMobile ? SPACING.md : SPACING.sm,
      paddingHorizontal: isMobile ? SPACING.xl : SPACING.lg,
      minWidth: isMobile ? 220 : 160,
    },
  };

  return (
    <View style={dynamicStyles.container}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        playsInline
      />

      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.3)',
          'rgba(0, 0, 0, 0.6)',
          'rgba(0, 0, 0, 0.4)',
        ]}
        locations={[0, 0.5, 1]}
        style={styles.overlay}
      >
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            },
          ]}
        >
          <Text style={dynamicStyles.mainText}>Home Production Interface</Text>
          <Text style={dynamicStyles.subText}>Created by</Text>
          <Text style={[dynamicStyles.subText, styles.authorName]}>
            Aleksander Sandnes
          </Text>
          <Text style={dynamicStyles.tagline}>
            Monitor your energy production and consumption in real-time with
            advanced analytics and insights
          </Text>

          {/* Feature highlights */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>Real-time monitoring</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Advanced analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🌱</Text>
              <Text style={styles.featureText}>Sustainable energy</Text>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      <Animated.View
        style={[
          dynamicStyles.buttonsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: loginButtonScale }] }}>
          <TouchableOpacity
            style={[dynamicStyles.button, styles.primaryButton]}
            onPress={() => router.push('/auth/login')}
            onPressIn={() => handleButtonPress('login', true)}
            onPressOut={() => handleButtonPress('login', false)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={solarTheme.primary.gradient}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={{ transform: [{ scale: registerButtonScale }] }}>
          <TouchableOpacity
            style={[dynamicStyles.button, styles.secondaryButton]}
            onPress={() => router.push('/auth/register')}
            onPressIn={() => handleButtonPress('register', true)}
            onPressOut={() => handleButtonPress('register', false)}
            activeOpacity={0.9}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    maxWidth: 800,
  },
  mainText: {
    color: solarTheme.text.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 1,
    lineHeight: 1.2,
  },
  subText: {
    color: solarTheme.text.secondary,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  authorName: {
    color: solarTheme.primary.light,
    fontWeight: 'bold',
  },
  tagline: {
    color: solarTheme.text.tertiary,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 1.4,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
    marginVertical: SPACING.xs,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  featureText: {
    color: solarTheme.text.tertiary,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonsContainer: {
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  button: {
    borderRadius: 30,
    elevation: 8,
    shadowColor: solarTheme.shadow.color,
    shadowOffset: solarTheme.shadow.offset,
    shadowOpacity: solarTheme.shadow.opacity,
    shadowRadius: solarTheme.shadow.radius,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 30,
    minWidth: 160,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: solarTheme.button.primary.background,
    borderWidth: 2,
    borderColor: solarTheme.button.primary.border,
  },
  secondaryButton: {
    backgroundColor: solarTheme.button.secondary.background,
    borderWidth: 2,
    borderColor: solarTheme.button.secondary.border,
    backdropFilter: 'blur(10px)',
  },
  buttonText: {
    color: solarTheme.button.primary.text,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
