import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { body, validationResult } from 'express-validator';
import { VertexAIService, RoadmapRequest } from '../../services/VertexAIService';
import rateLimit from 'express-rate-limit';

const router = Router();
const vertexAIService = new VertexAIService();

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // limit each IP to 3 roadmap requests per minute (more restrictive as roadmaps are complex)
  message: { error: 'Too many roadmap requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation for roadmap requests
const roadmapValidation = [
  body('goal').isString().isLength({ min: 1, max: 500 }).withMessage('Goal is required and must be 1-500 characters'),
  body('timeframe').optional().isString().isLength({ max: 100 }).withMessage('Timeframe must be under 100 characters'),
  body('skills').optional().isArray({ max: 20 }).withMessage('Skills must be an array with max 20 items'),
  body('skills.*').optional().isString().isLength({ max: 100 }).withMessage('Each skill must be under 100 characters'),
  body('experience').optional().isString().isLength({ max: 200 }).withMessage('Experience must be under 200 characters')
];

// POST /api/roadmap - Generate learning/career roadmap
router.post('/', 
  aiLimiter,
  roadmapValidation,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map(e => e.msg)
      });
      return;
    }

    const { goal, timeframe, skills, experience } = req.body as RoadmapRequest;

    try {
      const result = await vertexAIService.generateRoadmap({
        goal,
        timeframe,
        skills,
        experience
      });

      // Try to parse the AI response as JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(result.content);
      } catch {
        // If parsing fails, return structured content
        parsedContent = { 
          roadmap: {
            title: `Roadmap for: ${goal}`,
            overview: result.content,
            estimatedDuration: timeframe || 'Not specified',
            phases: [],
            finalOutcome: goal,
            nextSteps: []
          }
        };
      }

      res.json({
        success: true,
        data: {
          ...parsedContent,
          metadata: result.metadata
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Roadmap generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate roadmap',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

export { router as roadmapRoutes };