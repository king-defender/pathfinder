import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { asyncHandler, createError } from '../../middleware/errorHandler';
import { body, validationResult } from 'express-validator';
import { PathfindingService } from '../../services/PathfindingService';
import rateLimit from 'express-rate-limit';

const router = Router();
const pathfindingService = new PathfindingService();

// Rate limiting for pathfinding operations
const pathfindingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: { error: 'Too many pathfinding requests. Please try again later.' },
  skip: (req: AuthenticatedRequest) => req.user?.role?.includes('premium') || false
});

// Validation rules for path calculation
const pathValidation = [
  body('start.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid start latitude'),
  body('start.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid start longitude'),
  body('end.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid end latitude'),
  body('end.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid end longitude'),
  body('algorithm').isIn(['astar', 'dijkstra', 'bfs']).withMessage('Invalid algorithm'),
  body('options').optional().isObject().withMessage('Options must be an object')
];

// Calculate path between two points
router.post('/find', 
  pathfindingLimiter,
  pathValidation,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const { start, end, algorithm, options = {} } = req.body;
    const userId = req.user!.uid;

    const result = await pathfindingService.findPath({
      start,
      end,
      algorithm,
      options,
      userId
    });

    res.json({
      success: true,
      data: result,
      algorithm,
      timestamp: new Date().toISOString()
    });
  })
);

// Batch path calculation
router.post('/batch',
  pathfindingLimiter,
  body('requests').isArray({ min: 1, max: 10 }).withMessage('Requests must be an array of 1-10 items'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw createError('Validation failed: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const { requests } = req.body;
    const userId = req.user!.uid;

    const results = await pathfindingService.batchFindPath(requests, userId);

    res.json({
      success: true,
      data: results,
      count: results.length,
      timestamp: new Date().toISOString()
    });
  })
);

// Get user's path history
router.get('/history',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.uid;
    const { page = 1, limit = 20 } = req.query;

    const history = await pathfindingService.getPathHistory(
      userId, 
      Number(page), 
      Number(limit)
    );

    res.json({
      success: true,
      data: history.paths,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: history.total,
        pages: Math.ceil(history.total / Number(limit))
      }
    });
  })
);

// Get path by ID
router.get('/:pathId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pathId } = req.params;
    const userId = req.user!.uid;

    if (!pathId) {
      throw createError('Path ID is required', 400);
    }

    const path = await pathfindingService.getPath(pathId, userId);
    
    if (!path) {
      throw createError('Path not found', 404);
    }

    res.json({
      success: true,
      data: path
    });
  })
);

// Delete path
router.delete('/:pathId',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { pathId } = req.params;
    const userId = req.user!.uid;

    if (!pathId) {
      throw createError('Path ID is required', 400);
    }

    await pathfindingService.deletePath(pathId, userId);

    res.json({
      success: true,
      message: 'Path deleted successfully'
    });
  })
);

export { router as pathRoutes };