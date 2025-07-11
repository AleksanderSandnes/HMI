import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PowerIcon from '../icons/power';
import DollarIcon from '../icons/dollar';
import { solarTheme } from '../../theme/solarTheme';

interface MetricData {
  icon: React.ReactNode;
  value: number;
  label: string;
  unit: string;
  color: string;
}

interface CombinedMetricsCardProps {
  powerGeneration: {
    today: number;
    total: number;
  };
  revenue: {
    today: number;
    total: number;
  };
  isLoading?: boolean;
  isMobile?: boolean;
  timespan?: string; // 'daily', 'weekly', 'monthly'
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: solarTheme.text.primary,
  },
  subtitle: {
    fontSize: 12,
    color: solarTheme.text.secondary,
    marginTop: 2,
  },

  // Metrics layout
  metricsContainer: {
    gap: 16,
  },
  metricSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 8,
  },
  metricValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricValue: {
    flex: 1,
  },
  valueText: {
    fontSize: 16,
    fontWeight: '700',
    color: solarTheme.text.primary,
  },
  valueLabel: {
    fontSize: 11,
    color: solarTheme.text.secondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    marginHorizontal: 12,
  },

  // Mobile specific styles
  mobileContainer: {
    backgroundColor: solarTheme.background.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  mobileMetricSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: solarTheme.background.cardLight,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  mobileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  mobileMetricTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: solarTheme.text.primary,
    marginBottom: 4,
  },
  mobileValueText: {
    fontSize: 12,
    fontWeight: '700',
    color: solarTheme.text.primary,
  },
  mobileValueLabel: {
    fontSize: 9,
    color: solarTheme.text.secondary,
    marginTop: 1,
  },

  // Loading state
  loadingContainer: {
    opacity: 0.6,
  },
  loadingText: {
    color: solarTheme.text.secondary,
  },
});

export default function CombinedMetricsCard({
  powerGeneration,
  revenue,
  isLoading = false,
  isMobile = false,
  timespan = 'daily',
}: CombinedMetricsCardProps) {
  const containerStyle = isMobile ? styles.mobileContainer : styles.container;
  const metricSectionStyle = isMobile
    ? styles.mobileMetricSection
    : styles.metricSection;
  const iconStyle = isMobile ? styles.mobileIcon : styles.metricIcon;
  const titleStyle = isMobile ? styles.mobileMetricTitle : styles.metricTitle;
  const valueTextStyle = isMobile ? styles.mobileValueText : styles.valueText;
  const valueLabelStyle = isMobile
    ? styles.mobileValueLabel
    : styles.valueLabel;

  // Determine current period label based on timespan
  const getCurrentPeriodLabel = () => {
    switch (timespan) {
      case 'hourly':
        return 'This Hour';
      case 'daily':
        return 'Today';
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      case 'yearly':
        return 'This Year';
      default:
        return 'Current';
    }
  };

  // Determine subtitle based on timespan
  const getSubtitle = () => {
    switch (timespan) {
      case 'hourly':
        return "This hour's performance overview";
      case 'daily':
        return "Today's performance overview";
      case 'weekly':
        return "This week's performance overview";
      case 'monthly':
        return "This month's performance overview";
      case 'yearly':
        return "This year's performance overview";
      default:
        return 'Performance overview';
    }
  };

  const currentPeriodLabel = getCurrentPeriodLabel();

  return (
    <View style={[containerStyle, isLoading && styles.loadingContainer]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Energy & Revenue</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        {/* Power Generation Section */}
        <View style={metricSectionStyle}>
          <LinearGradient
            colors={[solarTheme.metrics.power, solarTheme.metrics.power + '80']}
            style={iconStyle}
          >
            <PowerIcon />
          </LinearGradient>

          <View style={styles.metricContent}>
            <Text style={titleStyle}>Power Generation</Text>
            <View style={styles.metricValues}>
              <View style={styles.metricValue}>
                <Text style={valueTextStyle}>
                  {isLoading ? '...' : powerGeneration.today.toFixed(2)} kWh
                </Text>
                <Text style={valueLabelStyle}>{currentPeriodLabel}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricValue}>
                <Text style={valueTextStyle}>
                  {isLoading ? '...' : powerGeneration.total.toFixed(2)} kWh
                </Text>
                <Text style={valueLabelStyle}>Total</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Revenue Section */}
        <View style={metricSectionStyle}>
          <LinearGradient
            colors={[
              solarTheme.metrics.revenue,
              solarTheme.metrics.revenue + '80',
            ]}
            style={iconStyle}
          >
            <DollarIcon />
          </LinearGradient>

          <View style={styles.metricContent}>
            <Text style={titleStyle}>Revenue</Text>
            <View style={styles.metricValues}>
              <View style={styles.metricValue}>
                <Text style={valueTextStyle}>
                  {isLoading ? '...' : revenue.today.toFixed(2)} kr
                </Text>
                <Text style={valueLabelStyle}>{currentPeriodLabel}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.metricValue}>
                <Text style={valueTextStyle}>
                  {isLoading ? '...' : revenue.total.toFixed(2)} kr
                </Text>
                <Text style={valueLabelStyle}>Total</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
