/**
 * Storage Configuration
 * Centralized configuration for file upload system
 */

export const STORAGE_CONFIG = {
  // Provider: 's3' | 'r2' | 'minio'
  provider: (process.env.STORAGE_PROVIDER || 's3') as 's3' | 'r2' | 'minio',
  
  // S3/R2 Connection
  bucket: process.env.S3_BUCKET || 'gym-uploads',
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT || undefined, // Used for R2/Minio
  accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  
  // Optional CDN URL for public files
  cdnUrl: process.env.CDN_URL || undefined,
  
  // Presigned URL expiry (in seconds)
  presignedUrlExpiry: 60 * 15, // 15 minutes for upload
  downloadUrlExpiry: 60 * 60, // 1 hour for download
  
  // Maximum file sizes by category (in bytes)
  limits: {
    MEMBER_AVATAR: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
    MEMBER_DOCUMENT: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    TRAINER_AVATAR: {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
    TRAINER_CERTIFICATE: {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    },
    PRODUCT_IMAGE: {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
    CLASS_IMAGE: {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
    ORGANIZATION_LOGO: {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
    },
    INVOICE_PDF: {
      maxSize: 5 * 1024 * 1024,
      allowedTypes: ['application/pdf'],
    },
    REPORT_EXPORT: {
      maxSize: 20 * 1024 * 1024, // 20MB for reports
      allowedTypes: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
    },
    OTHER: {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['*/*'], // Allow any type - validation done elsewhere
    },
  } as const,
  
  // Folder structure in storage
  getStoragePath: (
    organizationId: string,
    category: string,
    entityType?: string,
    entityId?: string
  ): string => {
    const basePath = `organizations/${organizationId}`;
    
    if (entityType && entityId) {
      return `${basePath}/${entityType}s/${entityId}/${category.toLowerCase()}`;
    }
    
    return `${basePath}/uploads/${category.toLowerCase()}`;
  },
};

export type FileCategory = keyof typeof STORAGE_CONFIG.limits;

/**
 * Validate file against category limits
 */
export function validateFile(
  mimeType: string,
  size: number,
  category: FileCategory
): { valid: boolean; error?: string } {
  const limits = STORAGE_CONFIG.limits[category];
  
  // Check size
  if (size > limits.maxSize) {
    const maxMB = Math.round(limits.maxSize / (1024 * 1024));
    return { valid: false, error: `File size exceeds ${maxMB}MB limit` };
  }
  
  // Check type - cast to string[] for includes check
  const allowedTypes = limits.allowedTypes as readonly string[];
  if (!allowedTypes.includes('*/*') && !allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `File type ${mimeType} not allowed. Allowed: ${allowedTypes.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Collapse multiple underscores
    .replace(/^_+|_+$/g, '') // Trim underscores from ends
    .toLowerCase()
    .slice(0, 100); // Limit length
}

/**
 * Get file extension from mime type
 */
export function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'text/csv': 'csv',
    'application/vnd.ms-excel': 'xls',
  };
  
  return mimeToExt[mimeType] || 'bin';
}
