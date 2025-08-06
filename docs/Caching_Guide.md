# Caching Guide for Multi-Tenant Platform

## Overview

This guide explains how to use the comprehensive caching system implemented for Prisma queries to improve application performance.

## Architecture

The caching system consists of several components:

1. **Memory Cache** (`src/lib/prisma.ts`) - In-memory cache implementation
2. **Cache Utilities** (`src/lib/prisma.ts`) - Helper functions for cache operations
3. **Cached Operations** (`src/lib/cached-operations.ts`) - Pre-built cached database operations
4. **Cache Middleware** (`src/lib/cache-middleware.ts`) - Automatic cache invalidation
5. **Cache Configuration** (`src/lib/cache-config.ts`) - TTL and configuration settings

## Basic Usage

### 1. Using Cached Operations

Instead of direct Prisma queries, use the cached operations:

```typescript
// Before (direct Prisma)
const user = await prisma.user.findUnique({ where: { id: userId } });

// After (cached)
import { cachedOperations } from '@/lib/cached-operations';
const user = await cachedOperations.getUser(userId);
```

### 2. Available Cached Operations

#### User Operations
```typescript
// Get user by ID
const user = await cachedOperations.getUser(userId);

// Get user by email
const user = await cachedOperations.getUserByEmail(email);
```

#### Tenant Operations
```typescript
// Get tenant by ID
const tenant = await cachedOperations.getTenant(tenantId);

// Get tenant by admin ID
const tenant = await cachedOperations.getTenantByAdmin(adminId);
```

#### Database Operations
```typescript
// Get all databases for a tenant
const databases = await cachedOperations.getDatabases(tenantId);

// Get specific database
const database = await cachedOperations.getDatabase(databaseId, tenantId);
```

#### Table Operations
```typescript
// Get all tables for a database
const tables = await cachedOperations.getTables(databaseId);

// Get specific table
const table = await cachedOperations.getTable(tableId, databaseId);

// Get public tables for a tenant
const publicTables = await cachedOperations.getPublicTables(tenantId);
```

#### Column Operations
```typescript
// Get all columns for a table
const columns = await cachedOperations.getColumns(tableId);

// Get specific column
const column = await cachedOperations.getColumn(columnId, tableId);
```

#### Row Operations
```typescript
// Get all rows for a table
const rows = await cachedOperations.getRows(tableId);

// Get specific row
const row = await cachedOperations.getRow(rowId, tableId);
```

#### Permission Operations
```typescript
// Get table permissions for a user
const tablePermissions = await cachedOperations.getTablePermissions(userId, tenantId);

// Get column permissions for a user
const columnPermissions = await cachedOperations.getColumnPermissions(userId, tenantId);
```

#### Count Operations
```typescript
// Get all counts for a tenant (databases, tables, users, apiTokens, publicTables, rows)
const [databases, tables, users, apiTokens, publicTables, rows] = 
  await cachedOperations.getCounts(tenantId, userId);
```

#### API Token Operations
```typescript
// Get all API tokens for a user
const tokens = await cachedOperations.getApiTokens(userId);

// Get specific API token
const token = await cachedOperations.getApiToken(tokenHash);
```

### 3. Manual Cache Operations

For custom queries, use the cache utilities:

```typescript
import { cacheUtils } from '@/lib/prisma';

// Cached query with custom TTL
const result = await cacheUtils.cachedQuery(
  () => prisma.customModel.findMany({ where: { customField: value } }),
  'custom:query:key',
  60 * 1000 // 1 minute TTL
);

// Batch operations
const results = await cacheUtils.batchQuery([
  {
    operation: () => prisma.model1.findMany(),
    cacheKey: 'model1:list',
    ttl: 30 * 1000
  },
  {
    operation: () => prisma.model2.findMany(),
    cacheKey: 'model2:list',
    ttl: 60 * 1000
  }
]);
```

## Cache Invalidation

### 1. Automatic Invalidation

Use the cache middleware to automatically invalidate cache after operations:

```typescript
import { cacheMiddleware } from '@/lib/cache-middleware';

// After creating a user
const newUser = await prisma.user.create(userData);
cacheMiddleware.afterUserUpdate(newUser.id);

// After updating a table
const updatedTable = await prisma.table.update(tableData);
cacheMiddleware.afterTableUpdate(updatedTable.id);

// After deleting a row
await prisma.row.delete({ where: { id: rowId } });
cacheMiddleware.afterRowDelete(tableId);
```

### 2. Manual Invalidation

```typescript
import { cachedOperations } from '@/lib/cached-operations';

// Invalidate specific cache patterns
cachedOperations.invalidateUserCache(userId);
cachedOperations.invalidateTenantCache(tenantId);
cachedOperations.invalidateDatabaseCache(databaseId);
cachedOperations.invalidateTableCache(tableId);
cachedOperations.invalidateColumnCache(columnId);
cachedOperations.invalidateRowCache(tableId);
cachedOperations.invalidatePermissionCache(userId, tenantId);

// Clear all cache
cachedOperations.clearAllCache();
```

### 3. Bulk Invalidation

```typescript
import { cacheMiddleware, cachePatterns } from '@/lib/cache-middleware';

// Invalidate multiple patterns
cacheMiddleware.afterBulkOperation(cachePatterns.tableDeleted(tableId, databaseId));

// Or manually specify patterns
cacheMiddleware.afterBulkOperation([
  `table.${tableId}`,
  `table.findMany.${databaseId}`,
  `row.${tableId}`
]);
```

## Configuration

### 1. Environment Variables

```bash
# Enable cache (default: enabled in production)
ENABLE_CACHE=true

# Cache TTL settings (in milliseconds)
CACHE_TTL_USER=120000        # 2 minutes
CACHE_TTL_TABLE=60000        # 1 minute
CACHE_TTL_ROW=30000          # 30 seconds
```

### 2. Cache Configuration

The cache configuration is in `src/lib/cache-config.ts`:

```typescript
export const CACHE_CONFIG = {
  ENABLED: process.env.NODE_ENV === 'production' || process.env.ENABLE_CACHE === 'true',
  
  TTL: {
    USER: 2 * 60 * 1000,        // 2 minutes
    TABLE: 2 * 60 * 1000,       // 2 minutes
    ROW: 1 * 60 * 1000,         // 1 minute
    COUNT: 30 * 1000,           // 30 seconds
    // ... more TTL settings
  },
  
  SIZE_LIMITS: {
    MAX_ENTRIES: 1000,
    MAX_MEMORY_MB: 50,
  },
  
  MONITORING: {
    LOG_STATS: process.env.NODE_ENV === 'development',
    LOG_OPERATIONS: process.env.NODE_ENV === 'development',
  }
};
```

## Performance Monitoring

### 1. Cache Statistics

```typescript
import { cacheStats } from '@/lib/cache-config';

// Get cache performance stats
const stats = cacheStats.getStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
console.log(`Total operations: ${stats.operations}`);
console.log(`Cache hits: ${stats.hits}`);
console.log(`Cache misses: ${stats.misses}`);

// Reset statistics
cacheStats.reset();
```

### 2. Cache Performance Thresholds

The system includes performance thresholds:

- **Hit Rate**: Minimum 70% expected
- **Response Time**: Maximum 100ms expected
- **Memory Usage**: Maximum 50MB

## Best Practices

### 1. Choose Appropriate TTL

- **User data**: 2 minutes (relatively stable)
- **Tenant data**: 5 minutes (very stable)
- **Table/Column data**: 2 minutes (moderately stable)
- **Row data**: 30 seconds - 1 minute (frequently changing)
- **Count data**: 30 seconds (frequently changing)

### 2. Invalidate Cache Appropriately

- Always invalidate cache after write operations
- Use bulk invalidation for complex operations
- Consider the impact of cache invalidation on performance

### 3. Monitor Cache Performance

- Track hit rates in development
- Monitor memory usage
- Set up alerts for low hit rates

### 4. Use Batch Operations

For multiple related queries, use batch operations:

```typescript
// Instead of multiple individual queries
const user = await cachedOperations.getUser(userId);
const tenant = await cachedOperations.getTenant(user.tenantId);
const databases = await cachedOperations.getDatabases(user.tenantId);

// Use batch operations when possible
const [user, tenant, databases] = await cacheUtils.batchQuery([
  {
    operation: () => cachedOperations.getUser(userId),
    cacheKey: `user:${userId}`,
    ttl: getTTL('FIND_UNIQUE', 'USER')
  },
  {
    operation: () => cachedOperations.getTenant(user?.tenantId),
    cacheKey: `tenant:${user?.tenantId}`,
    ttl: getTTL('FIND_UNIQUE', 'TENANT')
  },
  {
    operation: () => cachedOperations.getDatabases(user?.tenantId),
    cacheKey: `databases:${user?.tenantId}`,
    ttl: getTTL('FIND_MANY', 'DATABASE')
  }
]);
```

## Migration Guide

### 1. Replace Direct Prisma Queries

**Before:**
```typescript
// API route
export async function GET(request: Request) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tables = await prisma.table.findMany({ where: { databaseId } });
  return NextResponse.json({ user, tables });
}
```

**After:**
```typescript
// API route
import { cachedOperations } from '@/lib/cached-operations';

export async function GET(request: Request) {
  const user = await cachedOperations.getUser(userId);
  const tables = await cachedOperations.getTables(databaseId);
  return NextResponse.json({ user, tables });
}
```

### 2. Add Cache Invalidation

**Before:**
```typescript
export async function POST(request: Request) {
  const newTable = await prisma.table.create(tableData);
  return NextResponse.json(newTable);
}
```

**After:**
```typescript
import { cacheMiddleware } from '@/lib/cache-middleware';

export async function POST(request: Request) {
  const newTable = await prisma.table.create(tableData);
  cacheMiddleware.afterTableUpdate(newTable.id);
  return NextResponse.json(newTable);
}
```

## Troubleshooting

### 1. Cache Not Working

- Check if cache is enabled: `CACHE_CONFIG.ENABLED`
- Verify environment variables
- Check cache statistics for hit/miss rates

### 2. Stale Data

- Ensure proper cache invalidation after write operations
- Check TTL settings
- Use cache middleware for automatic invalidation

### 3. Memory Issues

- Monitor cache size limits
- Clear cache periodically if needed
- Adjust TTL settings for frequently changing data

### 4. Performance Issues

- Use batch operations for multiple queries
- Monitor cache hit rates
- Adjust TTL based on data change frequency

## Examples

### Complete API Route Example

```typescript
import { cachedOperations } from '@/lib/cached-operations';
import { cacheMiddleware } from '@/lib/cache-middleware';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { tableId: string } }) {
  try {
    const tableId = parseInt(params.tableId);
    
    // Use cached operations for reads
    const table = await cachedOperations.getTable(tableId, databaseId);
    const columns = await cachedOperations.getColumns(tableId);
    const rows = await cachedOperations.getRows(tableId);
    
    return NextResponse.json({ table, columns, rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: { tableId: string } }) {
  try {
    const tableId = parseInt(params.tableId);
    const body = await request.json();
    
    // Create new row
    const newRow = await prisma.row.create({
      data: body,
      include: { cells: true }
    });
    
    // Invalidate cache
    cacheMiddleware.afterRowCreate(tableId);
    
    return NextResponse.json(newRow);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create row' }, { status: 500 });
  }
}
```

This caching system provides significant performance improvements while maintaining data consistency through proper cache invalidation strategies. 