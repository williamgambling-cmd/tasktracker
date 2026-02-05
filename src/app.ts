import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { env } from './utils/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimit';

export function createApp(): Application {
  const app = express();

  // Security middleware - allow inline scripts for the served frontend
  app.use(helmet({
    contentSecurityPolicy: false,
  }));

  // CORS configuration
  app.use(
    cors({
      origin: env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(','),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24 hours
    })
  );

  // Rate limiting
  app.use(globalRateLimiter);

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  // Serve static frontend files
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // API routes
  app.use('/api', routes);

  // Serve index.html for non-API routes (SPA fallback)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  // 404 handler (for API routes only now)
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
