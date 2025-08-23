import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

// Simple API health check - different from the detailed /health endpoint
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: 'API is operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      pathfinding: 'available',
      advice: 'available',
      roadmap: 'available',
      chat: 'available'
    }
  });
}));

export { router as apiHealthRoutes };