/** @format */

import { NextRequest, NextResponse } from "next/server";
import { logger, type LogEntry } from "@/lib/error-logger";
import { requireAuthAPI, requireTenantAccessAPI } from "@/lib/session";
import { z } from "zod";

const LogEntrySchema = z.object({
	timestamp: z.string(),
	level: z.number(),
	message: z.string(),
	context: z.object({
		userId: z.string().optional(),
		tenantId: z.string().optional(),
		sessionId: z.string().optional(),
		userAgent: z.string().optional(),
		url: z.string().optional(),
		method: z.string().optional(),
		ip: z.string().optional(),
		requestId: z.string().optional(),
		component: z.string().optional(),
		action: z.string().optional(),
	}).optional(),
	error: z.object({
		name: z.string(),
		message: z.string(),
		stack: z.string().optional(),
	}).optional(),
	metadata: z.record(z.unknown()).optional(),
});

/**
 * POST /api/logs - Receive client-side logs
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const logEntry = LogEntrySchema.parse(body);

		// Get user context
		const sessionResult = await requireAuthAPI();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const { user } = sessionResult;
		const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

		// Enhance log entry with server context
		const enhancedLogEntry: LogEntry = {
			...logEntry,
			context: {
				...logEntry.context,
				userId: user?.id,
				tenantId: user?.tenantId,
				ip,
				serverTimestamp: new Date().toISOString(),
			},
		};

		// Log to server-side logging system
		switch (logEntry.level) {
			case 0: // DEBUG
				logger.debug(logEntry.message, enhancedLogEntry.context, logEntry.metadata);
				break;
			case 1: // INFO
				logger.info(logEntry.message, enhancedLogEntry.context, logEntry.metadata);
				break;
			case 2: // WARN
				logger.warn(logEntry.message, enhancedLogEntry.context, logEntry.metadata);
				break;
			case 3: // ERROR
			case 4: // FATAL
				const error = logEntry.error ? new Error(logEntry.error.message) : undefined;
				if (error && logEntry.error?.stack) {
					error.stack = logEntry.error.stack;
				}
				logger.error(logEntry.message, error, enhancedLogEntry.context, logEntry.metadata);
				break;
		}

		// Store in database for analytics (optional)
		// await storeLogEntry(enhancedLogEntry);

		return NextResponse.json({ success: true });
	} catch (error) {
		logger.error("Failed to process log entry", error as Error, {
			component: "LogsAPI",
		});

		return NextResponse.json(
			{ error: "Failed to process log entry" },
			{ status: 400 }
		);
	}
}

/**
 * GET /api/logs - Get logs for debugging (development only)
 */
export async function GET(request: NextRequest) {
	// Only allow in development
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json({ error: "Not available in production" }, { status: 403 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const level = searchParams.get("level");
		const component = searchParams.get("component");
		const limit = parseInt(searchParams.get("limit") || "100");

		// Get logs from storage (implement based on your storage solution)
		const logs = logger.getStoredLogs();

		// Filter logs
		let filteredLogs = logs;
		if (level) {
			filteredLogs = filteredLogs.filter(log => log.level >= parseInt(level));
		}
		if (component) {
			filteredLogs = filteredLogs.filter(log => log.context?.component === component);
		}

		// Limit results
		filteredLogs = filteredLogs.slice(-limit);

		return NextResponse.json({
			logs: filteredLogs,
			total: filteredLogs.length,
		});
	} catch (error) {
		logger.error("Failed to retrieve logs", error as Error, {
			component: "LogsAPI",
		});

		return NextResponse.json(
			{ error: "Failed to retrieve logs" },
			{ status: 500 }
		);
	}
}
