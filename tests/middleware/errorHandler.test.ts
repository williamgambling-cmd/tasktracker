import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodIssueCode } from 'zod';
import { Prisma } from '@prisma/client';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
  errorHandler,
  notFoundHandler,
} from '../../src/middleware/errorHandler';

// Helper to create mock Express objects
function createMocks(overrides: { method?: string; path?: string } = {}) {
  const req = {
    method: overrides.method || 'GET',
    path: overrides.path || '/test',
  } as unknown as Request;

  const jsonFn = jest.fn();
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn });
  const res = {
    status: statusFn,
    json: jsonFn,
  } as unknown as Response;

  const next = jest.fn() as NextFunction;

  return { req, res, statusFn, jsonFn, next };
}

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with statusCode and isOperational defaults to true', () => {
      const err = new AppError('Something went wrong', 500);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toBe('Something went wrong');
      expect(err.statusCode).toBe(500);
      expect(err.isOperational).toBe(true);
    });

    it('should allow overriding isOperational to false', () => {
      const err = new AppError('Critical failure', 500, false);
      expect(err.isOperational).toBe(false);
    });

    it('should have a stack trace', () => {
      const err = new AppError('test', 400);
      expect(err.stack).toBeDefined();
    });
  });

  describe('NotFoundError', () => {
    it('should default to 404 and "Resource not found" message', () => {
      const err = new NotFoundError();
      expect(err.statusCode).toBe(404);
      expect(err.message).toBe('Resource not found');
      expect(err).toBeInstanceOf(AppError);
    });

    it('should accept a custom message', () => {
      const err = new NotFoundError('Task not found');
      expect(err.message).toBe('Task not found');
      expect(err.statusCode).toBe(404);
    });
  });

  describe('UnauthorizedError', () => {
    it('should default to 401 and "Unauthorized" message', () => {
      const err = new UnauthorizedError();
      expect(err.statusCode).toBe(401);
      expect(err.message).toBe('Unauthorized');
    });

    it('should accept a custom message', () => {
      const err = new UnauthorizedError('Token expired');
      expect(err.message).toBe('Token expired');
    });
  });

  describe('ForbiddenError', () => {
    it('should default to 403 and "Forbidden" message', () => {
      const err = new ForbiddenError();
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe('Forbidden');
    });
  });

  describe('BadRequestError', () => {
    it('should default to 400 and "Bad request" message', () => {
      const err = new BadRequestError();
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('Bad request');
    });
  });

  describe('ConflictError', () => {
    it('should default to 409 and "Resource already exists" message', () => {
      const err = new ConflictError();
      expect(err.statusCode).toBe(409);
      expect(err.message).toBe('Resource already exists');
    });
  });
});

describe('errorHandler', () => {
  it('should handle AppError and return correct status code', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new AppError('Custom error', 422);

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(422);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Custom error',
      })
    );
  });

  it('should handle NotFoundError', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new NotFoundError('User not found');

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(404);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'User not found',
      })
    );
  });

  it('should handle UnauthorizedError', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new UnauthorizedError();

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(401);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Unauthorized',
      })
    );
  });

  it('should handle ZodError with formatted validation errors', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const zodError = new ZodError([
      {
        code: ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'number',
        path: ['email'],
        message: 'Expected string, received number',
      },
      {
        code: ZodIssueCode.too_small,
        minimum: 6,
        type: 'string',
        inclusive: true,
        exact: false,
        path: ['password'],
        message: 'String must contain at least 6 character(s)',
      },
    ]);

    errorHandler(zodError, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
        errors: [
          { field: 'email', message: 'Expected string, received number' },
          { field: 'password', message: 'String must contain at least 6 character(s)' },
        ],
      })
    );
  });

  it('should handle ZodError with nested paths', () => {
    const { req, res, jsonFn, next } = createMocks();
    const zodError = new ZodError([
      {
        code: ZodIssueCode.invalid_type,
        expected: 'string',
        received: 'undefined',
        path: ['address', 'street'],
        message: 'Required',
      },
    ]);

    errorHandler(zodError, req, res, next);

    const response = jsonFn.mock.calls[0][0];
    expect(response.errors[0].field).toBe('address.street');
  });

  it('should handle Prisma P2002 unique constraint error', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '5.0.0' }
    );

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(409);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'A record with this value already exists',
      })
    );
  });

  it('should handle Prisma P2025 record not found error', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      { code: 'P2025', clientVersion: '5.0.0' }
    );

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(404);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Record not found',
      })
    );
  });

  it('should handle Prisma P2003 foreign key constraint error', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new Prisma.PrismaClientKnownRequestError(
      'Foreign key constraint failed',
      { code: 'P2003', clientVersion: '5.0.0' }
    );

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Foreign key constraint failed',
      })
    );
  });

  it('should handle unknown Prisma known request error codes as 400', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new Prisma.PrismaClientKnownRequestError(
      'Some other error',
      { code: 'P2010', clientVersion: '5.0.0' }
    );

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Database operation failed',
      })
    );
  });

  it('should handle PrismaClientValidationError', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new Prisma.PrismaClientValidationError(
      'Invalid data',
      { clientVersion: '5.0.0' }
    );

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(400);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Invalid data provided',
      })
    );
  });

  it('should handle generic Error with its message', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new Error('Something broke');

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(500);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Something broke',
      })
    );
  });

  it('should handle generic Error with no message', () => {
    const { req, res, statusFn, jsonFn, next } = createMocks();
    const err = new Error();

    errorHandler(err, req, res, next);

    expect(statusFn).toHaveBeenCalledWith(500);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Internal server error',
      })
    );
  });

  describe('development mode stack trace', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development mode', () => {
      jest.resetModules();
      process.env.NODE_ENV = 'development';

      // Re-require to get fresh env with NODE_ENV=development
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { errorHandler: devErrorHandler } = require('../../src/middleware/errorHandler');
      const { req, res, jsonFn, next } = createMocks();
      const err = new Error('dev error');

      // Suppress console.error in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      devErrorHandler(err, req, res, next);

      const response = jsonFn.mock.calls[0][0];
      expect(response.stack).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

describe('notFoundHandler', () => {
  it('should return 404 with the request method and path', () => {
    const { req, res, statusFn, jsonFn } = createMocks({ method: 'POST', path: '/api/tasks' });

    notFoundHandler(req, res);

    expect(statusFn).toHaveBeenCalledWith(404);
    expect(jsonFn).toHaveBeenCalledWith({
      success: false,
      error: 'Route POST /api/tasks not found',
    });
  });

  it('should include GET method for GET requests', () => {
    const { req, res, statusFn, jsonFn } = createMocks({ method: 'GET', path: '/api/unknown' });

    notFoundHandler(req, res);

    expect(statusFn).toHaveBeenCalledWith(404);
    expect(jsonFn).toHaveBeenCalledWith({
      success: false,
      error: 'Route GET /api/unknown not found',
    });
  });
});
