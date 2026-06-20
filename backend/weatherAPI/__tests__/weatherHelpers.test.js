const {
  PWS_ENDPOINTS,
  toYyyyMmDd,
  getSelectedDateParts,
  getWeekDatesFromDateParts,
  getWeekDatesForSelectedDate,
  getOptimalEndpointForTimeRange,
} = require('../services/weatherHelpers');

describe('weatherHelpers', () => {
  describe('toYyyyMmDd', () => {
    it('formats dates as YYYYMMDD with zero-padded month and day', () => {
      expect(toYyyyMmDd(new Date(2026, 0, 5))).toBe('20260105');
    });

    it('formats end-of-year boundary dates', () => {
      expect(toYyyyMmDd(new Date(2024, 11, 31))).toBe('20241231');
    });
  });

  describe('getSelectedDateParts', () => {
    it('parses YYYYMMDD strings into local Date constructor parts', () => {
      expect(getSelectedDateParts('20240609')).toEqual({
        year: 2024,
        month: 5,
        day: 9,
      });
    });

    it('preserves existing empty-string parsing behavior', () => {
      const result = getSelectedDateParts('');

      expect(Number.isNaN(result.year)).toBe(true);
      expect(Number.isNaN(result.month)).toBe(true);
      expect(Number.isNaN(result.day)).toBe(true);
    });
  });

  describe('getWeekDatesForSelectedDate', () => {
    it('returns Sunday-through-Saturday dates from parsed date parts', () => {
      expect(getWeekDatesFromDateParts(2024, 5, 19)).toEqual([
        '20240616',
        '20240617',
        '20240618',
        '20240619',
        '20240620',
        '20240621',
        '20240622',
      ]);
    });

    it('returns Sunday-through-Saturday dates for a midweek selected date', () => {
      expect(getWeekDatesForSelectedDate('20240619')).toEqual([
        '20240616',
        '20240617',
        '20240618',
        '20240619',
        '20240620',
        '20240621',
        '20240622',
      ]);
    });

    it('keeps a Sunday selected date as the first day of the returned week', () => {
      expect(getWeekDatesForSelectedDate('20240616')).toEqual([
        '20240616',
        '20240617',
        '20240618',
        '20240619',
        '20240620',
        '20240621',
        '20240622',
      ]);
    });

    it('handles weeks that cross year and month boundaries', () => {
      expect(getWeekDatesForSelectedDate('20240101')).toEqual([
        '20231231',
        '20240101',
        '20240102',
        '20240103',
        '20240104',
        '20240105',
        '20240106',
      ]);
    });

    it('handles leap-day weeks', () => {
      expect(getWeekDatesForSelectedDate('20240229')).toEqual([
        '20240225',
        '20240226',
        '20240227',
        '20240228',
        '20240229',
        '20240301',
        '20240302',
      ]);
    });
  });

  describe('getOptimalEndpointForTimeRange', () => {
    it('returns exact endpoint constants and params for supported ranges', () => {
      expect(getOptimalEndpointForTimeRange('hourly', '20230619')).toMatchObject({
        endpoint: PWS_ENDPOINTS.HOURLY,
        params: { date: '20230619' },
      });
      expect(getOptimalEndpointForTimeRange('weekly')).toMatchObject({
        endpoint: PWS_ENDPOINTS.DAILY_SUMMARY,
        params: {},
      });
      expect(getOptimalEndpointForTimeRange('current')).toMatchObject({
        endpoint: PWS_ENDPOINTS.CURRENT,
        params: {},
      });
      expect(getOptimalEndpointForTimeRange('recent')).toMatchObject({
        endpoint: PWS_ENDPOINTS.RECENT_DAY,
        params: {},
      });
    });

    it('falls back to all-observations and preserves missing date values', () => {
      expect(getOptimalEndpointForTimeRange('unknown')).toEqual({
        endpoint: PWS_ENDPOINTS.DAILY_ALL,
        params: { date: undefined },
        description: 'Default: All observations for specific date',
      });
    });
  });
});
