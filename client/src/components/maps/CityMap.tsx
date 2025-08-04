import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  AlertCircle, 
  Loader as LoaderIcon, 
  RefreshCw, 
  Map, 
  Satellite,
  Route,
  Eye,
  Layers,
  Navigation2,
  Compass,
  Maximize,
  Minimize,
  Settings,
  Search,
  Target,
  Camera,
  Share2,
  Download
} from 'lucide-react';
import { 
  loadGoogleMaps, 
  INDIANAPOLIS_CENTER, 
  geocodeAddress, 
  isGoogleMapsLoaded, 
  getStaticMapImageUrl,
  getMapOptions,
  getDirections,
  searchNearbyPlaces,
  initialize3DMap,
  getStreetViewData,
  calculateDistance
} from '../../services/maps';
import { saveMapLocation, getMapLocations, deleteMapLocation } from '../../services/mapService';
import { showToast } from '../common/ToastContainer';

interface SavedLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
  created_at: string;
}

const CityMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [streetViewPanorama, setStreetViewPanorama] = useState<google.maps.StreetViewPanorama | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading map...');
  const [usingFallback, setUsingFallback] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('hybrid');
  const [is3DMode, setIs3DMode] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [showSavedLocations, setShowSavedLocations] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<google.maps.places.PlaceResult[]>([]);
  const [showNearbyPlaces, setShowNearbyPlaces] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    steps: google.maps.DirectionsStep[];
  } | null>(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      if (!mapRef.current || !isMounted) return;
      
      try {
        if (isMounted) {
          setIsLoading(true);
          setError(null);
          setUsingFallback(false);
          setLoadingMessage('Loading Google Maps...');
        }
        
        const googleInstance = await loadGoogleMaps();
        
        if (isMounted) {
          setLoadingMessage('Initializing enhanced map...');
        }
        
        // Create enhanced map with 3D capabilities
        const mapOptions = getMapOptions(INDIANAPOLIS_CENTER);
        const newMap = new google.maps.Map(mapRef.current, {
          ...mapOptions,
          mapTypeId: mapType,
          tilt: is3DMode ? 45 : 0,
          heading: is3DMode ? 90 : 0
        });

        // Initialize Street View
        const panorama = new google.maps.StreetViewPanorama(
          streetViewRef.current || document.createElement('div'),
          {
            position: INDIANAPOLIS_CENTER,
            pov: { heading: 34, pitch: 10 },
            visible: false
          }
        );
        
        newMap.setStreetView(panorama);
        setStreetViewPanorama(panorama);

        // Add enhanced marker for Indianapolis center
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: newMap,
          position: INDIANAPOLIS_CENTER,
          title: 'Indianapolis - Safety Companion HQ',
        });

        // Initialize enhanced directions services
        const dirService = new google.maps.DirectionsService();
        const dirRenderer = new google.maps.DirectionsRenderer({
          map: newMap,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#3B82F6',
            strokeWeight: 6,
            strokeOpacity: 0.8
          },
          markerOptions: {
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3B82F6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF'
            }
          }
        });

        // Add click listener for saving locations
        newMap.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            handleMapClick(event.latLng);
          }
        });

        // Add map type change listener
        newMap.addListener('maptypeid_changed', () => {
          const newMapType = newMap.getMapTypeId() as typeof mapType;
          setMapType(newMapType);
        });

        if (isMounted) {
          setMap(newMap);
          setDirectionsService(dirService);
          setDirectionsRenderer(dirRenderer);
          loadSavedLocations();
        }
      } catch (error) {
        if (isMounted) {
          setError('Failed to initialize Google Maps');
          setFallbackImageUrl(getStaticMapImageUrl(INDIANAPOLIS_CENTER));
          setUsingFallback(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initMap();
    
    return () => {
      isMounted = false;
    };
  }, [mapType, is3DMode]);

  const loadSavedLocations = async () => {
    try {
      const locations = await getMapLocations();
      setSavedLocations(locations);
    } catch (error) {
      
    }
  };

  const handleMapClick = async (latLng: google.maps.LatLng) => {
    const lat = latLng.lat();
    const lng = latLng.lng();
    
    try {
      // Get address for the clicked location
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        const name = prompt('Enter a name for this location:', 'New Location');
        
        if (name) {
          await saveMapLocation({
            name,
            address,
            lat,
            lng,
            notes: ''
          });
          loadSavedLocations();
          showToast('Location saved successfully', 'success');
        }
      }
    } catch (error) {
      
      showToast('Failed to save location', 'error');
    }
  };

  const calculateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (usingFallback) {
      try {
        setFallbackImageUrl(getStaticMapImageUrl(destination));
      } catch (error) {
        setSearchError('Unable to display this location');
      }
      return;
    }
    
    if (!directionsService || !directionsRenderer || !destination.trim()) {
      setSearchError('Please enter a destination');
      return;
    }

    try {
      setSearchError(null);
      setIsCalculating(true);

      const result = await getDirections(
        INDIANAPOLIS_CENTER,
        destination,
        google.maps.TravelMode.DRIVING,
        {
          provideRouteAlternatives: true,
          optimizeWaypoints: true,
          avoidHighways: false,
          avoidTolls: false
        }
      );

      directionsRenderer.setDirections(result);

      // Extract route information
      if (result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];
        
        setRouteInfo({
          distance: leg.distance?.text || 'Unknown',
          duration: leg.duration?.text || 'Unknown',
          steps: leg.steps || []
        });

        // Fit bounds to show the whole route
        if (map) {
          const bounds = new google.maps.LatLngBounds();
          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              step.path.forEach(point => {
                bounds.extend(point);
              });
            });
          });
          map.fitBounds(bounds);
        }
      }
    } catch (error) {
      setSearchError('Could not calculate a route to this destination');
      
    } finally {
      setIsCalculating(false);
    }
  };

  const toggle3DMode = () => {
    if (map && !usingFallback) {
      const new3DMode = !is3DMode;
      setIs3DMode(new3DMode);
      
      if (new3DMode) {
        map.setTilt(45);
        map.setHeading(90);
        map.setMapTypeId('satellite');
      } else {
        map.setTilt(0);
        map.setHeading(0);
      }
    }
  };

  const toggleStreetView = () => {
    if (streetViewPanorama && map) {
      const newVisibility = !showStreetView;
      setShowStreetView(newVisibility);
      streetViewPanorama.setVisible(newVisibility);
      
      if (newVisibility) {
        // Set street view to map center
        const center = map.getCenter();
        if (center) {
          streetViewPanorama.setPosition(center);
        }
      }
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(pos);
          
          if (map) {
            map.setCenter(pos);
            map.setZoom(16);
            
            // Add marker for current location
            new google.maps.marker.AdvancedMarkerElement({
              map,
              position: pos,
              title: 'Your Location',
            });
          }
          
          showToast('Location found', 'success');
        },
        (error) => {
          
          showToast('Unable to get your location', 'error');
        }
      );
    } else {
      showToast('Geolocation not supported', 'error');
    }
  };

  const searchNearby = async (type: string) => {
    if (!map || !currentLocation) {
      showToast('Please get your current location first', 'warning');
      return;
    }

    try {
      const places = await searchNearbyPlaces(currentLocation, 5000, type);
      setNearbyPlaces(places);
      setShowNearbyPlaces(true);
      
      // Add markers for nearby places
      places.forEach(place => {
        if (place.geometry?.location) {
          new google.maps.marker.AdvancedMarkerElement({
            map,
            position: place.geometry.location,
            title: place.name,
          });
        }
      });
      
      showToast(`Found ${places.length} nearby ${type}s`, 'success');
    } catch (error) {
      
      showToast('Failed to search nearby places', 'error');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleRetryMap = () => {
    setMap(null);
    setDirectionsService(null);
    setDirectionsRenderer(null);
    setError(null);
    setUsingFallback(false);
    setIsLoading(true);
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-900 p-4' : ''}`}
    >
      {/* Enhanced Control Panel */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search and Route */}
          <form onSubmit={calculateRoute} className="flex space-x-2 flex-1 min-w-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination address..."
                className="w-full bg-slate-700/50 border border-blue-500/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/40"
                disabled={isLoading && !usingFallback}
              />
              <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isCalculating || !destination.trim() || (isLoading && !usingFallback)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalculating ? (
                <LoaderIcon className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
              <span>Route</span>
            </motion.button>
          </form>

          {/* Map Controls */}
          <div className="flex items-center space-x-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={getCurrentLocation}
              className="p-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors"
              title="Get Current Location"
            >
              <Target className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggle3DMode}
              className={`p-2 rounded-lg transition-colors ${
                is3DMode 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-700/50 text-white hover:bg-slate-600/50'
              }`}
              title="Toggle 3D View"
              disabled={usingFallback}
            >
              <Layers className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleStreetView}
              className={`p-2 rounded-lg transition-colors ${
                showStreetView 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-700/50 text-white hover:bg-slate-600/50'
              }`}
              title="Toggle Street View"
              disabled={usingFallback}
            >
              <Eye className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSavedLocations(!showSavedLocations)}
              className="p-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors"
              title="Saved Locations"
            >
              <MapPin className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600/50 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </motion.button>
          </div>
        </div>

        {/* Map Type Selector */}
        <div className="flex items-center space-x-2 mt-4">
          <span className="text-sm text-gray-300">View:</span>
          {[
            { type: 'roadmap', icon: Map, label: 'Map' },
            { type: 'satellite', icon: Satellite, label: 'Satellite' },
            { type: 'hybrid', icon: Layers, label: 'Hybrid' },
            { type: 'terrain', icon: Compass, label: 'Terrain' }
          ].map(({ type, icon: Icon, label }) => (
            <motion.button
              key={type}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMapType(type as typeof mapType)}
              className={`px-3 py-1 rounded-lg text-sm flex items-center space-x-1 transition-colors ${
                mapType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
              }`}
              disabled={usingFallback}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Route Information */}
      <AnimatePresence>
        {routeInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
          >
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <Route className="w-5 h-5 mr-2 text-blue-400" />
              Route Information
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{routeInfo.distance}</p>
                <p className="text-sm text-gray-400">Distance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{routeInfo.duration}</p>
                <p className="text-sm text-gray-400">Duration</p>
              </div>
            </div>
            <div className="max-h-32 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Turn-by-turn directions:</h4>
              <div className="space-y-1">
                {routeInfo.steps.slice(0, 5).map((step, index) => (
                  <div key={index} className="text-xs text-gray-400 flex items-start space-x-2">
                    <span className="text-blue-400 font-medium">{index + 1}.</span>
                    <span dangerouslySetInnerHTML={{ __html: step.instructions }} />
                  </div>
                ))}
                {routeInfo.steps.length > 5 && (
                  <p className="text-xs text-gray-500">... and {routeInfo.steps.length - 5} more steps</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {searchError && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-2 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{searchError}</p>
        </motion.div>
      )}

      {/* Enhanced Map Container */}
      <div className={`relative rounded-xl overflow-hidden border border-blue-500/20 ${
        isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[500px]'
      }`}>
        {isLoading && !usingFallback && (
          <div className="absolute inset-0 bg-slate-800/70 flex items-center justify-center z-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-300">{loadingMessage}</p>
            </div>
          </div>
        )}
        
        {usingFallback && fallbackImageUrl && (
          <div className="absolute inset-0 z-10 flex flex-col">
            <div className="bg-yellow-500/20 border-b border-yellow-500/40 p-2 text-yellow-400 text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>Using static map view - interactive features limited</span>
            </div>
            <div className="flex-1 relative">
              <img 
                src={fallbackImageUrl} 
                alt="Static map of Indianapolis" 
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRetryMap}
                className="absolute bottom-4 right-4 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Interactive Map</span>
              </button>
            </div>
          </div>
        )}
        
        {!usingFallback && error && (
          <div className="absolute inset-0 bg-slate-800/90 flex items-center justify-center z-10 p-4">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
              <p className="text-gray-300 mb-4 max-w-md">{error}</p>
              <div className="flex space-x-4">
                <button 
                  onClick={handleRetryMap}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Try Again</span>
                </button>
                <button 
                  onClick={() => {
                    setUsingFallback(true);
                    setFallbackImageUrl(getStaticMapImageUrl(INDIANAPOLIS_CENTER));
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Map className="w-5 h-5" />
                  <span>Use Static Map</span>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Main Map */}
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Street View Overlay */}
        <AnimatePresence>
          {showStreetView && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 w-80 h-60 bg-black rounded-lg overflow-hidden border-2 border-blue-500/40 shadow-xl"
            >
              <div ref={streetViewRef} className="w-full h-full" />
              <button
                onClick={() => setShowStreetView(false)}
                className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                ×
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhanced Feature Information */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Enhanced Map Features:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 🗺️ Multiple map types (Road, Satellite, Hybrid, Terrain)</li>
            <li>• 🏗️ 3D building visualization in satellite mode</li>
            <li>• 👁️ Street View integration with 360° panoramas</li>
            <li>• 🧭 Turn-by-turn navigation with route optimization</li>
          </ul>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• 📍 Click to save custom locations to Supabase</li>
            <li>• 🎯 GPS location detection and tracking</li>
            <li>• 🔍 Nearby places search (restaurants, gas stations, etc.)</li>
            <li>• 📱 Fullscreen mode for mobile-optimized viewing</li>
          </ul>
        </div>
      </div>

      {/* Saved Locations Panel */}
      <AnimatePresence>
        {showSavedLocations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Saved Locations</h3>
            {savedLocations.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {savedLocations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium">{location.name}</p>
                      <p className="text-xs text-gray-400">{location.address}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (map) {
                            map.setCenter({ lat: location.lat, lng: location.lng });
                            map.setZoom(16);
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await deleteMapLocation(location.id);
                            loadSavedLocations();
                            showToast('Location deleted', 'success');
                          } catch (error) {
                            showToast('Failed to delete location', 'error');
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                No saved locations. Click on the map to save a location.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CityMap;