/** @format */

// Cache configuration and TTL settings
export const CACHE_CONFIG = {
  // Enable/disable cache
  ENABLED: process.env.NODE_ENV === 'production' || process.env.ENABLE_CACHE === 'true',
  
  // Default TTL values (in milliseconds)
  TTL: {
    // User data - relatively stable
    USER: 2 * 60 * 1000, // 2 minutes
    USER_LIST: 1 * 60 * 1000, // 1 minute
    
    // Tenant data - very stable
    TENANT: 5 * 60 * 1000, // 5 minutes
    
    // Database data - moderately stable
    DATABASE: 2 * 60 * 1000, // 2 minutes
    DATABASE_LIST: 1 * 60 * 1000, // 1 minute
    
    // Table data - moderately stable
    TABLE: 2 * 60 * 1000, // 2 minutes
    TABLE_LIST: 1 * 60 * 1000, // 1 minute
    TABLE_PUBLIC: 30 * 1000, // 30 seconds
    
    // Column data - stable
    COLUMN: 2 * 60 * 1000, // 2 minutes
    COLUMN_LIST: 2 * 60 * 1000, // 2 minutes
    
    // Row data - frequently changing
    ROW: 1 * 60 * 1000, // 1 minute
    ROW_LIST: 30 * 1000, // 30 seconds
    
    // Permission data - moderately stable
    PERMISSION: 1 * 60 * 1000, // 1 minute
    
    // Count data - frequently changing
    COUNT: 30 * 1000, // 30 seconds
    
    // Default fallback
    DEFAULT: 5 * 60 * 1000, // 5 minutes
  },
  
  // Cache size limits
  SIZE_LIMITS: {
    MAX_ENTRIES: 1000, // Maximum number of cache entries
    MAX_MEMORY_MB: 50, // Maximum memory usage in MB
  },
  
  // Cache invalidation settings
  INVALIDATION: {
    // Enable automatic cache invalidation
    AUTO_INVALIDATE: true,
    
    // Invalidation patterns
    PATTERNS: {
      USER: 'user.',
      TENANT: 'tenant.',
      DATABASE: 'database.',
      TABLE: 'table.',
      COLUMN: 'column.',
      ROW: 'row.',
      PERMISSION: 'permission.',
      
    },
  },
  
  // Performance monitoring
  MONITORING: {
    // Enable cache hit/miss logging
    LOG_STATS: process.env.NODE_ENV === 'development',
    
    // Log cache operations
    LOG_OPERATIONS: process.env.NODE_ENV === 'development',
    
    // Cache performance thresholds
    THRESHOLDS: {
      HIT_RATE_MIN: 0.7, // Minimum expected hit rate (70%)
      RESPONSE_TIME_MAX: 100, // Maximum expected response time in ms
    },
  },
};

// Cache key prefixes for better organization
export const CACHE_PREFIXES = {
  USER: 'user',
  TENANT: 'tenant',
  DATABASE: 'database',
  TABLE: 'table',
  COLUMN: 'column',
  ROW: 'row',
  PERMISSION: 'permission',
  
  COUNT: 'count',
};

// Cache operation types
export const CACHE_OPERATIONS = {
  FIND_UNIQUE: 'findUnique',
  FIND_MANY: 'findMany',
  FIND_FIRST: 'findFirst',
  COUNT: 'count',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  UPSERT: 'upsert',
};

// Helper function to get TTL for specific operation
export function getTTL(operation: string, entity: string): number {
  const operationKey = operation.toUpperCase();
  const entityKey = entity.toUpperCase();
  
  // Try specific operation + entity combination
  if (CACHE_CONFIG.TTL[`${entityKey}_${operationKey}` as keyof typeof CACHE_CONFIG.TTL]) {
    return CACHE_CONFIG.TTL[`${entityKey}_${operationKey}` as keyof typeof CACHE_CONFIG.TTL];
  }
  
  // Try entity-specific TTL
  if (CACHE_CONFIG.TTL[entityKey as keyof typeof CACHE_CONFIG.TTL]) {
    return CACHE_CONFIG.TTL[entityKey as keyof typeof CACHE_CONFIG.TTL];
  }
  
  // Fallback to default
  return CACHE_CONFIG.TTL.DEFAULT;
}

// Helper function to generate consistent cache keys
export function generateCacheKey(prefix: string, operation: string, params: any): string {
  const sortedParams = Object.keys(params || {})
    .sort()
    .reduce((result: any, key) => {
      result[key] = params[key];
      return result;
    }, {});
  
  return `${prefix}:${operation}:${JSON.stringify(sortedParams)}`;
}

// Cache statistics tracking
export class CacheStats {
  private hits = 0;
  private misses = 0;
  private operations = 0;
  
  recordHit() {
    this.hits++;
    this.operations++;
  }
  
  recordMiss() {
    this.misses++;
    this.operations++;
  }
  
  getHitRate(): number {
    return this.operations > 0 ? this.hits / this.operations : 0;
  }
  
  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      operations: this.operations,
      hitRate: this.getHitRate(),
    };
  }
  
  reset() {
    this.hits = 0;
    this.misses = 0;
    this.operations = 0;
  }
}

// Global cache statistics instance
export const cacheStats = new CacheStats(); 