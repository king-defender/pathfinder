import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Health Routes - Real Implementation', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('memory');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health information with real service checks', async () => {
      const response = await request(app)
        .get('/health/detailed');

      // Accept either 200 (all healthy) or 503 (some services degraded) since we expect some failures
      expect([200, 503]).toContain(response.status);
      
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('system');
      
      // Check that services have real status checks (not just simulated)
      expect(response.body.services).toHaveProperty('database');
      expect(response.body.services).toHaveProperty('cache');
      expect(response.body.services).toHaveProperty('external_apis');
      
      // Verify service structure includes proper error handling
      const dbService = response.body.services.database;
      expect(dbService).toHaveProperty('status');
      expect(['healthy', 'unhealthy']).toContain(dbService.status);
      
      const cacheService = response.body.services.cache;
      expect(cacheService).toHaveProperty('status');
      expect(['healthy', 'unhealthy']).toContain(cacheService.status);
      
      // Since we may not have real services running, expect proper error messages
      if (dbService.status === 'unhealthy') {
        expect(dbService).toHaveProperty('error');
        expect(typeof dbService.error).toBe('string');
      }
      
      if (cacheService.status === 'unhealthy') {
        expect(cacheService).toHaveProperty('error');
        expect(typeof cacheService.error).toBe('string');
      }
    });

    it('should include external API checks', async () => {
      const response = await request(app)
        .get('/health/detailed');

      expect([200, 503]).toContain(response.status);
      
      const externalApis = response.body.services.external_apis;
      expect(externalApis).toHaveProperty('status');
      expect(externalApis).toHaveProperty('services');
      expect(externalApis.services).toHaveProperty('firebase');
      expect(externalApis.services).toHaveProperty('maps');
      
      // Verify Firebase check structure
      const firebaseService = externalApis.services.firebase;
      expect(firebaseService).toHaveProperty('status');
      expect(['healthy', 'unhealthy']).toContain(firebaseService.status);
      
      // Verify Maps API check structure  
      const mapsService = externalApis.services.maps;
      expect(mapsService).toHaveProperty('status');
      expect(['healthy', 'unhealthy']).toContain(mapsService.status);
    });
  });
});