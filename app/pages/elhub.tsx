import React, { FC } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Box, HStack, VStack } from '@gluestack-ui/themed';
import Background from '../components/boxes/universal/background';
import UnifiedBox from '../components/boxes/UnifiedBox';
import PowerIcon from '../components/icons/power';
import { useResponsive } from '../utils/responsive';
import { solarTheme } from '../theme/solarTheme';
import { SPACING } from '../constants';

const Elhub: FC = function Elhub() {
  const { isMobile, width } = useResponsive();

  if (isMobile) {
    return (
      <Background>
        <ScrollView>
          <View style={styles.mobileContainer}>
            <View style={[styles.chartSection, { width: width * 0.95 }]}>
              <UnifiedBox variant="big">
                <Text style={styles.placeholderText}>Elhub Chart</Text>
              </UnifiedBox>
            </View>

            <View style={[styles.metricsSection, { width: width * 0.95 }]}>
              <UnifiedBox variant="small">
                <PowerIcon />
                <Box style={{ height: SPACING.md }} />
                <Text style={styles.metricText}>Strømpris</Text>
              </UnifiedBox>

              <Box style={{ height: SPACING.md }} />

              <UnifiedBox variant="small">
                <PowerIcon />
                <Box style={{ height: SPACING.md }} />
                <Text style={styles.metricText}>Gjennomsnittlig strømpris</Text>
              </UnifiedBox>

              <Box style={{ height: SPACING.md }} />
            </View>
          </View>
        </ScrollView>
      </Background>
    );
  }

  // Desktop version
  return (
    <Background>
      <HStack style={styles.desktopContainer}>
        <VStack style={styles.chartColumn}>
          <UnifiedBox variant="big">
            <Text style={styles.placeholderText}>Elhub Chart</Text>
          </UnifiedBox>
        </VStack>

        <Box style={{ width: SPACING.md }} />

        <VStack style={styles.metricsColumn}>
          <UnifiedBox variant="small">
            <PowerIcon />
            <Box style={{ height: SPACING.md }} />
            <Text style={styles.metricText}>Strømpris</Text>
          </UnifiedBox>

          <Box style={{ height: SPACING.md }} />

          <UnifiedBox variant="small">
            <PowerIcon />
            <Box style={{ height: SPACING.md }} />
            <Text style={styles.metricText}>Gjennomsnittlig strømpris</Text>
          </UnifiedBox>
        </VStack>
      </HStack>
    </Background>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    flexDirection: 'column',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  chartSection: {
    flex: 8,
    flexDirection: 'column',
    paddingBottom: SPACING.md,
  },
  metricsSection: {
    flex: 2,
    flexDirection: 'column',
  },
  desktopContainer: {
    flex: 0.9,
    flexDirection: 'row',
    width: '95%',
    margin: 'auto',
  },
  chartColumn: {
    flex: 8,
    flexDirection: 'column',
  },
  metricsColumn: {
    flex: 2,
    flexDirection: 'column',
  },
  placeholderText: {
    color: solarTheme.text.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  metricText: {
    color: solarTheme.text.primary,
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default Elhub;
