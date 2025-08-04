import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Target, 
  AlertCircle, 
  Loader as LoaderIcon,
  Map,
  RefreshCw
} from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

const SimpleCityMap: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState('');

  // Indianapolis center coordinates
  const indianapolisCenter: Location = {
    lat: 39.7684,
    lng: -86.1581,
    name: 'Indianapolis, IN'
  };

  useEffect(() => {
    // Generate default map centered on Indianapolis
    generateMapUrl(indianapolisCenter);
  }, []);

  const generateMapUrl = (location: Location, dest?: string) => {
    const center = `${location.lat},${location.lng}`;
    const zoom = 12;
    const size = '800x600';
    
    // Using OpenStreetMap-based service as fallback
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${location.lng-0.1},${location.lat-0.1},${location.lng+0.1},${location.lat+0.1}&layer=mapnik&marker=${location.lat},${location.lng}`;
    
    setMapUrl(osmUrl);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Your Location'
        };
        setCurrentLocation(location);
        generateMapUrl(location);
        setIsLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location. Using Indianapolis as default.');
        setCurrentLocation(indianapolisCenter);
        generateMapUrl(indianapolisCenter);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const calculateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) {
      setError('Please enter a destination');
      return;
    }

    const baseLocation = currentLocation || indianapolisCenter;
    
    // Create Google Maps directions URL
    const mapsUrl = `https://www.google.com/maps/dir/${baseLocation.lat},${baseLocation.lng}/${encodeURIComponent(destination)}`;
    
    // Open in new tab
    window.open(mapsUrl, '_blank');
  };

  const getDistanceEstimate = (destination: string): string => {
    // Simple distance estimation for common Indianapolis destinations
    const distances: { [key: string]: string } = {
      'downtown': '15 miles',
      'airport': '12 miles', 
      'university': '8 miles',
      'mall': '10 miles'
    };
    
    const dest = destination.toLowerCase();
    for (const [key, distance] of Object.entries(distances)) {
      if (dest.includes(key)) {
        return distance;
      }
    }
    return 'Distance varies';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Control Panel */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
        <div className="space-y-4">
          {/* Location Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">
                  {currentLocation ? currentLocation.name || 'Current Location' : 'Indianapolis, IN'}
                </p>
                <p className="text-sm text-gray-400">
                  {currentLocation 
                    ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                    : `${indianapolisCenter.lat}, ${indianapolisCenter.lng}`}
                </p>
              </div>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <LoaderIcon className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              <span>Get Location</span>
            </motion.button>
          </div>

          {/* Route Planning */}
          <form onSubmit={calculateRoute} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Plan a trip to:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter destination address or landmark..."
                  className="flex-1 bg-slate-700/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Get Directions</span>
                </motion.button>
              </div>
            </div>

            {destination && (
              <div className="flex items-center space-x-4 p-3 bg-slate-700/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-300">Estimated distance:</p>
                  <p className="text-blue-400 font-medium">{getDistanceEstimate(destination)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">Travel mode:</p>
                  <p className="text-white">Driving</p>
                </div>
              </div>
            )}
          </form>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-orange-400" />
              <p className="text-orange-300 text-sm">{error}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Map Display */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Map className="w-5 h-5 text-blue-400" />
              <span>Interactive Map</span>
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Live Map</span>
            </div>
          </div>
        </div>
        
        <div className="relative h-96 bg-slate-700/30">
          {mapUrl ? (
            <iframe
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Map className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Downtown Indy', search: 'downtown indianapolis' },
          { name: 'Indy Airport', search: 'indianapolis airport' },
          { name: 'Lucas Oil Stadium', search: 'lucas oil stadium indianapolis' },
          { name: 'Indianapolis Motor Speedway', search: 'indianapolis motor speedway' }
        ].map((location, index) => (
          <motion.button
            key={location.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setDestination(location.search);
              const mapsUrl = `https://www.google.com/maps/dir/${currentLocation?.lat || indianapolisCenter.lat},${currentLocation?.lng || indianapolisCenter.lng}/${encodeURIComponent(location.search)}`;
              window.open(mapsUrl, '_blank');
            }}
            className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:border-blue-500/30 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium text-sm">{location.name}</p>
                <p className="text-gray-400 text-xs">Quick directions</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default SimpleCityMap;