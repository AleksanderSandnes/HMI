# Solar Power Dashboard - Mock Data Mode

This README explains how to use the Solar Power Dashboard with mock data for development, testing, and demonstration purposes.

## Overview

The Solar Power Dashboard now supports two data modes:

1. **Real API Mode** - Fetches data from the actual Growatt API
2. **Mock Data Mode** - Uses realistic simulated data for reliable testing and development

## Running with Mock Data

### Quick Start Commands

To run the application with mock data, use any of these commands:

```bash
# Web with mock data
npm run web:mock

# Mobile (Android) with mock data
npm run android:mock

# Mobile (iOS) with mock data
npm run ios:mock

# Start development server with mock data
npm run start:mock
```

### Regular Commands (Real API)

For production or real API testing:

```bash
# Web with real API
npm run web

# Mobile with real API
npm run android
npm run ios

# Regular development server
npm start
```

## Features Enhanced

### 1. Power Generation Chart Enhancements

#### Hover Effects (Web)

- **Line Chart (Hourly)**: Hover over data points to see exact power generation and time
- **Sophisticated Tooltips**: Show precise values with clean visual presentation
- **Interactive Dots**: Visual indicators that appear on hover

#### Touch Effects (Mobile)

- **Touch Sliding**: Drag finger across chart to see data points
- **Touch Tooltips**: Touch and hold to see values at specific points

#### Chart Types by Time Range

- **Hourly**: Line chart with smooth curves and hover effects
- **Daily**: Bar chart showing hourly breakdown (every hour displayed on X-axis)
- **Weekly**: Bar chart with daily aggregation
- **Monthly**: Bar chart with monthly data (styled like Growatt dashboard)
- **Yearly**: Bar chart showing yearly totals

#### Improved Styling

- **Larger Font Sizes**: Enhanced readability for both X and Y axis labels
- **Better Stroke Width**: Thicker lines for improved visibility
- **Professional Gradients**: Production-quality visual styling

### 2. Data Accuracy & Metrics

#### Dynamic Labels

- **Time Range Aware**: Labels change based on selected time period
  - Hourly: "This Hour" / "Total"
  - Daily: "Today" / "Total"
  - Weekly: "This Week" / "Total"
  - Monthly: "This Month" / "Total"
  - Yearly: "This Year" / "Total"

#### Realistic Mock Data

- **Seasonal Variations**: Solar production varies by time of year
- **Time-of-Day Curves**: Realistic bell curves for daily solar generation
- **Weather Simulation**: Random variations simulating cloud cover
- **Progressive Enhancement**: Real API data overlays mock data when available

### 3. Mobile Responsiveness

#### Tab Bar Fixes

- **Icon-Only Mobile**: Clean icons without text labels on mobile devices
- **Responsive Sizing**: Different icon sizes for mobile vs desktop
- **Proper Spacing**: Equal distribution and alignment across devices
- **Shortened Labels**: Condensed text for smaller screens when labels are shown

#### Date Selector

- **Centered Text**: Quick selection buttons now have properly centered text
- **Touch-Friendly**: Larger touch targets for mobile devices

## Mock Data Features

### Realistic Data Generation

The mock data service provides:

- **Hourly Data**: 48 data points per day (30-minute intervals)
- **Daily Data**: 24 hourly averages
- **Weekly Data**: 7 days of aggregated daily data
- **Monthly Data**: 12 months of seasonal variation
- **Yearly Data**: 5 years of historical totals

### Solar Generation Simulation

- **Daylight Hours**: Power generation only during 6 AM - 6 PM
- **Bell Curve Distribution**: Peak generation around noon
- **Seasonal Adjustment**: Higher generation in summer months
- **Random Variation**: Realistic fluctuations (weather, clouds)
- **Zero Night Generation**: No power generation during night hours

### Revenue Calculation

- **Dynamic Pricing**: 0.95 NOK per kWh
- **Time-Period Aware**: Accurate calculations for each time range
- **Cumulative Totals**: Realistic lifetime generation totals

## Environment Configuration

### Automatic Detection

The system automatically detects which mode to use based on:

1. **Environment Variable**: `EXPO_PUBLIC_USE_MOCK_DATA=true`
2. **Development Mode**: Fallback to mock data if APIs fail
3. **Configuration**: Easy switching between modes

### Console Logging

When running, check the console for:

```
[DataService] Environment: development, Mock Data: ON
[DataService] Using mock data (configured)
[Growatt] Data fetched from mock
```

## Development Benefits

### Reliable Testing

- **No API Dependencies**: Work offline or with unreliable connections
- **Consistent Data**: Same data every time for UI testing
- **Fast Loading**: Instant data generation without network delays

### Feature Development

- **All Time Ranges**: Test weekly/monthly/yearly views without waiting
- **Edge Cases**: Simulate various data scenarios
- **UI Polish**: Focus on visual improvements without API complexity

### Demo/Presentation Mode

- **Impressive Visuals**: Realistic data that looks professional
- **Reliable Performance**: No risk of API failures during demonstrations
- **Complete Features**: All charts and metrics work perfectly

## Configuration Details

### Environment Variables

```bash
# Enable mock data mode
EXPO_PUBLIC_USE_MOCK_DATA=true

# Disable mock data (use real API)
EXPO_PUBLIC_USE_MOCK_DATA=false
```

### Fallback Strategy

The system uses a smart fallback approach:

1. **Check Configuration**: Use mock data if explicitly enabled
2. **Try Real API**: Attempt to fetch from Growatt API
3. **Automatic Fallback**: Switch to mock data if API fails
4. **User Notification**: Console logs indicate data source

## Technical Architecture

### Data Service Layer

```typescript
// Unified data fetching
fetchSolarData(timespan, date, isMobile).then((response) => {
  // response.source: 'mock' | 'api' | 'fallback'
  // response.chartData: Ready for PowerProductionChart
  // response.metrics: Calculated for CombinedMetricsCard
});
```

### Mock Data Service

```typescript
// Generate realistic data
getMockSolarData(timespan, date, isMobile)
  .returns({
    chartData: { labels, datasets },
    metrics: { currentPeriod, total, revenue },
    rawData: SolarDataPoint[]
  })
```

## Troubleshooting

### Mock Data Not Loading

1. Check console for environment logs
2. Verify `cross-env` is installed: `npm install cross-env`
3. Use explicit commands: `npm run web:mock`

### Real API Issues

1. Check environment variables for Growatt credentials
2. Verify network connectivity
3. System will automatically fallback to mock data

### Chart Issues

1. Hover effects only work on web
2. Touch effects only work on mobile
3. Bar charts used for daily/weekly/monthly/yearly
4. Line charts used for hourly data

## Future Enhancements

### Planned Features

- **Historical Data Import**: Load real data into mock service
- **Custom Scenarios**: Configure specific weather/generation patterns
- **A/B Testing**: Compare mock vs real data side by side
- **Export Functionality**: Save mock data for external use

This mock data system ensures a robust, professional, and reliable development and demonstration experience for the Solar Power Dashboard.
