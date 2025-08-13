/** @format */

import { cacheHelpers } from "./memory-cache";

// Enhanced API caching with TTL and invalidation strategies
export class ApiCache {
  private static instance: ApiCache;
  private cache = new Map<string, { data: any; expires: number; hits: number }>();
  private maxSize = 10000; // Maximum cache entries
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  static getInstance(): ApiCache {
    if (!ApiCache.instance) {
      ApiCache.instance = new ApiCache();
    }
    return ApiCache.instance;
  }

  // Set cache with TTL
  set(key: string, data: any, ttlSeconds: number = 300): void {
    // Evict least recently used if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000),
      hits: 0,
    });
  }

  // Get cache with hit tracking
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter
    entry.hits++;
    return entry.data;
  }

  // Delete cache entry
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalRequests: number;
  } {
    let totalHits = 0;
    let totalRequests = 0;

    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalRequests += entry.hits + 1; // +1 for the initial set
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalHits,
      totalRequests,
    };
  }

  // Evict least recently used entries
  private evictLRU(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].hits - b[1].hits);
    
    // Remove 10% of least used entries
    const toRemove = Math.ceil(this.maxSize * 0.1);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }

  // Invalidate cache by pattern
  invalidateByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Preload frequently accessed data
  async preloadData(keys: string[], loader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      try {
        const data = await loader(key);
        this.set(key, data, 300); // 5 minutes TTL
      } catch (error) {
        console.warn(`Failed to preload cache for key: ${key}`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  // Destroy cache instance
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Enhanced cached operations with better performance
export const enhancedCachedOperations = {
  // User operations with enhanced caching
  getUser: async (userId: number) => {
    const cache = ApiCache.getInstance();
    const cacheKey = `user_${userId}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { PrismaClient } = require("@/lib/prisma");
      const prisma = new PrismaClient();
      
      const user = await prisma.user.findUnique({ 
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          tenantId: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
        }
      });
      
      if (user) {
        // Cache for 5 minutes
        cache.set(cacheKey, user, 300);
      }
      
      return user;
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  },

  // Table operations with enhanced caching
  getPublicTables: async (tenantId: number) => {
    const cache = ApiCache.getInstance();
    const cacheKey = `public_tables_${tenantId}`;
    
    // Try cache first
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { PrismaClient } = require("@/lib/prisma");
      const prisma = new PrismaClient();
      
      const tables = await prisma.table.findMany({
        where: {
          database: { tenantId },
          isPublic: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          createdAt: true,
          databaseId: true,
          _count: {
            select: {
              columns: true,
              rows: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      });

      // Cache for 5 minutes
      cache.set(cacheKey, tables, 300);
      return tables;
    } catch (error) {
      console.error("Error fetching public tables:", error);
      return [];
    }
  },

  // Enhanced table schema caching
  getTableSchema: async (tableId: number) => {
    const cache = ApiCache.getInstance();
    const cacheKey = `table_schema_${tableId}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { PrismaClient } = require("@/lib/prisma");
      const prisma = new PrismaClient();
      
      const table = await prisma.table.findUnique({
        where: { id: tableId },
        include: {
          columns: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (table) {
        // Cache for 15 minutes
        cache.set(cacheKey, table, 900);
      }
      
      return table;
    } catch (error) {
      console.error("Error fetching table schema:", error);
      return null;
    }
  },

  // Enhanced row operations with pagination caching
  getTableRows: async (
    tableId: number,
    page: number = 1,
    pageSize: number = 25,
    filters?: any
  ) => {
    const cache = ApiCache.getInstance();
    const cacheKey = `table_rows_${tableId}_${page}_${pageSize}_${JSON.stringify(filters || {})}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { PrismaClient } = require("@/lib/prisma");
      const prisma = new PrismaClient();
      
      const skip = (page - 1) * pageSize;
      
      // Get total count and rows in parallel
      const [totalRows, rows] = await Promise.all([
        prisma.row.count({ where: { tableId } }),
        prisma.row.findMany({
          where: { tableId },
          include: { cells: { include: { column: true } } },
          skip,
          take: pageSize,
          orderBy: { createdAt: "asc" },
        }),
      ]);

      const result = {
        data: rows,
        pagination: {
          page,
          pageSize,
          totalRows,
          totalPages: Math.ceil(totalRows / pageSize),
          hasNext: page * pageSize < totalRows,
          hasPrev: page > 1,
        },
      };

      // Cache for 2 minutes (shorter TTL for dynamic data)
      cache.set(cacheKey, result, 120);
      return result;
    } catch (error) {
      console.error("Error fetching table rows:", error);
      return {
        data: [],
        pagination: {
          page: 1,
          pageSize,
          totalRows: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  },

  // User permissions caching
  getUserPermissions: async (userId: number, tableId: number) => {
    const cache = ApiCache.getInstance();
    const cacheKey = `user_permissions_${userId}_${tableId}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { PrismaClient } = require("@/lib/prisma");
      const prisma = new PrismaClient();
      
      const permissions = await prisma.tablePermission.findUnique({
        where: { userId_tableId: { userId, tableId } },
        select: {
          canRead: true,
          canEdit: true,
          canDelete: true,
        },
      });

      // Cache for 2 minutes
      cache.set(cacheKey, permissions, 120);
      return permissions;
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      return null;
    }
  },

  // API token caching
  getApiToken: async (tokenHash: string) => {
    const cache = ApiCache.getInstance();
    const cacheKey = `api_token_${tokenHash}`;
    
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
      const { PrismaClient } = require("@/lib/prisma");
      const prisma = new PrismaClient();
      
      const token = await prisma.apiToken.findUnique({
        where: { tokenHash },
        select: {
          id: true,
          userId: true,
          scopes: true,
          expiresAt: true,
          revoked: true,
        },
      });

      if (token) {
        // Cache for 1 minute (shorter TTL for security)
        cache.set(cacheKey, token, 60);
      }
      
      return token;
    } catch (error) {
      console.error("Error fetching API token:", error);
      return null;
    }
  },

  // Cache invalidation methods
  invalidateTableCache: (tableId: number) => {
    const cache = ApiCache.getInstance();
    cache.invalidateByPattern(`table_${tableId}`);
  },

  invalidateUserCache: (userId: number) => {
    const cache = ApiCache.getInstance();
    cache.invalidateByPattern(`user_${userId}`);
  },

  invalidateTenantCache: (tenantId: number) => {
    const cache = ApiCache.getInstance();
    cache.invalidateByPattern(`tenant_${tenantId}`);
  },

  // Get cache statistics
  getCacheStats: () => {
    const cache = ApiCache.getInstance();
    return cache.getStats();
  },

  // Clear all cache
  clearAllCache: () => {
    const cache = ApiCache.getInstance();
    cache.clear();
  },
};

// Export singleton instance
export const apiCache = ApiCache.getInstance();
