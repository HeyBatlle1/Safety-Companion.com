import axios from 'axios';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  alerts?: string[];
}

export class WeatherAPIClient {
  private baseUrl = 'https://api.open-meteo.com/v1';

  async getCurrentConditions(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
          timezone: 'auto'
        }
      });

      const { current } = response.data;
      
      return {
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        conditions: this.getConditionText(current.weather_code),
        alerts: [] // Open-meteo doesn't provide alerts in free tier
      };
    } catch (error) {
      
      throw new Error('Failed to fetch weather data');
    }
  }

  async getForecast(latitude: number, longitude: number): Promise<WeatherData[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          latitude,
          longitude,
          hourly: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
          timezone: 'auto',
          forecast_days: 1
        }
      });

      const { hourly } = response.data;
      
      return hourly.time.map((time: string, index: number) => ({
        temperature: hourly.temperature_2m[index],
        humidity: hourly.relative_humidity_2m[index],
        windSpeed: hourly.wind_speed_10m[index],
        conditions: this.getConditionText(hourly.weather_code[index])
      }));
    } catch (error) {
      
      throw new Error('Failed to fetch forecast data');
    }
  }

  private getConditionText(code: number): string {
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
    
    return conditions[code] || 'Unknown';
  }
}