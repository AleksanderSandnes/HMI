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

/**
 * Device/plant status surfaced from the Growatt v2 getDevicesByPlantList endpoint.
 * (CO₂ / revenue / trees / performance-ratio are NOT returned by the v2 API, so they
 * are not part of this shape — any such figures shown in the UI are computed estimates.)
 */
export interface SolarDeviceInfo {
  /** Raw device status string ("1" == online/normal). */
  status?: string;
  /** Convenience flag derived from status === '1'. */
  online?: boolean;
  /** Inverter model, e.g. "MID 12KTL3-XL". */
  model?: string;
  /** Plant display name, e.g. "Hovedtak". */
  plantName?: string;
  /** Last device data update timestamp (plant local). */
  lastUpdate?: string;
  /** Rated PV system capacity in watts (nominalPower), e.g. 12000. */
  capacity?: number;
  /** Total number of devices on the plant. */
  deviceCount?: number;
  /** Number of devices currently online. */
  onlineCount?: number;
}

export interface SolarData {
  chartData: SolarChartData;
  metrics: SolarMetrics;
  /** Present when the totalData snapshot was fetched (hourly + aggregated paths). */
  device?: SolarDeviceInfo;
}

export type SolarTimespan = 'hourly' | 'weekly' | 'monthly' | 'yearly' | 'total';
