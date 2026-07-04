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

/**
 * Public base URL for uploaded files.
 * Examples:
 * - `/uploads`
 * - `https://tiktakrun.ir/uploads`
 */
export function getStoragePublicRoot(): string {
  const raw = process.env.STORAGE_PUBLIC_URL || '/uploads';
  return raw.replace(/\/+$/, '');
}

/** Subdirectory under the uploads root (created if missing). */
export function getStorageDir(...segments: string[]): string {
  const dir = path.join(getStorageRoot(), ...segments);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Convert a storage-relative path like `games/x/cover.webp`
 * or a public uploads path into the deployment's public URL.
 */
export function toPublicUploadUrl(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const relative = normalized
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/+/, '')
    .replace(/^uploads\/+/i, '');

  return `${getStoragePublicRoot()}/${relative}`;
}

/**
 * Resolve a public URL like `/uploads/games/x/cover.webp`
 * to an absolute filesystem path under the storage root.
 */
export function resolveUploadPath(publicPath: string): string {
  const withoutOrigin = publicPath.replace(/^https?:\/\/[^/]+/i, '');
  const normalized = withoutOrigin.startsWith('/') ? withoutOrigin.slice(1) : withoutOrigin;
  const withoutPrefix = normalized.startsWith('uploads/')
    ? normalized.slice('uploads/'.length)
    : normalized;
  return path.join(getStorageRoot(), withoutPrefix);
}
