import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../models/prisma';
import { sendSuccess, sendCreated, sendNoContent, sendError } from '../utils/response';
import { NotFoundError, ForbiddenError } from '../middleware/errorHandler';
import { AuthenticatedRequest, PaginatedResponse } from '../types';
import { Task, TaskStatus, Priority } from '@prisma/client';

// Validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).default('PENDING'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .transform((val) => new Date(val))
    .optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long').optional(),
  description: z.string().max(2000, 'Description is too long').nullable().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format' })
    .transform((val) => new Date(val))
    .nullable()
    .optional(),
});

export const taskQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const taskIdSchema = z.object({
  id: z.string().uuid('Invalid task ID format'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;

// Helper function to verify task ownership
async function getTaskWithOwnerCheck(
  taskId: string,
  userId: string
): Promise<Task> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new NotFoundError('Task not found');
  }

  if (task.userId !== userId) {
    throw new ForbiddenError('You do not have permission to access this task');
  }

  return task;
}

export async function createTask(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const data = req.body as CreateTaskInput;

    const task = await prisma.task.create({
      data: {
        ...data,
        userId: req.user.userId,
      },
    });

    sendCreated(res, task, 'Task created successfully');
  } catch (error) {
    next(error);
  }
}

export async function getTasks(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const query = req.query as unknown as TaskQuery;
    const { page, limit, status, priority, search, sortBy, sortOrder } = query;

    // Build where clause
    const where: {
      userId: string;
      status?: TaskStatus;
      priority?: Priority;
      OR?: Array<{ title: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>;
    } = {
      userId: req.user.userId,
    };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Build orderBy
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [sortBy]: sortOrder,
    };

    // Get tasks
    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<Task> = {
      items: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    sendSuccess(res, response);
  } catch (error) {
    next(error);
  }
}

export async function getTaskById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { id } = req.params;
    const task = await getTaskWithOwnerCheck(id, req.user.userId);

    sendSuccess(res, task);
  } catch (error) {
    next(error);
  }
}

export async function updateTask(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { id } = req.params;
    const data = req.body as UpdateTaskInput;

    // Verify ownership
    await getTaskWithOwnerCheck(id, req.user.userId);

    const task = await prisma.task.update({
      where: { id },
      data,
    });

    sendSuccess(res, task, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const { id } = req.params;

    // Verify ownership
    await getTaskWithOwnerCheck(id, req.user.userId);

    await prisma.task.delete({
      where: { id },
    });

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
}

export async function getTaskStats(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    const [statusCounts, priorityCounts, total] = await Promise.all([
      prisma.task.groupBy({
        by: ['status'],
        where: { userId: req.user.userId },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { userId: req.user.userId },
        _count: true,
      }),
      prisma.task.count({
        where: { userId: req.user.userId },
      }),
    ]);

    const stats = {
      total,
      byStatus: {
        pending: statusCounts.find((s) => s.status === 'PENDING')?._count ?? 0,
        inProgress: statusCounts.find((s) => s.status === 'IN_PROGRESS')?._count ?? 0,
        completed: statusCounts.find((s) => s.status === 'COMPLETED')?._count ?? 0,
      },
      byPriority: {
        low: priorityCounts.find((p) => p.priority === 'LOW')?._count ?? 0,
        medium: priorityCounts.find((p) => p.priority === 'MEDIUM')?._count ?? 0,
        high: priorityCounts.find((p) => p.priority === 'HIGH')?._count ?? 0,
      },
    };

    sendSuccess(res, stats);
  } catch (error) {
    next(error);
  }
}
