import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { logError } from '../utils/logger';

// SQL injection prevention - sanitize any raw SQL queries
export function sanitizeSQLInput(input: string): string {
  // Remove or escape potentially dangerous SQL characters
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment starts
    .replace(/\*\//g, ''); // Remove multi-line comment ends
}

// XSS prevention - sanitize HTML output
export function sanitizeHTML(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Input validation middleware
export function validateInput(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
}

// Generic error handler that doesn't expose sensitive information
export function secureErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  logError(err, req.path);
  
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.userMessage || 'An error occurred processing your request',
    ...(isDevelopment && { details: err.message, stack: err.stack })
  });
}

// Rate limiting per user (more strict than IP-based)
export function userRateLimit(windowMs: number, max: number) {
  const userRequests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return next();
    }
    
    const userId = req.session.userId;
    const now = Date.now();
    const userRecord = userRequests.get(userId);
    
    if (!userRecord || now > userRecord.resetTime) {
      userRequests.set(userId, {
        count: 1,
        resetTime: now + windowMs
      });
      return next();
    }
    
    if (userRecord.count >= max) {
      return res.status(429).json({
        error: 'Too many requests, please try again later'
      });
    }
    
    userRecord.count++;
    next();
  };
}