import { Request, Response, NextFunction } from 'express';
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth, DecodedIdToken } from 'firebase-admin/auth';
import { createError } from './errorHandler';

// Initialize Firebase Admin (should be done once in app startup)
if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if ((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') && (!projectId || projectId === 'demo-project-id')) {
    // Initialize with mock configuration for development/testing
    console.log('Firebase running in development/test mode with mock configuration');
    initializeApp({
      projectId: 'pathfinder-dev-mock'
    });
  } else if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is required');
  } else {
    initializeApp({
      credential: applicationDefault(),
      projectId
    });
  }
}

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
}

// Helper function to normalize user roles into an array
export const normalizeUserRoles = (role: string | string[] | undefined): string[] => {
  return Array.isArray(role)
    ? role
    : role
      ? [role]
      : [];
};

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip auth only in the test environment, and only with the flag explicitly set.
    // Deliberately excludes 'development' - a misconfigured deployment that left NODE_ENV
    // as 'development' with BYPASS_AUTH set would otherwise silently disable auth entirely.
    if (process.env.NODE_ENV === 'test' && process.env.BYPASS_AUTH === 'true') {
      req.user = {
        uid: 'dev-user',
        email: 'dev@example.com',
        email_verified: true
      } as DecodedIdToken;
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('No valid authorization header', 401);
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      throw createError('No token provided', 401);
    }

    // Verify the token
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;

    next();
  } catch (error) {
    if (error instanceof Error) {
      next(createError('Invalid or expired token', 401));
    } else {
      next(createError('Authentication failed', 401));
    }
  }
};

export const requireRole = (role: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('User not authenticated', 401));
    }

    const userRoles = normalizeUserRoles(req.user.role);
    if (!userRoles.includes(role) && !req.user.admin) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user?.admin) {
    return next(createError('Admin access required', 403));
  }
  next();
};