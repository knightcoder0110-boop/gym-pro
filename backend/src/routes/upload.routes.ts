/**
 * Upload Routes
 * File upload API endpoints
 */

import { Router } from 'express';
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

// All routes require authentication
router.use(authenticate);

// Configuration and testing
router.get('/config', getUploadConfig);
router.get('/test-connection', testS3Connection);

// Upload flow
router.post('/initiate', initiateUpload);
router.post('/:id/confirm', confirmUpload);
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
