import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Array<{ field: string; message: string }>
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message?: string): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendNoContent(res: Response): Response {
  return res.status(204).send();
}
