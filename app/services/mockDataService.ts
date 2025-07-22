/**
 * Mock Data Service for Solar Power Dashboard
 * Provides realistic solar power generation data for different time ranges
 */

export interface SolarDataPoint {
  time: string;
  power: number; // Watts for hourly/daily, kWh for longer periods
  energy?: number; // kWh cumulative
}

export interface SolarMetrics {
  currentPeriod: number;
  total: number;
  revenue: {
    current: number;
    total: number;
  };
}

/**
 * Generate realistic hourly solar power data
 * Simulates solar power generation throughout the day
 */
export function generateHourlyData(date: string): SolarDataPoint[] {
  const data: SolarDataPoint[] = [];
  const selectedDate = new Date(date);
  const month = selectedDate.getMonth() + 1; // 1-12
  const dayOfYear = getDayOfYear(selectedDate);

  // Solar irradiance varies by season and time of day
  const seasonalMultiplier =
    Math.sin((dayOfYear / 365) * Math.PI * 2) * 0.3 + 0.7;
  const peakPower = 8000; // 8kW system

  // Generate hourly data (24 data points)
  for (let hour = 0; hour < 24; hour++) {
    const timeString = `${String(hour).padStart(2, '0')}:00`;

    // Solar power generation curve (bell curve centered around noon)
    let power = 0;

    if (hour >= 6 && hour <= 18) {
      // Daylight hours - use a sine curve
      const dayProgress = (hour - 6) / 12; // 0 to 1
      const solarIntensity = Math.sin(dayProgress * Math.PI);

      // Add some realistic variation
      const randomVariation = (Math.random() - 0.5) * 0.2;
      const cloudiness = Math.sin(hour * 0.7) * 0.1; // Simulated cloud cover

      power =
        peakPower *
        solarIntensity *
        seasonalMultiplier *
        (1 + randomVariation + cloudiness);
      power = Math.max(0, power);
    }

    data.push({
      time: timeString,
      power: Math.round(power),
    });
  }

  return data;
}

/**
 * Generate realistic daily data (24 hours aggregated)
 */
export function generateDailyData(date: string): SolarDataPoint[] {
  const hourlyData = generateHourlyData(date);
  const dailyData: SolarDataPoint[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const hourData = hourlyData.filter((d) =>
      d.time.startsWith(String(hour).padStart(2, '0'))
    );
    const avgPower =
      hourData.reduce((sum, d) => sum + d.power, 0) / hourData.length;

    dailyData.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      power: Math.round(avgPower),
    });
  }

  return dailyData;
}

/**
 * Generate weekly data (7 days)
 */
export function generateWeeklyData(endDate: string): SolarDataPoint[] {
  const data: SolarDataPoint[] = [];
  const end = new Date(endDate);

  for (let i = 6; i >= 0; i--) {
    const date = new Date(end);
    date.setDate(date.getDate() - i);

    const dailyData = generateDailyData(date.toISOString().split('T')[0]);
    const totalEnergy = dailyData.reduce((sum, d) => sum + d.power, 0) / 1000; // Convert to kWh

    data.push({
      time: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      power: Math.round(totalEnergy * 100) / 100,
    });
  }

  return data;
}

/**
 * Generate monthly data (up to current month for current year, all 12 for past years)
 */
export function generateMonthlyData(year: number): SolarDataPoint[] {
  const data: SolarDataPoint[] = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-12

  // If requesting current year, only show months up to current month
  // If requesting past year, show all 12 months
  // If requesting future year, show no months (shouldn't happen but safe)
  let maxMonth: number;
  if (year === currentYear) {
    maxMonth = currentMonth;
  } else if (year < currentYear) {
    maxMonth = 12; // Past years show all 12 months
  } else {
    maxMonth = 0; // Future years show no data
  }

  for (let month = 1; month <= maxMonth; month++) {
    const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
      month: 'short',
    });

    // Simulate seasonal variation (Northern Hemisphere)
    const seasonalMultiplier =
      Math.sin(((month - 1) / 12) * Math.PI * 2) * 0.4 + 0.6;
    const baseMonthlyGeneration = 600; // Base kWh per month

    // Add some year-to-year variation for past years
    const yearVariation =
      year < currentYear
        ? 0.85 + Math.random() * 0.3
        : 0.9 + Math.random() * 0.2;
    const monthlyGeneration =
      baseMonthlyGeneration * seasonalMultiplier * yearVariation;

    data.push({
      time: monthName,
      power: Math.round(monthlyGeneration),
    });
  }

  return data;
}

/**
 * Generate yearly data (5 years)
 */
export function generateYearlyData(endYear: number): SolarDataPoint[] {
  const data: SolarDataPoint[] = [];

  for (let i = 4; i >= 0; i--) {
    const year = endYear - i;
    const monthlyData = generateMonthlyData(year);
    const totalYearlyGeneration = monthlyData.reduce(
      (sum, d) => sum + d.power,
      0
    );

    data.push({
      time: year.toString(),
      power: Math.round(totalYearlyGeneration),
    });
  }

  return data;
}

/**
 * Calculate comprehensive metrics for the dashboard
 */
export function calculateMetrics(
  data: SolarDataPoint[],
  timespan: string
): SolarMetrics {
  const pricePerKwh = 0.95; // NOK per kWh

  let currentPeriod = 0;
  let total = 0;

  if (timespan === 'hourly') {
    // For hourly, current period is the sum of all hours, convert W to kWh
    currentPeriod = data.reduce((sum, d) => sum + d.power, 0) / 1000;
    total = 23955.2; // Mock total lifetime generation
  } else if (timespan === 'daily') {
    // For daily, current period is today's total, convert W to kWh
    currentPeriod = data.reduce((sum, d) => sum + d.power, 0) / 1000;
    total = 23955.2; // Mock total lifetime generation
  } else {
    // For weekly, monthly, yearly - data is already in kWh
    currentPeriod = data.reduce((sum, d) => sum + d.power, 0);
    total = 23955.2; // Mock total lifetime generation
  }

  return {
    currentPeriod: Math.round(currentPeriod * 100) / 100,
    total: Math.round(total * 100) / 100,
    revenue: {
      current: Math.round(currentPeriod * pricePerKwh * 100) / 100,
      total: Math.round(total * pricePerKwh * 100) / 100,
    },
  };
}

/**
 * Get chart-ready data for the PowerProductionChart component
 */
export function getChartData(
  data: SolarDataPoint[],
  timespan: string,
  isMobile: boolean = false
) {
  console.log(
    `[MockData] Optimizing chart data for ${timespan}, mobile: ${isMobile}`
  );
  console.log(`[MockData] Input data points: ${data.length}`);

  let labels: string[] = [];
  let values: number[] = [];

  // Filter out zero/low power values (nighttime) and apply smart sampling
  const meaningfulData = data.filter((d) => d.power > 10); // Only show meaningful generation

  if (meaningfulData.length === 0) {
    // No meaningful data
    return {
      labels: ['No Data'],
      datasets: [
        {
          data: [0],
          color: () => '#dc2626',
          strokeWidth: 2,
        },
      ],
    };
  }

  let samplingInterval: number;

  if (timespan === 'hourly') {
    // For hourly view, show every 30-60 minutes during active period
    samplingInterval = isMobile ? 2 : 1; // Mobile: every 2 hours, Desktop: every hour
  } else if (timespan === 'daily') {
    // For daily view, show every 1-2 hours during active period
    samplingInterval = isMobile ? 3 : 2; // Mobile: every 3 hours, Desktop: every 2 hours
  } else {
    // For other timespans, use moderate sampling
    samplingInterval = 1; // Use all meaningful data
  }

  // Sample the meaningful data
  for (let i = 0; i < meaningfulData.length; i += samplingInterval) {
    const dataPoint = meaningfulData[i];
    labels.push(dataPoint.time);
    values.push(dataPoint.power);
  }

  console.log(
    `[MockData] Filtered to ${meaningfulData.length} meaningful points, sampled to ${labels.length} display points`
  );

  return {
    labels,
    datasets: [
      {
        data: values,
        color: () => '#dc2626', // Red for mock mode to distinguish from production
        strokeWidth: 2,
      },
    ],
  };
}

/**
 * Helper function to get day of year
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get mock data for a specific timespan and date
 */
export function getMockSolarData(
  timespan: string,
  date: string,
  isMobile: boolean = false
) {
  let data: SolarDataPoint[] = [];

  switch (timespan) {
    case 'hourly':
      data = generateHourlyData(date);
      break;
    case 'daily':
      data = generateDailyData(date);
      break;
    case 'weekly':
      data = generateWeeklyData(date);
      break;
    case 'monthly':
      data = generateMonthlyData(new Date(date).getFullYear());
      break;
    case 'yearly':
      data = generateYearlyData(new Date(date).getFullYear());
      break;
    default:
      data = generateDailyData(date);
  }

  return {
    chartData: getChartData(data, timespan, isMobile),
    metrics: calculateMetrics(data, timespan),
    rawData: data,
  };
}
