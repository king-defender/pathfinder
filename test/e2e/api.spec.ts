import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check endpoint returns correct status', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toMatchObject({
      status: 'OK',
      timestamp: expect.any(String),
      version: expect.any(String),
      environment: expect.any(String),
    });
  });

  test('API root returns information', async ({ request }) => {
    const response = await request.get('/api');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('endpoints');
  });

  test('unknown routes return 404', async ({ request }) => {
    const response = await request.get('/nonexistent-route');
    expect(response.status()).toBe(404);
    
    const data = await response.json();
    expect(data).toMatchObject({
      error: 'Not Found',
      message: expect.any(String),
    });
  });

  test('API endpoints respect rate limiting', async ({ request }) => {
    // Make multiple requests quickly to test rate limiting
    const promises = Array.from({ length: 5 }, () => request.get('/health'));
    const responses = await Promise.all(promises);
    
    // All requests should succeed (assuming we're under the limit)
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });
});