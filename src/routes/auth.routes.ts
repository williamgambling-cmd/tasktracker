import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { authRateLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(register));

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(login));

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, asyncHandler(getProfile));

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, validate(updateProfileSchema), asyncHandler(updateProfile));

export default router;
