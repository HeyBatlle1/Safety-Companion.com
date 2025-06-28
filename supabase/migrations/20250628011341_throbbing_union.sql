/*
  # Enhanced Maps Module Tables

  1. New Tables
    - `map_locations` - Store user-saved map locations
    - `map_routes` - Store user-saved routes and directions
    - `map_preferences` - Store user map preferences and settings

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own data
*/

-- Create map_locations table
CREATE TABLE IF NOT EXISTS map_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  notes TEXT,
  location_type TEXT DEFAULT 'custom' CHECK (location_type IN ('custom', 'work', 'home', 'favorite')),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create map_routes table
CREATE TABLE IF NOT EXISTS map_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  origin_address TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  distance TEXT,
  duration TEXT,
  route_data JSONB, -- Store the full route response from Google Maps
  travel_mode TEXT DEFAULT 'DRIVING' CHECK (travel_mode IN ('DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT')),
  avoid_highways BOOLEAN DEFAULT false,
  avoid_tolls BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ
);

-- Create map_preferences table
CREATE TABLE IF NOT EXISTS map_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  default_map_type TEXT DEFAULT 'hybrid' CHECK (default_map_type IN ('roadmap', 'satellite', 'hybrid', 'terrain')),
  default_zoom INTEGER DEFAULT 15 CHECK (default_zoom >= 1 AND default_zoom <= 20),
  enable_3d BOOLEAN DEFAULT false,
  enable_street_view BOOLEAN DEFAULT true,
  enable_traffic BOOLEAN DEFAULT true,
  enable_transit BOOLEAN DEFAULT true,
  enable_bicycling BOOLEAN DEFAULT false,
  default_travel_mode TEXT DEFAULT 'DRIVING' CHECK (default_travel_mode IN ('DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT')),
  avoid_highways BOOLEAN DEFAULT false,
  avoid_tolls BOOLEAN DEFAULT false,
  units TEXT DEFAULT 'imperial' CHECK (units IN ('metric', 'imperial')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE map_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for map_locations
CREATE POLICY "Users can manage their own map locations"
  ON map_locations
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public map locations"
  ON map_locations
  FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

-- Create policies for map_routes
CREATE POLICY "Users can manage their own map routes"
  ON map_routes
  FOR ALL
  USING (auth.uid() = user_id);

-- Create policies for map_preferences
CREATE POLICY "Users can manage their own map preferences"
  ON map_preferences
  FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_map_locations_user_id ON map_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_map_locations_coordinates ON map_locations(lat, lng);
CREATE INDEX IF NOT EXISTS idx_map_locations_type ON map_locations(location_type);
CREATE INDEX IF NOT EXISTS idx_map_routes_user_id ON map_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_map_routes_favorite ON map_routes(user_id, is_favorite) WHERE is_favorite = true;

-- Create function to automatically create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_map_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.map_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create map preferences for new users
CREATE TRIGGER on_auth_user_created_map_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_map_preferences();

-- Add comments for documentation
COMMENT ON TABLE map_locations IS 'User-saved map locations with coordinates and metadata';
COMMENT ON TABLE map_routes IS 'User-saved routes with origin, destination, and route data';
COMMENT ON TABLE map_preferences IS 'User preferences for map display and behavior';

COMMENT ON COLUMN map_locations.lat IS 'Latitude coordinate';
COMMENT ON COLUMN map_locations.lng IS 'Longitude coordinate';
COMMENT ON COLUMN map_locations.location_type IS 'Type of location: custom, work, home, or favorite';
COMMENT ON COLUMN map_locations.is_public IS 'Whether this location can be viewed by other users';

COMMENT ON COLUMN map_routes.route_data IS 'Full Google Maps Directions API response stored as JSON';
COMMENT ON COLUMN map_routes.travel_mode IS 'Mode of transportation for the route';
COMMENT ON COLUMN map_routes.avoid_highways IS 'Whether to avoid highways in route calculation';
COMMENT ON COLUMN map_routes.avoid_tolls IS 'Whether to avoid toll roads in route calculation';