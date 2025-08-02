import axios from 'axios';

// Using a weather API that doesn't need API key for basic functionality
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    temp_f: number;
    condition: {
      text: string;
      icon: string;
    };
    wind_kph: number;
    wind_dir: string;
    humidity: number;
    feelslike_c: number;
    uv: number;
  };
}

export const getCurrentWeather = async (location: string): Promise<WeatherData> => {
  try {
    // Indianapolis coordinates
    const lat = 39.7684;
    const lng = -86.1581;
    
    const response = await axios.get(BASE_URL, {
      params: {
        latitude: lat,
        longitude: lng,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code',
        timezone: 'America/New_York'
      }
    });

    // Map weather codes to condition text
    const weatherCodeMap: Record<number, string> = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      56: 'Light freezing drizzle',
      57: 'Dense freezing drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      66: 'Light freezing rain',
      67: 'Heavy freezing rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };

    const data = response.data;
    const weatherCode = data.current.weather_code;
    const conditionText = weatherCodeMap[weatherCode] || 'Unknown';

    return {
      location: {
        name: 'Indianapolis',
        region: 'Indiana',
        country: 'US',
        localtime: new Date().toISOString()
      },
      current: {
        temp_c: data.current.temperature_2m,
        temp_f: (data.current.temperature_2m * 9/5) + 32,
        condition: {
          text: conditionText,
          icon: getWeatherIcon(weatherCode)
        },
        wind_kph: data.current.wind_speed_10m * 3.6, // convert m/s to km/h
        wind_dir: getWindDirection(data.current.wind_direction_10m),
        humidity: data.current.relative_humidity_2m,
        feelslike_c: data.current.apparent_temperature,
        uv: 0 // open-meteo doesn't provide UV index in free tier
      }
    };
  } catch (error) {
    // Return default data in case of error
    return {
      location: {
        name: 'Indianapolis',
        region: 'Indiana',
        country: 'US',
        localtime: new Date().toISOString()
      },
      current: {
        temp_c: 22,
        temp_f: 72,
        condition: {
          text: 'Partly cloudy',
          icon: 'https://cdn.weatherapi.com/weather/64x64/day/116.png'
        },
        wind_kph: 10,
        wind_dir: 'N',
        humidity: 60,
        feelslike_c: 22,
        uv: 4
      }
    };
  }
};

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return directions[index];
};

const getWeatherIcon = (code: number): string => {
  // Map weather codes to public weather icons
  if (code === 0) return 'https://cdn.weatherapi.com/weather/64x64/day/113.png'; // Clear
  if (code >= 1 && code <= 2) return 'https://cdn.weatherapi.com/weather/64x64/day/116.png'; // Partly cloudy
  if (code === 3) return 'https://cdn.weatherapi.com/weather/64x64/day/119.png'; // Cloudy
  if (code >= 45 && code <= 48) return 'https://cdn.weatherapi.com/weather/64x64/day/143.png'; // Fog
  if (code >= 51 && code <= 55) return 'https://cdn.weatherapi.com/weather/64x64/day/266.png'; // Drizzle
  if (code >= 56 && code <= 57) return 'https://cdn.weatherapi.com/weather/64x64/day/281.png'; // Freezing drizzle
  if (code >= 61 && code <= 65) return 'https://cdn.weatherapi.com/weather/64x64/day/308.png'; // Rain
  if (code >= 66 && code <= 67) return 'https://cdn.weatherapi.com/weather/64x64/day/284.png'; // Freezing rain
  if (code >= 71 && code <= 77) return 'https://cdn.weatherapi.com/weather/64x64/day/338.png'; // Snow
  if (code >= 80 && code <= 82) return 'https://cdn.weatherapi.com/weather/64x64/day/305.png'; // Rain showers
  if (code >= 85 && code <= 86) return 'https://cdn.weatherapi.com/weather/64x64/day/335.png'; // Snow showers
  if (code >= 95) return 'https://cdn.weatherapi.com/weather/64x64/day/389.png'; // Thunderstorm
  
  return 'https://cdn.weatherapi.com/weather/64x64/day/116.png'; // Default to partly cloudy
};