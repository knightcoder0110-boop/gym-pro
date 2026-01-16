/**
 * Upload Service
 * High-level file upload orchestration with database tracking
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { storageProvider } from '../lib/storage.provider.js';
import {
  STORAGE_CONFIG,
  validateFile,
  sanitizeFilename,
  getExtensionFromMime,
  type FileCategory,
} from '../config/storage.config.js';
import { FileStatus, type FileUpload } from '@prisma/client';

export interface InitiateUploadParams {
  organizationId: string;
  userId: string;
  category: FileCategory;
  fileName: string;
  mimeType: string;
  size: number;
  entityType?: string;
  entityId?: string;
  isPublic?: boolean;
}

export interface InitiateUploadResult {
  uploadId: string;
  uploadUrl: string;
  key: string;
  expiresAt: Date;
}

export interface UploadedFile {
  id: string;
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
}

export const uploadService = {
  /**
   * Initiate upload - generates presigned URL and creates DB record
   */
  async initiateUpload(params: InitiateUploadParams): Promise<InitiateUploadResult> {
    // Validate file against category limits
    const validation = validateFile(params.mimeType, params.size, params.category);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Generate unique key for storage
    const sanitizedName = sanitizeFilename(params.fileName);
    const extension = getExtensionFromMime(params.mimeType);
    const uniqueId = uuidv4();
    const storagePath = STORAGE_CONFIG.getStoragePath(
      params.organizationId,
      params.category,
      params.entityType,
      params.entityId
    );
    const key = `${storagePath}/${uniqueId}.${extension}`;

    // Get presigned upload URL
    const presigned = await storageProvider.getPresignedUploadUrl(
      key,
      params.mimeType,
      params.size
    );

    // Create database record
    const fileUpload = await prisma.fileUpload.create({
      data: {
        organizationId: params.organizationId,
        key,
        originalName: params.fileName,
        mimeType: params.mimeType,
        size: params.size,
        category: params.category as any,
        entityType: params.entityType,
        entityId: params.entityId,
        status: FileStatus.PENDING,
        isPublic: params.isPublic ?? false,
        uploadedById: params.userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours to confirm
      },
    });

    return {
      uploadId: fileUpload.id,
      uploadUrl: presigned.url,
      key: presigned.key,
      expiresAt: presigned.expiresAt,
    };
  },

  /**
   * Confirm upload - marks upload as complete after client uploads to S3
   */
  async confirmUpload(
    uploadId: string,
    organizationId: string
  ): Promise<FileUpload> {
    const fileUpload = await prisma.fileUpload.findFirst({
      where: { id: uploadId, organizationId },
    });

    if (!fileUpload) {
      throw new Error('Upload not found');
    }

    if (fileUpload.status === FileStatus.CONFIRMED) {
      return fileUpload; // Already confirmed
    }

    // Verify file exists in storage
    const exists = await storageProvider.objectExists(fileUpload.key);
    if (!exists) {
      throw new Error('File not found in storage. Upload may have failed.');
    }

    // Generate public URL if file is public
    let publicUrl: string | null = null;
    if (fileUpload.isPublic) {
      publicUrl = storageProvider.getPublicUrl(fileUpload.key);
    }

    // Update status
    const updated = await prisma.fileUpload.update({
      where: { id: uploadId },
      data: {
        status: FileStatus.UPLOADED,
        uploadedAt: new Date(),
        publicUrl,
        expiresAt: null, // Remove expiry since upload is confirmed
      },
    });

    return updated;
  },

  /**
   * Link file to an entity (member, product, etc.)
   */
  async linkToEntity(
    uploadId: string,
    organizationId: string,
    entityType: string,
    entityId: string
  ): Promise<FileUpload> {
    const fileUpload = await prisma.fileUpload.findFirst({
      where: { id: uploadId, organizationId },
    });

    if (!fileUpload) {
      throw new Error('Upload not found');
    }

    const updated = await prisma.fileUpload.update({
      where: { id: uploadId },
      data: {
        entityType,
        entityId,
        status: FileStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
    });

    return updated;
  },

  /**
   * Get file URL (signed for private, public for public files)
   */
  async getFileUrl(
    uploadId: string,
    organizationId: string,
    expiresIn?: number
  ): Promise<string> {
    const fileUpload = await prisma.fileUpload.findFirst({
      where: { id: uploadId, organizationId },
    });

    if (!fileUpload) {
      throw new Error('File not found');
    }

    // If file is public and has cached URL, return it
    if (fileUpload.isPublic && fileUpload.publicUrl) {
      return fileUpload.publicUrl;
    }

    // Generate signed URL for private files
    return storageProvider.getPresignedDownloadUrl(fileUpload.key, expiresIn);
  },

  /**
   * Get file URL by key (for internal use)
   */
  async getFileUrlByKey(
    key: string,
    isPublic: boolean = false,
    expiresIn?: number
  ): Promise<string> {
    if (isPublic) {
      return storageProvider.getPublicUrl(key);
    }
    return storageProvider.getPresignedDownloadUrl(key, expiresIn);
  },

  /**
   * Delete a single file
   */
  async deleteFile(
    uploadId: string,
    organizationId: string
  ): Promise<void> {
    const fileUpload = await prisma.fileUpload.findFirst({
      where: { id: uploadId, organizationId },
    });

    if (!fileUpload) {
      throw new Error('File not found');
    }

    // Delete from storage
    try {
      await storageProvider.deleteObject(fileUpload.key);
    } catch (error) {
      console.error('Failed to delete from storage:', error);
      // Continue to mark as deleted in DB even if storage delete fails
    }

    // Soft delete in database
    await prisma.fileUpload.update({
      where: { id: uploadId },
      data: { status: FileStatus.DELETED },
    });
  },

  /**
   * Delete multiple files
   */
  async deleteFiles(uploadIds: string[], organizationId: string): Promise<void> {
    const files = await prisma.fileUpload.findMany({
      where: { id: { in: uploadIds }, organizationId },
    });

    if (files.length === 0) return;

    // Delete from storage
    const keys = files.map((f) => f.key);
    try {
      await storageProvider.deleteObjects(keys);
    } catch (error) {
      console.error('Failed to delete from storage:', error);
    }

    // Soft delete in database
    await prisma.fileUpload.updateMany({
      where: { id: { in: uploadIds } },
      data: { status: FileStatus.DELETED },
    });
  },

  /**
   * Get files by entity
   */
  async getFilesByEntity(
    organizationId: string,
    entityType: string,
    entityId: string
  ): Promise<UploadedFile[]> {
    const files = await prisma.fileUpload.findMany({
      where: {
        organizationId,
        entityType,
        entityId,
        status: { in: [FileStatus.UPLOADED, FileStatus.CONFIRMED] },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      files.map(async (file) => ({
        id: file.id,
        url: file.publicUrl || (await this.getFileUrl(file.id, organizationId)),
        key: file.key,
        originalName: file.originalName,
        mimeType: file.mimeType,
        size: file.size,
        category: file.category,
      }))
    );
  },

  /**
   * Cleanup orphaned files - files that were never confirmed
   * Run this via cron job
   */
  async cleanupOrphanedFiles(): Promise<{ deleted: number }> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    // Find orphaned uploads
    const orphaned = await prisma.fileUpload.findMany({
      where: {
        status: FileStatus.PENDING,
        createdAt: { lt: cutoff },
      },
    });

    if (orphaned.length === 0) {
      return { deleted: 0 };
    }

    // Delete from storage (some may not exist if upload never completed)
    const keys = orphaned.map((f) => f.key);
    try {
      await storageProvider.deleteObjects(keys);
    } catch (error) {
      console.error('Orphan cleanup storage error:', error);
    }

    // Mark as orphaned/deleted in DB
    await prisma.fileUpload.updateMany({
      where: { id: { in: orphaned.map((f) => f.id) } },
      data: { status: FileStatus.ORPHANED },
    });

    console.log(`[Upload] Cleaned up ${orphaned.length} orphaned files`);
    return { deleted: orphaned.length };
  },

  /**
   * Get upload statistics for organization
   */
  async getUploadStats(organizationId: string): Promise<{
    total: number;
    totalSize: number;
    byCategory: Record<string, { count: number; size: number }>;
  }> {
    const stats = await prisma.fileUpload.groupBy({
      by: ['category'],
      where: {
        organizationId,
        status: { in: [FileStatus.UPLOADED, FileStatus.CONFIRMED] },
      },
      _count: true,
      _sum: { size: true },
    });

    const total = stats.reduce((acc, s) => acc + s._count, 0);
    const totalSize = stats.reduce((acc, s) => acc + (s._sum.size || 0), 0);

    const byCategory = stats.reduce(
      (acc, s) => {
        acc[s.category] = {
          count: s._count,
          size: s._sum.size || 0,
        };
        return acc;
      },
      {} as Record<string, { count: number; size: number }>
    );

    return { total, totalSize, byCategory };
  },
};

export default uploadService;
