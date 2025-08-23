import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireRole, AuthenticatedRequest, normalizeUserRoles } from '../../src/middleware/auth';

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