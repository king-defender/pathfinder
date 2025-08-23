import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { body, validationResult } from 'express-validator';
import { VertexAIService, AdviceRequest } from '../../services/VertexAIService';
import rateLimit from 'express-rate-limit';

const router = Router();
const vertexAIService = new VertexAIService();

// Rate limiting for AI endpoints - more restrictive than general API
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 AI requests per minute
  message: { error: 'Too many AI requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation for advice requests
const adviceValidation = [
  body('query').isString().isLength({ min: 1, max: 1000 }).withMessage('Query is required and must be 1-1000 characters'),
  body('context').optional().isString().isLength({ max: 2000 }).withMessage('Context must be under 2000 characters'),
  body('preferences').optional().isObject().withMessage('Preferences must be an object')
];

// POST /api/advice - Get AI-powered advice
router.post('/', 
  aiLimiter,
  adviceValidation,
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

    const { query, context, preferences } = req.body as AdviceRequest;

    try {
      const result = await vertexAIService.generateAdvice({
        query,
        context,
        preferences
      });

      // Try to parse the AI response as JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(result.content);
      } catch {
        // If parsing fails, return raw content
        parsedContent = { advice: result.content };
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
      console.error('Advice generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate advice',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

export { router as adviceRoutes };