import axios from 'axios';

export interface WeatherFunctionData {
  location: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  conditions: string;
  precipitation: number;
  visibility: number;
  alerts: string[];
  safetyRecommendations: string[];
}

/**
 * Weather function that Gemini can call automatically during checklist analysis
 * Uses Open-Meteo API to get real-time weather data for the job site
 */
export async function getWeatherForSafetyAnalysis(location: string): Promise<WeatherFunctionData> {
  try {
    // First, geocode the location to get coordinates
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;
    const geocodeResponse = await axios.get(geocodeUrl);
    
    if (!geocodeResponse.data.results || geocodeResponse.data.results.length === 0) {
      throw new Error(`Location not found: ${location}`);
    }
    
    const { latitude, longitude, name, admin1 } = geocodeResponse.data.results[0];
    
    // Get current weather and forecast
    const weatherUrl = `https://api.open-meteo.com/v1/forecast`;
    const params = {
      latitude,
      longitude,
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,precipitation,visibility',
      hourly: 'wind_speed_10m,precipitation_probability,visibility',
      daily: 'weather_code,precipitation_sum,wind_speed_10m_max',
      timezone: 'auto',
      temperature_unit: 'fahrenheit',
      wind_speed_unit: 'mph',
      precipitation_unit: 'inch'
    };
    
    const weatherResponse = await axios.get(weatherUrl, { params });
    const current = weatherResponse.data.current;
    const hourly = weatherResponse.data.hourly;
    const daily = weatherResponse.data.daily;
    
    // Generate safety recommendations based on conditions
    const safetyRecommendations: string[] = [];
    const alerts: string[] = [];
    
    // Wind speed analysis
    if (current.wind_speed_10m >= 25) {
      alerts.push('HIGH WIND WARNING');
      safetyRecommendations.push('Suspend all crane operations and glass installation work');
      safetyRecommendations.push('Secure loose materials and equipment');
    } else if (current.wind_speed_10m >= 15) {
      alerts.push('MODERATE WIND CAUTION');
      safetyRecommendations.push('Exercise extreme caution with large glass panels');
      safetyRecommendations.push('Consider postponing work with lightweight materials');
    }
    
    // Temperature analysis
    if (current.temperature_2m <= 32) {
      alerts.push('FREEZING CONDITIONS');
      safetyRecommendations.push('Implement cold weather safety protocols');
      safetyRecommendations.push('Monitor workers for hypothermia and frostbite');
    } else if (current.temperature_2m >= 90) {
      alerts.push('HIGH HEAT RISK');
      safetyRecommendations.push('Implement heat stress prevention measures');
      safetyRecommendations.push('Increase break frequency and hydration');
    }
    
    // Precipitation analysis
    if (current.precipitation > 0.1) {
      alerts.push('PRECIPITATION PRESENT');
      safetyRecommendations.push('Suspend electrical work and outdoor operations');
      safetyRecommendations.push('Implement slip and fall prevention measures');
    }
    
    // Visibility analysis
    if (current.visibility < 3280) { // Less than 1 km
      alerts.push('LOW VISIBILITY');
      safetyRecommendations.push('Restrict crane and equipment operations');
      safetyRecommendations.push('Enhance communication protocols');
    }
    
    return {
      location: `${name}, ${admin1}`,
      temperature: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: getWindDirection(current.wind_direction_10m),
      conditions: getWeatherCondition(current.weather_code),
      precipitation: current.precipitation || 0,
      visibility: Math.round(current.visibility / 5280 * 10) / 10, // Convert to miles
      alerts,
      safetyRecommendations
    };
    
  } catch (error) {
    console.error('Weather function error:', error);
    
    // Return default safe response if weather API fails
    return {
      location: location,
      temperature: 70,
      humidity: 50,
      windSpeed: 5,
      windDirection: 'Unknown',
      conditions: 'Weather data unavailable',
      precipitation: 0,
      visibility: 10,
      alerts: ['WEATHER DATA UNAVAILABLE'],
      safetyRecommendations: [
        'Weather conditions unknown - proceed with extreme caution',
        'Visually assess current conditions before starting work',
        'Monitor conditions frequently throughout the workday'
      ]
    };
  }
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  
  return conditions[code] || 'Unknown conditions';
}