import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireRole, AuthenticatedRequest, normalizeUserRoles, authMiddleware } from '../../src/middleware/auth';

// Mocks
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

// Test: normalizeUserRoles and requireRole
describe('Auth Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = vi.fn();
  });

  describe('normalizeUserRoles', () => {
    it('should handle string role', () => {
      expect(normalizeUserRoles('admin')).toEqual(['admin']);
    });
    it('should handle array role', () => {
      expect(normalizeUserRoles(['user', 'admin'])).toEqual(['user', 'admin']);
    });
    it('should handle undefined role', () => {
      expect(normalizeUserRoles(undefined)).toEqual([]);
    });
    it('should handle empty string role', () => {
      expect(normalizeUserRoles('')).toEqual([]);
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role as string', () => {
      mockReq.user = {
        uid: 'test-user',
        role: 'admin'
      } as any;
      const middleware = requireRole('admin');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
    it('should allow access when user has required role in array', () => {
      mockReq.user = {
        uid: 'test-user',
        role: ['user', 'admin']
      } as any;
      const middleware = requireRole('admin');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
    it('should deny access when user does not have required role (string)', () => {
      mockReq.user = {
        uid: 'test-user',
        role: 'user'
      } as any;
      const middleware = requireRole('admin');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: 'Insufficient permissions'
      }));
    });
    it('should deny access when user does not have required role (array)', () => {
      mockReq.user = {
        uid: 'test-user',
        role: ['user', 'moderator']
      } as any;
      const middleware = requireRole('admin');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: 'Insufficient permissions'
      }));
    });
    it('should allow access when user is admin regardless of role', () => {
      mockReq.user = {
        uid: 'test-user',
        role: 'user',
        admin: true
      } as any;
      const middleware = requireRole('moderator');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });
    it('should handle missing role gracefully', () => {
      mockReq.user = {
        uid: 'test-user'
      } as any;
      const middleware = requireRole('admin');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 403,
        message: 'Insufficient permissions'
      }));
    });
    it('should deny access when user is not authenticated', () => {
      mockReq.user = undefined;
      const middleware = requireRole('admin');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({
        statusCode: 401,
        message: 'User not authenticated'
      }));
    });
  });
});

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