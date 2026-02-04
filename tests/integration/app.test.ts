import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';

describe('App', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBe('test');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('should return 404 for unknown methods on known routes', async () => {
      const response = await request(app).patch('/api/auth/register');

      expect(response.status).toBe(404);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include helmet security headers', async () => {
      const response = await request(app).get('/health');

      // Helmet adds various security headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBeDefined();
    });
  });
});
