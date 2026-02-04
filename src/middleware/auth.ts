import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { sendError } from '../utils/response';
import { AuthenticatedRequest } from '../types';

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    sendError(res, 'Authorization header is required', 401);
    return;
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    sendError(res, 'Authorization header must be in format: Bearer <token>', 401);
    return;
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        sendError(res, 'Token has expired', 401);
        return;
      }
      if (error.name === 'JsonWebTokenError') {
        sendError(res, 'Invalid token', 401);
        return;
      }
    }
    sendError(res, 'Authentication failed', 401);
  }
}
