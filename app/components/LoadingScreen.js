import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';

const LoadingScreen = ({ onComplete }) => {
  const [progress] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(1));
  const windowDimensions = useWindowDimensions();
  const isMobile = windowDimensions.width <= 768;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      // Fade out loading screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onComplete();
      });
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { fontSize: isMobile ? 24 : 32 }]}>
          Home Production Interface
        </Text>
        <Text style={[styles.subtitle, { fontSize: isMobile ? 16 : 20 }]}>
          Loading your energy dashboard...
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.features}>
          <Text style={styles.featureText}>• Real-time energy monitoring</Text>
          <Text style={styles.featureText}>• Advanced analytics dashboard</Text>
          <Text style={styles.featureText}>• Sustainable energy insights</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    maxWidth: 400,
  },
  title: {
    color: '#00bfa5',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00bfa5',
    borderRadius: 2,
  },
  features: {
    alignItems: 'flex-start',
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 5,
  },
});

export default LoadingScreen;
