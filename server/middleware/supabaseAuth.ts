import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Extend Express Request to include Supabase user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

/**
 * Middleware to verify Supabase JWT token and extract user info
 * Used instead of custom session management
 */
export const verifySupabaseToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized - Invalid token' });
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'field_worker'
    };

    next();
  } catch (error) {
    console.error('Supabase auth error:', error);
    res.status(401).json({ error: 'Unauthorized - Auth verification failed' });
  }
};

/**
 * Optional auth - doesn't fail if no token
 */
export const optionalSupabaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'field_worker'
        };
      }
    }
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};
