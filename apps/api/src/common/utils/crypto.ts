/**
 * Cryptographic utilities
 */

import * as bcrypt from 'bcrypt';
import { randomBytes as cryptoRandomBytes } from 'crypto';

const BCRYPT_ROUNDS = 10;

/**
 * Hash a plain text string using bcrypt
 */
export async function hashString(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Compare plain text with bcrypt hash
 */
export async function compareHash(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Generate a random numeric OTP code
 */
export function generateOtpCode(length: number = 5): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/**
 * Generate a unique invite code using crypto
 */
export function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  const bytes = cryptoRandomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate a random hex token
 */
export function generateToken(bytes: number = 32): string {
  return cryptoRandomBytes(bytes).toString('hex');
}

/**
 * Generate a simple unique ID
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = cryptoRandomBytes(6).toString('hex');
  return `c${timestamp}${random}`;
}
