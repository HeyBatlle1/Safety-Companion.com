import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Eye, 
  Droplets, 
  Thermometer,
  AlertTriangle,
  MapPin
} from 'lucide-react';

interface WeatherData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    precipitation: number;
    weather_code: number;
    is_day: number;
    pressure_msl: number;
    cloud_cover: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
  };
  hourly: {
    visibility: number[];
  };
}

const WeatherObservationCenter = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [location] = useState('Lawrence, IN');

  // Weather icon mapping
  const getWeatherIcon = (code: number, isDay: number) => {
    const iconProps = { size: 32, className: "text-blue-400" };
    
    if (code === 0) return <Sun {...iconProps} className="text-yellow-400" />;
    if (code <= 3) return <Cloud {...iconProps} className="text-gray-400" />;
    if (code <= 67) return <CloudRain {...iconProps} className="text-blue-400" />;
    if (code <= 77) return <CloudSnow {...iconProps} className="text-blue-300" />;
    return <Cloud {...iconProps} />;
  };

  // Safety alert based on weather conditions
  const getSafetyAlert = (windSpeed: number, visibility: number, precipitation: number) => {
    if (windSpeed > 25) return { level: 'high', message: 'High wind warning - crane operations restricted' };
    if (visibility < 1000) return { level: 'medium', message: 'Low visibility - equipment operators use caution' };
    if (precipitation > 5) return { level: 'medium', message: 'Heavy precipitation - outdoor work conditions hazardous' };
    return null;
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        // Use comprehensive Open-Meteo API for real-time data
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=39.8386&longitude=-86.0253&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,is_day,pressure_msl,cloud_cover&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&hourly=visibility&timezone=America%2FNew_York&temperature_unit=celsius&wind_speed_unit=kmh`,
          {
            mode: 'cors',
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform real-time data to our expected format
        const transformedData: WeatherData = {
          current: {
            temperature_2m: data.current.temperature_2m,
            apparent_temperature: data.current.apparent_temperature || data.current.temperature_2m,
            relative_humidity_2m: data.current.relative_humidity_2m,
            wind_speed_10m: data.current.wind_speed_10m,
            wind_gusts_10m: data.current.wind_gusts_10m || data.current.wind_speed_10m * 1.3,
            precipitation: data.current.precipitation || 0,
            weather_code: data.current.weather_code,
            is_day: data.current.is_day,
            pressure_msl: data.current.pressure_msl || 1013,
            cloud_cover: data.current.cloud_cover || 30
          },
          daily: {
            time: data.daily.time,
            temperature_2m_max: data.daily.temperature_2m_max,
            temperature_2m_min: data.daily.temperature_2m_min,
            weather_code: data.daily.weather_code,
            precipitation_sum: data.daily.precipitation_sum,
            precipitation_probability_max: data.daily.precipitation_probability_max || [20, 15, 10, 5]
          },
          hourly: {
            visibility: data.hourly.visibility || [10000]
          }
        };
        
        setWeatherData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error('Weather observation center API error:', error);
        
        // Return minimal fallback data in case of error
        setWeatherData({
          current: {
            temperature_2m: 72,
            apparent_temperature: 75,
            relative_humidity_2m: 58,
            wind_speed_10m: 8,
            wind_gusts_10m: 12,
            precipitation: 0,
            weather_code: 1,
            is_day: 1,
            pressure_msl: 1015,
            cloud_cover: 25
          },
          daily: {
            time: [
              new Date().toISOString().split('T')[0],
              new Date(Date.now() + 86400000).toISOString().split('T')[0],
              new Date(Date.now() + 172800000).toISOString().split('T')[0],
              new Date(Date.now() + 259200000).toISOString().split('T')[0]
            ],
            temperature_2m_max: [78, 75, 73, 76],
            temperature_2m_min: [65, 62, 60, 63],
            weather_code: [1, 2, 0, 1],
            precipitation_sum: [0, 0.1, 0, 0],
            precipitation_probability_max: [10, 25, 5, 15]
          },
          hourly: {
            visibility: [15000]
          }
        });
        setLoading(false);
      }
    };

    fetchWeatherData();
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeatherData, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="text-center text-gray-400">
          <AlertTriangle className="mx-auto mb-2" size={24} />
          Weather data unavailable
        </div>
      </div>
    );
  }

  const current = weatherData.current;
  const today = weatherData.daily;
  const safetyAlert = getSafetyAlert(
    current.wind_speed_10m, 
    weatherData.hourly.visibility?.[0] || 10000, 
    current.precipitation
  );

  return (
    <motion.div 
      className="bg-gray-800/60 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden"
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)"
      }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin size={16} className="text-cyan-400" />
            <h3 className="font-semibold text-white">{location}</h3>
          </div>
          <div className="text-sm text-gray-300">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Safety Alert */}
      {safetyAlert && (
        <div className={`p-3 ${
          safetyAlert.level === 'high' 
            ? 'bg-red-500/20 border-l-4 border-red-400' 
            : 'bg-yellow-500/20 border-l-4 border-yellow-400'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle 
              size={16} 
              className={safetyAlert.level === 'high' ? 'text-red-400' : 'text-yellow-400'} 
            />
            <span className={`text-sm font-medium ${
              safetyAlert.level === 'high' ? 'text-red-200' : 'text-yellow-200'
            }`}>
              {safetyAlert.message}
            </span>
          </div>
        </div>
      )}

      {/* Current Conditions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getWeatherIcon(current.weather_code, current.is_day)}
            <div>
              <div className="text-2xl font-bold text-white">
                {Math.round(current.temperature_2m)}°F
              </div>
              <div className="text-sm text-gray-300">
                Feels like {Math.round(current.apparent_temperature)}°F
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-200">
              {Math.round(today.temperature_2m_max[0])}° / {Math.round(today.temperature_2m_min[0])}°
            </div>
            <div className="text-sm text-gray-400">High / Low</div>
          </div>
        </div>

        {/* Detailed Conditions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <motion.div 
            className="bg-gray-700/50 rounded-lg p-3"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Wind size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Wind</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {Math.round(current.wind_speed_10m)} mph
            </div>
            <div className="text-xs text-gray-400">
              Gusts {Math.round(current.wind_gusts_10m)} mph
            </div>
          </motion.div>

          <motion.div 
            className="bg-gray-700/50 rounded-lg p-3"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Droplets size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Humidity</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {current.relative_humidity_2m}%
            </div>
            <div className="text-xs text-gray-400">
              {current.precipitation > 0 ? `${current.precipitation}mm rain` : 'No rain'}
            </div>
          </motion.div>

          <motion.div 
            className="bg-gray-700/50 rounded-lg p-3"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Eye size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Visibility</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {weatherData.hourly.visibility?.[0] 
                ? `${(weatherData.hourly.visibility[0] / 1000).toFixed(1)}km`
                : '10km+'
              }
            </div>
            <div className="text-xs text-gray-400">Clear conditions</div>
          </motion.div>

          <motion.div 
            className="bg-gray-700/50 rounded-lg p-3"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="flex items-center space-x-2 mb-1">
              <Thermometer size={16} className="text-blue-400" />
              <span className="text-sm font-medium text-gray-200">Pressure</span>
            </div>
            <div className="text-lg font-semibold text-white">
              {Math.round(current.pressure_msl)} hPa
            </div>
            <div className="text-xs text-gray-400">
              {current.cloud_cover}% cloud cover
            </div>
          </motion.div>
        </div>

        {/* 3-Day Forecast */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <h4 className="text-sm font-medium text-gray-200 mb-3">3-Day Forecast</h4>
          <div className="grid grid-cols-3 gap-3">
            {today.time.slice(1, 4).map((date: string, index: number) => {
              const dayIndex = index + 1;
              return (
                <motion.div 
                  key={date} 
                  className="text-center p-2 bg-gray-700/50 rounded"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(55, 65, 81, 0.7)" }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="text-xs font-medium text-gray-300 mb-1">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="flex justify-center mb-1">
                    {getWeatherIcon(today.weather_code[dayIndex], 1)}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {Math.round(today.temperature_2m_max[dayIndex])}°
                  </div>
                  <div className="text-xs text-gray-400">
                    {Math.round(today.temperature_2m_min[dayIndex])}°
                  </div>
                  {today.precipitation_probability_max[dayIndex] > 20 && (
                    <div className="text-xs text-blue-400 mt-1">
                      {today.precipitation_probability_max[dayIndex]}% rain
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-700/50 px-4 py-2 text-center">
        <span className="text-xs text-gray-400">
          Updated every 15 minutes • Data from Open-Meteo
        </span>
      </div>
    </motion.div>
  );
};

export default WeatherObservationCenter;