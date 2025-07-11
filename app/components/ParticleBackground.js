import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';

const ParticleBackground = () => {
  const [particles] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 0.5 + 0.2,
      opacity: Math.random() * 0.8 + 0.2,
    }))
  );

  const windowDimensions = useWindowDimensions();

  useEffect(() => {
    const interval = setInterval(() => {
      particles.forEach((particle) => {
        particle.y -= particle.speed;
        if (particle.y < -5) {
          particle.y = 105;
          particle.x = Math.random() * 100;
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {particles.map((particle) => (
        <View
          key={particle.id}
          style={[
            styles.particle,
            {
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
              opacity: particle.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#00bfa5',
    borderRadius: 50,
  },
});

export default ParticleBackground;
