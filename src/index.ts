import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables - try multiple locations for flexibility
import { existsSync } from 'fs';
if (existsSync('./api/.env')) {
  dotenv.config({ path: './api/.env' });
} else {
  dotenv.config(); // Fallback to default .env location
}

import { healthRoutes } from './api/routes/healthRoutes';
import { pathRoutes } from './api/routes/pathRoutes';
import { adviceRoutes } from './api/routes/adviceRoutes';
import { roadmapRoutes } from './api/routes/roadmapRoutes';
import { chatRoutes } from './api/routes/chatRoutes';
import { apiHealthRoutes } from './api/routes/apiHealthRoutes';
// Import auth middleware to ensure Firebase is initialized
import './middleware/auth';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS ?? '100', 10), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.use('/health', healthRoutes);

// API routes
app.use('/api/health', apiHealthRoutes);
app.use('/api/path', pathRoutes);
app.use('/api/advice', adviceRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/chat', chatRoutes);

// API root endpoint
app.get('/api', (_req, res) => {
  res.json({
    message: 'Pathfinder API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      healthDetailed: '/health/detailed',
      apiHealth: '/api/health',
      pathfinding: '/api/path/*',
      advice: '/api/advice',
      roadmap: '/api/roadmap',
      chat: '/api/chat',
    },
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
});

// Error handling middleware
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Something went wrong',
    });
  }
);

// Start server only when this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Pathfinder server running on port ${PORT}`);
    console.log(`📖 Health check: http://localhost:${PORT}/health`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV ?? 'development'}`);
  });
}

export default app;
