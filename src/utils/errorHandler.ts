/**
 * A utility for handling and standardizing errors across the application
 */

// Generic error for all application errors
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

// API request error with status code
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Authentication-related errors
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Form validation errors
export class ValidationError extends Error {
  field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// Network-related errors (offline, timeout, etc.)
export class NetworkError extends Error {
  constructor(message: string = 'Network connection error') {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Get a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle PostgreSQL/Supabase specific error codes
  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as any;
    if (supabaseError.code) {
      switch (supabaseError.code) {
        case '23505': return 'A record with this information already exists';
        case '23503': return 'This operation references a record that does not exist';
        case '23502': return 'Missing required information';
        case '42P01': return 'The database table does not exist';
        case '42703': return 'Column does not exist in database table';
        case '28P01': return 'Invalid login credentials';
        case '3D000': return 'Database does not exist';
        default: return `Database error: ${supabaseError.message || 'Unknown error'}`;
      }
    }
  }
  
  return 'An unknown error occurred';
}

/**
 * Log errors with additional context for debugging
 */
export function logError(error: unknown, context?: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Error${context ? ` in ${context}:` : ':'}`, error);
  }
  
  // In production, you might want to send errors to a monitoring service
  // sendToErrorMonitoring(error, context);
}

/**
 * Create a standardized error object for API responses
 */
export function createApiError(message: string, status: number = 500): ApiError {
  return new ApiError(message, status);
}

/**
 * Handle Supabase-specific errors
 */
export function handleSupabaseError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const supabaseError = error as any;
    const code = supabaseError.code;
    const message = supabaseError.message || 'Unknown database error';
    
    // Return user-friendly messages for common Supabase errors
    if (code === 'PGRST116') {
      return 'Resource not found. The requested data might have been deleted or you may not have access to it.';
    }
    
    if (message.includes('duplicate key')) {
      return 'This information already exists in the system.';
    }
    
    if (message.includes('permission denied')) {
      return 'You do not have permission to perform this action.';
    }
    
    if (message.includes('JWT expired')) {
      return 'Your session has expired. Please sign in again.';
    }
    
    return `Database error: ${message}`;
  }
  
  return getErrorMessage(error);
}

export default {
  AppError,
  ApiError,
  AuthError,
  ValidationError,
  NetworkError,
  getErrorMessage,
  logError,
  createApiError,
  handleSupabaseError
};