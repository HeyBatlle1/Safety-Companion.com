import supabase, { getCurrentUser } from './supabase';

export interface MapLocation {
  id?: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  notes?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MapRoute {
  id?: string;
  name: string;
  origin_address: string;
  destination_address: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  distance: string;
  duration: string;
  route_data: any; // JSON data for the route
  user_id?: string;
  created_at?: string;
}

// Save a map location to Supabase
export const saveMapLocation = async (location: Omit<MapLocation, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<MapLocation> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('map_locations')
      .insert([{
        ...location,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    
    throw error;
  }
};

// Get all map locations for the current user
export const getMapLocations = async (): Promise<MapLocation[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('map_locations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    
    return [];
  }
};

// Update a map location
export const updateMapLocation = async (
  id: string, 
  updates: Partial<MapLocation>
): Promise<MapLocation> => {
  try {
    const { data, error } = await supabase
      .from('map_locations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    
    throw error;
  }
};

// Delete a map location
export const deleteMapLocation = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('map_locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    
    return false;
  }
};

// Save a route to Supabase
export const saveMapRoute = async (route: Omit<MapRoute, 'id' | 'user_id' | 'created_at'>): Promise<MapRoute> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('map_routes')
      .insert([{
        ...route,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    
    throw error;
  }
};

// Get all saved routes for the current user
export const getMapRoutes = async (): Promise<MapRoute[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('map_routes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    
    return [];
  }
};

// Delete a saved route
export const deleteMapRoute = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('map_routes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    
    return false;
  }
};

// Search for locations by name or address
export const searchMapLocations = async (query: string): Promise<MapLocation[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('map_locations')
      .select('*')
      .eq('user_id', user.id)
      .or(`name.ilike.%${query}%,address.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    
    return [];
  }
};

// Get locations within a certain radius
export const getLocationsNearby = async (
  lat: number, 
  lng: number, 
  radiusKm: number = 10
): Promise<MapLocation[]> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return [];
    }

    // Use PostGIS functions if available, otherwise filter in JavaScript
    const { data, error } = await supabase
      .from('map_locations')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    // Filter by distance in JavaScript (fallback)
    const filtered = (data || []).filter(location => {
      const distance = calculateDistance(lat, lng, location.lat, location.lng);
      return distance <= radiusKm;
    });

    return filtered;
  } catch (error) {
    
    return [];
  }
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default {
  saveMapLocation,
  getMapLocations,
  updateMapLocation,
  deleteMapLocation,
  saveMapRoute,
  getMapRoutes,
  deleteMapRoute,
  searchMapLocations,
  getLocationsNearby
};