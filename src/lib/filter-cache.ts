/**
 * Optimized filter cache system
 * Provides intelligent cache invalidation based on filter changes
 */

import { FilterConfig, CacheKey } from '@/types/filtering-enhanced';
import crypto from 'crypto';

export interface CacheEntry {
  data: any;
  pagination: any;
  timestamp: number;
  filterHash: string;
  tableId: number;
}

export class FilterCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_SIZE = 1000; // Maximum cache entries

  /**
   * Generate cache key from filter parameters
   */
  generateCacheKey(
    tableId: number,
    filters: FilterConfig[],
    globalSearch: string,
    sortBy: string,
    sortOrder: string,
    page: number,
    pageSize: number
  ): string {
    const cacheKey: CacheKey = {
      tableId,
      filters: JSON.stringify(filters.sort((a, b) => a.id.localeCompare(b.id))),
      globalSearch: globalSearch.trim(),
      sortBy,
      sortOrder,
      page,
      pageSize
    };

    return this.hashCacheKey(cacheKey);
  }

  /**
   * Generate hash for cache key
   */
  private hashCacheKey(cacheKey: CacheKey): string {
    const keyString = JSON.stringify(cacheKey);
    return crypto.createHash('md5').update(keyString).digest('hex');
  }

  /**
   * Get cached data
   */
  get(key: string): CacheEntry | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set cached data
   */
  set(
    key: string,
    data: any,
    pagination: any,
    tableId: number,
    filters: FilterConfig[]
  ): void {
    const filterHash = this.generateFilterHash(filters);
    
    const entry: CacheEntry = {
      data,
      pagination,
      timestamp: Date.now(),
      filterHash,
      tableId
    };

    this.cache.set(key, entry);
    this.cleanup();
  }

  /**
   * Invalidate cache for a specific table
   */
  invalidateTable(tableId: number): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tableId === tableId) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Invalidate cache for specific filters
   */
  invalidateFilters(tableId: number, affectedColumns: number[]): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tableId === tableId) {
        // Check if any of the affected columns are in the cached filters
        const shouldInvalidate = this.shouldInvalidateEntry(entry, affectedColumns);
        if (shouldInvalidate) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Check if cache entry should be invalidated
   */
  private shouldInvalidateEntry(entry: CacheEntry, affectedColumns: number[]): boolean {
    // This is a simplified check - in a real implementation, you'd parse the filterHash
    // to check if any of the affected columns are present in the cached filters
    return true; // For now, invalidate all entries for the table
  }

  /**
   * Generate hash for filters to detect changes
   */
  private generateFilterHash(filters: FilterConfig[]): string {
    const sortedFilters = filters
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(f => ({
        columnId: f.columnId,
        operator: f.operator,
        value: f.value,
        secondValue: f.secondValue
      }));

    return crypto
      .createHash('md5')
      .update(JSON.stringify(sortedFilters))
      .digest('hex');
  }

  /**
   * Clean up old cache entries
   */
  private cleanup(): void {
    if (this.cache.size <= this.MAX_SIZE) {
      return;
    }

    // Sort entries by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest entries until we're under the limit
    const toDelete = entries.slice(0, entries.length - this.MAX_SIZE);
    toDelete.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    entries: Array<{
      key: string;
      timestamp: number;
      age: number;
      tableId: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      timestamp: entry.timestamp,
      age: now - entry.timestamp,
      tableId: entry.tableId
    }));

    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      ttl: this.TTL,
      entries
    };
  }

  /**
   * Check if cache is healthy
   */
  isHealthy(): boolean {
    const stats = this.getStats();
    const expiredEntries = stats.entries.filter(entry => entry.age > this.TTL);
    
    return expiredEntries.length === 0 && stats.size < this.MAX_SIZE;
  }
}

// Singleton instance
export const filterCache = new FilterCache();
