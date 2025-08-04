/**
 * Centralizes error handling logic for the application
 */

// Custom error types for specific error scenarios
export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection error') {
    super(message);
    this.name = 'NetworkError';
  }
}

// Error messages dictionary for consistent messaging
export const errorMessages = {
  auth: {
    signInFailed: 'Unable to sign in. Please check your credentials and try again.',
    sessionExpired: 'Your session has expired. Please sign in again.',
    unauthorized: 'You are not authorized to perform this action.',
    emailInUse: 'This email is already registered. Please use a different email or sign in.',
  },
  data: {
    fetchFailed: 'Failed to fetch data. Please try again later.',
    saveFailed: 'Failed to save data. Please try again later.',
    deleteFailed: 'Failed to delete data. Please try again later.',
    notFound: 'The requested resource was not found.',
  },
  validation: {
    requiredField: 'This field is required.',
    invalidEmail: 'Please enter a valid email address.',
    invalidPassword: 'Password must be at least 6 characters long.',
    passwordMismatch: 'Passwords do not match.',
  },
  general: {
    unknownError: 'An unexpected error occurred. Please try again.',
    notImplemented: 'This feature is not yet implemented.',
  }
};

// Log errors for debugging purposes
export const logError = (error: unknown, context?: string): void => {
  if (process.env.NODE_ENV !== 'production') {
    
  }
  
  // In a production app, you might want to send errors to a monitoring service
  // Example: sendToErrorMonitoring(error, context);
};

// Get a user-friendly error message from various error types
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    if (error instanceof AuthError) {
      return error.message;
    }
    if (error instanceof ApiError) {
      return error.message;
    }
    if (error instanceof NetworkError) {
      return error.message;
    }
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return errorMessages.general.unknownError;
};

// Helper function to handle API errors consistently
export const handleApiError = (error: unknown, fallback: string = errorMessages.data.fetchFailed): string => {
  logError(error, 'API');
  return getErrorMessage(error) || fallback;
};

export default {
  AuthError,
  ApiError,
  NetworkError,
  errorMessages,
  logError,
  getErrorMessage,
  handleApiError
};