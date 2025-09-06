/** @format */

/**
 * Centralized Error Logging System
 * Replaces console.log/console.error with structured logging
 * Integrates with external monitoring services (Sentry, LogRocket, etc.)
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
	FATAL = 4,
}

export interface LogContext {
	userId?: string;
	tenantId?: string;
	sessionId?: string;
	userAgent?: string;
	url?: string;
	method?: string;
	ip?: string;
	requestId?: string;
	component?: string;
	action?: string;
	[key: string]: unknown;
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: LogContext;
	error?: Error;
	stack?: string;
	metadata?: Record<string, unknown>;
}

class ErrorLogger {
	private minLevel: LogLevel;
	private enableConsole: boolean;
	private enableSentry: boolean;
	private enableRemoteLogging: boolean;

	constructor() {
		this.minLevel = process.env.NODE_ENV === "production" ? LogLevel.WARN : LogLevel.DEBUG;
		this.enableConsole = process.env.NODE_ENV !== "production";
		this.enableSentry = process.env.NEXT_PUBLIC_SENTRY_DSN ? true : false;
		this.enableRemoteLogging = process.env.NODE_ENV === "production";
	}

	/**
	 * Log debug information - development only
	 */
	debug(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.DEBUG, message, context, undefined, metadata);
	}

	/**
	 * Log general information
	 */
	info(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.INFO, message, context, undefined, metadata);
	}

	/**
	 * Log warnings
	 */
	warn(message: string, context?: LogContext, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.WARN, message, context, undefined, metadata);
	}

	/**
	 * Log errors
	 */
	error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.ERROR, message, context, error, metadata);
	}

	/**
	 * Log fatal errors
	 */
	fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.FATAL, message, context, error, metadata);
	}

	/**
	 * Log user activity for analytics
	 */
	activity(action: string, context?: LogContext, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.INFO, `User Activity: ${action}`, context, undefined, metadata);
	}

	/**
	 * Log performance metrics
	 */
	performance(metric: string, value: number, context?: LogContext): void {
		this.log(LogLevel.INFO, `Performance: ${metric}`, context, undefined, {
			metric,
			value,
			timestamp: Date.now(),
		});
	}

	/**
	 * Log security events
	 */
	security(event: string, context?: LogContext, metadata?: Record<string, unknown>): void {
		this.log(LogLevel.WARN, `Security Event: ${event}`, context, undefined, metadata);
	}

	/**
	 * Core logging method
	 */
	private log(
		level: LogLevel,
		message: string,
		context?: LogContext,
		error?: Error,
		metadata?: Record<string, unknown>
	): void {
		if (level < this.minLevel) return;

		const logEntry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
			error,
			stack: error?.stack,
			metadata,
		};

		// Console logging (development)
		if (this.enableConsole) {
			this.logToConsole(logEntry);
		}

		// Sentry logging (production errors)
		if (this.enableSentry && level >= LogLevel.ERROR) {
			this.logToSentry(logEntry);
		}

		// Remote logging (production)
		if (this.enableRemoteLogging) {
			this.logToRemote(logEntry);
		}

		// Browser storage for debugging
		this.logToBrowser(logEntry);
	}

	/**
	 * Console logging with formatted output
	 */
	private logToConsole(entry: LogEntry): void {
		const levelName = LogLevel[entry.level];
		const timestamp = entry.timestamp;
		const prefix = `[${timestamp}] [${levelName}]`;

		const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : "";
		const metadataStr = entry.metadata ? JSON.stringify(entry.metadata, null, 2) : "";

		switch (entry.level) {
			case LogLevel.DEBUG:
				// eslint-disable-next-line no-console
				console.debug(`${prefix} ${entry.message}`, contextStr, metadataStr);
				break;
			case LogLevel.INFO:
				// eslint-disable-next-line no-console
				console.info(`${prefix} ${entry.message}`, contextStr, metadataStr);
				break;
			case LogLevel.WARN:
				// eslint-disable-next-line no-console
				console.warn(`${prefix} ${entry.message}`, contextStr, metadataStr);
				break;
			case LogLevel.ERROR:
			case LogLevel.FATAL:
				// eslint-disable-next-line no-console
				console.error(`${prefix} ${entry.message}`, entry.error, contextStr, metadataStr);
				break;
		}
	}

	/**
	 * Sentry logging for production error tracking
	 */
	private logToSentry(entry: LogEntry): void {
		if (typeof window === "undefined") return; // Server-side

		try {
			// Dynamic import to avoid SSR issues
			import("@sentry/browser").then((Sentry) => {
				Sentry.addBreadcrumb({
					message: entry.message,
					level: entry.level >= LogLevel.ERROR ? "error" : "info",
					data: entry.metadata,
				});

				if (entry.error) {
					Sentry.captureException(entry.error, {
						contexts: {
							context: entry.context,
						},
						tags: {
							level: LogLevel[entry.level],
						},
					});
				} else {
					Sentry.captureMessage(entry.message, entry.level >= LogLevel.ERROR ? "error" : "info");
				}
			}).catch(() => {
				// Silently ignore if Sentry is not available
			});
		} catch (err) {
			// Fallback if Sentry is not available
			// eslint-disable-next-line no-console
			console.error("Failed to log to Sentry:", err);
		}
	}

	/**
	 * Remote logging for production
	 */
	private logToRemote(entry: LogEntry): void {
		// Only attempt remote logging in development
		if (process.env.NODE_ENV !== "development") {
			this.storePendingLog(entry);
			return;
		}

		try {
			// Send to remote logging service
			fetch("/api/logs", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(entry),
			}).catch((err) => {
				// Fallback - store in browser for later upload
				this.storePendingLog(entry);
			});
		} catch (err) {
			this.storePendingLog(entry);
		}
	}

	/**
	 * Browser storage for debugging and offline logging
	 */
	private logToBrowser(entry: LogEntry): void {
		if (typeof window === "undefined") return;

		try {
			const logs = JSON.parse(localStorage.getItem("app_logs") || "[]");
			logs.push(entry);

			// Keep only last 100 logs
			if (logs.length > 100) {
				logs.splice(0, logs.length - 100);
			}

			localStorage.setItem("app_logs", JSON.stringify(logs));
		} catch (err) {
			// Storage might be full or unavailable
		}
	}

	/**
	 * Store pending logs for later upload
	 */
	private storePendingLog(entry: LogEntry): void {
		if (typeof window === "undefined") return;

		try {
			const pending = JSON.parse(localStorage.getItem("pending_logs") || "[]");
			pending.push(entry);

			// Keep only last 50 pending logs
			if (pending.length > 50) {
				pending.splice(0, pending.length - 50);
			}

			localStorage.setItem("pending_logs", JSON.stringify(pending));
		} catch (err) {
			// Storage might be full or unavailable
		}
	}

	/**
	 * Upload pending logs when connection is restored
	 */
	uploadPendingLogs(): void {
		if (typeof window === "undefined") return;

		// Only attempt remote logging in development
		if (process.env.NODE_ENV !== "development") {
			return;
		}

		try {
			const pending = JSON.parse(localStorage.getItem("pending_logs") || "[]");
			if (pending.length === 0) return;

			fetch("/api/logs/batch", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(pending),
			})
				.then(() => {
					localStorage.removeItem("pending_logs");
				})
				.catch(() => {
					// Keep logs for later retry
				});
		} catch (err) {
			// Unable to process pending logs
		}
	}

	/**
	 * Get stored logs for debugging
	 */
	getStoredLogs(): LogEntry[] {
		if (typeof window === "undefined") return [];

		try {
			return JSON.parse(localStorage.getItem("app_logs") || "[]");
		} catch (err) {
			return [];
		}
	}

	/**
	 * Clear stored logs
	 */
	clearStoredLogs(): void {
		if (typeof window === "undefined") return;

		try {
			localStorage.removeItem("app_logs");
			localStorage.removeItem("pending_logs");
		} catch (err) {
			// Unable to clear logs
		}
	}
}

// Singleton instance
export const logger = new ErrorLogger();

// Convenience exports
export default logger;
