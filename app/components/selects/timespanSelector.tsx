import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { solarTheme } from '../../theme/solarTheme';

interface TimespanSelectorProps {
  timespan: string;
  setTimespan: (value: string) => void;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: solarTheme.background.cardLight,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: solarTheme.secondary.accent,
    borderColor: solarTheme.secondary.accent,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    color: solarTheme.text.secondary,
  },
  buttonTextActive: {
    color: solarTheme.text.primary,
    fontWeight: '600',
  },
});

export default function TimespanSelector({
  timespan,
  setTimespan,
}: TimespanSelectorProps) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const options = [
    { label: isMobile ? '1H' : 'Hourly', value: 'hourly' },
    { label: isMobile ? '1W' : 'Weekly', value: 'weekly' },
    { label: isMobile ? '1M' : 'Monthly', value: 'monthly' },
    { label: isMobile ? '1Y' : 'Yearly', value: 'yearly' },
  ];

  return (
    <View style={styles.buttonContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.button,
            timespan === option.value && styles.buttonActive,
          ]}
          onPress={() => setTimespan(option.value)}
        >
          <Text
            style={[
              styles.buttonText,
              timespan === option.value && styles.buttonTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
