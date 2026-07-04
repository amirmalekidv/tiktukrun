import * as path from 'path';
import * as fs from 'fs';

/**
 * Absolute path to the uploads root.
 * Docker sets STORAGE_PATH=/storage/uploads (bind-mounted volume).
 * Local/dev falls back to <cwd>/storage/uploads.
 */
export function getStorageRoot(): string {
  return process.env.STORAGE_PATH || path.resolve(process.cwd(), 'storage/uploads');
}

/** Subdirectory under the uploads root (created if missing). */
export function getStorageDir(...segments: string[]): string {
  const dir = path.join(getStorageRoot(), ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Resolve a public URL like `/uploads/games/x/cover.webp`
 * to an absolute filesystem path under the storage root.
 */
export function resolveUploadPath(publicPath: string): string {
  const normalized = publicPath.startsWith('/') ? publicPath.slice(1) : publicPath;
  const withoutPrefix = normalized.startsWith('uploads/')
    ? normalized.slice('uploads/'.length)
    : normalized;
  return path.join(getStorageRoot(), withoutPrefix);
}
