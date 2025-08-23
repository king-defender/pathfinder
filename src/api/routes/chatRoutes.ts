import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { body, validationResult } from 'express-validator';
import { VertexAIService, ChatRequest, ChatMessage } from '../../services/VertexAIService';
import rateLimit from 'express-rate-limit';

const router = Router();
const vertexAIService = new VertexAIService();

// Rate limiting for chat endpoints
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 chat messages per minute
  message: { error: 'Too many chat requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation for chat requests
const chatValidation = [
  body('messages').isArray({ min: 1, max: 50 }).withMessage('Messages array is required with 1-50 messages'),
  body('messages.*.role').isIn(['user', 'assistant']).withMessage('Message role must be either "user" or "assistant"'),
  body('messages.*.content').isString().isLength({ min: 1, max: 2000 }).withMessage('Message content is required and must be 1-2000 characters'),
  body('context').optional().isString().isLength({ max: 1000 }).withMessage('Context must be under 1000 characters')
];

// POST /api/chat - Interactive chat with AI
router.post('/', 
  chatLimiter,
  chatValidation,
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

    const { messages, context } = req.body as ChatRequest;

    // Validate that the last message is from user
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role !== 'user') {
      res.status(400).json({
        success: false,
        error: 'Last message must be from user'
      });
      return;
    }

    try {
      const result = await vertexAIService.generateChatResponse({
        messages,
        context
      });

      // Try to parse the AI response as JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(result.content);
      } catch {
        // If parsing fails, return raw content as response
        parsedContent = { 
          response: result.content,
          suggestions: []
        };
      }

      // Create assistant message for response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: parsedContent.response || result.content,
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: {
          message: assistantMessage,
          suggestions: parsedContent.suggestions || [],
          metadata: result.metadata
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Chat generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate chat response',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

// GET /api/chat/health - Simple health check for chat service
router.get('/health', 
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      // Simple test to verify AI service is working
      const testResult = await vertexAIService.generateChatResponse({
        messages: [{ role: 'user', content: 'Hello, are you working?' }]
      });

      res.json({
        success: true,
        status: 'healthy',
        message: 'Chat service is operational',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: 'Chat service is not responding',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  })
);

export { router as chatRoutes };