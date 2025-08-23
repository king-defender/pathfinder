// Test setup file
import { vi } from 'vitest';

// Mock Firebase Admin SDK with proper default export
vi.mock('firebase-admin', () => {
  const mockFirestore = {
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
    offset: vi.fn().mockReturnThis()
  };

  const mockAuth = {
    verifyIdToken: vi.fn().mockResolvedValue({
      uid: 'test-user',
      email: 'test@example.com',
      email_verified: true
    }),
    deleteUser: vi.fn().mockResolvedValue(undefined),
    setCustomUserClaims: vi.fn().mockResolvedValue(undefined),
    listUsers: vi.fn().mockResolvedValue({ users: [] })
  };

  return {
    default: {
      apps: [],
      initializeApp: vi.fn(),
      credential: {
        applicationDefault: vi.fn()
      },
      auth: () => mockAuth,
      firestore: () => mockFirestore,
      FieldValue: {
        serverTimestamp: vi.fn()
      }
    }
  };
});

// Mock Redis for testing
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    ping: vi.fn().mockResolvedValue('PONG'),
    disconnect: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.FIREBASE_PROJECT_ID = 'test-project';