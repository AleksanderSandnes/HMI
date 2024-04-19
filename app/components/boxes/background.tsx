import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';

interface BackgroundProps {
  children: React.ReactNode;
}

export default function Background({ children }: BackgroundProps) {
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      colors={['rgba(48,44,108,1)', 'rgba(46,89,143,1)']}
      style={{ flex: 1 }}
    >
      {children}
    </LinearGradient>
  );
}
