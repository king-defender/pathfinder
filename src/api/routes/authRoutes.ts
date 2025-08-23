import { Router, Request, Response } from 'express';
import { asyncHandler, createError } from '../../middleware/errorHandler';
import { AuthenticatedRequest } from '../../middleware/auth';
import admin from 'firebase-admin';

const router = Router();

// User registration (handled by Firebase Auth on client side)
// This endpoint is for additional user profile setup
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { idToken, additionalData = {} } = req.body;

  if (!idToken) {
    throw createError('ID token is required', 400);
  }

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Create user profile in Firestore
    const userRef = admin.firestore().collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      throw createError('User already exists', 409);
    }

    const userData = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'user',
      ...additionalData
    };

    await userRef.set(userData);

    res.status(201).json({
      success: true,
      message: 'User profile created successfully',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: 'user'
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ID token')) {
      throw createError('Invalid ID token', 401);
    }
    throw error;
  }
}));

// Get current user profile
router.get('/profile', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.uid;

  const userRef = admin.firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw createError('User profile not found', 404);
  }

  const userData = userDoc.data();
  
  res.json({
    success: true,
    user: {
      uid: userData?.uid,
      email: userData?.email,
      role: userData?.role,
      createdAt: userData?.createdAt,
      lastLoginAt: userData?.lastLoginAt
    }
  });
}));

// Update user profile
router.patch('/profile', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.uid;
  const { displayName, preferences = {} } = req.body;

  const userRef = admin.firestore().collection('users').doc(userId);
  const updates: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (displayName) {
    updates.displayName = displayName;
  }

  if (Object.keys(preferences).length > 0) {
    updates.preferences = preferences;
  }

  await userRef.update(updates);

  res.json({
    success: true,
    message: 'Profile updated successfully'
  });
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw createError('Refresh token is required', 400);
  }

  try {
    // Verify refresh token and get new tokens
    // This would typically involve Firebase Auth Admin SDK
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      // In real implementation, return new tokens here
    });
  } catch (error) {
    throw createError('Invalid refresh token', 401);
  }
}));

// Logout endpoint (for additional cleanup)
router.post('/logout', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.uid;

  // Update last logout time
  const userRef = admin.firestore().collection('users').doc(userId);
  await userRef.update({
    lastLogoutAt: admin.firestore.FieldValue.serverTimestamp()
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
}));

// Delete user account
router.delete('/account', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.uid;

  try {
    // Delete user data from Firestore
    const batch = admin.firestore().batch();
    
    // Delete user profile
    const userRef = admin.firestore().collection('users').doc(userId);
    batch.delete(userRef);

    // Delete user's paths
    const pathsQuery = await admin.firestore()
      .collection('paths')
      .where('userId', '==', userId)
      .get();

    pathsQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete user's analytics
    const analyticsRef = admin.firestore().collection('analytics').doc(userId);
    batch.delete(analyticsRef);

    await batch.commit();

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    throw createError('Failed to delete account', 500);
  }
}));

export { router as authRoutes };