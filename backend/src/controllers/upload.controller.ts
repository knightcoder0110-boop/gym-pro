/**
 * Upload Controller
 * API endpoints for file upload management
 */

import { Request, Response } from 'express';
import { uploadService } from '../services/upload.service.js';
import { STORAGE_CONFIG, validateFile, type FileCategory } from '../config/storage.config.js';
import { storageProvider } from '../lib/storage.provider.js';
import cron from 'node-cron';

/**
 * Initiate upload - Get presigned URL
 * POST /uploads/initiate
 */
export const initiateUpload = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user.organizationId;
    const userId = (req as any).user.userId;
    const { fileName, mimeType, size, category, entityType, entityId, isPublic } = req.body;

    // Validate required fields
    if (!fileName || !mimeType || !size || !category) {
      return res.status(400).json({
        success: false,
        error: { message: 'Missing required fields: fileName, mimeType, size, category' },
      });
    }

    // Validate category
    if (!(category in STORAGE_CONFIG.limits)) {
      return res.status(400).json({
        success: false,
        error: { message: `Invalid category. Valid: ${Object.keys(STORAGE_CONFIG.limits).join(', ')}` },
      });
    }

    // Validate file before generating URL
    const validation = validateFile(mimeType, size, category as FileCategory);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { message: validation.error },
      });
    }

    const result = await uploadService.initiateUpload({
      organizationId,
      userId,
      category: category as FileCategory,
      fileName,
      mimeType,
      size,
      entityType,
      entityId,
      isPublic,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Initiate upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to initiate upload' },
    });
  }
};

/**
 * Confirm upload - After client completes upload to S3
 * POST /uploads/:id/confirm
 */
export const confirmUpload = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    const file = await uploadService.confirmUpload(id, organizationId);

    // Get URL for response - use publicUrl if available, otherwise generate signed URL
    const url = file.publicUrl || await uploadService.getFileUrl(id, organizationId);

    res.json({
      success: true,
      data: {
        id: file.id,
        url,
        key: file.key,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        category: file.category,
      },
    });
  } catch (error) {
    console.error('Confirm upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to confirm upload' },
    });
  }
};

/**
 * Link file to entity
 * POST /uploads/:id/link
 */
export const linkToEntity = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;
    const { entityType, entityId } = req.body;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: { message: 'entityType and entityId are required' },
      });
    }

    const file = await uploadService.linkToEntity(id, organizationId, entityType, entityId);

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error('Link to entity error:', error);
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to link file' },
    });
  }
};

/**
 * Get file URL (signed URL for private files)
 * GET /uploads/:id/url
 */
export const getFileUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;
    const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn as string) : undefined;

    const url = await uploadService.getFileUrl(id, organizationId, expiresIn);

    res.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error('Get file URL error:', error);
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to get file URL' },
    });
  }
};

/**
 * Delete file
 * DELETE /uploads/:id
 */
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const organizationId = (req as any).user.organizationId;

    await uploadService.deleteFile(id, organizationId);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to delete file' },
    });
  }
};

/**
 * Get files by entity
 * GET /uploads/entity/:entityType/:entityId
 */
export const getFilesByEntity = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;
    const organizationId = (req as any).user.organizationId;

    const files = await uploadService.getFilesByEntity(organizationId, entityType, entityId);

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    console.error('Get files by entity error:', error);
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to get files' },
    });
  }
};

/**
 * Get upload stats
 * GET /uploads/stats
 */
export const getUploadStats = async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user.organizationId;

    const stats = await uploadService.getUploadStats(organizationId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Failed to get stats' },
    });
  }
};

/**
 * Test S3 connection
 * GET /uploads/test-connection
 */
export const testS3Connection = async (_req: Request, res: Response) => {
  try {
    // Try to check if a test object exists (this will verify credentials and bucket access)
    const testKey = 'test-connection.txt';
    const exists = await storageProvider.objectExists(testKey);
    
    res.json({
      success: true,
      message: '✅ S3 connection successful!',
      data: {
        provider: STORAGE_CONFIG.provider,
        bucket: STORAGE_CONFIG.bucket,
        region: STORAGE_CONFIG.region,
        testPerformed: 'objectExists check',
        result: exists ? 'Test object found' : 'Test object not found (but connection works)',
      },
    });
  } catch (error: any) {
    console.error('S3 connection test error:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Failed to connect to S3';
    let troubleshooting: string[] = [];
    
    if (error.name === 'CredentialsProviderError' || error.message?.includes('credentials')) {
      errorMessage = 'Invalid AWS credentials';
      troubleshooting = [
        'Check S3_ACCESS_KEY_ID in .env',
        'Check S3_SECRET_ACCESS_KEY in .env',
        'Verify credentials are not expired',
      ];
    } else if (error.name === 'NoSuchBucket' || error.message?.includes('bucket')) {
      errorMessage = 'Bucket not found';
      troubleshooting = [
        `Verify bucket '${STORAGE_CONFIG.bucket}' exists`,
        'Check bucket name spelling in .env',
        `Verify bucket is in region '${STORAGE_CONFIG.region}'`,
      ];
    } else if (error.name === 'AccessDenied' || error.$metadata?.httpStatusCode === 403) {
      errorMessage = 'Access denied - insufficient permissions';
      troubleshooting = [
        'Verify IAM user has S3 permissions',
        'Check bucket policy allows access',
        'Ensure IAM user has AmazonS3FullAccess policy',
      ];
    }
    
    res.status(500).json({
      success: false,
      error: {
        message: errorMessage,
        details: error.message,
        troubleshooting,
      },
      config: {
        provider: STORAGE_CONFIG.provider,
        bucket: STORAGE_CONFIG.bucket,
        region: STORAGE_CONFIG.region,
        hasAccessKey: !!STORAGE_CONFIG.accessKeyId && STORAGE_CONFIG.accessKeyId !== 'AKIA...',
        hasSecretKey: !!STORAGE_CONFIG.secretAccessKey && STORAGE_CONFIG.secretAccessKey !== '...',
      },
    });
  }
};

/**
 * Get upload limits/configuration
 * GET /uploads/config
 */
export const getUploadConfig = async (_req: Request, res: Response) => {
  try {
    // Return sanitized config (no secrets)
    const config = {
      limits: Object.entries(STORAGE_CONFIG.limits).reduce(
        (acc, [category, limits]) => {
          acc[category] = {
            maxSize: limits.maxSize,
            maxSizeMB: Math.round(limits.maxSize / (1024 * 1024)),
            allowedTypes: limits.allowedTypes,
          };
          return acc;
        },
        {} as Record<string, any>
      ),
    };

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Get upload config error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get upload config' },
    });
  }
};

/**
 * Manually trigger orphan cleanup (admin only)
 * POST /uploads/cleanup
 */
export const triggerCleanup = async (req: Request, res: Response) => {
  try {
    const result = await uploadService.cleanupOrphanedFiles();

    res.json({
      success: true,
      message: 'Cleanup completed',
      data: result,
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to run cleanup' },
    });
  }
};

/**
 * Initialize cron jobs for upload cleanup
 */
export const initUploadCrons = () => {
  // Run cleanup every day at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[CRON] Running upload cleanup...');
    try {
      const result = await uploadService.cleanupOrphanedFiles();
      console.log('[CRON] Upload cleanup result:', result);
    } catch (error) {
      console.error('[CRON] Upload cleanup error:', error);
    }
  });

  console.log('[CRON] Upload cleanup cron job initialized');
};
