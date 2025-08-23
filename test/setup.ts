// Test setup file
import 'jest';

// Mock Firebase Admin SDK for testing
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    applicationDefault: jest.fn()
  },
  auth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({
      uid: 'test-user',
      email: 'test@example.com',
      email_verified: true
    }),
    deleteUser: jest.fn().mockResolvedValue(undefined),
    setCustomUserClaims: jest.fn().mockResolvedValue(undefined)
  }),
  firestore: () => ({
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    add: jest.fn().mockResolvedValue({ id: 'test-doc-id' }),
    set: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        userId: 'test-user',
        email: 'test@example.com',
        role: 'user'
      })
    }),
    update: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    FieldValue: {
      serverTimestamp: jest.fn()
    }
  })
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.BYPASS_AUTH = 'true';