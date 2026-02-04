import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { env } from '../utils/env';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

interface ErrorResponse {
  success: false;
  error: string;
  errors?: Array<{ field: string; message: string }>;
  stack?: string;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const response: ErrorResponse = {
    success: false,
    error: 'Internal server error',
  };

  let statusCode = 500;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    statusCode = 400;
    response.error = 'Validation failed';
    response.errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }
  // Handle custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    response.error = err.message;
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        response.error = 'A record with this value already exists';
        break;
      case 'P2025':
        statusCode = 404;
        response.error = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        response.error = 'Foreign key constraint failed';
        break;
      default:
        statusCode = 400;
        response.error = 'Database operation failed';
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    response.error = 'Invalid data provided';
  }
  // Handle other errors
  else {
    response.error = err.message || 'Internal server error';
  }

  // Include stack trace in development
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
    console.error('Error:', err);
  }

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}
