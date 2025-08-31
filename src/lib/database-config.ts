/** @format */

// Database connection configuration and optimization
export const databaseConfig = {
	// Connection pool settings
	pool: {
		min: 2, // Minimum connections
		max: 10, // Maximum connections
		acquireTimeout: 30000, // 30 seconds
		idleTimeout: 30000, // 30 seconds
	},

	// Query optimization
	query: {
		timeout: 30000, // 30 seconds query timeout
		maxRetries: 3, // Maximum retry attempts
		retryDelay: 1000, // 1 second delay between retries
	},

	// Performance settings
	performance: {
		enableQueryCache: true,
		cacheTTL: 5 * 60 * 1000, // 5 minutes
		enableConnectionPooling: true,
		enableQueryLogging: process.env.NODE_ENV === "development",
	},

	// Health check settings
	healthCheck: {
		interval: 30000, // 30 seconds
		timeout: 5000, // 5 seconds
		maxFailures: 3, // Maximum consecutive failures
	},
};

// Database URL parser and validator
export const parseDatabaseUrl = (url: string) => {
	try {
		const parsed = new URL(url);
		return {
			protocol: parsed.protocol,
			host: parsed.hostname,
			port:
				parsed.port || (parsed.protocol === "postgresql:" ? "5432" : "3306"),
			database: parsed.pathname.slice(1),
			username: parsed.username,
			password: parsed.password,
			searchParams: parsed.searchParams,
		};
	} catch (error) {
		console.error("Invalid database URL:", error);
		return null;
	}
};

// Connection string builder with pool settings
export const buildConnectionString = (
	baseUrl: string,
	poolSettings?: Partial<typeof databaseConfig.pool>,
) => {
	const url = new URL(baseUrl);

	// Add connection pool parameters
	if (poolSettings) {
		url.searchParams.set(
			"connection_limit",
			poolSettings.max?.toString() || "10",
		);
		url.searchParams.set(
			"pool_timeout",
			poolSettings.acquireTimeout?.toString() || "30000",
		);
		url.searchParams.set(
			"idle_timeout",
			poolSettings.idleTimeout?.toString() || "30000",
		);
	}

	// Add performance parameters
	url.searchParams.set(
		"statement_timeout",
		databaseConfig.query.timeout.toString(),
	);
	url.searchParams.set("idle_in_transaction_session_timeout", "30000");

	return url.toString();
};

// Database connection status monitor
export class DatabaseMonitor {
	private static instance: DatabaseMonitor;
	private healthStatus: "healthy" | "degraded" | "unhealthy" = "healthy";
	private consecutiveFailures = 0;
	private lastCheck = Date.now();

	static getInstance(): DatabaseMonitor {
		if (!DatabaseMonitor.instance) {
			DatabaseMonitor.instance = new DatabaseMonitor();
		}
		return DatabaseMonitor.instance;
	}

	async checkHealth(): Promise<boolean> {
		try {
			// Simple health check - can be extended with actual database queries
			const now = Date.now();
			if (now - this.lastCheck < databaseConfig.healthCheck.interval) {
				return this.healthStatus === "healthy";
			}

			this.lastCheck = now;

			// Reset failures on successful check
			this.consecutiveFailures = 0;
			this.healthStatus = "healthy";
			return true;
		} catch (error) {
			this.consecutiveFailures++;

			if (this.consecutiveFailures >= databaseConfig.healthCheck.maxFailures) {
				this.healthStatus = "unhealthy";
			} else {
				this.healthStatus = "degraded";
			}

			console.error("Database health check failed:", error);
			return false;
		}
	}

	getStatus() {
		return {
			status: this.healthStatus,
			consecutiveFailures: this.consecutiveFailures,
			lastCheck: this.lastCheck,
		};
	}

	reset() {
		this.consecutiveFailures = 0;
		this.healthStatus = "healthy";
		this.lastCheck = Date.now();
	}
}

// Export singleton instance
export const databaseMonitor = DatabaseMonitor.getInstance();
