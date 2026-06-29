// Solar / Growatt data shapes (ported from mobile growattApiService + helpers).

export interface SolarMetrics {
  todayGeneration: number;
  totalGeneration: number;
  todayRevenue: number;
  totalRevenue: number;
}

export interface SolarChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: () => string;
    strokeWidth: number;
  }[];
}

export interface SolarData {
  chartData: SolarChartData;
  metrics: SolarMetrics;
}

export type SolarTimespan = 'hourly' | 'weekly' | 'monthly' | 'yearly';
