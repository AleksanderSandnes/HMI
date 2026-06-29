// Weather observation shapes (ported from mobile src/interface/weatherInterface.ts).

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: () => string;
    strokeWidth: number;
    withDots?: boolean;
  }[];
}

export interface TemperatureDataItem {
  metric: { tempAvg: number; dewptAvg: number };
  obsTimeLocal: string;
}

export interface WindSpeedDataItem {
  metric: { windspeedAvg: number; windgustAvg: number };
  obsTimeLocal: string;
}

export interface WindDirectionDataItem {
  winddirAvg: number;
  obsTimeLocal: string;
}

export interface PrecipDataItem {
  metric: { precipRate: number; precipTotal: number };
  obsTimeLocal: string;
}

export interface PressureDataItem {
  metric: { pressureMax: number };
  obsTimeLocal: string;
}

export interface SolarRadiationDataItem {
  solarRadiationHigh: number;
  obsTimeLocal: string;
}

export interface UvIndexDataItem {
  uvHigh: number;
  obsTimeLocal: string;
}
