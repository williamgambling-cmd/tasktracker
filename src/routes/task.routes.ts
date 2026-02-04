import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats,
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema,
  taskIdSchema,
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';
import { validate, validateRequest } from '../middleware/validate';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/tasks/stats
 * @desc    Get task statistics for current user
 * @access  Private
 */
router.get('/stats', getTaskStats);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks for current user with filtering and pagination
 * @access  Private
 */
router.get('/', validate(taskQuerySchema, 'query'), getTasks);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Private
 */
router.post('/', validate(createTaskSchema), createTask);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest({ params: taskIdSchema }),
  getTaskById
);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Private
 */
router.put(
  '/:id',
  validateRequest({ params: taskIdSchema, body: updateTaskSchema }),
  updateTask
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest({ params: taskIdSchema }),
  deleteTask
);

export default router;
