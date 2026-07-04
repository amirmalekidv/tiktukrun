import { getStoragePublicRoot, resolveUploadPath, toPublicUploadUrl } from './storage-path';

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
});
