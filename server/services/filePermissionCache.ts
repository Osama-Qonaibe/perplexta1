import path from 'path';

export const filePermissionCache = new Map<string, { authorized: boolean; expiresAt: number }>();
export const fileVersionCache = new Map<string, { version: number; expiresAt: number }>();
export const missingFileCache = new Map<string, number>();

export const FILE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour TTL Cache
export const MISSING_FILE_TTL_MS = 10 * 60 * 1000; // 10 minutes TTL for 404 missing files

export function invalidateFilePermissionCache(filename?: string) {
  if (filename) {
    const cleanName = path.basename(filename.split('?')[0]);
    filePermissionCache.delete(`public_ref:${cleanName}`);
    missingFileCache.delete(cleanName);
  } else {
    filePermissionCache.clear();
    missingFileCache.clear();
  }
}

export function invalidateFileVersionCache(filename?: string) {
  if (filename) {
    const cleanName = path.basename(filename.split('?')[0]);
    fileVersionCache.delete(cleanName);
    missingFileCache.delete(cleanName);
  } else {
    fileVersionCache.clear();
    missingFileCache.clear();
  }
}
