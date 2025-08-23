// Test setup file
import { vi } from 'vitest';

// Mock Firebase Admin SDK for testing
vi.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: vi.fn(),
  credential: {
    applicationDefault: vi.fn()
  },
  auth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user',
      email: 'test@example.com',
      email_verified: true
    }),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    setCustomUserClaims: vi.fn().mockResolvedValue(undefined)
  }),
  firestore: () => ({
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    add: vi.fn().mockResolvedValue({ id: 'test-doc-id' }),
    set: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        userId: 'test-user',
        email: 'test@example.com',
        role: 'user'
      })
    }),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    FieldValue: {
      serverTimestamp: vi.fn()
    }
  })
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';
process.env.BYPASS_AUTH = 'true';