/**
 * BigInt serialization utilities
 * Ensures BigInt values are properly serialized to JSON as strings
 */

/**
 * Patch BigInt prototype to support JSON serialization
 * Call this once at application startup
 */
export function patchBigIntSerialization(): void {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

/**
 * Safely convert a value to BigInt
 */
export function toBigInt(value: string | number | bigint | null | undefined): bigint {
  if (value === null || value === undefined) return 0n;
  return BigInt(value);
}

/**
 * Convert BigInt to string for API response
 */
export function bigIntToString(value: bigint | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return value.toString();
}

/**
 * Safely add two BigInt values
 */
export function addBigInt(a: bigint, b: bigint): bigint {
  return a + b;
}

/**
 * Safely subtract BigInt, ensuring non-negative result
 */
export function subtractBigInt(a: bigint, b: bigint): bigint {
  const result = a - b;
  if (result < 0n) throw new Error('Insufficient balance');
  return result;
}

/**
 * Deep convert all BigInt in an object to strings
 */
export function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(serializeBigInts);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[key] = serializeBigInts(obj[key]);
    }
    return result;
  }
  return obj;
}
