/**
 * Upload Routes
 * File upload API endpoints with rate limiting
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  initiateUpload,
  confirmUpload,
  linkToEntity,
  getFileUrl,
  deleteFile,
  getFilesByEntity,
  getUploadStats,
  getUploadConfig,
  triggerCleanup,
  testS3Connection,
} from '../controllers/upload.controller.js';

const router: ReturnType<typeof Router> = Router();

// Rate limiters for upload endpoints
// Note: Since all upload routes require authentication, we use userId as the key
// This avoids IPv6 validation issues with req.ip
const uploadInitiateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 uploads per window per user
  keyGenerator: (req) => req.user?.userId || 'anonymous',
  message: {
    success: false,
    error: {
      message: 'Too many upload requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

const uploadConfirmLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Allow more confirms than initiates (retries)
  keyGenerator: (req) => req.user?.userId || 'anonymous',
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// All routes require authentication
router.use(authenticate);

// Configuration and testing
router.get('/config', getUploadConfig);
router.get('/test-connection', testS3Connection);

// Upload flow with rate limiting
router.post('/initiate', uploadInitiateLimiter, initiateUpload);
router.post('/:id/confirm', uploadConfirmLimiter, confirmUpload);
router.post('/:id/link', linkToEntity);

// File operations
router.get('/:id/url', getFileUrl);
router.delete('/:id', deleteFile);

// Entity-based queries
router.get('/entity/:entityType/:entityId', getFilesByEntity);

// Stats and admin
router.get('/stats', getUploadStats);
router.post('/cleanup', triggerCleanup);

export default router;
