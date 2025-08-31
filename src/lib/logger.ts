/** @format */

export enum LogLevel {
	ERROR = "error",
	WARN = "warn",
	INFO = "info",
	DEBUG = "debug",
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	context?: Record<string, any>;
	userId?: string;
	tenantId?: string;
	requestId?: string;
	userAgent?: string;
	ip?: string;
}

class Logger {
	private isDevelopment = process.env.NODE_ENV === "development";
	private isProduction = process.env.NODE_ENV === "production";

	private formatMessage(
		level: LogLevel,
		message: string,
		context?: Record<string, any>,
	): LogEntry {
		return {
			timestamp: new Date().toISOString(),
			level,
			message,
			context,
		};
	}

	private shouldLog(level: LogLevel): boolean {
		if (this.isDevelopment) {
			return true; // Log everything in development
		}

		if (this.isProduction) {
			// In production, only log ERROR, WARN, and INFO
			return level !== LogLevel.DEBUG;
		}

		return false;
	}

	private logToConsole(entry: LogEntry): void {
		const { timestamp, level, message, context } = entry;
		const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

		switch (level) {
			case LogLevel.ERROR:
				console.error(prefix, message, context || "");
				break;
			case LogLevel.WARN:
				console.warn(prefix, message, context || "");
				break;
			case LogLevel.INFO:
				console.info(prefix, message, context || "");
				break;
			case LogLevel.DEBUG:
				console.debug(prefix, message, context || "");
				break;
		}
	}

	private async logToExternal(entry: LogEntry): Promise<void> {
		if (!this.isProduction) return;

		try {
			// Store in memory for now
			this.storeLog(entry);
		} catch (error) {
			// Fallback to console if external logging fails
			console.error("Failed to log to external service:", error);
			this.logToConsole(entry);
		}
	}

	private logs: LogEntry[] = [];

	private storeLog(entry: LogEntry): void {
		this.logs.push(entry);

		// Keep only last 1000 logs in memory
		if (this.logs.length > 1000) {
			this.logs = this.logs.slice(-1000);
		}
	}

	error(message: string, context?: Record<string, any>): void {
		const entry = this.formatMessage(LogLevel.ERROR, message, context);

		if (this.shouldLog(LogLevel.ERROR)) {
			this.logToConsole(entry);
			this.logToExternal(entry);
		}
	}

	warn(message: string, context?: Record<string, any>): void {
		const entry = this.formatMessage(LogLevel.WARN, message, context);

		if (this.shouldLog(LogLevel.WARN)) {
			this.logToConsole(entry);
			this.logToExternal(entry);
		}
	}

	info(message: string, context?: Record<string, any>): void {
		const entry = this.formatMessage(LogLevel.INFO, message, context);

		if (this.shouldLog(LogLevel.INFO)) {
			this.logToConsole(entry);
			this.logToExternal(entry);
		}
	}

	debug(message: string, context?: Record<string, any>): void {
		const entry = this.formatMessage(LogLevel.DEBUG, message, context);

		if (this.shouldLog(LogLevel.DEBUG)) {
			this.logToConsole(entry);
		}
	}

	// Security logging
	securityEvent(event: string, context?: Record<string, any>): void {
		this.warn(`SECURITY: ${event}`, {
			...context,
			securityEvent: true,
		});
	}

	// Performance logging
	performance(
		operation: string,
		duration: number,
		context?: Record<string, any>,
	): void {
		this.info(`PERFORMANCE: ${operation} took ${duration}ms`, {
			...context,
			performance: true,
			duration,
		});
	}

	// API request logging
	apiRequest(
		method: string,
		url: string,
		statusCode: number,
		duration: number,
		context?: Record<string, any>,
	): void {
		const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
		const entry = this.formatMessage(
			level,
			`API ${method} ${url} - ${statusCode}`,
			{
				...context,
				apiRequest: true,
				method,
				url,
				statusCode,
				duration,
			},
		);

		if (this.shouldLog(level)) {
			this.logToConsole(entry);
			this.logToExternal(entry);
		}
	}

	// Get stored logs (for debugging)
	getLogs(): LogEntry[] {
		return [...this.logs];
	}

	// Clear stored logs
	clearLogs(): void {
		this.logs = [];
	}
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions
export const logError = (message: string, context?: Record<string, any>) =>
	logger.error(message, context);
export const logWarn = (message: string, context?: Record<string, any>) =>
	logger.warn(message, context);
export const logInfo = (message: string, context?: Record<string, any>) =>
	logger.info(message, context);
export const logDebug = (message: string, context?: Record<string, any>) =>
	logger.debug(message, context);
export const logSecurity = (event: string, context?: Record<string, any>) =>
	logger.securityEvent(event, context);
export const logPerformance = (
	operation: string,
	duration: number,
	context?: Record<string, any>,
) => logger.performance(operation, duration, context);
export const logApiRequest = (
	method: string,
	url: string,
	statusCode: number,
	duration: number,
	context?: Record<string, any>,
) => logger.apiRequest(method, url, statusCode, duration, context);
