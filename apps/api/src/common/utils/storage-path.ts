import * as path from 'path';
import * as fs from 'fs';

function findUp(start: string, fileName: string): string | undefined {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, fileName))) return current;

    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

function uniq(paths: string[]): string[] {
  return [...new Set(paths.map((p) => path.resolve(p)))];
}

function resolveFromCwd(value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function getWorkspaceRoot(): string | undefined {
  return findUp(process.cwd(), 'pnpm-workspace.yaml') ?? findUp(__dirname, 'pnpm-workspace.yaml');
}

function getApiPackageRoot(): string | undefined {
  return findUp(__dirname, 'package.json') ?? findUp(process.cwd(), 'package.json');
}

/**
 * Absolute path to the uploads root.
 * Docker sets STORAGE_PATH=/storage/uploads (bind-mounted volume).
 * Local/dev falls back to the monorepo-level storage/uploads directory.
 */
export function getStorageRoot(): string {
  if (process.env.STORAGE_PATH) {
    return resolveFromCwd(process.env.STORAGE_PATH);
  }

  const workspaceRoot = getWorkspaceRoot();
  if (workspaceRoot) return path.join(workspaceRoot, 'storage/uploads');

  return path.resolve(process.cwd(), 'storage/uploads');
}

/**
 * Directories that may contain existing uploads.
 * Root storage is canonical, but earlier local API runs wrote to apps/api/storage/uploads.
 */
export function getStorageReadRoots(): string[] {
  const roots = [getStorageRoot()];

  const workspaceRoot = getWorkspaceRoot();
  if (workspaceRoot) {
    roots.push(path.join(workspaceRoot, 'storage/uploads'));
  }

  const apiPackageRoot = getApiPackageRoot();
  if (apiPackageRoot) {
    roots.push(path.join(apiPackageRoot, 'storage/uploads'));
  }

  return uniq(roots);
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

  for (const root of getStorageReadRoots()) {
    const candidate = path.join(root, withoutPrefix);
    if (fs.existsSync(candidate)) return candidate;
  }

  return path.join(getStorageRoot(), withoutPrefix);
}
