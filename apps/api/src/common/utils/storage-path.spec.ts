import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getStoragePublicRoot, getStorageRoot, resolveUploadPath, toPublicUploadUrl } from './storage-path';

describe('storage-path utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.STORAGE_PATH = '/srv/uploads';
    process.env.STORAGE_PUBLIC_URL = 'https://cdn.example.com/uploads/';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('normalizes the public uploads root', () => {
    expect(getStoragePublicRoot()).toBe('https://cdn.example.com/uploads');
  });

  it('resolves a relative storage path from the current working directory', () => {
    process.env.STORAGE_PATH = 'storage/uploads';

    expect(getStorageRoot()).toBe(path.join(process.cwd(), 'storage/uploads'));
  });

  it('builds an absolute public upload URL', () => {
    expect(toPublicUploadUrl('/uploads/games/game-1/cover.webp')).toBe(
      'https://cdn.example.com/uploads/games/game-1/cover.webp',
    );
  });

  it('resolves an absolute public upload URL back to the storage path', () => {
    expect(resolveUploadPath('https://cdn.example.com/uploads/games/game-1/cover.webp')).toBe(
      '/srv/uploads/games/game-1/cover.webp',
    );
  });

  it('prefers an existing upload file when resolving public paths', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tiktakrun-uploads-'));
    process.env.STORAGE_PATH = tmp;
    const coverPath = path.join(tmp, 'games/game-1/cover.webp');
    fs.mkdirSync(path.dirname(coverPath), { recursive: true });
    fs.writeFileSync(coverPath, 'fixture');

    expect(resolveUploadPath('/uploads/games/game-1/cover.webp')).toBe(coverPath);

    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
