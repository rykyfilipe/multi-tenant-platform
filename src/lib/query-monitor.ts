/**
 * Query Performance Monitoring
 * Tracks and analyzes database query performance
 */

import { PrismaClient } from '@/generated/prisma';

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  userId?: number;
  tenantId?: number;
  tableId?: number;
  success: boolean;
  error?: string;
  rowCount?: number;
}

export interface PerformanceAlert {
  type: 'slow_query' | 'high_error_rate' | 'connection_pool_exhausted';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  metadata?: any;
}

export class QueryMonitor {
  private static instance: QueryMonitor;
  private metrics: QueryMetrics[] = [];
  private alerts: PerformanceAlert[] = [];
  private slowQueryThreshold: number = 1000; // 1 second
  private errorRateThreshold: number = 0.1; // 10%
  private maxMetricsHistory: number = 1000;

  constructor() {
    this.startCleanupInterval();
  }

  static getInstance(): QueryMonitor {
    if (!QueryMonitor.instance) {
      QueryMonitor.instance = new QueryMonitor();
    }
    return QueryMonitor.instance;
  }

  /**
   * Track a query execution
   */
  trackQuery(metrics: Omit<QueryMetrics, 'timestamp'>): void {
    const fullMetrics: QueryMetrics = {
      ...metrics,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Check for performance issues
    this.checkPerformanceIssues(fullMetrics);
  }

  /**
   * Get query performance statistics
   */
  getPerformanceStats(timeWindow: number = 300000): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    errorRate: number;
    topSlowQueries: Array<{ query: string; avgDuration: number; count: number }>;
    recentAlerts: PerformanceAlert[];
  } {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);

    const totalQueries = recentMetrics.length;
    const averageDuration = totalQueries > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;
    
    const slowQueries = recentMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
    const errorRate = totalQueries > 0 
      ? recentMetrics.filter(m => !m.success).length / totalQueries 
      : 0;

    // Group slow queries by query type
    const slowQueryGroups = recentMetrics
      .filter(m => m.duration > this.slowQueryThreshold)
      .reduce((groups, m) => {
        const key = this.normalizeQuery(m.query);
        if (!groups[key]) {
          groups[key] = { query: key, durations: [], count: 0 };
        }
        groups[key].durations.push(m.duration);
        groups[key].count++;
        return groups;
      }, {} as Record<string, { query: string; durations: number[]; count: number }>);

    const topSlowQueries = Object.values(slowQueryGroups)
      .map(group => ({
        query: group.query,
        avgDuration: group.durations.reduce((sum, d) => sum + d, 0) / group.durations.length,
        count: group.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    const recentAlerts = this.alerts
      .filter(a => a.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return {
      totalQueries,
      averageDuration,
      slowQueries,
      errorRate,
      topSlowQueries,
      recentAlerts,
    };
  }

  /**
   * Get tenant-specific performance stats
   */
  getTenantPerformanceStats(tenantId: number, timeWindow: number = 300000): {
    totalQueries: number;
    averageDuration: number;
    slowQueries: number;
    errorRate: number;
    tableStats: Array<{ tableId: number; queryCount: number; avgDuration: number }>;
  } {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const tenantMetrics = this.metrics.filter(
      m => m.tenantId === tenantId && m.timestamp >= cutoffTime
    );

    const totalQueries = tenantMetrics.length;
    const averageDuration = totalQueries > 0 
      ? tenantMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;
    
    const slowQueries = tenantMetrics.filter(m => m.duration > this.slowQueryThreshold).length;
    const errorRate = totalQueries > 0 
      ? tenantMetrics.filter(m => !m.success).length / totalQueries 
      : 0;

    // Group by table
    const tableGroups = tenantMetrics
      .filter(m => m.tableId)
      .reduce((groups, m) => {
        const tableId = m.tableId!;
        if (!groups[tableId]) {
          groups[tableId] = { tableId, durations: [], count: 0 };
        }
        groups[tableId].durations.push(m.duration);
        groups[tableId].count++;
        return groups;
      }, {} as Record<number, { tableId: number; durations: number[]; count: number }>);

    const tableStats = Object.values(tableGroups)
      .map(group => ({
        tableId: group.tableId,
        queryCount: group.count,
        avgDuration: group.durations.reduce((sum, d) => sum + d, 0) / group.durations.length,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration);

    return {
      totalQueries,
      averageDuration,
      slowQueries,
      errorRate,
      tableStats,
    };
  }

  /**
   * Check for performance issues and create alerts
   */
  private checkPerformanceIssues(metrics: QueryMetrics): void {
    // Check for slow queries
    if (metrics.duration > this.slowQueryThreshold) {
      this.createAlert({
        type: 'slow_query',
        message: `Slow query detected: ${metrics.duration}ms`,
        severity: metrics.duration > 5000 ? 'critical' : 'high',
        timestamp: new Date(),
        metadata: {
          query: this.normalizeQuery(metrics.query),
          duration: metrics.duration,
          userId: metrics.userId,
          tenantId: metrics.tenantId,
          tableId: metrics.tableId,
        },
      });
    }

    // Check for high error rate
    const recentMetrics = this.metrics.slice(-100); // Last 100 queries
    if (recentMetrics.length >= 10) {
      const errorRate = recentMetrics.filter(m => !m.success).length / recentMetrics.length;
      if (errorRate > this.errorRateThreshold) {
        this.createAlert({
          type: 'high_error_rate',
          message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          severity: errorRate > 0.5 ? 'critical' : 'high',
          timestamp: new Date(),
          metadata: { errorRate, recentQueries: recentMetrics.length },
        });
      }
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts
    if (alert.severity === 'critical') {
      console.error('CRITICAL PERFORMANCE ALERT:', alert);
    } else if (alert.severity === 'high') {
      console.warn('HIGH PERFORMANCE ALERT:', alert);
    }
  }

  /**
   * Normalize query for grouping
   */
  private normalizeQuery(query: string): string {
    return query
      .replace(/\d+/g, '?') // Replace numbers with ?
      .replace(/'[^']*'/g, '?') // Replace strings with ?
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
      this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
      this.alerts = this.alerts.filter(a => a.timestamp >= cutoffTime);
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Get all metrics (for debugging)
   */
  getAllMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.metrics = [];
    this.alerts = [];
  }
}

// Export singleton instance
export const queryMonitor = QueryMonitor.getInstance();
