/** @format */

import { cachedOperations } from './cached-operations';

// Cache invalidation middleware for different operations
export const cacheMiddleware = {
  // Invalidate cache after user operations
  afterUserUpdate: (userId: number) => {
    cachedOperations.invalidateUserCache(userId);
  },

  afterUserDelete: (userId: number) => {
    cachedOperations.invalidateUserCache(userId);
  },

  // Invalidate cache after tenant operations
  afterTenantUpdate: (tenantId: number) => {
    cachedOperations.invalidateTenantCache(tenantId);
  },

  afterTenantDelete: (tenantId: number) => {
    cachedOperations.invalidateTenantCache(tenantId);
  },

  // Invalidate cache after database operations
  afterDatabaseUpdate: (databaseId: number) => {
    cachedOperations.invalidateDatabaseCache(databaseId);
  },

  afterDatabaseDelete: (databaseId: number) => {
    cachedOperations.invalidateDatabaseCache(databaseId);
  },

  // Invalidate cache after table operations
  afterTableUpdate: (tableId: number) => {
    cachedOperations.invalidateTableCache(tableId);
  },

  afterTableDelete: (tableId: number) => {
    cachedOperations.invalidateTableCache(tableId);
  },

  // Invalidate cache after column operations
  afterColumnUpdate: (columnId: number) => {
    cachedOperations.invalidateColumnCache(columnId);
  },

  afterColumnDelete: (columnId: number) => {
    cachedOperations.invalidateColumnCache(columnId);
  },

  // Invalidate cache after row operations
  afterRowUpdate: (tableId: number) => {
    cachedOperations.invalidateRowCache(tableId);
  },

  afterRowDelete: (tableId: number) => {
    cachedOperations.invalidateRowCache(tableId);
  },

  afterRowCreate: (tableId: number) => {
    cachedOperations.invalidateRowCache(tableId);
  },

  // Invalidate cache after permission operations
  afterPermissionUpdate: (userId: number, tenantId: number) => {
    cachedOperations.invalidatePermissionCache(userId, tenantId);
  },

  // Bulk invalidation for complex operations
  afterBulkOperation: (patterns: string[]) => {
    patterns.forEach(pattern => {
      cachedOperations.invalidate(pattern);
    });
  },

  // Clear all cache (use sparingly)
  clearAll: () => {
    cachedOperations.clearAllCache();
  },
};

// Higher-order function to wrap database operations with cache invalidation
export function withCacheInvalidation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  invalidateCallback: (result: R, ...args: T) => void
) {
  return async (...args: T): Promise<R> => {
    try {
      const result = await operation(...args);
      invalidateCallback(result, ...args);
      return result;
    } catch (error) {
      // If operation fails, still try to invalidate cache to be safe
      try {
        invalidateCallback(null as any, ...args);
      } catch (invalidateError) {
        // Cache invalidation failed
      }
      throw error;
    }
  };
}

// Predefined cache invalidation patterns for common operations
export const cachePatterns = {
  // User-related patterns
  userCreated: (userId: number) => [`user.${userId}`, `user.findMany`],
  userUpdated: (userId: number) => [`user.${userId}`, `user.findMany`],
  userDeleted: (userId: number) => [`user.${userId}`, `user.findMany`, `user.count`],

  // Tenant-related patterns
  tenantUpdated: (tenantId: number) => [
    `tenant.${tenantId}`,
    `database.${tenantId}`,
    `table.${tenantId}`,
    `user.${tenantId}`,
    `database.count.${tenantId}`,
    `table.count.${tenantId}`,
    `user.count.${tenantId}`,
    `row.count.${tenantId}`,
  ],

  // Database-related patterns
  databaseCreated: (databaseId: number, tenantId: number) => [
    `database.${databaseId}`,
    `database.findMany.${tenantId}`,
    `database.count.${tenantId}`,
  ],
  databaseUpdated: (databaseId: number, tenantId: number) => [
    `database.${databaseId}`,
    `database.findMany.${tenantId}`,
  ],
  databaseDeleted: (databaseId: number, tenantId: number) => [
    `database.${databaseId}`,
    `database.findMany.${tenantId}`,
    `database.count.${tenantId}`,
    `table.${databaseId}`,
    `table.count.${tenantId}`,
  ],

  // Table-related patterns
  tableCreated: (tableId: number, databaseId: number) => [
    `table.${tableId}`,
    `table.findMany.${databaseId}`,
    `table.count.${databaseId}`,
  ],
  tableUpdated: (tableId: number, databaseId: number) => [
    `table.${tableId}`,
    `table.findMany.${databaseId}`,
  ],
  tableDeleted: (tableId: number, databaseId: number) => [
    `table.${tableId}`,
    `table.findMany.${databaseId}`,
    `table.count.${databaseId}`,
    `row.${tableId}`,
    `column.${tableId}`,
  ],

  // Row-related patterns
  rowCreated: (tableId: number) => [
    `row.${tableId}`,
    `row.count.${tableId}`,
  ],
  rowUpdated: (tableId: number) => [
    `row.${tableId}`,
  ],
  rowDeleted: (tableId: number) => [
    `row.${tableId}`,
    `row.count.${tableId}`,
  ],

  // Column-related patterns
  columnCreated: (columnId: number, tableId: number) => [
    `column.${columnId}`,
    `column.findMany.${tableId}`,
  ],
  columnUpdated: (columnId: number, tableId: number) => [
    `column.${columnId}`,
    `column.findMany.${tableId}`,
  ],
  columnDeleted: (columnId: number, tableId: number) => [
    `column.${columnId}`,
    `column.findMany.${tableId}`,
  ],

  // Permission-related patterns
  permissionUpdated: (userId: number, tenantId: number) => [
    `permission.${userId}.${tenantId}`,
    `tablePermission.findMany.${userId}.${tenantId}`,
    `columnPermission.findMany.${userId}.${tenantId}`,
  ],
}; 