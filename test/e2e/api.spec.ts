import { test, expect } from '@playwright/test';

test.describe('Pathfinder Application', () => {
  test('health endpoint should be accessible', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
  });

  test('API should require authentication', async ({ request }) => {
    const response = await request.post('/api/path/find', {
      data: {
        start: { lat: 40.7128, lng: -74.0060 },
        end: { lat: 40.7589, lng: -73.9851 },
        algorithm: 'astar'
      }
    });
    
    expect(response.status()).toBe(401);
  });

  test('API should work with valid authentication', async ({ request }) => {
    // Skip this test in CI since it requires actual Firebase setup
    test.skip(!!process.env.CI, 'Skipping auth test in CI');
    
    const response = await request.post('/api/path/find', {
      headers: {
        'Authorization': 'Bearer valid-test-token'
      },
      data: {
        start: { lat: 40.7128, lng: -74.0060 },
        end: { lat: 40.7589, lng: -73.9851 },
        algorithm: 'astar'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
  });
});