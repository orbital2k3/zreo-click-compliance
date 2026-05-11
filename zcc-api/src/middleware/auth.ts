import { Request, Response, NextFunction } from 'express';
import { extractUserFromToken } from '../lib/supabase';

/**
 * Type extension for Express Request to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
        role?: string;
      };
    }
  }
}

/**
 * Authentication Middleware
 * Validates Bearer token from Authorization header and attaches user to request
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  // Extract user from token
  const user = await extractUserFromToken(authHeader);

  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Bearer token',
    });
    return;
  }

  // Attach user to request for downstream handlers
  req.user = user;
  next();
}

/**
 * Optional Authentication Middleware
 * Attempts to authenticate but doesn't reject if token is missing
 * Useful for routes that support both authenticated and guest access
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const user = await extractUserFromToken(authHeader);
    if (user) {
      req.user = user;
    }
  }

  next();
}
