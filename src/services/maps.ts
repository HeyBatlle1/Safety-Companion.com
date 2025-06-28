import { Loader } from '@googlemaps/js-api-loader';

// Use the non-GenAI Google API key for Maps
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Global tracking variables
let isLoadingMap = false;
let googleMapsLoadPromise: Promise<typeof google> | null = null;

// Utility to verify if the API key is valid
const isValidApiKey = () => {
  return API_KEY && API_KEY.length > 10 && !API_KEY.includes('undefined');
};

// Check if Google Maps is already loaded
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.google !== 'undefined' && 
         typeof window.google.maps !== 'undefined';
};

/**
 * Loads the Google Maps API without logging errors to console
 */
export const loadGoogleMaps = async (): Promise<typeof google> => {
  // If Google Maps is already loaded, return it immediately
  if (isGoogleMapsLoaded()) {
    return window.google;
  }
  
  // If already loading, return the existing promise
  if (isLoadingMap && googleMapsLoadPromise) {
    return googleMapsLoadPromise;
  }

  // Check if API key is valid
  if (!isValidApiKey()) {
    throw new Error('Invalid Google Maps API key');
  }
  
  try {
    isLoadingMap = true;
    
    // Create a new loading promise
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      // Create a global callback function
      const callbackName = `googleMapsInitCallback_${Date.now()}`;
      
      // Add callback to window
      (window as any)[callbackName] = () => {
        isLoadingMap = false;
        if (window.google) {
          resolve(window.google);
        } else {
          reject(new Error('Google Maps not available after initialization'));
        }
        // Clean up
        delete (window as any)[callbackName];
      };
      
      // Add script directly to avoid loader errors
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=${callbackName}&libraries=places,geometry&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        isLoadingMap = false;
        googleMapsLoadPromise = null;
        reject(new Error('Failed to load Google Maps script'));
        // Clean up
        delete (window as any)[callbackName];
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
      
      // Append script to document
      document.head.appendChild(script);
      
      // Add a timeout as a safety measure
      setTimeout(() => {
        if (isLoadingMap) {
          isLoadingMap = false;
          googleMapsLoadPromise = null;
          reject(new Error('Google Maps script loading timed out'));
          // Clean up
          delete (window as any)[callbackName];
        }
      }, 20000);
    });
    
    return await googleMapsLoadPromise;
  } catch (error) {
    isLoadingMap = false;
    googleMapsLoadPromise = null;
    throw error;
  }
};

export const INDIANAPOLIS_CENTER = {
  lat: 39.7684,
  lng: -86.1581
};

// Helper function to handle geocoding
export const geocodeAddress = async (address: string): Promise<google.maps.LatLngLiteral> => {
  try {
    // Make sure Google Maps is loaded
    if (!isGoogleMapsLoaded()) {
      await loadGoogleMaps();
    }
    
    return new Promise((resolve, reject) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const location = results[0].geometry.location;
          resolve({ 
            lat: location.lat(), 
            lng: location.lng() 
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  } catch (error) {
    throw new Error('Unable to find location');
  }
};

// Get a static map URL as fallback
export const getStaticMapImageUrl = (center: string | google.maps.LatLngLiteral, zoom = 12, width = 600, height = 400): string => {
  let centerParam = '';
  
  if (typeof center === 'string') {
    centerParam = encodeURIComponent(center);
  } else {
    centerParam = `${center.lat},${center.lng}`;
  }
  
  return `https://maps.googleapis.com/maps/api/staticmap?center=${centerParam}&zoom=${zoom}&size=${width}x${height}&maptype=hybrid&key=${API_KEY}`;
};

// Get default map options
export const getMapOptions = (center: google.maps.LatLngLiteral, zoom = 12): google.maps.MapOptions => {
  return {
    center,
    zoom,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    fullscreenControl: true,
  };
};

// Get directions between two points
export const getDirections = async (
  origin: string | google.maps.LatLngLiteral,
  destination: string | google.maps.LatLngLiteral,
  travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
): Promise<google.maps.DirectionsResult> => {
  try {
    // Make sure Google Maps is loaded
    if (!isGoogleMapsLoaded()) {
      await loadGoogleMaps();
    }
    
    return new Promise((resolve, reject) => {
      const directionsService = new google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin,
          destination,
          travelMode,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            resolve(result);
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  } catch (error) {
    throw new Error('Unable to get directions');
  }
};

// Search for nearby places
export const searchNearbyPlaces = async (
  location: google.maps.LatLngLiteral,
  radius = 5000,
  type?: string
): Promise<google.maps.places.PlaceResult[]> => {
  try {
    // Make sure Google Maps is loaded
    if (!isGoogleMapsLoaded()) {
      await loadGoogleMaps();
    }
    
    return new Promise((resolve, reject) => {
      const service = new google.maps.places.PlacesService(
        document.createElement('div')
      );
      
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius,
      };
      
      if (type) {
        request.type = type;
      }
      
      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  } catch (error) {
    throw new Error('Unable to search nearby places');
  }
};

// Initialize 3D map with enhanced features
export const initialize3DMap = (
  mapElement: HTMLElement,
  center: google.maps.LatLngLiteral = INDIANAPOLIS_CENTER,
  is3DMode: boolean = false
): Promise<google.maps.Map> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Make sure Google Maps is loaded
      if (!isGoogleMapsLoaded()) {
        await loadGoogleMaps();
      }
      
      // Create map with 3D capabilities
      const mapOptions = getMapOptions(center);
      
      // Apply 3D settings if enabled
      if (is3DMode) {
        mapOptions.mapTypeId = 'satellite';
        mapOptions.tilt = 45;
        mapOptions.heading = 90;
      }
      
      const map = new google.maps.Map(mapElement, mapOptions);
      
      // Add a default marker at the center
      new google.maps.marker.AdvancedMarkerElement({
        map,
        position: center,
        title: 'Center',
      });
      
      // Wait for map to be fully loaded
      google.maps.event.addListenerOnce(map, 'idle', () => {
        resolve(map);
      });
    } catch (error) {
      reject(error);
    }
  });
};