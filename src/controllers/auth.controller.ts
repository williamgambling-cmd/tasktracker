import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../models/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { ConflictError, UnauthorizedError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { email, password, name } = req.body as RegisterInput;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    sendCreated(res, { user, token }, 'User registered successfully');
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { email, password } = req.body as LoginInput;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
}

export async function getProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    sendSuccess(res, {
      ...user,
      taskCount: user._count.tasks,
      _count: undefined,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { name } = req.body as { name: string };

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, user, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
}

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
});
