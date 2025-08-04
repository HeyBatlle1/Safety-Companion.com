/**
 * Utilities for working with Supabase more safely and efficiently
 */
import supabase from '../services/supabase';

/**
 * Safely execute a Supabase query with proper error handling
 * @param queryFn Function that performs the Supabase query
 * @param errorMsg Custom error message if the query fails
 */
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any; }>,
  errorMsg: string = 'Database operation failed'
): Promise<T> {
  try {
    const { data, error } = await queryFn();
    
    if (error) {
      throw error;
    }
    
    if (data === null) {
      throw new Error('No data returned');
    }
    
    return data as T;
  } catch (error) {
    console.error('Supabase Query Error:', error);
    throw new Error(errorMsg);
  }
}

/**
 * Insert a record with proper error handling
 * @param table Table name
 * @param data Object containing data to insert
 * @param options Additional options like returning strategy
 */
export async function insertRecord<T extends object>(
  table: string, 
  data: T,
  options: { returning?: 'minimal' | 'representation' } = { returning: 'representation' }
) {
  try {
    const { data: result, error } = await supabase.from(table).insert([data]).select().maybeSingle();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Insert error:', error);
    throw new Error(`Failed to insert record into ${table}`);
  }
}

/**
 * Update records with proper error handling
 * @param table Table name
 * @param data Object containing fields to update
 * @param match Object containing fields to match for update
 */
export async function updateRecords<T extends object, M extends object>(
  table: string,
  data: T,
  match: M
) {
  // Create a filter function that builds the query with all match conditions
  const buildMatchQuery = (query: any) => {
    let matchQuery = query;
    Object.entries(match).forEach(([field, value]) => {
      matchQuery = matchQuery.eq(field, value);
    });
    return matchQuery;
  };
  
  try {
    let query = supabase.from(table).update(data);
    query = buildMatchQuery(query);
    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Update error:', error);
    throw new Error(`Failed to update records in ${table}`);
  }
}

/**
 * Delete records with proper error handling
 * @param table Table name
 * @param match Object containing fields to match for deletion
 */
export async function deleteRecords<M extends object>(
  table: string,
  match: M
) {
  // Create a filter function that builds the query with all match conditions
  const buildMatchQuery = (query: any) => {
    let matchQuery = query;
    Object.entries(match).forEach(([field, value]) => {
      matchQuery = matchQuery.eq(field, value);
    });
    return matchQuery;
  };
  
  try {
    let query = supabase.from(table).delete();
    query = buildMatchQuery(query);
    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete records from ${table}`);
  }
}

/**
 * Select records with proper error handling
 * @param table Table name
 * @param match Object containing fields to match for selection
 * @param select Fields to select (default: '*')
 */
export async function selectRecords<M extends object>(
  table: string,
  match?: M,
  select: string = '*'
) {
  try {
    let query = supabase.from(table).select(select);
    
    if (match) {
      Object.entries(match).forEach(([field, value]) => {
        query = query.eq(field, value);
      });
    }
    
    const { data: result, error } = await query;
    if (error) throw error;
    return result;
  } catch (error) {
    console.error('Select error:', error);
    throw new Error(`Failed to select records from ${table}`);
  }
}

/**
 * Upload a file to Supabase Storage
 * @param bucket Bucket name
 * @param path File path in storage
 * @param file File to upload
 * @param options Upload options
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { cacheControl?: string; upsert?: boolean }
) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, options);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Get public URL for a file
 * @param bucket Bucket name
 * @param path File path in storage
 */
export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Export all utilities
export default {
  safeQuery,
  insertRecord,
  updateRecords,
  deleteRecords,
  selectRecords,
  uploadFile,
  getPublicUrl
};