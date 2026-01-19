/**
 * File URL Resolver
 * Generates proper URLs for file access - credential-independent
 * 
 * This module ensures that:
 * 1. Database stores S3 keys (permanent, credential-independent)
 * 2. URLs are generated on-the-fly using current credentials
 * 3. Credential rotation doesn't break images
 */

import { storageProvider } from './storage.provider.js';
import { STORAGE_CONFIG } from '../config/storage.config.js';

/**
 * Resolve a file reference to an accessible URL
 * 
 * @param keyOrUrl - Either an S3 key or legacy presigned URL
 * @param options - Configuration options
 * @returns Accessible URL or null
 */
export async function resolveFileUrl(
  keyOrUrl: string | null | undefined,
  options: {
    expiresIn?: number;
    isPublic?: boolean;
  } = {}
): Promise<string | null> {
  if (!keyOrUrl) return null;

  const { expiresIn = 3600, isPublic = true } = options;

  // If it's already a full URL (legacy data), extract the S3 key
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try {
      const url = new URL(keyOrUrl);
      // Extract path from URL: /organizations/xxx/uploads/member_avatar/123.png
      let path = url.pathname;
      if (path.startsWith('/')) {
        path = path.slice(1);
      }
      
      // If it looks like an S3 key, use it
      if (path.startsWith('organizations/')) {
        keyOrUrl = path;
      } else {
        // It's some other URL (maybe CDN), return as-is
        return keyOrUrl;
      }
    } catch {
      // Invalid URL, return null
      console.warn('[FileUrl] Invalid URL:', keyOrUrl);
      return null;
    }
  }

  // Now we have an S3 key
  const s3Key = keyOrUrl;

  // For public files (avatars, logos), generate a public URL
  if (isPublic) {
    // Check for CDN domain first
    const cdnDomain = process.env.CDN_DOMAIN;
    if (cdnDomain) {
      return `https://${cdnDomain}/${s3Key}`;
    }

    // Fallback to direct S3 public URL
    return `https://${STORAGE_CONFIG.bucket}.s3.${STORAGE_CONFIG.region}.amazonaws.com/${s3Key}`;
  }

  // For private files, generate a presigned URL
  try {
    return await storageProvider.getPresignedDownloadUrl(s3Key, expiresIn);
  } catch (error) {
    console.error('[FileUrl] Failed to generate presigned URL:', error);
    return null;
  }
}

/**
 * Resolve multiple file URLs in parallel
 */
export async function resolveFileUrls(
  items: Array<{ key: string | null | undefined; isPublic?: boolean }>
): Promise<Array<string | null>> {
  return Promise.all(
    items.map(item => resolveFileUrl(item.key, { isPublic: item.isPublic ?? true }))
  );
}

/**
 * Extract S3 key from a URL or return as-is if already a key
 * Used for migration and normalization
 */
export function extractS3Key(urlOrKey: string | null | undefined): string | null {
  if (!urlOrKey) return null;

  // Already an S3 key
  if (urlOrKey.startsWith('organizations/')) {
    return urlOrKey;
  }

  // Try to extract from URL
  if (urlOrKey.startsWith('http://') || urlOrKey.startsWith('https://')) {
    try {
      const url = new URL(urlOrKey);
      let path = url.pathname;
      if (path.startsWith('/')) {
        path = path.slice(1);
      }
      
      if (path.startsWith('organizations/')) {
        return path;
      }
    } catch {
      // Invalid URL
    }
  }

  return null;
}

/**
 * Get presigned URL for a file (async)
 * Use when the bucket doesn't allow public read access
 *
 * @param keyOrUrl - S3 key or legacy full URL
 * @param expiresIn - URL expiration in seconds (default 1 hour)
 * @returns Presigned URL or null
 */
export async function getPresignedFileUrl(
  keyOrUrl: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> {
  if (!keyOrUrl) return null;

  // Extract S3 key from URL if needed
  let s3Key = keyOrUrl;
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try {
      const url = new URL(keyOrUrl);
      let path = url.pathname;
      if (path.startsWith('/')) {
        path = path.slice(1);
      }
      if (path.startsWith('organizations/')) {
        s3Key = path;
      } else {
        // External URL, return as-is
        return keyOrUrl;
      }
    } catch {
      return null;
    }
  }

  // Generate presigned URL
  try {
    return await storageProvider.getPresignedDownloadUrl(s3Key, expiresIn);
  } catch (error) {
    console.error('[FileUrl] Failed to generate presigned URL for', s3Key, error);
    return null;
  }
}

/**
 * Get public URL for a file (without presigning)
 * Use for avatars, logos, and other public assets
 *
 * Handles both S3 keys and legacy full URLs:
 * - S3 key: "organizations/xxx/uploads/..." -> returns full S3 URL
 * - Full URL: "https://..." -> returns as-is if valid, otherwise extracts key
 */
export function getPublicFileUrl(keyOrUrl: string | null | undefined): string | null {
  if (!keyOrUrl) return null;

  // If it's already a full URL, handle it
  if (keyOrUrl.startsWith('http://') || keyOrUrl.startsWith('https://')) {
    try {
      const url = new URL(keyOrUrl);
      // Extract path to check if it's an S3 key
      let path = url.pathname;
      if (path.startsWith('/')) {
        path = path.slice(1);
      }

      // If it looks like an S3 key in the URL, extract and rebuild
      if (path.startsWith('organizations/')) {
        keyOrUrl = path;
      } else {
        // It's some other URL (CDN, external), return as-is
        return keyOrUrl;
      }
    } catch {
      // Invalid URL, return null
      return null;
    }
  }

  // Now we have an S3 key
  const s3Key = keyOrUrl;

  const cdnDomain = process.env.CDN_DOMAIN;
  if (cdnDomain) {
    return `https://${cdnDomain}/${s3Key}`;
  }

  return `https://${STORAGE_CONFIG.bucket}.s3.${STORAGE_CONFIG.region}.amazonaws.com/${s3Key}`;
}
