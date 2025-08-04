import { SiteLocation } from '../types/safety';

const API_BASE = '/api';
const LOCATIONS_KEY = 'safety-companion-locations';

// Local storage helpers
const getLocalLocations = (): SiteLocation[] => {
  try {
    const stored = localStorage.getItem(LOCATIONS_KEY);
    if (!stored) return [];
    const locations = JSON.parse(stored);
    return Array.isArray(locations) ? locations : [];
  } catch (error) {
    console.error('Error reading locations:', error);
    return [];
  }
};

const saveLocalLocations = (locations: SiteLocation[]): void => {
  try {
    localStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations));
  } catch (error) {
    console.error('Error saving locations:', error);
  }
};

// Get all saved locations
export const getSavedLocations = async (): Promise<SiteLocation[]> => {
  try {
    // TODO: Implement API endpoint when backend is ready
    // For now, use localStorage
    return getLocalLocations();
  } catch (error) {
    console.error('Error getting saved locations:', error);
    return [];
  }
};

// Save a new location
export const saveLocation = async (location: Omit<SiteLocation, 'id'>): Promise<SiteLocation> => {
  try {
    const newLocation: SiteLocation = {
      ...location,
      id: `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    const locations = getLocalLocations();
    locations.push(newLocation);
    saveLocalLocations(locations);
    
    return newLocation;
  } catch (error) {
    console.error('Error saving location:', error);
    throw new Error('Failed to save location');
  }
};

// Update a location
export const updateLocation = async (id: string, updates: Partial<SiteLocation>): Promise<SiteLocation | null> => {
  try {
    const locations = getLocalLocations();
    const index = locations.findIndex(loc => loc.id === id);
    
    if (index === -1) return null;
    
    locations[index] = { ...locations[index], ...updates };
    saveLocalLocations(locations);
    
    return locations[index];
  } catch (error) {
    console.error('Error updating location:', error);
    return null;
  }
};

// Delete a location
export const deleteLocation = async (id: string): Promise<boolean> => {
  try {
    const locations = getLocalLocations();
    const filtered = locations.filter(loc => loc.id !== id);
    
    if (filtered.length === locations.length) return false;
    
    saveLocalLocations(filtered);
    return true;
  } catch (error) {
    console.error('Error deleting location:', error);
    return false;
  }
};

// Alias for backwards compatibility
export const deleteMapLocation = deleteLocation;
export const getMapLocations = getSavedLocations;
export const saveMapLocation = saveLocation;