import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Thermometer, Wind, Droplets } from 'lucide-react';
import { getCurrentWeather, WeatherData } from '../../services/weather';

const WeatherWidget = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCurrentWeather('Indianapolis,Indiana');
        setWeather(data);
        setLastUpdated(new Date());
        console.log('Weather data updated successfully:', data);
      } catch (err) {
        console.error('Weather API error:', err);
        setError(`Weather data unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh weather data every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Cloud className="w-6 h-6 text-gray-400" />
            <div>
              <div className="text-gray-300">
                Weather data unavailable
              </div>
              <div className="text-sm text-gray-400">
                Indianapolis, IN
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <Thermometer className="w-6 h-6 text-blue-400" />
          <div>
            <div className="text-2xl font-bold text-white">
              {Math.round(weather.current.temp_f)}°F / {Math.round(weather.current.temp_c)}°C
            </div>
            <div className="text-sm text-gray-400">
              Indianapolis, IN
            </div>
            {lastUpdated && (
              <div className="text-xs text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Cloud className="w-6 h-6 text-blue-400" />
          <span className="text-white">
            {weather.current.condition.text}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-blue-500/10">
        <div className="flex items-center space-x-2">
          <Wind className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">
            {Math.round(weather.current.wind_kph * 0.621371)} mph {weather.current.wind_dir}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">
            {weather.current.humidity}% humidity
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default WeatherWidget;