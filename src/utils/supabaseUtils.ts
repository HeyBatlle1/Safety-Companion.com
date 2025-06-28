/**
 * Utilities for working with Supabase more safely and efficiently
 */
import supabase from '../services/supabase';
import { logError } from './errorHandler';

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
    logError(error, 'Supabase Query');
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
  return safeQuery(
    () => supabase.from(table).insert([data]).select().maybeSingle(),
    `Failed to insert record into ${table}`
  );
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
  
  return safeQuery(
    () => {
      let query = supabase.from(table).update(data);
      query = buildMatchQuery(query);
      return query.select();
    },
    `Failed to update records in ${table}`
  );
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
  
  return safeQuery(
    () => {
      let query = supabase.from(table).delete();
      query = buildMatchQuery(query);
      return query;
    },
    `Failed to delete records from ${table}`
  );
}

/**
 * Select records with proper error handling and optional filtering
 * @param table Table name
 * @param columns Columns to select (default is *)
 * @param match Optional object with fields to match for filtering
 * @param options Additional options like order and limit
 */
export async function selectRecords<M extends object>(
  table: string,
  columns: string = '*',
  match?: M,
  options?: {
    order?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
    single?: boolean;
  }
) {
  return safeQuery(
    () => {
      let query = supabase.from(table).select(columns);
      
      // Apply filters if match is provided
      if (match) {
        Object.entries(match).forEach(([field, value]) => {
          query = query.eq(field, value);
        });
      }
      
      // Apply ordering if specified
      if (options?.order) {
        query = query.order(
          options.order.column, 
          { ascending: options.order.ascending ?? true }
        );
      }
      
      // Apply pagination if specified
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Return single item if requested
      if (options?.single) {
        return query.single();
      }
      
      return query;
    },
    `Failed to select records from ${table}`
  );
}

/**
 * Upload a file to Supabase storage
 * @param bucket Storage bucket name
 * @param path File path in the bucket
 * @param file File to upload
 * @param options Additional options
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean }
) {
  return safeQuery(
    () => supabase.storage.from(bucket).upload(path, file, {
      upsert: options?.upsert ?? false
    }),
    `Failed to upload file to ${bucket}/${path}`
  );
}

/**
 * Get the public URL for a file in Supabase storage
 * @param bucket Storage bucket name
 * @param path File path in the bucket
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export default {
  safeQuery,
  insertRecord,
  updateRecords,
  deleteRecords,
  selectRecords,
  uploadFile,
  getPublicUrl
};