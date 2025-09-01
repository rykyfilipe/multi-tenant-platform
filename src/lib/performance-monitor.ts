/** @format */

interface PerformanceMetric {
	timestamp: number;
	value: number;
	metric: string;
	component?: string;
	metadata?: Record<string, any>;
}

class PerformanceMonitor {
	private metrics: PerformanceMetric[] = [];
	private observers: Map<string, PerformanceObserver> = new Map();

	constructor() {
		this.initializeObservers();
	}

	private initializeObservers() {
		if (typeof window === "undefined") return;

		// Observe First Contentful Paint
		try {
			const fcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.name === "first-contentful-paint") {
						this.trackMetric("FCP", entry.startTime, {
							entryType: entry.entryType,
							startTime: entry.startTime,
						});
					}
				});
			});
			fcpObserver.observe({ entryTypes: ["paint"] });
			this.observers.set("fcp", fcpObserver);
		} catch (error) {
			console.warn("FCP observer not supported:", error);
		}

		// Observe Largest Contentful Paint
		try {
			const lcpObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.entryType === "largest-contentful-paint") {
						this.trackMetric("LCP", entry.startTime, {
							entryType: entry.entryType,
							startTime: entry.startTime,
							size: (entry as any).size,
						});
					}
				});
			});
			lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
			this.observers.set("lcp", lcpObserver);
		} catch (error) {
			console.warn("LCP observer not supported:", error);
		}

		// Observe First Input Delay
		try {
			const fidObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.entryType === "first-input") {
						this.trackMetric(
							"FID",
							(entry as any).processingStart - entry.startTime,
							{
								entryType: entry.entryType,
								startTime: entry.startTime,
								processingStart: (entry as any).processingStart,
							},
						);
					}
				});
			});
			fidObserver.observe({ entryTypes: ["first-input"] });
			this.observers.set("fid", fidObserver);
		} catch (error) {
			console.warn("FID observer not supported:", error);
		}

		// Observe Cumulative Layout Shift
		try {
			const clsObserver = new PerformanceObserver((list) => {
				const entries = list.getEntries();
				entries.forEach((entry) => {
					if (entry.entryType === "layout-shift") {
						this.trackMetric("CLS", (entry as any).value, {
							entryType: entry.entryType,
							value: (entry as any).value,
						});
					}
				});
			});
			clsObserver.observe({ entryTypes: ["layout-shift"] });
			this.observers.set("cls", clsObserver);
		} catch (error) {
			console.warn("CLS observer not supported:", error);
		}
	}

	trackMetric(metric: string, value: number, metadata?: Record<string, any>) {
		const metricData: PerformanceMetric = {
			timestamp: Date.now(),
			value,
			metric,
			metadata,
		};

		this.metrics.push(metricData);

		// Log performance issues
		this.logPerformanceIssues(metric, value);

		// Store in localStorage for persistence
		this.persistMetrics();
	}

	trackComponentRender(
		componentName: string,
		startTime: number,
		metadata?: Record<string, any>,
	) {
		const renderTime = performance.now() - startTime;
		this.trackMetric("ComponentRender", renderTime, {
			component: componentName,
			...metadata,
		});
	}

	trackAPIRequest(
		source: string,
		endpoint: string,
		startTime: number,
		status: number,
		responseSize: number,
		isError: boolean,
		metadata?: Record<string, any>,
	) {
		const duration = Date.now() - startTime;
		this.trackMetric("APIRequest", duration, {
			source,
			endpoint,
			status,
			responseSize,
			isError,
			...metadata,
		});
	}

	startAPIRequest(method: string, endpoint: string, startTime: number): string {
		// Generate unique request ID
		const requestId = `req_${Date.now()}_${Math.random()
			.toString(36)
			.substr(2, 9)}`;

		// Track the start of API request
		this.trackMetric("APIRequestStart", startTime, {
			method,
			endpoint,
			requestId,
		});

		return requestId;
	}

	private logPerformanceIssues(metric: string, value: number) {
		const thresholds: Record<string, { warning: number; error: number }> = {
			FCP: { warning: 2000, error: 3000 },
			LCP: { warning: 2500, error: 4000 },
			FID: { warning: 100, error: 300 },
			CLS: { warning: 0.1, error: 0.25 },
			ComponentRender: { warning: 16, error: 50 },
			APIRequest: { warning: 1000, error: 3000 },
		};

		const threshold = thresholds[metric];
		if (!threshold) return;

		if (value >= threshold.error) {
			console.error(`🚨 Critical ${metric}: ${value.toFixed(2)}ms`);
		} else if (value >= threshold.warning) {
			console.warn(`⚠️ Slow ${metric}: ${value.toFixed(2)}ms`);
		}
	}

	private persistMetrics() {
		if (typeof window === "undefined") return;

		try {
			// Keep only last 1000 metrics to avoid localStorage bloat
			const recentMetrics = this.metrics.slice(-1000);
			localStorage.setItem(
				"performance-metrics",
				JSON.stringify(recentMetrics),
			);
		} catch (error) {
			console.warn("Failed to persist performance metrics:", error);
		}
	}

	getMetrics(metric?: string, limit?: number): PerformanceMetric[] {
		let filteredMetrics = this.metrics;

		if (metric) {
			filteredMetrics = this.metrics.filter((m) => m.metric === metric);
		}

		if (limit) {
			filteredMetrics = filteredMetrics.slice(-limit);
		}

		return filteredMetrics;
	}

	getAverageMetric(metric: string): number {
		const metricData = this.metrics.filter((m) => m.metric === metric);
		if (metricData.length === 0) return 0;

		const sum = metricData.reduce((acc, m) => acc + m.value, 0);
		return sum / metricData.length;
	}

	getLatestMetric(metric: string): PerformanceMetric | null {
		const metricData = this.metrics.filter((m) => m.metric === metric);
		return metricData.length > 0 ? metricData[metricData.length - 1] : null;
	}

	generateReport(): Record<string, any> {
		const report: Record<string, any> = {};

		// Core Web Vitals
		const coreMetrics = ["FCP", "LCP", "FID", "CLS"];
		coreMetrics.forEach((metric) => {
			const latest = this.getLatestMetric(metric);
			const average = this.getAverageMetric(metric);

			report[metric] = {
				latest: latest?.value || 0,
				average: average,
				count: this.metrics.filter((m) => m.metric === metric).length,
			};
		});

		// Component performance
		const componentMetrics = this.metrics.filter(
			(m) => m.metric === "ComponentRender",
		);
		if (componentMetrics.length > 0) {
			report.components = {};
			const componentGroups = componentMetrics.reduce((acc, m) => {
				const component = m.metadata?.component || "unknown";
				if (!acc[component]) acc[component] = [];
				acc[component].push(m.value);
				return acc;
			}, {} as Record<string, number[]>);

			Object.entries(componentGroups).forEach(([component, values]) => {
				const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
				const max = Math.max(...values);
				report.components[component] = {
					average: avg,
					max,
					count: values.length,
				};
			});
		}

		// API performance
		const apiMetrics = this.metrics.filter((m) => m.metric === "APIRequest");
		if (apiMetrics.length > 0) {
			report.api = {
				averageResponseTime: this.getAverageMetric("APIRequest"),
				totalRequests: apiMetrics.length,
				errorRate:
					apiMetrics.filter((m) => m.metadata?.isError).length /
					apiMetrics.length,
			};
		}

		return report;
	}

	disconnect() {
		this.observers.forEach((observer) => observer.disconnect());
		this.observers.clear();
	}
}

export const performanceMonitor = new PerformanceMonitor();

// Prisma performance tracking wrapper
export function createPrismaWithPerformanceTracking(prisma: any) {
	const trackedPrisma = new Proxy(prisma, {
		get(target: any, prop: string) {
			const value = target[prop];

			// If it's a method, wrap it with performance tracking
			if (typeof value === "function") {
				return async function (...args: any[]) {
					const startTime = Date.now();
					// Safely stringify args to avoid circular reference errors
					let argsString = "";
					try {
						// Custom replacer function to handle circular references and complex objects
						const safeStringify = (obj: any) => {
							const seen = new WeakSet();
							return JSON.stringify(obj, (key, value) => {
								if (typeof value === "object" && value !== null) {
									if (seen.has(value)) {
										return "[Circular]";
									}
									seen.add(value);

									// Handle Prisma client objects
									if (
										value &&
										typeof value === "object" &&
										value.constructor &&
										value.constructor.name
									) {
										if (
											value.constructor.name.includes("Prisma") ||
											value.constructor.name.includes("Client")
										) {
											return `[${value.constructor.name}]`;
										}
									}
								}
								if (typeof value === "bigint") {
									return value.toString() + "n";
								}
								if (typeof value === "function") {
									return "[Function]";
								}
								return value;
							});
						};
						argsString = safeStringify(args).slice(0, 100);
					} catch (error) {
						argsString = "[Complex Object]";
					}

					const requestId = performanceMonitor.startAPIRequest(
						prop,
						`${prop}_${argsString}`,
						startTime,
					);

					try {
						const result = await value.apply(target, args);
						const endTime = Date.now();

						// Safely calculate response size, handling BigInt values
						let responseSize = 0;
						try {
							// Custom replacer function to handle BigInt serialization
							const safeStringify = (obj: any) => {
								return JSON.stringify(obj, (key, value) => {
									if (typeof value === "bigint") {
										return value.toString() + "n"; // Convert BigInt to string representation
									}
									return value;
								});
							};
							responseSize = safeStringify(result).length;
						} catch (serializeError) {
							// Fallback: estimate size or use 0
							responseSize = 0;
						}

						performanceMonitor.trackAPIRequest(
							"Prisma",
							prop,
							startTime,
							200,
							responseSize,
							false,
							{ requestId, args: args.slice(0, 3) }, // Limit args logging
						);

						return result;
					} catch (error: any) {
						const endTime = Date.now();

						performanceMonitor.trackAPIRequest(
							"Prisma",
							prop,
							startTime,
							error?.code || 500,
							0,
							true,
							{ requestId, error: error?.message, args: args.slice(0, 3) },
						);

						throw error;
					}
				};
			}

			return value;
		},
	});

	return trackedPrisma;
}

// Auto-disconnect on page unload
if (typeof window !== "undefined") {
	window.addEventListener("beforeunload", () => {
		performanceMonitor.disconnect();
	});
}
