/** @format */

import { trackSystemPerformance, trackTenantUsage } from "@/lib/api-tracker";
import { activityTracker } from "@/lib/activity-tracker";

interface SystemMetrics {
	cpuUsage: number;
	memoryUsage: number;
	diskUsage: number;
	networkLatency: number;
	errorRate: number;
	activeConnections: number;
}

interface TenantMetrics {
	tenantId: number;
	cpuUsage: number;
	memoryUsage: number;
	storageUsage: number;
	apiCalls: number;
	databaseQueries: number;
	overageAmount: number;
}

class SystemMonitor {
	private static instance: SystemMonitor;
	private monitoringInterval: NodeJS.Timeout | null = null;
	private isMonitoring = false;
	private metricsHistory: SystemMetrics[] = [];
	private tenantMetrics: Map<number, TenantMetrics> = new Map();

	private constructor() {}

	public static getInstance(): SystemMonitor {
		if (!SystemMonitor.instance) {
			SystemMonitor.instance = new SystemMonitor();
		}
		return SystemMonitor.instance;
	}

	public startMonitoring(intervalMs: number = 60000) {
		// Default 1 minute
		if (this.isMonitoring) {
			console.warn("System monitoring is already running");
			return;
		}

		this.isMonitoring = true;
		console.log("Starting system monitoring...");

		this.monitoringInterval = setInterval(async () => {
			try {
				await this.collectSystemMetrics();
				await this.collectTenantMetrics();
				await this.checkPerformanceAlerts();
			} catch (error) {
				console.error("Error in system monitoring:", error);
			}
		}, intervalMs);

		// Initial collection
		this.collectSystemMetrics();
	}

	public stopMonitoring() {
		if (this.monitoringInterval) {
			clearInterval(this.monitoringInterval);
			this.monitoringInterval = null;
		}
		this.isMonitoring = false;
		console.log("System monitoring stopped");
	}

	private async collectSystemMetrics() {
		try {
			const metrics = await this.getSystemMetrics();
			this.metricsHistory.push(metrics);

			// Keep only last 100 metrics
			if (this.metricsHistory.length > 100) {
				this.metricsHistory = this.metricsHistory.slice(-100);
			}

			// Track system performance for all tenants
			// In a real system, you'd get all active tenants
			const activeTenants = await this.getActiveTenants();

			for (const tenantId of activeTenants) {
				trackSystemPerformance(
					tenantId,
					metrics.cpuUsage,
					metrics.memoryUsage,
					metrics.diskUsage,
					metrics.networkLatency,
					metrics.errorRate,
					metrics.activeConnections,
				);
			}
		} catch (error) {
			console.error("Failed to collect system metrics:", error);
		}
	}

	private async collectTenantMetrics() {
		try {
			const tenants = await this.getActiveTenants();

			for (const tenantId of tenants) {
				const metrics = await this.getTenantMetrics(tenantId);
				this.tenantMetrics.set(tenantId, metrics);

				trackTenantUsage(
					tenantId,
					metrics.cpuUsage,
					metrics.memoryUsage,
					metrics.storageUsage,
					metrics.apiCalls,
					metrics.databaseQueries,
					metrics.overageAmount,
				);
			}
		} catch (error) {
			console.error("Failed to collect tenant metrics:", error);
		}
	}

	private async getSystemMetrics(): Promise<SystemMetrics> {
		// In a real system, you'd collect actual system metrics
		// For now, we'll simulate realistic values
		const now = new Date();
		const hour = now.getHours();

		// Simulate daily usage patterns
		const baseLoad = 20 + Math.sin(((hour - 6) * Math.PI) / 12) * 30;
		const randomVariation = (Math.random() - 0.5) * 20;

		return {
			cpuUsage: Math.max(5, Math.min(95, baseLoad + randomVariation)),
			memoryUsage: Math.max(30, Math.min(90, baseLoad + randomVariation + 10)),
			diskUsage: Math.max(40, Math.min(85, 60 + Math.random() * 15)),
			networkLatency: Math.max(10, Math.min(200, 50 + Math.random() * 100)),
			errorRate: Math.max(0, Math.min(5, Math.random() * 2)),
			activeConnections: Math.max(5, Math.min(100, 20 + Math.random() * 30)),
		};
	}

	private async getTenantMetrics(tenantId: number): Promise<TenantMetrics> {
		// In a real system, you'd collect actual tenant-specific metrics
		// For now, we'll simulate realistic values based on tenant activity
		const baseActivity = 10 + Math.random() * 40;

		return {
			tenantId,
			cpuUsage: Math.max(5, Math.min(80, baseActivity)),
			memoryUsage: Math.max(20, Math.min(70, baseActivity + 10)),
			storageUsage: Math.max(100, Math.min(5000, 500 + Math.random() * 1000)),
			apiCalls: Math.max(10, Math.min(1000, 50 + Math.random() * 200)),
			databaseQueries: Math.max(5, Math.min(500, 20 + Math.random() * 100)),
			overageAmount: Math.random() < 0.1 ? Math.random() * 100 : 0,
		};
	}

	private async getActiveTenants(): Promise<number[]> {
		// In a real system, you'd query the database for active tenants
		// For now, we'll return a few sample tenant IDs
		return [1, 2, 3]; // Sample tenant IDs
	}

	private async checkPerformanceAlerts() {
		const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
		if (!latestMetrics) return;

		// Check for high CPU usage
		if (latestMetrics.cpuUsage > 80) {
			await this.createPerformanceAlert(
				1, // Default tenant ID
				"CPU_HIGH",
				"cpu_usage",
				80,
				latestMetrics.cpuUsage,
				"warning",
				`High CPU usage detected: ${latestMetrics.cpuUsage.toFixed(1)}%`,
			);
		}

		// Check for high memory usage
		if (latestMetrics.memoryUsage > 85) {
			await this.createPerformanceAlert(
				1, // Default tenant ID
				"MEMORY_HIGH",
				"memory_usage",
				85,
				latestMetrics.memoryUsage,
				"warning",
				`High memory usage detected: ${latestMetrics.memoryUsage.toFixed(1)}%`,
			);
		}

		// Check for high error rate
		if (latestMetrics.errorRate > 2) {
			await this.createPerformanceAlert(
				1, // Default tenant ID
				"ERROR_RATE_HIGH",
				"error_rate",
				2,
				latestMetrics.errorRate,
				"critical",
				`High error rate detected: ${latestMetrics.errorRate.toFixed(2)}%`,
			);
		}

		// Check for high network latency
		if (latestMetrics.networkLatency > 150) {
			await this.createPerformanceAlert(
				1, // Default tenant ID
				"LATENCY_HIGH",
				"network_latency",
				150,
				latestMetrics.networkLatency,
				"warning",
				`High network latency detected: ${latestMetrics.networkLatency}ms`,
			);
		}
	}

	private async createPerformanceAlert(
		tenantId: number,
		alertType: string,
		metric: string,
		threshold: number,
		currentValue: number,
		severity: string,
		message: string,
	) {
		try {
			await activityTracker.trackPerformanceAlert({
				tenantId,
				alertType,
				metric,
				threshold,
				currentValue,
				severity,
				message,
			});
		} catch (error) {
			console.error("Failed to create performance alert:", error);
		}
	}

	public getMetricsHistory(): SystemMetrics[] {
		return [...this.metricsHistory];
	}

	public getTenantMetrics(tenantId: number): TenantMetrics | undefined {
		return this.tenantMetrics.get(tenantId);
	}

	public getAllTenantMetrics(): Map<number, TenantMetrics> {
		return new Map(this.tenantMetrics);
	}

	public isRunning(): boolean {
		return this.isMonitoring;
	}
}

export const systemMonitor = SystemMonitor.getInstance();

// Helper function to start monitoring
export function startSystemMonitoring(intervalMs?: number) {
	systemMonitor.startMonitoring(intervalMs);
}

// Helper function to stop monitoring
export function stopSystemMonitoring() {
	systemMonitor.stopMonitoring();
}

// Helper function to get current metrics
export function getCurrentSystemMetrics(): SystemMetrics[] {
	return systemMonitor.getMetricsHistory();
}

// Helper function to get tenant metrics
export function getTenantMetrics(tenantId: number): TenantMetrics | undefined {
	return systemMonitor.getTenantMetrics(tenantId);
}
