import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import admin from 'firebase-admin';
import { createClient } from 'redis';

const router = Router();

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '0.1.0',
    memory: {
      used: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };

  res.json(healthData);
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      cache: await checkCache(),
      external_apis: await checkExternalAPIs()
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      version: process.version
    }
  };

  const overallStatus = Object.values(health.services).every(service => service.status === 'healthy')
    ? 'healthy'
    : 'degraded';

  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    ...health,
    status: overallStatus
  });
}));

async function checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    
    // Check Firestore connection by performing a simple read operation
    const testCollection = admin.firestore().collection('_health_check');
    await testCollection.limit(1).get();
    
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function checkCache(): Promise<{ status: string; latency?: number; error?: string }> {
  try {
    const start = Date.now();
    
    // Check Redis connection
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const redis = createClient({ url: redisUrl });
    
    // Connect and ping Redis
    await redis.connect();
    await redis.ping();
    await redis.disconnect();
    
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Redis connection failed' 
    };
  }
}

async function checkExternalAPIs(): Promise<{ status: string; services: Record<string, { status: string; error?: string }> }> {
  const services = {
    firebase: await checkFirebase(),
    maps: await checkMapsAPI()
  };

  const allHealthy = Object.values(services).every(service => service.status === 'healthy');
  
  return {
    status: allHealthy ? 'healthy' : 'degraded',
    services
  };
}

async function checkFirebase(): Promise<{ status: string; error?: string }> {
  try {
    // Check Firebase Admin connectivity by testing authentication service
    await admin.auth().listUsers(1);
    
    return { status: 'healthy' };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Firebase connection failed' 
    };
  }
}

async function checkMapsAPI(): Promise<{ status: string; error?: string }> {
  try {
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!googleMapsApiKey) {
      return { 
        status: 'unhealthy', 
        error: 'Google Maps API key not configured' 
      };
    }
    
    // Test Google Maps API with a simple geocoding request
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${googleMapsApiKey}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
      return { status: 'healthy' };
    } else {
      return { 
        status: 'unhealthy', 
        error: `Maps API error: ${data.status}` 
      };
    }
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Maps API connection failed' 
    };
  }
}

export { router as healthRoutes };