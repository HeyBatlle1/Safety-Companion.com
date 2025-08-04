import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Target, 
  Satellite,
  Map,
  Route,
  Loader as LoaderIcon,
  AlertCircle,
  Eye,
  Layers,
  RefreshCw
} from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Location {
  lat: number;
  lng: number;
}

const GoogleMapsComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [directionsService, setDirectionsService] = useState<any>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);
  const [streetView, setStreetView] = useState<any>(null);
  const [destination, setDestination] = useState('');
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [showStreetView, setShowStreetView] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  // Indianapolis center coordinates
  const indianapolisCenter: Location = {
    lat: 39.7684,
    lng: -86.1581
  };

  useEffect(() => {
    fetchConfigAndLoadMaps();
  }, []);

  const fetchConfigAndLoadMaps = async () => {
    try {
      const response = await fetch('/api/config');
      const config = await response.json();
      
      if (config.googleMapsApiKey) {
        (window as any).__GOOGLE_MAPS_API_KEY__ = config.googleMapsApiKey;
        loadGoogleMaps();
      } else {
        setError('Google Maps API key not available');
        setIsLoading(false);
      }
    } catch (error) {
      setError('Failed to load configuration');
      setIsLoading(false);
    }
  };

  const loadGoogleMaps = () => {
    if (window.google) {
      initializeMap();
      return;
    }

    // Check if script already exists to prevent duplicate loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      setError('Google Maps already loading...');
      setTimeout(() => {
        if (window.google) {
          initializeMap();
        } else {
          setError('Google Maps failed to initialize');
          setIsLoading(false);
        }
      }, 3000);
      return;
    }

    const apiKey = (window as any).__GOOGLE_MAPS_API_KEY__;
    if (!apiKey) {
      setError('Google Maps API key not configured');
      setIsLoading(false);
      return;
    }

    window.initMap = initializeMap;

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=places,geometry&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      setError('Failed to load Google Maps');
      setIsLoading(false);
    };
    
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      const mapOptions = {
        center: indianapolisCenter,
        zoom: 12,
        mapTypeId: mapType,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeControl: true,
      };

      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);

      // Add marker for Indianapolis center
      new window.google.maps.Marker({
        position: indianapolisCenter,
        map: newMap,
        title: 'Indianapolis - Safety Companion HQ',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: '#FFFFFF'
        }
      });

      // Initialize directions service and renderer
      const dirService = new window.google.maps.DirectionsService();
      const dirRenderer = new window.google.maps.DirectionsRenderer({
        map: newMap,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 6,
          strokeOpacity: 0.8
        }
      });

      // Initialize Street View
      const panorama = new window.google.maps.StreetViewPanorama(
        document.createElement('div'),
        {
          position: indianapolisCenter,
          pov: { heading: 34, pitch: 10 },
          visible: false
        }
      );
      newMap.setStreetView(panorama);

      // Add map type change listener
      newMap.addListener('maptypeid_changed', () => {
        setMapType(newMap.getMapTypeId());
      });

      setMap(newMap);
      setDirectionsService(dirService);
      setDirectionsRenderer(dirRenderer);
      setStreetView(panorama);
      setIsLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setCurrentLocation(location);
        
        if (map) {
          map.setCenter(location);
          map.setZoom(16);
          
          // Add marker for current location
          new window.google.maps.Marker({
            position: location,
            map: map,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#10B981',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF'
            }
          });
        }
      },
      (error) => {
        setError('Unable to get your location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!directionsService || !directionsRenderer || !destination.trim()) {
      setError('Please enter a destination');
      return;
    }

    setIsCalculating(true);
    setError(null);

    const origin = currentLocation || indianapolisCenter;

    try {
      const request = {
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      };

      directionsService.route(request, (result: any, status: any) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          
          // Extract route information
          const route = result.routes[0];
          const leg = route.legs[0];
          
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text
          });

          // Fit map to show entire route
          if (map) {
            const bounds = new window.google.maps.LatLngBounds();
            route.overview_path.forEach((point: any) => {
              bounds.extend(point);
            });
            map.fitBounds(bounds);
          }
        } else {
          setError('Could not calculate route to this destination');
        }
        setIsCalculating(false);
      });
    } catch (err) {
      setError('Failed to calculate route');
      setIsCalculating(false);
    }
  };

  const changeMapType = (type: 'roadmap' | 'satellite' | 'hybrid' | 'terrain') => {
    if (map) {
      map.setMapTypeId(type);
      setMapType(type);
    }
  };

  const toggleStreetView = () => {
    if (streetView && map) {
      const newVisibility = !showStreetView;
      setShowStreetView(newVisibility);
      streetView.setVisible(newVisibility);
      
      if (newVisibility) {
        const center = map.getCenter();
        streetView.setPosition(center);
      }
    }
  };

  const clearRoute = () => {
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
    setRouteInfo(null);
    setDestination('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl">
        <div className="text-center">
          <LoaderIcon className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Control Panel */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
        <div className="space-y-4">
          {/* Location and Controls Row */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium">
                  {currentLocation ? 'Current Location' : 'Indianapolis, IN'}
                </p>
                <p className="text-sm text-gray-400">
                  {currentLocation 
                    ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                    : `${indianapolisCenter.lat}, ${indianapolisCenter.lng}`}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={getCurrentLocation}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Target className="w-4 h-4" />
                <span>Get Location</span>
              </button>
              
              <button
                onClick={toggleStreetView}
                className={`p-2 rounded-lg transition-colors ${
                  showStreetView 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
                title="Toggle Street View"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Route Planning */}
          <form onSubmit={calculateRoute} className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination address or landmark..."
                className="flex-1 bg-slate-700/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40"
              />
              <button
                type="submit"
                disabled={isCalculating || !destination.trim()}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2 disabled:opacity-50"
              >
                {isCalculating ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span>Get Directions</span>
              </button>
              {routeInfo && (
                <button
                  onClick={clearRoute}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Route Info */}
            {routeInfo && (
              <div className="flex items-center space-x-6 p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Route className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-300">Distance:</span>
                  <span className="text-white font-medium">{routeInfo.distance}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">Duration:</span>
                  <span className="text-white font-medium">{routeInfo.duration}</span>
                </div>
              </div>
            )}
          </form>

          {/* Map Type Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">View:</span>
            {[
              { type: 'roadmap', icon: Map, label: 'Map' },
              { type: 'satellite', icon: Satellite, label: 'Satellite' },
              { type: 'hybrid', icon: Layers, label: 'Hybrid' },
              { type: 'terrain', icon: Route, label: 'Terrain' }
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => changeMapType(type as any)}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                  mapType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl overflow-hidden">
        <div className="h-96" ref={mapRef} />
      </div>

      {/* Quick Destinations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Downtown Indy', search: 'downtown indianapolis, in' },
          { name: 'Indy Airport', search: 'indianapolis international airport' },
          { name: 'Lucas Oil Stadium', search: 'lucas oil stadium indianapolis' },
          { name: 'Indy 500', search: 'indianapolis motor speedway' }
        ].map((location, index) => (
          <motion.button
            key={location.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDestination(location.search)}
            className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg hover:border-blue-500/30 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-white font-medium text-sm">{location.name}</p>
                <p className="text-gray-400 text-xs">Click to set destination</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default GoogleMapsComponent;