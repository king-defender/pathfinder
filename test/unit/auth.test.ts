import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';

// Mock winston first
vi.mock('winston', () => ({
  default: {
    createLogger: vi.fn(() => ({
      error: vi.fn(),
      info: vi.fn(),
      add: vi.fn()
    })),
    format: {
      combine: vi.fn(),
      timestamp: vi.fn(),
      errors: vi.fn(),
      json: vi.fn(),
      simple: vi.fn()
    },
    transports: {
      File: vi.fn(),
      Console: vi.fn()
    }
  }
}));

// Mock Firebase Admin
vi.mock('firebase-admin', () => ({
  default: {
    apps: [],
    initializeApp: vi.fn(),
    credential: {
      applicationDefault: vi.fn()
    },
    auth: () => ({
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Token verification failed'))
    })
  }
}));

import { authMiddleware } from '../../src/middleware/auth';

describe('Auth Middleware - BYPASS_AUTH Security', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let originalNodeEnv: string | undefined;
  let originalBypassAuth: string | undefined;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {};
    next = vi.fn();
    
    // Store original env vars
    originalNodeEnv = process.env.NODE_ENV;
    originalBypassAuth = process.env.BYPASS_AUTH;
  });

  afterEach(() => {
    // Restore original env vars
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv;
    } else {
      delete process.env.NODE_ENV;
    }
    
    if (originalBypassAuth !== undefined) {
      process.env.BYPASS_AUTH = originalBypassAuth;
    } else {
      delete process.env.BYPASS_AUTH;
    }
  });

  it('should bypass auth when NODE_ENV is test and BYPASS_AUTH is true', async () => {
    process.env.NODE_ENV = 'test';
    process.env.BYPASS_AUTH = 'true';

    await authMiddleware(req as any, res as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as any).user).toEqual({
      uid: 'dev-user',
      email: 'dev@example.com',
      email_verified: true
    });
  });

  it('should NOT bypass auth when NODE_ENV is development and BYPASS_AUTH is true', async () => {
    process.env.NODE_ENV = 'development';
    process.env.BYPASS_AUTH = 'true';

    await authMiddleware(req as any, res as Response, next);

    // Should call next with an error because no auth header provided and auth bypass doesn't work in development
    expect(next).toHaveBeenCalled();
    const callArg = (next as any).mock.calls[0][0];
    expect(callArg).toBeDefined();
    expect(callArg.message).toBe('Invalid or expired token'); // This is the error thrown because auth fails without bypass
    expect((req as any).user).toBeUndefined();
  });

  it('should NOT bypass auth when NODE_ENV is production and BYPASS_AUTH is true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.BYPASS_AUTH = 'true';

    await authMiddleware(req as any, res as Response, next);

    // Should call next with an error because no auth header provided and auth bypass doesn't work in production
    expect(next).toHaveBeenCalled();
    const callArg = (next as any).mock.calls[0][0];
    expect(callArg).toBeDefined();
    expect(callArg.message).toBe('Invalid or expired token'); // This is the error thrown because auth fails without bypass
    expect((req as any).user).toBeUndefined();
  });

  it('should NOT bypass auth when NODE_ENV is test but BYPASS_AUTH is false', async () => {
    process.env.NODE_ENV = 'test';
    process.env.BYPASS_AUTH = 'false';

    await authMiddleware(req as any, res as Response, next);

    // Should call next with an error because no auth header provided and auth bypass is disabled
    expect(next).toHaveBeenCalled();
    const callArg = (next as any).mock.calls[0][0];
    expect(callArg).toBeDefined();
    expect(callArg.message).toBe('Invalid or expired token'); // This is the error thrown because auth fails without bypass
    expect((req as any).user).toBeUndefined();
  });

  it('should NOT bypass auth when NODE_ENV is test but BYPASS_AUTH is not set', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.BYPASS_AUTH;

    await authMiddleware(req as any, res as Response, next);

    // Should call next with an error because no auth header provided and auth bypass is not set
    expect(next).toHaveBeenCalled();
    const callArg = (next as any).mock.calls[0][0];
    expect(callArg).toBeDefined();
    expect(callArg.message).toBe('Invalid or expired token'); // This is the error thrown because auth fails without bypass
    expect((req as any).user).toBeUndefined();
  });
});