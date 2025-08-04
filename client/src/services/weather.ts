import axios from 'axios';

// Using wttr.in which provides reliable weather data without API key
const BASE_URL = 'https://wttr.in';

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
    // Use wttr.in JSON API for Indianapolis
    const response = await axios.get(`${BASE_URL}/Indianapolis?format=j1`, {
      headers: {
        'User-Agent': 'Safety-Companion-Weather-Widget/1.0'
      }
    });

    const data = response.data;
    const current = data.current_condition[0];
    const nearest = data.nearest_area[0];

    return {
      location: {
        name: nearest.areaName[0].value,
        region: nearest.region[0].value,
        country: nearest.country[0].value,
        localtime: new Date().toISOString()
      },
      current: {
        temp_c: parseInt(current.temp_C),
        temp_f: parseInt(current.temp_F),
        condition: {
          text: current.weatherDesc[0].value,
          icon: getWeatherIcon(current.weatherCode)
        },
        wind_kph: parseInt(current.windspeedKmph),
        wind_dir: current.winddir16Point,
        humidity: parseInt(current.humidity),
        feelslike_c: parseInt(current.FeelsLikeC),
        uv: parseInt(current.uvIndex)
      }
    };
  } catch (error) {
    console.error('Weather API Error:', error);
    console.error('Failed to fetch from wttr.in API, trying Open-Meteo fallback');
    
    // Try Open-Meteo as fallback
    try {
      const lat = 39.7684;
      const lng = -86.1581;
      
      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: lat,
          longitude: lng,
          current: 'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,weather_code',
          timezone: 'America/New_York',
          temperature_unit: 'celsius',
          wind_speed_unit: 'kmh'
        }
      });

      const data = response.data;
      const weatherCode = data.current.weather_code;
      const conditionText = getWeatherCondition(weatherCode);

      return {
        location: {
          name: 'Indianapolis',
          region: 'Indiana',
          country: 'US',
          localtime: new Date().toISOString()
        },
        current: {
          temp_c: Math.round(data.current.temperature_2m),
          temp_f: Math.round((data.current.temperature_2m * 9/5) + 32),
          condition: {
            text: conditionText,
            icon: getWeatherIcon(weatherCode.toString())
          },
          wind_kph: Math.round(data.current.wind_speed_10m),
          wind_dir: getWindDirection(data.current.wind_direction_10m || 0),
          humidity: data.current.relative_humidity_2m,
          feelslike_c: Math.round(data.current.apparent_temperature || data.current.temperature_2m),
          uv: 0
        }
      };
    } catch (fallbackError) {
      console.error('Fallback weather API also failed:', fallbackError);
      throw new Error('Unable to fetch weather data from any source');
    }
  }
};

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return directions[index];
};

const getWeatherIcon = (code: string | number): string => {
  const codeStr = code.toString();
  
  // Map wttr.in weather codes to icons
  const iconMap: Record<string, string> = {
    '113': '☀️', // Sunny/Clear
    '116': '⛅', // Partly cloudy
    '119': '☁️', // Cloudy
    '122': '☁️', // Overcast
    '143': '🌫️', // Mist/Fog
    '176': '🌦️', // Patchy rain possible
    '179': '🌦️', // Patchy snow possible
    '182': '🌧️', // Patchy sleet possible
    '185': '🌧️', // Patchy freezing drizzle
    '200': '⛈️', // Thundery outbreaks possible
    '227': '❄️', // Blowing snow
    '230': '❄️', // Blizzard
    '248': '🌫️', // Fog
    '260': '🌫️', // Freezing fog
    '263': '🌦️', // Patchy light drizzle
    '266': '🌧️', // Light drizzle
    '281': '🌧️', // Freezing drizzle
    '284': '🌧️', // Heavy freezing drizzle
    '293': '🌦️', // Patchy light rain
    '296': '🌧️', // Light rain
    '299': '🌦️', // Moderate rain at times
    '302': '🌧️', // Moderate rain
    '305': '🌧️', // Heavy rain at times
    '308': '🌧️', // Heavy rain
    '311': '🌧️', // Light freezing rain
    '314': '🌧️', // Moderate or heavy freezing rain
    '317': '🌧️', // Light sleet
    '320': '🌧️', // Moderate or heavy sleet
    '323': '🌨️', // Patchy light snow
    '326': '❄️', // Light snow
    '329': '🌨️', // Patchy moderate snow
    '332': '❄️', // Moderate snow
    '335': '🌨️', // Patchy heavy snow
    '338': '❄️', // Heavy snow
    '350': '🌧️', // Ice pellets
    '353': '🌦️', // Light rain shower
    '356': '🌧️', // Moderate or heavy rain shower
    '359': '🌧️', // Torrential rain shower
    '362': '🌧️', // Light sleet showers
    '365': '🌧️', // Moderate or heavy sleet showers
    '368': '🌨️', // Light snow showers
    '371': '❄️', // Moderate or heavy snow showers
    '374': '🌧️', // Light showers of ice pellets
    '377': '🌧️', // Moderate or heavy showers of ice pellets
    '386': '⛈️', // Patchy light rain with thunder
    '389': '⛈️', // Moderate or heavy rain with thunder
    '392': '⛈️', // Patchy light snow with thunder
    '395': '⛈️', // Moderate or heavy snow with thunder
  };
  
  return iconMap[codeStr] || '⛅'; // Default to partly cloudy
};

const getWeatherCondition = (code: number): string => {
  const conditionMap: Record<number, string> = {
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
  
  return conditionMap[code] || 'Unknown';
};