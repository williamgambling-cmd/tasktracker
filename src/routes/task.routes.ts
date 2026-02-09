import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
  sendTaskSummary,
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  taskIdSchema,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate, validateRequest } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/tasks/stats
 * @desc    Get task statistics for current user
 * @access  Private
 */
router.get('/stats', asyncHandler(getTaskStats));

/**
 * @route   POST /api/tasks/summary
 * @desc    Send task summary to Slack
 * @access  Private
 */
router.post('/summary', asyncHandler(sendTaskSummary));

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for current user with filtering and pagination
 * @access  Private
 */
router.get('/', validate(taskQuerySchema, 'query'), asyncHandler(getTasks));

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', validate(createTaskSchema), asyncHandler(createTask));

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest({ params: taskIdSchema }),
  asyncHandler(getTaskById)
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest({ params: taskIdSchema, body: updateTaskSchema }),
  asyncHandler(updateTask)
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest({ params: taskIdSchema }),
  asyncHandler(deleteTask)
);

export default router;
