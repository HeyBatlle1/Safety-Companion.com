import winston from 'winston';

// Create a secure logger that doesn't expose sensitive information
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: false }), // Don't log stack traces in production
    winston.format.json()
  ),
  defaultMeta: { service: 'safety-companion' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// If we're not in production then log to the `console` with simple format
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Secure error logging that removes sensitive data
export function logError(error: any, context?: string) {
  const sanitizedError = {
    message: error.message || 'An error occurred',
    context,
    timestamp: new Date().toISOString(),
    // Never log sensitive fields
    ...Object.keys(error).reduce((acc, key) => {
      if (!['password', 'token', 'secret', 'apiKey', 'authorization'].includes(key.toLowerCase())) {
        acc[key] = error[key];
      }
      return acc;
    }, {} as any)
  };
  
  logger.error(sanitizedError);
}

export default logger;