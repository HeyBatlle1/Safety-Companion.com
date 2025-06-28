/*
  # Add Helper Function for Database Schema Checks

  1. New Functions
    - `get_tables`: Returns a list of all tables in the public schema
    
  2. Security
    - Function is set to SECURITY DEFINER to ensure it has access to schema information
    - Execute permission granted to authenticated users
*/

-- Create a function to safely get tables
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TEXT[] AS $$
DECLARE
  tables TEXT[];
BEGIN
  SELECT array_agg(tablename) INTO tables
  FROM pg_catalog.pg_tables
  WHERE schemaname = 'public';
  
  RETURN tables;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION get_tables() IS 'Returns an array of all table names in the public schema';