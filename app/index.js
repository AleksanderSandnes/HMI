import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
} from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { solarTheme } from '../src/theme/solarTheme';
import { premiumTheme } from '../src/theme/premiumTheme';
import { useResponsive } from '../src/utils/responsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ANIMATION_DURATION, SPACING } from '../src/constants';

const BACKGROUND_VIDEO_URI =
  'https://cdn.pixabay.com/video/2023/11/13/188912-884171167_large.mp4';

const Home = () => {
  const player = useVideoPlayer(BACKGROUND_VIDEO_URI, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });
  const router = useRouter();
  const { isMobile } = useResponsive();
  const insets = useSafeAreaInsets();

  // On web the <video> element has no `autoplay` attribute and is only mounted
  // to the player after this component renders, so the play() call in the
  // useVideoPlayer setup runs before any element exists (a no-op). Re-assert
  // playback once the VideoView has mounted.
  useEffect(() => {
    player.play();
  }, [player]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.extraSlow,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION.slow,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dynamicStyles = {
    mainText: {
      ...styles.mainText,
      fontSize: isMobile ? 42 : 68,
      marginBottom: isMobile ? 10 : 20,
    },
    subText: {
      ...styles.subText,
      fontSize: isMobile ? 18 : 24,
      marginBottom: isMobile ? 5 : 10,
    },
    buttonsContainer: {
      ...styles.buttonsContainer,
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 15 : 30,
      paddingHorizontal: isMobile ? 40 : 60,
      position: isMobile ? 'absolute' : 'relative',
      bottom: isMobile ? 40 + insets.bottom : 'auto',
      marginTop: isMobile ? 0 : 40,
    },
    button: {
      ...styles.button,
      minWidth: isMobile ? 200 : 180,
    },
    pad: {
      paddingVertical: isMobile ? 16 : 15,
      paddingHorizontal: isMobile ? 40 : 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
  };

  const Buttons = (
    <>
      <TouchableOpacity
        style={dynamicStyles.button}
        onPress={() => router.push('/auth/login')}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={premiumTheme.solar.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={dynamicStyles.pad}
        >
          <Text style={styles.primaryButtonText}>Login</Text>
        </LinearGradient>
      </TouchableOpacity>
      <TouchableOpacity
        style={[dynamicStyles.button, styles.secondaryButton]}
        onPress={() => router.push('/auth/register')}
        activeOpacity={0.85}
      >
        <View style={dynamicStyles.pad}>
          <Text style={styles.secondaryButtonText}>Register</Text>
        </View>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
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
          'rgba(0, 0, 0, 0.3)',
        ]}
        style={styles.overlay}
      >
        <View style={styles.contentWrapper}>
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={dynamicStyles.mainText}>
              Home Production Interface
            </Text>
            <Text style={dynamicStyles.subText}>Created by</Text>
            <Text style={dynamicStyles.subText}>Aleksander Sandnes</Text>
            <Text style={styles.tagline}>
              Monitor your energy production and consumption in real-time
            </Text>

            {/* Feature highlights */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Real-time</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>📊</Text>
                <Text style={styles.featureText}>Analytics</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>🌱</Text>
                <Text style={styles.featureText}>Sustainable</Text>
              </View>
            </View>

            {/* Buttons - positioned differently for web vs mobile */}
            {!isMobile && (
              <Animated.View
                style={[
                  dynamicStyles.buttonsContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {Buttons}
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </LinearGradient>

      {/* Mobile buttons - positioned at bottom */}
      {isMobile && (
        <Animated.View
          style={[
            dynamicStyles.buttonsContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {Buttons}
        </Animated.View>
      )}
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
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 20,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  mainText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
    maxWidth: 400,
    lineHeight: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
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
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  buttonsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingVertical: SPACING.md,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    transition: 'all 0.3s ease', // Web-specific smooth transitions
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    backdropFilter: 'blur(12px)',
    // Web-specific hover effects
    cursor: 'pointer',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
      borderColor: 'rgba(255, 255, 255, 0.85)',
    },
  },
  primaryButtonText: {
    color: premiumTheme.text.inverse,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
