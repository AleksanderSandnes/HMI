import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  TemperatureDataItem,
  WindSpeedDataItem,
  WindDirectionDataItem,
  PrecipDataItem,
  PressureDataItem,
  SolarRadiationDataItem,
  UvIndexDataItem,
} from '../interface/weatherInterface';
import { ChartData } from '../components/charts/weatherChart';
import {
  getHistoricalWeatherData,
  getHourlyWeatherData,
  getDailyWeatherData,
  getWeeklyWeatherData,
  getWeeklyHourlyWeatherData,
} from '../services/weatherApiService';
import { getDataMode } from '../services/dataConfig';

const useHistoricalWeatherData = (
  formattedPickerDate: string,
  timespan: string = 'daily'
) => {
  const [weatherData, setWeatherData] = useState<ChartData>({
    labels: [],
    datasets: [],
  });
  const [dataType, setDataType] = useState<string>('temperature');
  const [historicalPickerDate, setHistoricalPickerDate] =
    useState<string>(formattedPickerDate);
  const isMobile = useWindowDimensions().width <= 768;

  // Helper function to calculate week start and end dates
  const calculateWeekDates = (dateString: string) => {
    // Parse YYYYMMDD format correctly (same as backend)
    const year = parseInt(dateString.slice(0, 4));
    const month = parseInt(dateString.slice(4, 6)) - 1; // Month is 0-indexed
    const day = parseInt(dateString.slice(6, 8));

    console.log(
      `[HistoricalWeatherHook] Parsing date: ${dateString} -> Year=${year}, Month=${month + 1}, Day=${day}`
    );

    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek); // Go to Sunday of this week

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Saturday of this week

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    const startDateFormatted = formatDate(startDate);
    const endDateFormatted = formatDate(endDate);

    console.log(
      `[HistoricalWeatherHook] Week calculation: ${dateString} -> ${startDateFormatted} to ${endDateFormatted}`
    );

    return {
      startDate: startDateFormatted,
      endDate: endDateFormatted,
      weekDates: Array.from({ length: 7 }, (_, i) => {
        const weekDate = new Date(startDate);
        weekDate.setDate(startDate.getDate() + i);
        return formatDate(weekDate);
      }),
    };
  };

  const fetchDailyWeatherData = async (
    formattedPickerDate: string,
    timespan: string = 'daily'
  ) => {
    const dataMode = getDataMode();

    console.log(
      `[HistoricalWeatherHook] Fetching historical weather data for ${timespan} in ${dataMode} mode`
    );

    try {
      let json;

      // Use the appropriate API function based on timespan
      switch (timespan) {
        case 'hourly':
          json = await getHourlyWeatherData(formattedPickerDate);
          break;
        case 'weekly':
          // For weekly, calculate the week and get all hourly data for the week
          const { startDate, endDate } =
            calculateWeekDates(formattedPickerDate);
          console.log(
            `[HistoricalWeatherHook] Weekly mode: fetching data for week ${startDate} to ${endDate}`
          );
          json = await getWeeklyHourlyWeatherData(startDate, endDate);
          break;
        case 'daily':
        default:
          json = await getDailyWeatherData(formattedPickerDate);
          break;
      }

      // Handle different data structures based on timespan
      let observations = [];
      if (timespan === 'weekly') {
        // Weekly endpoints return a different structure with all hourly data for the week
        observations = json.weeklyData || json.observations || [];
      } else if (timespan === 'weekly' && json.summaries) {
        // Fallback for weekly endpoints that return summaries array
        observations = json.summaries || [];
      } else {
        // Hourly and daily endpoints return observations array
        observations = json.observations || [];
      }

      if (!observations || observations.length === 0) {
        console.warn(
          `[HistoricalWeatherHook] No data returned for ${timespan} timespan`
        );
        return [];
      }

      console.log(
        `[HistoricalWeatherHook] Successfully fetched ${timespan} weather data in ${dataMode} mode. Records: ${observations.length}`
      );

      // Debug: Log sample data structure for weekly
      if (timespan === 'weekly' && observations.length > 0) {
        console.log(
          `[HistoricalWeatherHook] Sample data structure for ${timespan}:`,
          {
            sampleItem: observations[0],
            metricValues: observations[0].metric,
            tempHigh: observations[0].metric?.tempHigh,
            windspeedHigh: observations[0].metric?.windspeedHigh,
          }
        );
      }

      return observations;
    } catch (error) {
      console.error(
        `[HistoricalWeatherHook] Error fetching ${timespan} weather data in ${dataMode} mode:`,
        error
      );
      return [];
    }
  };

  const formatTemperatureData = (data: TemperatureDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      tempAvg: item.metric.tempAvg,
      dewptAvg: item.metric.dewptAvg,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const tempAvg = formattedData.map((item) => item.tempAvg);
    const dewptAvg = formattedData.map((item) => item.dewptAvg);

    setWeatherData({
      labels,
      datasets: [
        {
          data: tempAvg,
          color: () => `#ff0000`,
          strokeWidth: 3,
        },
        {
          data: dewptAvg,
          color: () => `#329932`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatWindSpeedData = (data: WindSpeedDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      windspeedAvg: item.metric.windspeedAvg,
      windgustAvg: item.metric.windgustAvg,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const windspeedAvg = formattedData.map((item) => item.windspeedAvg);
    const windgustAvg = formattedData.map((item) => item.windgustAvg);

    setWeatherData({
      labels,
      datasets: [
        {
          data: windspeedAvg,
          color: () => `#3b82f6`,
          strokeWidth: 3,
        },
        {
          data: windgustAvg,
          color: () => `#f97316`,
          strokeWidth: 3,
          withDots: true,
        },
      ],
    });
  };

  const formatWindDirectionData = (data: WindDirectionDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      winddirAvg: item.winddirAvg,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const winddirAvg = formattedData.map((item) => item.winddirAvg);

    setWeatherData({
      labels,
      datasets: [
        {
          data: winddirAvg,
          color: () => `#329932`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatPrecipData = (data: PrecipDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      precipRate: item.metric.precipRate,
      precipTotal: item.metric.precipTotal,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const precipRate = formattedData.map((item) => item.precipRate);
    const precipTotal = formattedData.map((item) => item.precipTotal);

    setWeatherData({
      labels,
      datasets: [
        {
          data: precipTotal,
          color: () => `#3b82f6`, // Blue for precipitation total
          strokeWidth: 3,
        },
        {
          data: precipRate,
          color: () => `#10b981`, // Green for precipitation rate
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatPressureData = (data: PressureDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      pressureMax: item.metric.pressureMax,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const pressureMax = formattedData.map((item) => item.pressureMax);

    setWeatherData({
      labels,
      datasets: [
        {
          data: pressureMax,
          color: () => `#000000`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatSolarRadiationData = (data: SolarRadiationDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      solarRadiationHigh: item.solarRadiationHigh,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const solarRadiationHigh = formattedData.map(
      (item) => item.solarRadiationHigh
    );

    setWeatherData({
      labels,
      datasets: [
        {
          data: solarRadiationHigh,
          color: () => `#FF8C00`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatUvIndexData = (data: UvIndexDataItem[]) => {
    const formattedData = data.map((item) => ({
      hour: item.obsTimeLocal,
      uvHigh: item.uvHigh,
    }));

    const labels = formattedData.map((item) => {
      const time = item.hour.split(' ')[1];
      const [hour, minute] = time.split(':').map(Number);

      if (isMobile) {
        return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
      }
      return minute === 59 ? `${hour}:${minute}` : '';
    });

    const uvHigh = formattedData.map((item) => item.uvHigh);

    setWeatherData({
      labels,
      datasets: [
        {
          data: uvHigh,
          color: () => `#8B00FF`,
          strokeWidth: 3,
        },
      ],
    });
  };

  // New formatting functions that handle different time ranges and data structures
  const formatTemperatureDataByTimespan = (data: any[], timespan: string) => {
    console.log(
      `[HistoricalWeatherHook] Formatting temperature data for ${timespan}, records: ${data.length}`
    );

    if (!data || data.length === 0) {
      console.warn(`[HistoricalWeatherHook] No data to format for ${timespan}`);
      setWeatherData({
        labels: [],
        datasets: [],
      });
      return;
    }

    console.log(`[HistoricalWeatherHook] Sample data item:`, data[0]);

    let formattedData: any[] = [];
    let labels: string[] = [];

    try {
      if (timespan === 'hourly') {
        // Hourly data - use obsTimeLocal
        formattedData = data.map((item) => ({
          time: item.obsTimeLocal,
          tempAvg: item.metric?.tempAvg || item.tempHigh || 0,
          dewptAvg: item.metric?.dewptAvg || item.dewptHigh || 0,
        }));

        labels = formattedData.map((item) => {
          const time = item.time.split(' ')[1];
          const [hour, minute] = time.split(':').map(Number);
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        });
      } else if (timespan === 'daily') {
        // Daily data - aggregate by hour
        formattedData = data.map((item) => ({
          time: item.obsTimeLocal,
          tempAvg: item.metric?.tempAvg || item.tempHigh || 0,
          dewptAvg: item.metric?.dewptAvg || item.dewptHigh || 0,
        }));

        labels = formattedData.map((item) => {
          const time = item.time.split(' ')[1];
          return time.slice(0, 5); // HH:MM format
        });
      } else {
        // Weekly - use all hourly data for the week, keep all data points including zero temperatures
        // Sample data every 3 hours to reduce density (8 points per day instead of 24)
        const sampledData = data.filter((item, index) => {
          const date = new Date(item.obsTimeLocal || item.date);
          const hour = date.getHours();
          // Keep data points at 00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h
          return hour % 3 === 0;
        });

        formattedData = sampledData.map((item) => ({
          time: item.obsTimeLocal || item.date,
          tempAvg:
            item.metric?.tempAvg ||
            item.metric?.tempHigh ||
            item.tempHigh ||
            item.tempAvg ||
            0,
          dewptAvg:
            item.metric?.dewptAvg ||
            item.metric?.dewptHigh ||
            item.dewptHigh ||
            item.dewptAvg ||
            0,
          day: item.day || new Date(item.obsTimeLocal).getDay(),
          hour: item.hour || new Date(item.obsTimeLocal).getHours(),
        }));

        // Create compact labels for weekly view - show only day names and key times
        labels = formattedData.map((item, index) => {
          const date = new Date(item.time);
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayName = dayNames[date.getDay()];
          const hour = date.getHours();
          const day = date.getDate();
          const month = date.getMonth() + 1;

          // Show day name at midnight only
          if (hour === 0) {
            return `${dayName} ${month}/${day}`;
          } else if (index % 8 === 0) {
            // Show day marker every 24 hours (8 samples * 3 hours = 24 hours)
            return `${dayName}`;
          }
          return ''; // Empty label for other times
        });

        console.log(
          `[HistoricalWeatherHook] Sampled weekly data: ${data.length} -> ${sampledData.length} records`
        );
      }

      console.log(
        `[HistoricalWeatherHook] Formatted ${formattedData.length} records with ${labels.length} labels`
      );
      console.log(
        `[HistoricalWeatherHook] Sample temp values:`,
        formattedData.slice(0, 3).map((item) => item.tempAvg)
      );
      console.log(`[HistoricalWeatherHook] Sample labels:`, labels.slice(0, 5));

      const tempAvg = formattedData.map((item) => item.tempAvg);
      const dewptAvg = formattedData.map((item) => item.dewptAvg);

      // Validate data before setting
      if (tempAvg.length === 0 || labels.length === 0) {
        console.warn(
          `[HistoricalWeatherHook] Empty data arrays after processing`
        );
        setWeatherData({
          labels: [],
          datasets: [],
        });
        return;
      }

      setWeatherData({
        labels,
        datasets: [
          {
            data: tempAvg,
            color: () => `#ff0000`,
            strokeWidth: 3,
          },
          {
            data: dewptAvg,
            color: () => `#329932`,
            strokeWidth: 3,
          },
        ],
      });
    } catch (error) {
      console.error(
        `[HistoricalWeatherHook] Error formatting temperature data:`,
        error
      );
      setWeatherData({
        labels: [],
        datasets: [],
      });
    }
  };

  const formatWindSpeedDataByTimespan = (data: any[], timespan: string) => {
    let formattedData: any[] = [];
    let labels: string[] = [];

    if (timespan === 'hourly') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        windspeedAvg: item.metric?.windspeedAvg || item.windspeedHigh || 0,
        windgustAvg: item.metric?.windgustAvg || item.windgustHigh || 0,
      }));

      labels = formattedData.map((item) => {
        const time = item.time.split(' ')[1];
        const [hour, minute] = time.split(':').map(Number);
        if (isMobile) {
          return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
        }
        return minute === 59 ? `${hour}:${minute}` : '';
      });
    } else if (timespan === 'daily') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        windspeedAvg: item.metric?.windspeedAvg || item.windspeedHigh || 0,
        windgustAvg: item.metric?.windgustAvg || item.windgustHigh || 0,
      }));

      labels = formattedData.map((item, index) => {
        if (isMobile) {
          return index % 4 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
        }
        return index % 2 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
      });
    } else {
      // Weekly - use all hourly data for the week, keep all data points including zero wind values
      // Sample data every 3 hours to reduce density (8 points per day instead of 24)
      const sampledData = data.filter((item, index) => {
        const date = new Date(item.obsTimeLocal || item.date);
        const hour = date.getHours();
        // Keep data points at 00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h
        return hour % 3 === 0;
      });

      formattedData = sampledData.map((item) => ({
        time: item.obsTimeLocal || item.date,
        windspeedAvg:
          item.metric?.windspeedAvg ||
          item.metric?.windspeedHigh ||
          item.windspeedHigh ||
          item.windspeedAvg ||
          0,
        windgustAvg:
          item.metric?.windgustAvg ||
          item.metric?.windgustHigh ||
          item.windgustHigh ||
          item.windgustAvg ||
          0,
      }));

      // Create compact labels for weekly view
      labels = formattedData.map((item, index) => {
        const date = new Date(item.time);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;

        // Show day name at midnight only
        if (hour === 0) {
          return `${dayName} ${month}/${day}`;
        } else if (index % 8 === 0) {
          return `${dayName}`;
        }
        return '';
      });
    }

    const windspeedAvg = formattedData.map((item) => item.windspeedAvg);
    const windgustAvg = formattedData.map((item) => item.windgustAvg);

    setWeatherData({
      labels,
      datasets: [
        {
          data: windspeedAvg,
          color: () => `#3b82f6`,
          strokeWidth: 3,
        },
        {
          data: windgustAvg,
          color: () => `#f97316`,
          strokeWidth: 3,
          withDots: true,
        },
      ],
    });
  };

  const formatPrecipDataByTimespan = (data: any[], timespan: string) => {
    let formattedData: any[] = [];
    let labels: string[] = [];

    if (timespan === 'hourly' || timespan === 'daily') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        precipRate: item.metric?.precipRate || item.precipRate || 0,
        precipTotal: item.metric?.precipTotal || item.precipTotal || 0,
      }));

      labels = formattedData.map((item, index) => {
        if (timespan === 'hourly') {
          const time = item.time.split(' ')[1];
          const [hour, minute] = time.split(':').map(Number);
          if (isMobile) {
            return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
          }
          return minute === 59 ? `${hour}:${minute}` : '';
        } else {
          if (isMobile) {
            return index % 4 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
          }
          return index % 2 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
        }
      });
    } else {
      // Weekly - use all hourly data for the week, keep all data points including zero precipitation (dry periods)
      // Sample data every 3 hours to reduce density (8 points per day instead of 24)
      const sampledData = data.filter((item, index) => {
        const date = new Date(item.obsTimeLocal || item.date);
        const hour = date.getHours();
        // Keep data points at 00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h
        return hour % 3 === 0;
      });

      formattedData = sampledData.map((item) => ({
        time: item.obsTimeLocal || item.date,
        precipRate: item.metric?.precipRate || item.precipRate || 0,
        precipTotal: item.metric?.precipTotal || item.precipTotal || 0,
      }));

      // Create compact labels for weekly view
      labels = formattedData.map((item, index) => {
        const date = new Date(item.time);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;

        // Show day name with date at midnight, or at day boundaries when midnight is missing
        if (hour === 0) {
          return `${dayName} ${month}/${day}`;
        } else if (index % 8 === 0) {
          // Fallback: show day with date when we don't have midnight data
          return `${dayName} ${month}/${day}`;
        }
        return '';
      });
    }

    const precipTotal = formattedData.map((item) => item.precipTotal);
    const precipRate = formattedData.map((item) => item.precipRate);

    setWeatherData({
      labels,
      datasets: [
        {
          data: precipTotal,
          color: () => `#3b82f6`, // Blue for precipitation total
          strokeWidth: 3,
        },
        {
          data: precipRate,
          color: () => `#10b981`, // Green for precipitation rate
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatPressureDataByTimespan = (data: any[], timespan: string) => {
    let formattedData: any[] = [];
    let labels: string[] = [];

    if (timespan === 'hourly') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        pressureMax: item.metric?.pressureMax || item.pressureMax || 0,
      }));

      labels = formattedData.map((item) => {
        const time = item.time.split(' ')[1];
        const [hour, minute] = time.split(':').map(Number);
        if (isMobile) {
          return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
        }
        return minute === 59 ? `${hour}:${minute}` : '';
      });
    } else if (timespan === 'daily') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        pressureMax: item.metric?.pressureMax || item.pressureMax || 0,
      }));

      labels = formattedData.map((item, index) => {
        if (isMobile) {
          return index % 4 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
        }
        return index % 2 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
      });
    } else {
      // Weekly - use all hourly data for the week, keep all data points including zero pressure values
      // Sample data every 3 hours to reduce density (8 points per day instead of 24)
      const sampledData = data.filter((item, index) => {
        const date = new Date(item.obsTimeLocal || item.date);
        const hour = date.getHours();
        // Keep data points at 00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h
        return hour % 3 === 0;
      });

      formattedData = sampledData.map((item) => ({
        time: item.obsTimeLocal || item.date,
        pressureMax:
          item.metric?.pressureMax ||
          item.pressureMax ||
          item.pressureHigh ||
          0,
      }));

      // Create compact labels for weekly view
      labels = formattedData.map((item, index) => {
        const date = new Date(item.time);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;

        // Show day name at midnight only
        if (hour === 0) {
          return `${dayName} ${month}/${day}`;
        } else if (index % 8 === 0) {
          return `${dayName}`;
        }
        return '';
      });
    }

    const pressureMax = formattedData.map((item) => item.pressureMax);

    setWeatherData({
      labels,
      datasets: [
        {
          data: pressureMax,
          color: () => `#000000`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatSolarRadiationDataByTimespan = (
    data: any[],
    timespan: string
  ) => {
    let formattedData: any[] = [];
    let labels: string[] = [];

    if (timespan === 'hourly') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        solarRadiationHigh: item.solarRadiationHigh || 0,
      }));

      labels = formattedData.map((item) => {
        const time = item.time.split(' ')[1];
        const [hour, minute] = time.split(':').map(Number);
        if (isMobile) {
          return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
        }
        return minute === 59 ? `${hour}:${minute}` : '';
      });
    } else if (timespan === 'daily') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        solarRadiationHigh: item.solarRadiationHigh || 0,
      }));

      labels = formattedData.map((item, index) => {
        if (isMobile) {
          return index % 4 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
        }
        return index % 2 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
      });
    } else {
      // Weekly - use all hourly data for the week, keep all data points including zero solar radiation (nighttime/cloudy periods)
      // Sample data every 3 hours to reduce density (8 points per day instead of 24)
      const sampledData = data.filter((item, index) => {
        const date = new Date(item.obsTimeLocal || item.date);
        const hour = date.getHours();
        // Keep data points at 00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h
        return hour % 3 === 0;
      });

      formattedData = sampledData.map((item) => ({
        time: item.obsTimeLocal || item.date,
        solarRadiationHigh: item.solarRadiationHigh || 0,
      }));

      // Create compact labels for weekly view
      labels = formattedData.map((item, index) => {
        const date = new Date(item.time);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;

        // Show day name with date at midnight, or at day boundaries when midnight is missing
        if (hour === 0) {
          return `${dayName} ${month}/${day}`;
        } else if (index % 8 === 0) {
          // Fallback: show day with date when we don't have midnight data
          return `${dayName} ${month}/${day}`;
        }
        return '';
      });
    }

    const solarRadiationHigh = formattedData.map(
      (item) => item.solarRadiationHigh
    );

    setWeatherData({
      labels,
      datasets: [
        {
          data: solarRadiationHigh,
          color: () => `#FF8C00`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatUvIndexDataByTimespan = (data: any[], timespan: string) => {
    let formattedData: any[] = [];
    let labels: string[] = [];

    if (timespan === 'hourly') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        uvHigh: item.uvHigh || 0,
      }));

      labels = formattedData.map((item) => {
        const time = item.time.split(' ')[1];
        const [hour, minute] = time.split(':').map(Number);
        if (isMobile) {
          return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
        }
        return minute === 59 ? `${hour}:${minute}` : '';
      });
    } else if (timespan === 'daily') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        uvHigh: item.uvHigh || 0,
      }));

      labels = formattedData.map((item, index) => {
        if (isMobile) {
          return index % 4 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
        }
        return index % 2 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
      });
    } else {
      // Weekly - use all hourly data for the week, keep all data points including zero UV (nighttime/cloudy days)
      // Sample data every 3 hours to reduce density (8 points per day instead of 24)
      const sampledData = data.filter((item, index) => {
        const date = new Date(item.obsTimeLocal || item.date);
        const hour = date.getHours();
        // Keep data points at 00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h
        return hour % 3 === 0;
      });

      formattedData = sampledData.map((item) => ({
        time: item.obsTimeLocal || item.date,
        uvHigh: item.uvHigh || 0,
      }));

      // Create compact labels for weekly view
      labels = formattedData.map((item, index) => {
        const date = new Date(item.time);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;

        // Show day name with date at midnight, or at day boundaries when midnight is missing
        if (hour === 0) {
          return `${dayName} ${month}/${day}`;
        } else if (index % 8 === 0) {
          // Fallback: show day with date when we don't have midnight data
          return `${dayName} ${month}/${day}`;
        }
        return '';
      });
    }

    const uvHigh = formattedData.map((item) => item.uvHigh);

    setWeatherData({
      labels,
      datasets: [
        {
          data: uvHigh,
          color: () => `#8B00FF`,
          strokeWidth: 3,
        },
      ],
    });
  };

  const formatWindDirectionDataByTimespan = (data: any[], timespan: string) => {
    let formattedData: any[] = [];
    let labels: string[] = [];

    if (timespan === 'hourly') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        winddirAvg: item.winddirAvg || 0,
      }));

      labels = formattedData.map((item) => {
        const time = item.time.split(' ')[1];
        const [hour, minute] = time.split(':').map(Number);
        if (isMobile) {
          return minute === 59 && hour % 4 === 0 ? `${hour}:${minute}` : '';
        }
        return minute === 59 ? `${hour}:${minute}` : '';
      });
    } else if (timespan === 'daily') {
      formattedData = data.map((item) => ({
        time: item.obsTimeLocal,
        winddirAvg: item.winddirAvg || 0,
      }));

      labels = formattedData.map((item, index) => {
        if (isMobile) {
          return index % 4 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
        }
        return index % 2 === 0 ? item.time.split(' ')[1].slice(0, 5) : '';
      });
    } else {
      // Weekly - use all hourly data for the week, keep all data points including zero wind direction values
      // Sample data every 3 hours to reduce density (8 points per day instead of 24)
      const sampledData = data.filter((item, index) => {
        const date = new Date(item.obsTimeLocal || item.date);
        const hour = date.getHours();
        // Keep data points at 00h, 03h, 06h, 09h, 12h, 15h, 18h, 21h
        return hour % 3 === 0;
      });

      formattedData = sampledData.map((item) => ({
        time: item.obsTimeLocal || item.date,
        winddirAvg: item.winddirAvg || 0,
      }));

      // Create compact labels for weekly view
      labels = formattedData.map((item, index) => {
        const date = new Date(item.time);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = dayNames[date.getDay()];
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;

        // Show day name with date at midnight, or at day boundaries when midnight is missing
        if (hour === 0) {
          return `${dayName} ${month}/${day}`;
        } else if (index % 8 === 0) {
          // Fallback: show day with date when we don't have midnight data
          return `${dayName} ${month}/${day}`;
        }
        return '';
      });
    }

    const winddirAvg = formattedData.map((item) => item.winddirAvg);

    setWeatherData({
      labels,
      datasets: [
        {
          data: winddirAvg,
          color: () => `#329932`,
          strokeWidth: 3,
        },
      ],
    });
  };

  useEffect(() => {
    const dataMode = getDataMode();
    console.log(
      `[HistoricalWeatherHook] Data changed - Date: ${historicalPickerDate}, Type: ${dataType}, Timespan: ${timespan}, Mode: ${dataMode}`
    );

    fetchDailyWeatherData(historicalPickerDate, timespan)
      .then((data) => {
        switch (dataType) {
          case 'temperature':
            formatTemperatureDataByTimespan(data, timespan);
            break;
          case 'windSpeed':
            formatWindSpeedDataByTimespan(data, timespan);
            break;
          case 'windDirection':
            formatWindDirectionDataByTimespan(data, timespan);
            break;
          case 'precip':
            formatPrecipDataByTimespan(data, timespan);
            break;
          case 'pressure':
            formatPressureDataByTimespan(data, timespan);
            break;
          case 'solarRadiation':
            formatSolarRadiationDataByTimespan(data, timespan);
            break;
          case 'uvIndex':
            formatUvIndexDataByTimespan(data, timespan);
            break;
          default:
            formatTemperatureDataByTimespan(data, timespan);
            break;
        }
      })
      .catch((error) => {
        console.error(
          `[HistoricalWeatherHook] Error fetching data in ${dataMode} mode:`,
          error
        );
      });
  }, [historicalPickerDate, dataType, timespan]);

  useEffect(() => {
    setHistoricalPickerDate(formattedPickerDate);
  }, [formattedPickerDate]);

  return {
    weatherData,
    dataType,
    setDataType,
  };
};

export default useHistoricalWeatherData;
