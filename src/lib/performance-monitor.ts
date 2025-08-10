/** @format */

interface PerformanceMetric {
	name: string;
	duration: number;
	timestamp: number;
	metadata?: Record<string, any>;
}

interface APIPerformanceMetric extends PerformanceMetric {
	method: string;
	path: string;
	statusCode: number;
	responseSize?: number;
	cacheHit?: boolean;
}

class PerformanceMonitor {
	private metrics: PerformanceMetric[] = [];
	private apiMetrics: APIPerformanceMetric[] = [];
	private maxMetrics = 1000; // Keep last 1000 metrics
	private pendingRequests = new Map<
		string,
		{ startTime: number; method: string; path: string }
	>();

	// Track API request performance
	trackAPIRequest(
		method: string,
		path: string,
		startTime: number,
		statusCode: number,
		responseSize?: number,
		cacheHit?: boolean,
		metadata?: Record<string, any>,
	) {
		const duration = Date.now() - startTime;
		const metric: APIPerformanceMetric = {
			name: `API_${method}_${path}`,
			method,
			path,
			duration,
			timestamp: Date.now(),
			statusCode,
			responseSize,
			cacheHit,
			metadata,
		};

		this.apiMetrics.push(metric);
		if (this.apiMetrics.length > this.maxMetrics) {
			this.apiMetrics.shift();
		}

		// Log slow requests
		if (duration > 1000) {
			console.warn(
				`Slow API request detected: ${method} ${path} took ${duration}ms`,
			);
		}

		return metric;
	}

	// Start tracking an API request (called from middleware)
	startAPIRequest(method: string, path: string, startTime: number) {
		const requestId = `${method}_${path}_${startTime}`;
		this.pendingRequests.set(requestId, { startTime, method, path });
		return requestId;
	}

	// Complete tracking an API request (called from API route wrapper)
	completeAPIRequest(
		requestId: string,
		statusCode: number,
		responseSize?: number,
		cacheHit?: boolean,
		metadata?: Record<string, any>,
	) {
		const pending = this.pendingRequests.get(requestId);
		if (!pending) return null;

		const duration = Date.now() - pending.startTime;
		const metric: APIPerformanceMetric = {
			name: `API_${pending.method}_${pending.path}`,
			method: pending.method,
			path: pending.path,
			duration,
			timestamp: Date.now(),
			statusCode,
			responseSize,
			cacheHit,
			metadata,
		};

		this.apiMetrics.push(metric);
		if (this.apiMetrics.length > this.maxMetrics) {
			this.apiMetrics.shift();
		}

		// Clean up pending request
		this.pendingRequests.delete(requestId);

		// Log slow requests
		if (duration > 1000) {
			console.warn(
				`Slow API request detected: ${pending.method} ${pending.path} took ${duration}ms`,
			);
		}

		return metric;
	}

	// Track database query performance
	trackDatabaseQuery(
		queryName: string,
		startTime: number,
		metadata?: Record<string, any>,
	) {
		const duration = Date.now() - startTime;
		const metric: PerformanceMetric = {
			name: `DB_${queryName}`,
			duration,
			timestamp: Date.now(),
			metadata,
		};

		this.metrics.push(metric);
		if (this.metrics.length > this.maxMetrics) {
			this.metrics.shift();
		}

		// Log slow queries
		if (duration > 500) {
			console.warn(
				`Slow database query detected: ${queryName} took ${duration}ms`,
			);
		}

		return metric;
	}

	// Track React component render performance
	trackComponentRender(
		componentName: string,
		startTime: number,
		metadata?: Record<string, any>,
	) {
		const duration = performance.now() - startTime;
		const metric: PerformanceMetric = {
			name: `RENDER_${componentName}`,
			duration,
			timestamp: Date.now(),
			metadata,
		};

		this.metrics.push(metric);
		if (this.metrics.length > this.maxMetrics) {
			this.metrics.shift();
		}

		// Log slow renders
		if (duration > 100) {
			console.warn(
				`Slow component render detected: ${componentName} took ${duration}ms`,
			);
		}

		return metric;
	}

	// Get performance statistics
	getStats(timeWindowMs: number = 300000) {
		// Default 5 minutes
		const now = Date.now();
		const cutoff = now - timeWindowMs;

		const recentMetrics = this.metrics.filter((m) => m.timestamp > cutoff);
		const recentAPIMetrics = this.apiMetrics.filter(
			(m) => m.timestamp > cutoff,
		);

		// API statistics
		const apiStats = {
			totalRequests: recentAPIMetrics.length,
			averageResponseTime:
				recentAPIMetrics.length > 0
					? recentAPIMetrics.reduce((sum, m) => sum + m.duration, 0) /
					  recentAPIMetrics.length
					: 0,
			slowRequests: recentAPIMetrics.filter((m) => m.duration > 1000).length,
			cacheHitRate:
				recentAPIMetrics.length > 0
					? recentAPIMetrics.filter((m) => m.cacheHit).length /
					  recentAPIMetrics.length
					: 0,
			errorRate:
				recentAPIMetrics.length > 0
					? recentAPIMetrics.filter((m) => m.statusCode >= 400).length /
					  recentAPIMetrics.length
					: 0,
			byPath: this.groupMetricsByKey(recentAPIMetrics, "path"),
		};

		// Database statistics
		const dbMetrics = recentMetrics.filter((m) => m.name.startsWith("DB_"));
		const dbStats = {
			totalQueries: dbMetrics.length,
			averageQueryTime:
				dbMetrics.length > 0
					? dbMetrics.reduce((sum, m) => sum + m.duration, 0) / dbMetrics.length
					: 0,
			slowQueries: dbMetrics.filter((m) => m.duration > 500).length,
			byQuery: this.groupMetricsByKey(dbMetrics, "name"),
		};

		// Component render statistics
		const renderMetrics = recentMetrics.filter((m) =>
			m.name.startsWith("RENDER_"),
		);
		const renderStats = {
			totalRenders: renderMetrics.length,
			averageRenderTime:
				renderMetrics.length > 0
					? renderMetrics.reduce((sum, m) => sum + m.duration, 0) /
					  renderMetrics.length
					: 0,
			slowRenders: renderMetrics.filter((m) => m.duration > 100).length,
			byComponent: this.groupMetricsByKey(renderMetrics, "name"),
		};

		return {
			timeWindow: timeWindowMs,
			api: apiStats,
			database: dbStats,
			rendering: renderStats,
			totalMetrics: recentMetrics.length + recentAPIMetrics.length,
		};
	}

	private groupMetricsByKey<T extends PerformanceMetric>(
		metrics: T[],
		key: keyof T,
	) {
		const groups: Record<
			string,
			{ count: number; averageTime: number; totalTime: number }
		> = {};

		metrics.forEach((metric) => {
			const groupKey = String(metric[key]);
			if (!groups[groupKey]) {
				groups[groupKey] = { count: 0, averageTime: 0, totalTime: 0 };
			}
			groups[groupKey].count++;
			groups[groupKey].totalTime += metric.duration;
			groups[groupKey].averageTime =
				groups[groupKey].totalTime / groups[groupKey].count;
		});

		return groups;
	}

	// Get recent slow operations
	getSlowOperations(timeWindowMs: number = 300000) {
		const now = Date.now();
		const cutoff = now - timeWindowMs;

		const slowAPIs = this.apiMetrics
			.filter((m) => m.timestamp > cutoff && m.duration > 1000)
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 10);

		const slowQueries = this.metrics
			.filter(
				(m) =>
					m.timestamp > cutoff && m.name.startsWith("DB_") && m.duration > 500,
			)
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 10);

		const slowRenders = this.metrics
			.filter(
				(m) =>
					m.timestamp > cutoff &&
					m.name.startsWith("RENDER_") &&
					m.duration > 100,
			)
			.sort((a, b) => b.duration - a.duration)
			.slice(0, 10);

		return {
			slowAPIs,
			slowQueries,
			slowRenders,
		};
	}

	// Clear all metrics
	clear() {
		this.metrics = [];
		this.apiMetrics = [];
	}

	// Export metrics for analysis
	exportMetrics() {
		return {
			metrics: this.metrics,
			apiMetrics: this.apiMetrics,
			exportTime: Date.now(),
		};
	}
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Helper functions for easy usage
export function measureAPIRequest(
	method: string,
	path: string,
	startTime: number,
	statusCode: number,
	responseSize?: number,
	cacheHit?: boolean,
	metadata?: Record<string, any>,
) {
	return performanceMonitor.trackAPIRequest(
		method,
		path,
		startTime,
		statusCode,
		responseSize,
		cacheHit,
		metadata,
	);
}

export function measureDatabaseQuery(
	queryName: string,
	startTime: number,
	metadata?: Record<string, any>,
) {
	return performanceMonitor.trackDatabaseQuery(queryName, startTime, metadata);
}

export function measureComponentRender(
	componentName: string,
	startTime: number,
	metadata?: Record<string, any>,
) {
	return performanceMonitor.trackComponentRender(
		componentName,
		startTime,
		metadata,
	);
}

// Hook for measuring React component performance
export function usePerformanceMonitoring(componentName: string) {
	if (typeof window === "undefined") return { measureRender: () => {} };

	const measureRender = (
		callback: () => void,
		metadata?: Record<string, any>,
	) => {
		const startTime = performance.now();
		callback();
		measureComponentRender(componentName, startTime, metadata);
	};

	return { measureRender };
}

// Helper function to complete API request tracking in API routes
export function completeAPIRequestTracking(
	request: Request,
	response: Response,
	metadata?: Record<string, any>,
) {
	try {
		const requestId = request.headers.get("X-Request-ID");
		if (!requestId) return;

		const responseSize = response.headers.get("content-length")
			? parseInt(response.headers.get("content-length")!)
			: undefined;

		const cacheHit = response.headers.get("X-Cache") === "HIT";
		const statusCode = response.status;

		performanceMonitor.completeAPIRequest(
			requestId,
			statusCode,
			responseSize,
			cacheHit,
			metadata,
		);
	} catch (error) {
		// Silently fail if tracking fails
		console.warn("Failed to complete API request tracking:", error);
	}
}

// Wrapper for API routes to automatically track performance
export function withPerformanceTracking<T extends any[]>(
	handler: (...args: T) => Promise<Response>
) {
	return async (...args: T): Promise<Response> => {
		const startTime = Date.now();
		
		try {
			const response = await handler(...args);
			
			// Complete tracking if this is an API route
			if (args[0] instanceof Request) {
				completeAPIRequestTracking(args[0], response, {
					handlerName: handler.name,
					executionTime: Date.now() - startTime,
				});
			}
			
			return response;
		} catch (error) {
			// Track failed requests
			if (args[0] instanceof Request) {
				completeAPIRequestTracking(args[0], new Response('Error', { status: 500 }), {
					handlerName: handler.name,
					executionTime: Date.now() - startTime,
					error: String(error),
				});
			}
			throw error;
		}
	};
}

// Prisma query performance tracking
export function createPrismaWithPerformanceTracking(prisma: any) {
	const trackedPrisma = new Proxy(prisma, {
		get(target, prop) {
			const value = target[prop];
			
			// If it's a model (table), wrap its methods
			if (value && typeof value === 'object' && value.findMany) {
				return new Proxy(value, {
					get(modelTarget, modelProp) {
						const modelValue = modelTarget[modelProp];
						
						// Wrap async methods that perform database operations
						if (typeof modelValue === 'function' && modelProp !== 'constructor') {
							return async (...args: any[]) => {
								const startTime = Date.now();
								const queryName = `${String(prop)}.${String(modelProp)}`;
								
								try {
									const result = await modelValue.apply(modelTarget, args);
									
									// Track successful query
									performanceMonitor.trackDatabaseQuery(
										queryName,
										startTime,
										{
											args: args.length,
											resultSize: Array.isArray(result) ? result.length : 1,
											success: true,
										}
									);
									
									return result;
								} catch (error) {
									// Track failed query
									performanceMonitor.trackDatabaseQuery(
										queryName,
										startTime,
										{
											args: args.length,
											error: String(error),
											success: false,
										}
									);
									
									throw error;
								}
							};
						}
						
						return modelValue;
					}
				});
			}
			
			return value;
		}
	});
	
	return trackedPrisma;
}

// Console logging for development
if (process.env.NODE_ENV === "development") {
	// Log performance stats every 30 seconds in development
	setInterval(() => {
		const stats = performanceMonitor.getStats();
		if (stats.totalMetrics > 0) {
			console.group("🚀 Performance Stats (Last 5 minutes)");
			console.table({
				"API Requests": stats.api.totalRequests,
				"Avg API Response Time": `${stats.api.averageResponseTime.toFixed(
					2,
				)}ms`,
				"Slow API Requests": stats.api.slowRequests,
				"Cache Hit Rate": `${(stats.api.cacheHitRate * 100).toFixed(1)}%`,
				"Error Rate": `${(stats.api.errorRate * 100).toFixed(1)}%`,
				"DB Queries": stats.database.totalQueries,
				"Avg Query Time": `${stats.database.averageQueryTime.toFixed(2)}ms`,
				"Slow Queries": stats.database.slowQueries,
				"Component Renders": stats.rendering.totalRenders,
				"Avg Render Time": `${stats.rendering.averageRenderTime.toFixed(2)}ms`,
				"Slow Renders": stats.rendering.slowRenders,
			});
			console.groupEnd();
		}
	}, 30000);
}
