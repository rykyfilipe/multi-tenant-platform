/** @format */

import { databaseConfig } from "./database-config";

// Connection monitoring and management utility
export class ConnectionMonitor {
	private static instance: ConnectionMonitor;
	private connectionCount = 0;
	private maxConnections = databaseConfig.pool.max;
	private connectionHistory: Array<{
		timestamp: number;
		action: "acquire" | "release";
		count: number;
	}> = [];
	private alerts: Array<{
		timestamp: number;
		message: string;
		severity: "warning" | "error" | "critical";
	}> = [];

	static getInstance(): ConnectionMonitor {
		if (!ConnectionMonitor.instance) {
			ConnectionMonitor.instance = new ConnectionMonitor();
		}
		return ConnectionMonitor.instance;
	}

	// Track connection acquisition
	acquireConnection(): boolean {
		if (this.connectionCount < this.maxConnections) {
			this.connectionCount++;
			this.logConnection("acquire");
			this.checkThresholds();
			return true;
		}

		this.logAlert(
			"error",
			`Connection pool exhausted. Current: ${this.connectionCount}/${this.maxConnections}`,
		);
		return false;
	}

	// Track connection release
	releaseConnection(): void {
		if (this.connectionCount > 0) {
			this.connectionCount--;
			this.logConnection("release");
		}
	}

	// Get current connection status
	getStatus() {
		return {
			current: this.connectionCount,
			max: this.maxConnections,
			available: this.maxConnections - this.connectionCount,
			utilization: (this.connectionCount / this.maxConnections) * 100,
		};
	}

	// Check connection thresholds and generate alerts
	private checkThresholds(): void {
		const utilization = (this.connectionCount / this.maxConnections) * 100;

		if (utilization >= 90) {
			this.logAlert(
				"critical",
				`Connection pool at critical level: ${utilization.toFixed(1)}%`,
			);
		} else if (utilization >= 80) {
			this.logAlert(
				"warning",
				`Connection pool reaching capacity: ${utilization.toFixed(1)}%`,
			);
		}
	}

	// Log connection activity
	private logConnection(action: "acquire" | "release"): void {
		this.connectionHistory.push({
			timestamp: Date.now(),
			action,
			count: this.connectionCount,
		});

		// Keep only last 1000 entries
		if (this.connectionHistory.length > 1000) {
			this.connectionHistory = this.connectionHistory.slice(-1000);
		}
	}

	// Log alerts
	private logAlert(
		severity: "warning" | "error" | "critical",
		message: string,
	): void {
		this.alerts.push({
			timestamp: Date.now(),
			message,
			severity,
		});

		// Keep only last 100 alerts
		if (this.alerts.length > 100) {
			this.alerts = this.alerts.slice(-100);
		}

		// Log to console based on severity
		switch (severity) {
			case "warning":
				console.warn(`[Connection Monitor] ${message}`);
				break;
			case "error":
				console.error(`[Connection Monitor] ${message}`);
				break;
			case "critical":
				console.error(`[Connection Monitor] CRITICAL: ${message}`);
				break;
		}
	}

	// Get connection history
	getHistory(limit: number = 50) {
		return this.connectionHistory.slice(-limit);
	}

	// Get recent alerts
	getAlerts(limit: number = 20) {
		return this.alerts.slice(-limit);
	}

	// Get connection statistics
	getStats() {
		const now = Date.now();
		const oneHourAgo = now - 60 * 60 * 1000;
		const recentHistory = this.connectionHistory.filter(
			(entry) => entry.timestamp > oneHourAgo,
		);

		const acquisitions = recentHistory.filter(
			(entry) => entry.action === "acquire",
		).length;
		const releases = recentHistory.filter(
			(entry) => entry.action === "release",
		).length;
		const alerts = this.alerts.filter((alert) => alert.timestamp > oneHourAgo);

		return {
			acquisitions,
			releases,
			alerts: alerts.length,
			criticalAlerts: alerts.filter((alert) => alert.severity === "critical")
				.length,
		};
	}

	// Reset connection count (use with caution)
	reset(): void {
		this.connectionCount = 0;
		this.logAlert("warning", "Connection count manually reset");
	}

	// Clear history and alerts
	clearHistory(): void {
		this.connectionHistory = [];
		this.alerts = [];
	}
}

// Export singleton instance
export const connectionMonitor = ConnectionMonitor.getInstance();

// Auto-start monitoring in development
if (process.env.NODE_ENV === "development") {
	// Log connection status every 30 seconds
	setInterval(() => {
		const status = connectionMonitor.getStatus();
		if (status.utilization > 70) {
			console.log(
				`[Connection Monitor] Status: ${status.current}/${
					status.max
				} (${status.utilization.toFixed(1)}%)`,
			);
		}
	}, 30000);
}
