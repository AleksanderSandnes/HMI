// Optimal endpoint mapping based on Weather.com API documentation
const PWS_ENDPOINTS = {
  // Current weather - most accurate real-time data
  CURRENT: '/observations/current',

  // Hourly data - best for same-day hourly breakdown
  HOURLY: '/history/hourly',

  // Daily historical - best for specific date all observations
  DAILY_ALL: '/history/all',

  // Recent observations - best for recent 24-48 hour data
  RECENT_DAY: '/observations/all/1day',

  // Daily summaries - best for weekly/monthly aggregate data
  DAILY_SUMMARY: '/dailysummary/7day',

  // NOTE: /observations/hourly/7day endpoint appears unreliable
  // Using /dailysummary/7day instead for weekly data
};

// Format a Date as YYYYMMDD using local time (matches the frontend's date format).
const toYyyyMmDd = (d) =>
  `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`;

const getSelectedDateParts = (selectedDate) => {
  // Parse YYYYMMDD format correctly
  const year = parseInt(selectedDate.slice(0, 4));
  const month = parseInt(selectedDate.slice(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(selectedDate.slice(6, 8));

  return { year, month, day };
};

const getWeekDatesFromDateParts = (year, month, day) => {
  // Calculate week dates (Sunday to Saturday)
  const date = new Date(year, month, day);
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - dayOfWeek); // Go to Sunday of this week

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + i);
    const formattedDate = `${weekDate.getFullYear()}${String(weekDate.getMonth() + 1).padStart(2, '0')}${String(weekDate.getDate()).padStart(2, '0')}`;
    weekDates.push(formattedDate);
  }

  return weekDates;
};

const getWeekDatesForSelectedDate = (selectedDate) => {
  const { year, month, day } = getSelectedDateParts(selectedDate);
  return getWeekDatesFromDateParts(year, month, day);
};

// Utility function to get the best endpoint for a given time range
const getOptimalEndpointForTimeRange = (timeRange, date) => {
  switch (timeRange.toLowerCase()) {
    case 'hourly':
      return {
        endpoint: PWS_ENDPOINTS.HOURLY,
        params: { date },
        description: 'Hourly historical data for specific date',
      };
    case 'weekly':
      return {
        endpoint: PWS_ENDPOINTS.DAILY_SUMMARY,
        params: {},
        description: '7-day daily summary (best available for weekly view)',
      };
    case 'current':
      return {
        endpoint: PWS_ENDPOINTS.CURRENT,
        params: {},
        description: 'Current weather observations',
      };
    case 'recent':
      return {
        endpoint: PWS_ENDPOINTS.RECENT_DAY,
        params: {},
        description: 'Recent 24-hour observations',
      };
    default:
      return {
        endpoint: PWS_ENDPOINTS.DAILY_ALL,
        params: { date },
        description: 'Default: All observations for specific date',
      };
  }
};

module.exports = {
  PWS_ENDPOINTS,
  toYyyyMmDd,
  getSelectedDateParts,
  getWeekDatesFromDateParts,
  getWeekDatesForSelectedDate,
  getOptimalEndpointForTimeRange,
};
