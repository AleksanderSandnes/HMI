import {
  CO2_PER_KWH,
  chartSubtitle,
  comparisonLabel,
  formatCO2,
  formatPeak,
  getPeakOutput,
  peakSublabel,
  periodLabel,
  previousPeriodDate,
  toISO,
  type ChartData,
} from '../utils/solarStats';

describe('solarStats', () => {
  it('formats dates as ISO calendar dates', () => {
    expect(toISO(new Date('2024-06-15T12:34:56.000Z'))).toBe('2024-06-15');
  });

  it('calculates previous period dates for each timespan', () => {
    expect(previousPeriodDate('hourly', '2024-06-15')).toBe('2024-06-14');
    expect(previousPeriodDate('weekly', '2024-06-15')).toBe('2024-06-08');
    expect(previousPeriodDate('monthly', '2024-06-15')).toBe('2024-05-15');
    expect(previousPeriodDate('yearly', '2024-06-15')).toBe('2023-06-15');
    expect(previousPeriodDate('unknown', '2024-06-15')).toBe('2024-06-15');
  });

  it('builds period and comparison labels', () => {
    expect(periodLabel('hourly')).toBe('Today');
    expect(periodLabel('weekly')).toBe('This week');
    expect(periodLabel('monthly')).toBe('This month');
    expect(periodLabel('yearly')).toBe('This year');
    expect(comparisonLabel('hourly')).toBe('vs yesterday');
    expect(comparisonLabel('weekly')).toBe('vs last week');
    expect(comparisonLabel('monthly')).toBe('vs last month');
    expect(comparisonLabel('yearly')).toBe('vs last year');
  });

  it('builds chart subtitles for each timespan', () => {
    expect(chartSubtitle('hourly', '2024-06-15')).toBe('Power output · Jun 15');
    expect(chartSubtitle('weekly', '2024-06-15')).toBe(
      '7-day output from June 15'
    );
    expect(chartSubtitle('monthly', '2024-06-15')).toBe(
      'Daily output · June 2024'
    );
    expect(chartSubtitle('yearly', '2024-06-15')).toBe(
      'Monthly output · 2024'
    );
  });

  it('formats CO2 values with the existing units and precision', () => {
    expect(CO2_PER_KWH).toBe(0.4);
    expect(formatCO2(0)).toEqual({ value: '0.0', unit: 'kg' });
    expect(formatCO2(9.94)).toEqual({ value: '9.9', unit: 'kg' });
    expect(formatCO2(10)).toEqual({ value: '10', unit: 'kg' });
    expect(formatCO2(1000)).toEqual({ value: '1.00', unit: 't' });
  });

  it('formats peak values with the existing rounding', () => {
    expect(formatPeak(0)).toBe('0.0');
    expect(formatPeak(9.94)).toBe('9.9');
    expect(formatPeak(10)).toBe('10');
    expect(formatPeak(1000)).toBe('1.0');
  });

  it('builds peak sublabels for empty, hourly, weekly, monthly, and yearly labels', () => {
    expect(peakSublabel('hourly', '')).toBe('No data');
    expect(peakSublabel('hourly', '13:00')).toBe('at 13:00');
    expect(peakSublabel('weekly', 'Mon')).toBe('on Monday');
    expect(peakSublabel('weekly', 'Holiday')).toBe('on Holiday');
    expect(peakSublabel('monthly', '15')).toBe('on day 15');
    expect(peakSublabel('yearly', 'Jan')).toBe('in January');
    expect(peakSublabel('yearly', 'Q1')).toBe('in Q1');
  });

  it('derives peak output from chart data', () => {
    const data: ChartData = {
      labels: ['06:00', '07:00', '08:00'],
      datasets: [{ data: [0, 120, 120] }],
    };

    expect(getPeakOutput(data, 'hourly')).toEqual({
      value: 120,
      label: '07:00',
      unit: 'W',
    });
    expect(getPeakOutput(data, 'weekly')?.unit).toBe('kWh');
  });

  it('returns no peak for empty or non-positive chart data', () => {
    expect(getPeakOutput({ labels: [], datasets: [] }, 'hourly')).toBeNull();
    expect(
      getPeakOutput({ labels: ['A', 'B'], datasets: [{ data: [0, -1] }] }, 'hourly')
    ).toBeNull();
    expect(
      getPeakOutput({ labels: [], datasets: [{ data: [3] }] }, 'monthly')
    ).toEqual({ value: 3, label: '', unit: 'kWh' });
  });
});
