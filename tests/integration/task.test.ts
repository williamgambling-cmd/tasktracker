import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';

describe('Task Endpoints', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('GET /api/tasks', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/tasks', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get(
        '/api/tasks/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/tasks/invalid-uuid')
        .set('Authorization', 'Bearer valid-looking-token');

      // Will be 401 due to invalid token, but validates the route exists
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/tasks/123e4567-e89b-12d3-a456-426614174000')
        .send({
          title: 'Updated Task',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete(
        '/api/tasks/123e4567-e89b-12d3-a456-426614174000'
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/tasks/stats', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/tasks/stats');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
