import {
  buildAggregatedLabels,
  calculateMetrics,
  cleanPowerData,
  generateTimeLabels,
  optimizeChartData,
} from '../utils/growattApiHelpers';

describe('growattApiHelpers', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

  it('cleans null, undefined, NaN, and numeric-like power values', () => {
    expect(cleanPowerData([null, undefined, Number.NaN, '12.5', 7, ''])).toEqual([
      0, 0, 0, 12.5, 7, 0,
    ]);
  });

  it('generates 5-minute labels for a full day', () => {
    const labels = generateTimeLabels();

    expect(labels).toHaveLength(288);
    expect(labels.slice(0, 3)).toEqual(['00:00', '00:05', '00:10']);
    expect(labels.slice(-3)).toEqual(['23:45', '23:50', '23:55']);
  });

  it('returns No Data when optimization finds no values above the threshold', () => {
    expect(optimizeChartData([], [], 'hourly')).toEqual({
      data: [0],
      labels: ['No Data'],
    });
    expect(optimizeChartData([0, 5], ['00:00', '00:05'], 'hourly')).toEqual({
      data: [0],
      labels: ['No Data'],
    });
  });

  it('optimizes hourly data using padded range and rounded hour labels', () => {
    const powerValues = Array(30).fill(0);
    powerValues[12] = 10;
    powerValues[18] = 30;

    expect(
      optimizeChartData(powerValues, generateTimeLabels().slice(0, 30), 'hourly')
    ).toEqual({
      data: [0, 30],
      labels: ['01:00', '02:00'],
    });
  });

  it('optimizes non-hourly data with the existing hourly sampling labels', () => {
    const powerValues = Array(25).fill(0);
    powerValues[6] = 20;
    powerValues[12] = 50;
    powerValues[18] = 20;

    expect(
      optimizeChartData(powerValues, generateTimeLabels().slice(0, 25), 'weekly', true)
    ).toEqual({
      data: [0, 50, 0],
      labels: ['00:00', '01:00', '02:00'],
    });
  });

  it('calculates fallback metrics from 5-minute power data', () => {
    expect(calculateMetrics([12000], 'hourly', 2)).toEqual({
      todayGeneration: 1,
      totalGeneration: 1,
      todayRevenue: 2,
      totalRevenue: 2,
    });
  });

  it('uses API metric overrides while preserving zero override values', () => {
    expect(calculateMetrics([12000], 'hourly', 3, 100, 2)).toEqual({
      todayGeneration: 2,
      totalGeneration: 100,
      todayRevenue: 6,
      totalRevenue: 300,
    });
    expect(calculateMetrics([12000], 'hourly', 2, 0, 0)).toEqual({
      todayGeneration: 0,
      totalGeneration: 0,
      todayRevenue: 0,
      totalRevenue: 0,
    });
  });

  it('uses monthly API generation for the selected period metric', () => {
    expect(calculateMetrics([12000], 'monthly', 1.5, 100, 2, 8)).toEqual({
      todayGeneration: 8,
      totalGeneration: 100,
      todayRevenue: 12,
      totalRevenue: 150,
    });
  });

  it('builds aggregated labels for weekly, monthly, and yearly data', () => {
    expect(
      buildAggregatedLabels('weekly', 3, [
        '2024-06-16',
        '2024-06-17',
        'not-a-date',
      ])
    ).toEqual(['Sun', 'Mon', 'not-a-date']);
    expect(buildAggregatedLabels('weekly', 2)).toEqual(['Day 1', 'Day 2']);
    expect(buildAggregatedLabels('monthly', 3)).toEqual(['1', '2', '3']);
    expect(buildAggregatedLabels('monthly', 0)).toEqual([]);
    expect(buildAggregatedLabels('yearly', 14).slice(10)).toEqual([
      'Nov',
      'Dec',
      '13',
      '14',
    ]);
  });
});
