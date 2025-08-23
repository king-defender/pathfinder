import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { createError } from './errorHandler';

// Initialize Firebase Admin (should be done once in app startup)
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is required');
  }
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId
  });
}

export interface AuthenticatedRequest extends Request {
  user?: admin.auth.DecodedIdToken;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip auth in development if bypass is enabled
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      req.user = {
        uid: 'dev-user',
        email: 'dev@example.com',
        email_verified: true
      } as admin.auth.DecodedIdToken;
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
    const decodedToken = await admin.auth().verifyIdToken(token);
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

    const userRoles = req.user.role || [];
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