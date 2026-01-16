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
 * Upload file to S3 using presigned URL
 */
export async function uploadToPresignedUrl(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

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
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Complete upload flow: initiate -> upload to S3 -> confirm
 */
export async function uploadFile(
  file: File,
  category: FileCategory,
  options?: {
    entityType?: string;
    entityId?: string;
    isPublic?: boolean;
    onProgress?: (progress: number) => void;
  }
): Promise<UploadedFile> {
  // 1. Initiate upload
  const initResult = await uploadApi.initiateUpload({
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    category,
    entityType: options?.entityType,
    entityId: options?.entityId,
    isPublic: options?.isPublic,
  });

  // 2. Upload to S3
  await uploadToPresignedUrl(file, initResult.uploadUrl, options?.onProgress);

  // 3. Confirm upload
  const confirmed = await uploadApi.confirmUpload(initResult.uploadId);

  return confirmed;
}

export default uploadApi;
