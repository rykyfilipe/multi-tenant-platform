/** @format */

import prisma, { cacheUtils } from './prisma';
import { CACHE_CONFIG, CACHE_PREFIXES, CACHE_OPERATIONS, getTTL, generateCacheKey } from './cache-config';

// Common cached database operations
export const cachedOperations = {
  // User operations
  getUser: async (userId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.user.findUnique({ where: { id: userId } }),
      generateCacheKey(CACHE_PREFIXES.USER, CACHE_OPERATIONS.FIND_UNIQUE, { id: userId }),
      getTTL(CACHE_OPERATIONS.FIND_UNIQUE, 'USER')
    );
  },

  getUserByEmail: async (email: string) => {
    return cacheUtils.cachedQuery(
      () => prisma.user.findUnique({ where: { email } }),
      generateCacheKey(CACHE_PREFIXES.USER, CACHE_OPERATIONS.FIND_UNIQUE, { email }),
      getTTL(CACHE_OPERATIONS.FIND_UNIQUE, 'USER')
    );
  },

  // Tenant operations
  getTenant: async (tenantId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.tenant.findUnique({ where: { id: tenantId } }),
      cacheUtils.generateKey('tenant.findUnique', { id: tenantId }),
      5 * 60 * 1000 // 5 minutes
    );
  },

  getTenantByAdmin: async (adminId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.tenant.findUnique({ where: { adminId } }),
      cacheUtils.generateKey('tenant.findUnique', { adminId }),
      5 * 60 * 1000 // 5 minutes
    );
  },

  // Database operations
  getDatabases: async (tenantId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.database.findMany({ where: { tenantId } }),
      cacheUtils.generateKey('database.findMany', { tenantId }),
      1 * 60 * 1000 // 1 minute
    );
  },

  getDatabase: async (databaseId: number, tenantId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.database.findFirst({ 
        where: { id: databaseId, tenantId } 
      }),
      cacheUtils.generateKey('database.findFirst', { id: databaseId, tenantId }),
      2 * 60 * 1000 // 2 minutes
    );
  },

  // Table operations
  getTables: async (databaseId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.table.findMany({ where: { databaseId } }),
      cacheUtils.generateKey('table.findMany', { databaseId }),
      1 * 60 * 1000 // 1 minute
    );
  },

  getTable: async (tableId: number, databaseId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.table.findFirst({ 
        where: { id: tableId, databaseId } 
      }),
      cacheUtils.generateKey('table.findFirst', { id: tableId, databaseId }),
      2 * 60 * 1000 // 2 minutes
    );
  },

  getPublicTables: async (tenantId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.table.findMany({ 
        where: { 
          database: { tenantId },
          isPublic: true 
        } 
      }),
      cacheUtils.generateKey('table.findMany.public', { tenantId }),
      30 * 1000 // 30 seconds
    );
  },

  // Column operations
  getColumns: async (tableId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.column.findMany({ where: { tableId } }),
      cacheUtils.generateKey('column.findMany', { tableId }),
      2 * 60 * 1000 // 2 minutes
    );
  },

  getColumn: async (columnId: number, tableId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.column.findFirst({ 
        where: { id: columnId, tableId } 
      }),
      cacheUtils.generateKey('column.findFirst', { id: columnId, tableId }),
      2 * 60 * 1000 // 2 minutes
    );
  },

  // Row operations
  getRows: async (tableId: number, includeCells: boolean = true) => {
    return cacheUtils.cachedQuery(
      () => prisma.row.findMany({ 
        where: { tableId },
        include: includeCells ? { cells: true } : undefined
      }),
      cacheUtils.generateKey('row.findMany', { tableId, includeCells }),
      30 * 1000 // 30 seconds
    );
  },

  getRow: async (rowId: number, tableId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.row.findFirst({ 
        where: { id: rowId, tableId },
        include: { cells: true }
      }),
      cacheUtils.generateKey('row.findFirst', { id: rowId, tableId }),
      1 * 60 * 1000 // 1 minute
    );
  },

  // Permission operations
  getTablePermissions: async (userId: number, tenantId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.tablePermission.findMany({ 
        where: { userId, tenantId } 
      }),
      cacheUtils.generateKey('tablePermission.findMany', { userId, tenantId }),
      1 * 60 * 1000 // 1 minute
    );
  },

  getColumnPermissions: async (userId: number, tenantId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.columnPermission.findMany({ 
        where: { userId, tenantId } 
      }),
      cacheUtils.generateKey('columnPermission.findMany', { userId, tenantId }),
      1 * 60 * 1000 // 1 minute
    );
  },

  // Count operations
  getCounts: async (tenantId: number, userId: number) => {
    const [databases, tables, users, rows] = await cacheUtils.batchQuery([
      {
        operation: () => prisma.database.count({ where: { tenantId } }),
        cacheKey: cacheUtils.generateKey('database.count', { tenantId }),
        ttl: 30 * 1000 // 30 seconds
      },
      {
        operation: () => prisma.table.count({ 
          where: { database: { tenantId } } 
        }),
        cacheKey: cacheUtils.generateKey('table.count', { tenantId }),
        ttl: 30 * 1000 // 30 seconds
      },
      {
        operation: () => prisma.user.count({ where: { tenantId } }),
        cacheKey: cacheUtils.generateKey('user.count', { tenantId }),
        ttl: 30 * 1000 // 30 seconds
      },
      {
        operation: () => prisma.row.count({ 
          where: { table: { database: { tenantId } } } 
        }),
        cacheKey: cacheUtils.generateKey('row.count', { tenantId }),
        ttl: 30 * 1000 // 30 seconds
      }
    ]);

    const [apiTokens, publicTables] = await cacheUtils.batchQuery([
      {
        operation: () => prisma.apiToken.count({ where: { userId } }),
        cacheKey: cacheUtils.generateKey('apiToken.count', { userId }),
        ttl: 30 * 1000 // 30 seconds
      },
      {
        operation: () => prisma.table.count({
          where: {
            database: { tenantId },
            isPublic: true,
          },
        }),
        cacheKey: cacheUtils.generateKey('table.count.public', { tenantId }),
        ttl: 30 * 1000 // 30 seconds
      }
    ]);

    return [databases, tables, users, apiTokens, publicTables, rows];
  },

  // API Token operations
  getApiTokens: async (userId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.apiToken.findMany({ where: { userId } }),
      cacheUtils.generateKey('apiToken.findMany', { userId }),
      2 * 60 * 1000 // 2 minutes
    );
  },

  getApiToken: async (tokenHash: string) => {
    return cacheUtils.cachedQuery(
      () => prisma.apiToken.findUnique({ where: { tokenHash } }),
      cacheUtils.generateKey('apiToken.findUnique', { tokenHash }),
      1 * 60 * 1000 // 1 minute
    );
  },

  // User operations
  getUsers: async (tenantId: number) => {
    return cacheUtils.cachedQuery(
      () => prisma.user.findMany({ where: { tenantId } }),
      cacheUtils.generateKey('user.findMany', { tenantId }),
      1 * 60 * 1000 // 1 minute
    );
  },

  // Cache invalidation helpers
  invalidateUserCache: (userId: number) => {
    cacheUtils.invalidate(`user.${userId}`);
  },

  invalidateTenantCache: (tenantId: number) => {
    cacheUtils.invalidate(`tenant.${tenantId}`);
  },

  invalidateDatabaseCache: (databaseId: number) => {
    cacheUtils.invalidate(`database.${databaseId}`);
  },

  invalidateTableCache: (tableId: number) => {
    cacheUtils.invalidate(`table.${tableId}`);
  },

  invalidateColumnCache: (columnId: number) => {
    cacheUtils.invalidate(`column.${columnId}`);
  },

  invalidateRowCache: (tableId: number) => {
    cacheUtils.invalidate(`row.${tableId}`);
  },

  invalidatePermissionCache: (userId: number, tenantId: number) => {
    cacheUtils.invalidate(`permission.${userId}.${tenantId}`);
  },

  // Clear all cache
  clearAllCache: () => {
    cacheUtils.clear();
  },
}; 