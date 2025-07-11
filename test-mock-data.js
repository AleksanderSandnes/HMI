const { getMockSolarData } = require('./app/services/mockDataService.ts');

console.log('Testing mock data service...');

// Test different timespans
['hourly', 'daily', 'weekly', 'monthly', 'yearly'].forEach((timespan) => {
  try {
    const result = getMockSolarData(timespan, '2025-07-10');
    console.log(
      `${timespan}: ${result.chartData.labels.length} labels, ${result.chartData.datasets[0].data.length} data points`
    );
    console.log(
      `  Sample labels: ${result.chartData.labels.slice(0, 5).join(', ')}`
    );
    console.log(
      `  Sample data: ${result.chartData.datasets[0].data.slice(0, 5).join(', ')}`
    );
    console.log('');
  } catch (error) {
    console.error(`Error with ${timespan}:`, error.message);
  }
});
