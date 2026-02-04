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
import { authRateLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authRateLimiter, validate(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT
 * @access  Public
 */
router.post('/login', authRateLimiter, validate(loginSchema), login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;
