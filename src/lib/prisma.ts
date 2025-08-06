/** @format */

import { PrismaClient } from "@/generated/prisma/index";

// Cache interface for different caching strategies
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface Cache {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

// In-memory cache implementation
class MemoryCache implements Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes default

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Cache key generator
function generateCacheKey(operation: string, params: any): string {
  return `${operation}:${JSON.stringify(params)}`;
}

// Create the standard Prisma client
const prisma = new PrismaClient();

// Development mode global assignment
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).prisma = prisma;
}

// Cache instance
const cache = new MemoryCache();
const cacheEnabled = process.env.NODE_ENV === 'production' || process.env.ENABLE_CACHE === 'true';

// Cache utilities
export const cacheUtils = {
  // Invalidate cache for specific patterns
  invalidate: (pattern: string) => {
    if (!cacheEnabled) return;
    
    const keys = Array.from(cache['cache'].keys());
    keys.forEach((key: string) => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  },

  // Clear all cache
  clear: () => cache.clear(),

  // Cached query wrapper
  cachedQuery: async <T>(
    operation: () => Promise<T>,
    cacheKey: string,
    ttl: number = 5 * 60 * 1000
  ): Promise<T> => {
    if (!cacheEnabled) return operation();

    const cached = cache.get<T>(cacheKey);
    if (cached) return cached;

    const result = await operation();
    cache.set(cacheKey, result, ttl);
    return result;
  },

  // Batch operations with caching
  batchQuery: async <T>(
    operations: Array<{ operation: () => Promise<T>; cacheKey: string; ttl?: number }>
  ): Promise<T[]> => {
    const results: T[] = [];
    const uncachedOperations: Array<{ index: number; operation: () => Promise<T>; cacheKey: string; ttl?: number }> = [];

    // Check cache for all operations
    for (let i = 0; i < operations.length; i++) {
      const { operation, cacheKey, ttl } = operations[i];
      if (cacheEnabled) {
        const cached = cache.get<T>(cacheKey);
        if (cached) {
          results[i] = cached;
          continue;
        }
      }
      uncachedOperations.push({ index: i, operation, cacheKey, ttl });
    }

    // Execute uncached operations in parallel
    const uncachedResults = await Promise.all(
      uncachedOperations.map(async ({ operation, cacheKey, ttl }) => {
        const result = await operation();
        if (cacheEnabled) {
          cache.set(cacheKey, result, ttl);
        }
        return result;
      })
    );

    // Place results in correct positions
    uncachedOperations.forEach(({ index }, i) => {
      results[index] = uncachedResults[i];
    });

    return results;
  },

  // Generate cache key
  generateKey: generateCacheKey,

  // Check if cache is enabled
  isEnabled: () => cacheEnabled,
};

export default prisma;
