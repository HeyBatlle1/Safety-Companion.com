/**
 * Utilities for handling security concerns in the application
 */

/**
 * Sanitizes a string to prevent XSS attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.textContent = input;
  
  // Return the sanitized content
  return tempElement.innerHTML;
}

/**
 * Encodes HTML entities to prevent script injection
 * @param input String to encode
 * @returns Encoded string
 */
export function encodeHTML(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates email format
 * @param email Email to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * @param password Password to validate
 * @returns Object with validity and reason if invalid
 */
export function validatePassword(password: string): { isValid: boolean; reason?: string } {
  if (!password) {
    return { isValid: false, reason: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, reason: 'Password must be at least 8 characters long' };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { isValid: false, reason: 'Password must contain at least one number' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, reason: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { isValid: false, reason: 'Password must contain at least one lowercase letter' };
  }
  
  return { isValid: true };
}

/**
 * Checks if a string contains only alphanumeric characters
 * @param input String to check
 * @returns Whether the string contains only alphanumeric characters
 */
export function isAlphanumeric(input: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(input);
}

/**
 * Validates a URL format
 * @param url URL to validate
 * @returns Whether the URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a hash of a string (for simple use cases, not cryptographically secure)
 * @param input String to hash
 * @returns Hashed string
 */
export function simpleHash(input: string): string {
  let hash = 0;
  
  if (!input) return hash.toString();
  
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  
  return hash.toString(16);
}

/**
 * Generates a random ID (not cryptographically secure)
 * @param length Length of the ID
 * @returns Random ID
 */
export function generateId(length = 10): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

export default {
  sanitizeString,
  encodeHTML,
  isValidEmail,
  validatePassword,
  isAlphanumeric,
  isValidUrl,
  simpleHash,
  generateId
};