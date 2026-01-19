/**
 * S3/R2/Minio Storage Provider
 * Handles all cloud storage operations with presigned URLs
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { STORAGE_CONFIG } from '../config/storage.config.js';

// Initialize S3 client
function createS3Client(): S3Client {
  const config: any = {
    region: STORAGE_CONFIG.region,
    credentials: {
      accessKeyId: STORAGE_CONFIG.accessKeyId,
      secretAccessKey: STORAGE_CONFIG.secretAccessKey,
    },
  };

  // Custom endpoint for R2 or Minio
  if (STORAGE_CONFIG.endpoint) {
    config.endpoint = STORAGE_CONFIG.endpoint;
    config.forcePathStyle = true; // Required for Minio
  }

  return new S3Client(config);
}

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = createS3Client();
  }
  return s3Client;
}

export interface PresignedUploadResult {
  url: string;
  key: string;
  expiresAt: Date;
}

export interface StorageProvider {
  getPresignedUploadUrl(
    key: string,
    mimeType: string,
    size: number,
    expiresIn?: number,
    isPublic?: boolean
  ): Promise<PresignedUploadResult>;
  
  getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;
  
  getPublicUrl(key: string): string;
  
  uploadBuffer(key: string, buffer: Buffer, mimeType: string, isPublic?: boolean): Promise<void>;
  
  deleteObject(key: string): Promise<void>;
  
  deleteObjects(keys: string[]): Promise<void>;
  
  objectExists(key: string): Promise<boolean>;
}

export const storageProvider: StorageProvider = {
  /**
   * Generate presigned URL for client-side upload
   * NOTE: We don't include ACL or ContentLength in the signed params because:
   * 1. ACL is blocked by default "Block Public Access" settings on most S3 buckets
   * 2. ContentLength causes checksum validation issues with browser uploads
   * For public files, configure bucket policy instead of object-level ACLs
   */
  async getPresignedUploadUrl(
    key: string,
    mimeType: string,
    _size: number, // Not used in signing to avoid checksum issues
    expiresIn: number = STORAGE_CONFIG.presignedUrlExpiry,
    _isPublic: boolean = false // Not used - use bucket policy for public access
  ): Promise<PresignedUploadResult> {
    const client = getS3Client();

    // Only include ContentType in the signed request
    // Do NOT include: ACL (blocked by bucket policy), ContentLength (causes checksum issues)
    const command = new PutObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
      ContentType: mimeType,
    });

    // Generate presigned URL without checksum requirements
    // Use unhoistableHeaders to prevent AWS SDK from adding checksum query params
    const url = await getSignedUrl(client, command, { 
      expiresIn,
      unhoistableHeaders: new Set(['content-type']),
    });

    return {
      url,
      key,
      expiresAt: new Date(Date.now() + expiresIn * 1000),
    };
  },

  /**
   * Generate presigned URL for downloading/viewing
   */
  async getPresignedDownloadUrl(
    key: string,
    expiresIn: number = STORAGE_CONFIG.downloadUrlExpiry
  ): Promise<string> {
    const client = getS3Client();

    const command = new GetObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
    });

    return getSignedUrl(client, command, { expiresIn });
  },

  /**
   * Get public URL (only works if bucket/object is public or using CDN)
   */
  getPublicUrl(key: string): string {
    // If CDN is configured, use it
    if (STORAGE_CONFIG.cdnUrl) {
      return `${STORAGE_CONFIG.cdnUrl}/${key}`;
    }

    // Otherwise construct S3 URL
    if (STORAGE_CONFIG.endpoint) {
      return `${STORAGE_CONFIG.endpoint}/${STORAGE_CONFIG.bucket}/${key}`;
    }

    return `https://${STORAGE_CONFIG.bucket}.s3.${STORAGE_CONFIG.region}.amazonaws.com/${key}`;
  },

  /**
   * Upload buffer directly to storage (for server-side uploads like PDFs)
   */
  async uploadBuffer(key: string, buffer: Buffer, mimeType: string, isPublic: boolean = false): Promise<void> {
    const client = getS3Client();

    const command = new PutObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length,
      ACL: isPublic ? 'public-read' : 'private',
    });

    await client.send(command);
  },

  /**
   * Delete a single object from storage
   */
  async deleteObject(key: string): Promise<void> {
    const client = getS3Client();

    const command = new DeleteObjectCommand({
      Bucket: STORAGE_CONFIG.bucket,
      Key: key,
    });

    await client.send(command);
  },

  /**
   * Delete multiple objects from storage (batch)
   */
  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const client = getS3Client();

    // S3 allows max 1000 objects per request
    const chunks = [];
    for (let i = 0; i < keys.length; i += 1000) {
      chunks.push(keys.slice(i, i + 1000));
    }

    for (const chunk of chunks) {
      const command = new DeleteObjectsCommand({
        Bucket: STORAGE_CONFIG.bucket,
        Delete: {
          Objects: chunk.map((key) => ({ Key: key })),
          Quiet: true,
        },
      });

      await client.send(command);
    }
  },

  /**
   * Check if object exists in storage
   */
  async objectExists(key: string): Promise<boolean> {
    const client = getS3Client();

    try {
      const command = new HeadObjectCommand({
        Bucket: STORAGE_CONFIG.bucket,
        Key: key,
      });

      await client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  },
};

export default storageProvider;
