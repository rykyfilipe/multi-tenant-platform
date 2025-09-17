/**
 * Usage Analytics System
 * Tracks user behavior and system usage patterns
 */

export interface UsageEvent {
  id: string;
  userId: number;
  tenantId: number;
  event: string;
  action: string;
  resource: string;
  resourceId?: number;
  metadata?: any;
  timestamp: Date;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UsageStats {
  totalEvents: number;
  uniqueUsers: number;
  eventsByType: Record<string, number>;
  eventsByUser: Record<number, number>;
  eventsByTenant: Record<number, number>;
  recentEvents: UsageEvent[];
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
}

export class UsageAnalytics {
  private static instance: UsageAnalytics;
  private events: UsageEvent[] = [];
  private maxEvents: number = 10000;

  constructor() {
    this.startCleanupInterval();
  }

  static getInstance(): UsageAnalytics {
    if (!UsageAnalytics.instance) {
      UsageAnalytics.instance = new UsageAnalytics();
    }
    return UsageAnalytics.instance;
  }

  /**
   * Track a usage event
   */
  trackEvent(
    userId: number,
    tenantId: number,
    event: string,
    action: string,
    resource: string,
    resourceId?: number,
    metadata?: any,
    sessionId?: string,
    ipAddress?: string,
    userAgent?: string
  ): string {
    const eventId = this.generateEventId();
    const usageEvent: UsageEvent = {
      id: eventId,
      userId,
      tenantId,
      event,
      action,
      resource,
      resourceId,
      metadata,
      timestamp: new Date(),
      sessionId,
      ipAddress,
      userAgent,
    };

    this.events.push(usageEvent);

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    return eventId;
  }

  /**
   * Track table operations
   */
  trackTableOperation(
    userId: number,
    tenantId: number,
    action: 'create' | 'read' | 'update' | 'delete',
    tableId: number,
    tableName: string,
    metadata?: any
  ): string {
    return this.trackEvent(
      userId,
      tenantId,
      'table_operation',
      action,
      'table',
      tableId,
      { tableName, ...metadata }
    );
  }

  /**
   * Track column operations
   */
  trackColumnOperation(
    userId: number,
    tenantId: number,
    action: 'create' | 'read' | 'update' | 'delete',
    columnId: number,
    tableId: number,
    columnName: string,
    columnType: string,
    metadata?: any
  ): string {
    return this.trackEvent(
      userId,
      tenantId,
      'column_operation',
      action,
      'column',
      columnId,
      { tableId, columnName, columnType, ...metadata }
    );
  }

  /**
   * Track row operations
   */
  trackRowOperation(
    userId: number,
    tenantId: number,
    action: 'create' | 'read' | 'update' | 'delete' | 'bulk_create' | 'bulk_update' | 'bulk_delete',
    rowId: number,
    tableId: number,
    rowCount?: number,
    metadata?: any
  ): string {
    return this.trackEvent(
      userId,
      tenantId,
      'row_operation',
      action,
      'row',
      rowId,
      { tableId, rowCount, ...metadata }
    );
  }

  /**
   * Track filter operations
   */
  trackFilterOperation(
    userId: number,
    tenantId: number,
    tableId: number,
    filterCount: number,
    filterTypes: string[],
    resultCount: number,
    executionTime: number,
    metadata?: any
  ): string {
    return this.trackEvent(
      userId,
      tenantId,
      'filter_operation',
      'search',
      'table',
      tableId,
      { filterCount, filterTypes, resultCount, executionTime, ...metadata }
    );
  }

  /**
   * Track API usage
   */
  trackApiUsage(
    userId: number,
    tenantId: number,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    requestSize?: number,
    responseSize?: number,
    metadata?: any
  ): string {
    return this.trackEvent(
      userId,
      tenantId,
      'api_usage',
      `${method} ${endpoint}`,
      'api',
      undefined,
      { statusCode, responseTime, requestSize, responseSize, ...metadata }
    );
  }

  /**
   * Track user session
   */
  trackUserSession(
    userId: number,
    tenantId: number,
    action: 'login' | 'logout' | 'session_start' | 'session_end',
    sessionId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ): string {
    return this.trackEvent(
      userId,
      tenantId,
      'user_session',
      action,
      'session',
      undefined,
      { sessionId, ...metadata },
      sessionId,
      ipAddress,
      userAgent
    );
  }

  /**
   * Get usage statistics
   */
  getUsageStats(timeWindow: number = 24 * 60 * 60 * 1000): UsageStats {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const recentEvents = this.events.filter(e => e.timestamp >= cutoffTime);

    const uniqueUsers = new Set(recentEvents.map(e => e.userId)).size;
    
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByUser = recentEvents.reduce((acc, event) => {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const eventsByTenant = recentEvents.reduce((acc, event) => {
      acc[event.tenantId] = (acc[event.tenantId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const actionCounts = recentEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const resourceCounts = recentEvents.reduce((acc, event) => {
      acc[event.resource] = (acc[event.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topResources = Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: recentEvents.length,
      uniqueUsers,
      eventsByType,
      eventsByUser,
      eventsByTenant,
      recentEvents: recentEvents.slice(0, 50),
      topActions,
      topResources,
    };
  }

  /**
   * Get tenant-specific usage stats
   */
  getTenantUsageStats(tenantId: number, timeWindow: number = 24 * 60 * 60 * 1000): UsageStats {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const tenantEvents = this.events.filter(
      e => e.tenantId === tenantId && e.timestamp >= cutoffTime
    );

    const uniqueUsers = new Set(tenantEvents.map(e => e.userId)).size;
    
    const eventsByType = tenantEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByUser = tenantEvents.reduce((acc, event) => {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const actionCounts = tenantEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const resourceCounts = tenantEvents.reduce((acc, event) => {
      acc[event.resource] = (acc[event.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topResources = Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: tenantEvents.length,
      uniqueUsers,
      eventsByType,
      eventsByUser,
      eventsByTenant: { [tenantId]: tenantEvents.length },
      recentEvents: tenantEvents.slice(0, 50),
      topActions,
      topResources,
    };
  }

  /**
   * Get user-specific usage stats
   */
  getUserUsageStats(userId: number, timeWindow: number = 24 * 60 * 60 * 1000): UsageStats {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const userEvents = this.events.filter(
      e => e.userId === userId && e.timestamp >= cutoffTime
    );

    const eventsByType = userEvents.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const eventsByTenant = userEvents.reduce((acc, event) => {
      acc[event.tenantId] = (acc[event.tenantId] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const actionCounts = userEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const resourceCounts = userEvents.reduce((acc, event) => {
      acc[event.resource] = (acc[event.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topResources = Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEvents: userEvents.length,
      uniqueUsers: 1,
      eventsByType,
      eventsByUser: { [userId]: userEvents.length },
      eventsByTenant,
      recentEvents: userEvents.slice(0, 50),
      topActions,
      topResources,
    };
  }

  /**
   * Get events by time range
   */
  getEventsByTimeRange(startTime: Date, endTime: Date): UsageEvent[] {
    return this.events
      .filter(e => e.timestamp >= startTime && e.timestamp <= endTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Search events
   */
  searchEvents(query: string, limit: number = 100): UsageEvent[] {
    const lowercaseQuery = query.toLowerCase();
    return this.events
      .filter(e => 
        e.event.toLowerCase().includes(lowercaseQuery) ||
        e.action.toLowerCase().includes(lowercaseQuery) ||
        e.resource.toLowerCase().includes(lowercaseQuery) ||
        (e.metadata && JSON.stringify(e.metadata).toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      this.events = this.events.filter(e => e.timestamp >= cutoffTime);
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Get all events (for debugging)
   */
  getAllEvents(): UsageEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }
}

// Export singleton instance
export const usageAnalytics = UsageAnalytics.getInstance();
