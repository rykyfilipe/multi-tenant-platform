/**
 * Error Tracking System
 * Centralized error logging and monitoring
 */

export interface ErrorContext {
  userId?: number;
  tenantId?: number;
  tableId?: number;
  databaseId?: number;
  action?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: any;
}

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: ErrorContext;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: number;
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: TrackedError[] = [];
  private maxErrors: number = 1000;

  constructor() {
    this.startCleanupInterval();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Track an error
   */
  trackError(
    error: Error | string,
    context: ErrorContext = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): string {
    const errorId = this.generateErrorId();
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stack = typeof error === 'string' ? undefined : error.stack;
    const errorType = typeof error === 'string' ? 'CustomError' : error.constructor.name;

    const trackedError: TrackedError = {
      id: errorId,
      message: errorMessage,
      stack,
      type: errorType,
      severity,
      context,
      timestamp: new Date(),
      resolved: false,
    };

    this.errors.push(trackedError);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log critical errors
    if (severity === 'critical') {
      console.error('CRITICAL ERROR:', trackedError);
    } else if (severity === 'high') {
      console.error('HIGH SEVERITY ERROR:', trackedError);
    } else {
      console.warn('ERROR TRACKED:', trackedError);
    }

    return errorId;
  }

  /**
   * Track API errors
   */
  trackApiError(
    error: Error,
    endpoint: string,
    method: string,
    context: ErrorContext = {}
  ): string {
    return this.trackError(error, {
      ...context,
      action: `${method} ${endpoint}`,
    }, 'high');
  }

  /**
   * Track database errors
   */
  trackDatabaseError(
    error: Error,
    query: string,
    context: ErrorContext = {}
  ): string {
    return this.trackError(error, {
      ...context,
      action: 'database_query',
      metadata: { query: query.substring(0, 200) }, // Limit query length
    }, 'high');
  }

  /**
   * Track validation errors
   */
  trackValidationError(
    error: Error,
    field: string,
    value: any,
    context: ErrorContext = {}
  ): string {
    return this.trackError(error, {
      ...context,
      action: 'validation',
      metadata: { field, value: String(value).substring(0, 100) },
    }, 'medium');
  }

  /**
   * Track permission errors
   */
  trackPermissionError(
    error: Error,
    resource: string,
    action: string,
    context: ErrorContext = {}
  ): string {
    return this.trackError(error, {
      ...context,
      action: `permission_denied_${action}`,
      metadata: { resource },
    }, 'high');
  }

  /**
   * Get errors by tenant
   */
  getTenantErrors(tenantId: number, limit: number = 50): TrackedError[] {
    return this.errors
      .filter(e => e.context.tenantId === tenantId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical', limit: number = 50): TrackedError[] {
    return this.errors
      .filter(e => e.severity === severity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get unresolved errors
   */
  getUnresolvedErrors(limit: number = 50): TrackedError[] {
    return this.errors
      .filter(e => !e.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get error statistics
   */
  getErrorStats(timeWindow: number = 24 * 60 * 60 * 1000): {
    totalErrors: number;
    errorsBySeverity: Record<string, number>;
    errorsByType: Record<string, number>;
    errorsByTenant: Record<number, number>;
    recentErrors: TrackedError[];
    criticalErrors: TrackedError[];
  } {
    const cutoffTime = new Date(Date.now() - timeWindow);
    const recentErrors = this.errors.filter(e => e.timestamp >= cutoffTime);

    const errorsBySeverity = recentErrors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByType = recentErrors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const errorsByTenant = recentErrors.reduce((acc, error) => {
      const tenantId = error.context.tenantId;
      if (tenantId) {
        acc[tenantId] = (acc[tenantId] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const criticalErrors = recentErrors
      .filter(e => e.severity === 'critical')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    return {
      totalErrors: recentErrors.length,
      errorsBySeverity,
      errorsByType,
      errorsByTenant,
      recentErrors: recentErrors.slice(0, 20),
      criticalErrors,
    };
  }

  /**
   * Resolve an error
   */
  resolveError(errorId: string, resolvedBy: number): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.resolvedAt = new Date();
      error.resolvedBy = resolvedBy;
      return true;
    }
    return false;
  }

  /**
   * Get error by ID
   */
  getError(errorId: string): TrackedError | undefined {
    return this.errors.find(e => e.id === errorId);
  }

  /**
   * Search errors
   */
  searchErrors(query: string, limit: number = 50): TrackedError[] {
    const lowercaseQuery = query.toLowerCase();
    return this.errors
      .filter(e => 
        e.message.toLowerCase().includes(lowercaseQuery) ||
        e.type.toLowerCase().includes(lowercaseQuery) ||
        (e.context.action && e.context.action.toLowerCase().includes(lowercaseQuery))
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      this.errors = this.errors.filter(e => e.timestamp >= cutoffTime);
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Get all errors (for debugging)
   */
  getAllErrors(): TrackedError[] {
    return [...this.errors];
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();
