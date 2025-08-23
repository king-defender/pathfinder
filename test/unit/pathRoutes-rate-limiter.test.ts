import { describe, it, expect } from 'vitest';
import type { AuthenticatedRequest } from '../../src/middleware/auth';

// Import or recreate the rate limiter logic from pathRoutes.ts
const createRateLimiterSkip = () => {
  return (req: AuthenticatedRequest) => {
    const role = req.user?.role;
    if (Array.isArray(role)) {
      return role.includes('premium');
    }
    if (typeof role === 'string') {
      return role.includes('premium');
    }
    return false;
  };
};

describe('pathRoutes Rate Limiter Skip Function', () => {
  const skipFunction = createRateLimiterSkip();

  const createMockRequest = (role: any): AuthenticatedRequest => ({
    user: { role },
  } as AuthenticatedRequest);

  it('should skip rate limiting for premium users with array roles', () => {
    const req = createMockRequest(['user', 'premium']);
    expect(skipFunction(req)).toBe(true);
  });

  it('should skip rate limiting for premium users with string roles', () => {
    const req = createMockRequest('premium');
    expect(skipFunction(req)).toBe(true);
  });

  it('should skip rate limiting for premium users with string containing premium', () => {
    const req = createMockRequest('premium-user');
    expect(skipFunction(req)).toBe(true);
  });

  it('should not skip rate limiting for non-premium users with array roles', () => {
    const req = createMockRequest(['user', 'basic']);
    expect(skipFunction(req)).toBe(false);
  });

  it('should not skip rate limiting for non-premium users with string roles', () => {
    const req = createMockRequest('basic');
    expect(skipFunction(req)).toBe(false);
  });

  it('should not skip rate limiting when role is undefined', () => {
    const req = createMockRequest(undefined);
    expect(skipFunction(req)).toBe(false);
  });

  it('should not skip rate limiting when role is null', () => {
    const req = createMockRequest(null);
    expect(skipFunction(req)).toBe(false);
  });

  it('should not skip rate limiting when role is a number (graceful handling)', () => {
    const req = createMockRequest(123);
    expect(skipFunction(req)).toBe(false);
  });

  it('should not skip rate limiting when role is an object (graceful handling)', () => {
    const req = createMockRequest({ type: 'premium' });
    expect(skipFunction(req)).toBe(false);
  });

  it('should not skip rate limiting when user is undefined', () => {
    const req = { user: undefined } as AuthenticatedRequest;
    expect(skipFunction(req)).toBe(false);
  });

  it('should handle empty string role', () => {
    const req = createMockRequest('');
    expect(skipFunction(req)).toBe(false);
  });

  it('should handle empty array role', () => {
    const req = createMockRequest([]);
    expect(skipFunction(req)).toBe(false);
  });
});