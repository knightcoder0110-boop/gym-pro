/**
 * Upload API Client
 * Frontend API functions for file uploads
 */

import api from './api';

export type FileCategory =
  | 'MEMBER_AVATAR'
  | 'MEMBER_DOCUMENT'
  | 'TRAINER_AVATAR'
  | 'TRAINER_CERTIFICATE'
  | 'PRODUCT_IMAGE'
  | 'CLASS_IMAGE'
  | 'ORGANIZATION_LOGO'
  | 'INVOICE_PDF'
  | 'REPORT_EXPORT'
  | 'OTHER';

export interface UploadedFile {
  id: string;
  url: string;
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
}

export interface InitiateUploadParams {
  fileName: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  entityType?: string;
  entityId?: string;
  isPublic?: boolean;
}

export interface InitiateUploadResult {
  uploadId: string;
  uploadUrl: string;
  key: string;
  expiresAt: string;
}

export interface UploadConfig {
  limits: Record<
    FileCategory,
    {
      maxSize: number;
      maxSizeMB: number;
      allowedTypes: string[];
    }
  >;
}

export const uploadApi = {
  /**
   * Get upload configuration (limits, allowed types)
   */
  async getConfig(): Promise<UploadConfig> {
    const response = await api.get<{ success: boolean; data: UploadConfig }>('/uploads/config');
    return response.data.data;
  },

  /**
   * Initiate upload - get presigned URL
   */
  async initiateUpload(params: InitiateUploadParams): Promise<InitiateUploadResult> {
    const response = await api.post<{ success: boolean; data: InitiateUploadResult }>(
      '/uploads/initiate',
      params
    );
    return response.data.data;
  },

  /**
   * Confirm upload after file is uploaded to S3
   */
  async confirmUpload(uploadId: string): Promise<UploadedFile> {
    const response = await api.post<{ success: boolean; data: UploadedFile }>(
      `/uploads/${uploadId}/confirm`
    );
    return response.data.data;
  },

  /**
   * Link file to entity
   */
  async linkToEntity(
    uploadId: string,
    entityType: string,
    entityId: string
  ): Promise<UploadedFile> {
    const response = await api.post<{ success: boolean; data: UploadedFile }>(
      `/uploads/${uploadId}/link`,
      { entityType, entityId }
    );
    return response.data.data;
  },

  /**
   * Get file URL (signed for private files)
   */
  async getFileUrl(uploadId: string, expiresIn?: number): Promise<string> {
    const params = expiresIn ? { expiresIn: expiresIn.toString() } : {};
    const response = await api.get<{ success: boolean; data: { url: string } }>(
      `/uploads/${uploadId}/url`,
      { params }
    );
    return response.data.data.url;
  },

  /**
   * Delete file
   */
  async deleteFile(uploadId: string): Promise<void> {
    await api.delete(`/uploads/${uploadId}`);
  },

  /**
   * Get files by entity
   */
  async getFilesByEntity(entityType: string, entityId: string): Promise<UploadedFile[]> {
    const response = await api.get<{ success: boolean; data: UploadedFile[] }>(
      `/uploads/entity/${entityType}/${entityId}`
    );
    return response.data.data;
  },

  /**
   * Get upload stats
   */
  async getStats(): Promise<{
    total: number;
    totalSize: number;
    byCategory: Record<string, { count: number; size: number }>;
  }> {
    const response = await api.get<{ success: boolean; data: any }>('/uploads/stats');
    return response.data.data;
  },
};

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * S3 error codes and their user-friendly messages
 */
const S3_ERROR_MESSAGES: Record<string, { message: string; solution: string }> = {
  AccessDenied: {
    message: 'Access denied',
    solution: 'Please refresh the page and try again. If the problem persists, contact support.',
  },
  InvalidArgument: {
    message: 'Invalid file',
    solution: 'The file may be corrupted. Please try a different file.',
  },
  EntityTooLarge: {
    message: 'File too large',
    solution: 'Please compress the file or use a smaller one.',
  },
  SignatureDoesNotMatch: {
    message: 'Session expired',
    solution: 'Please refresh the page and try again.',
  },
  RequestTimeout: {
    message: 'Upload timed out',
    solution: 'Please check your internet connection and try again.',
  },
  SlowDown: {
    message: 'Too many requests',
    solution: 'Please wait a moment and try again.',
  },
  ServiceUnavailable: {
    message: 'Storage service unavailable',
    solution: 'Please try again in a few minutes.',
  },
  InternalError: {
    message: 'Server error',
    solution: 'Please try again. If the problem persists, contact support.',
  },
};

/**
 * Upload file to S3 using presigned URL
 */
export async function uploadToPresignedUrl(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        xhr.abort();
      });
    }

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        // Parse S3 error response for better error messages
        let errorMessage = `Upload failed (${xhr.status})`;

        try {
          // S3 returns XML error responses
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xhr.responseText, 'text/xml');
          const code = xmlDoc.getElementsByTagName('Code')[0]?.textContent;
          const message = xmlDoc.getElementsByTagName('Message')[0]?.textContent;

          // Get user-friendly message
          if (code && S3_ERROR_MESSAGES[code]) {
            const errorInfo = S3_ERROR_MESSAGES[code];
            errorMessage = `${errorInfo.message}. ${errorInfo.solution}`;
          } else if (message) {
            errorMessage = message;
          } else if (xhr.status === 403) {
            errorMessage = 'Access denied. Please refresh the page and try again.';
          } else if (xhr.status === 413) {
            errorMessage = `File too large (${formatBytes(file.size)}). Please use a smaller file.`;
          } else if (xhr.status >= 500) {
            errorMessage = 'Server error. Please try again in a few minutes.';
          }
        } catch (e) {
          // Fallback to status-based error
          console.error('Failed to parse S3 error:', e);
        }

        console.error('[Upload] S3 upload failed:', {
          status: xhr.status,
          statusText: xhr.statusText,
          response: xhr.responseText.substring(0, 200),
        });

        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      console.error('[Upload] Network error during upload');
      reject(new Error('Connection lost. Please check your internet and try again.'));
    });

    xhr.addEventListener('abort', () => {
      console.log('[Upload] Upload cancelled by user');
      reject(new Error('Upload cancelled'));
    });

    xhr.addEventListener('timeout', () => {
      console.error('[Upload] Upload timed out');
      reject(new Error('Upload timed out. Please check your connection and try again.'));
    });

    // Set timeout (5 minutes for large files)
    xhr.timeout = 5 * 60 * 1000;

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Delay utility for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Complete upload flow: initiate -> upload to S3 -> confirm
 * Includes automatic retry with exponential backoff
 */
export async function uploadFile(
  file: File,
  category: FileCategory,
  options?: {
    entityType?: string;
    entityId?: string;
    isPublic?: boolean;
    onProgress?: (progress: number) => void;
    abortSignal?: AbortSignal;
    maxRetries?: number;
  }
): Promise<UploadedFile> {
  const maxRetries = options?.maxRetries ?? 3;
  let lastError: Error | null = null;
  let uploadId: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if aborted before starting
      if (options?.abortSignal?.aborted) {
        throw new Error('Upload cancelled');
      }

      // 1. Initiate upload (get fresh presigned URL on each retry)
      const initResult = await uploadApi.initiateUpload({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        category,
        entityType: options?.entityType,
        entityId: options?.entityId,
        isPublic: options?.isPublic,
      });

      uploadId = initResult.uploadId;

      // 2. Upload to S3
      await uploadToPresignedUrl(
        file,
        initResult.uploadUrl,
        options?.onProgress,
        options?.abortSignal
      );

      // 3. Confirm upload
      const confirmed = await uploadApi.confirmUpload(initResult.uploadId);

      return confirmed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Upload failed');

      // Don't retry if cancelled
      if (lastError.message === 'Upload cancelled') {
        throw lastError;
      }

      // Don't retry on validation errors (these won't succeed on retry)
      if (
        lastError.message.includes('File too large') ||
        lastError.message.includes('Invalid file type') ||
        lastError.message.includes('Missing required fields')
      ) {
        throw lastError;
      }

      // Log retry attempt
      if (attempt < maxRetries) {
        console.log(
          `[Upload] Attempt ${attempt} failed, retrying in ${Math.pow(2, attempt)}s...`,
          lastError.message
        );
        // Exponential backoff: 2s, 4s, 8s
        await delay(Math.pow(2, attempt) * 1000);
        // Reset progress for retry
        options?.onProgress?.(0);
      }
    }
  }

  // All retries exhausted
  throw lastError || new Error('Upload failed after multiple attempts');
}

export default uploadApi;
