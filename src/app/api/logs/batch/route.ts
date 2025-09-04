/** @format */

import { NextRequest, NextResponse } from "next/server";
import { logger, type LogEntry } from "@/lib/error-logger";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
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

const BatchLogSchema = z.array(LogEntrySchema);

/**
 * POST /api/logs/batch - Process multiple log entries
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const logEntries = BatchLogSchema.parse(body);

		// Get user context
		const sessionResult = await requireAuthResponse();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const { user } = sessionResult;
		const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

		let processedCount = 0;
		let errorCount = 0;

		// Process each log entry
		for (const logEntry of logEntries) {
			try {
				// Enhance log entry with server context
				const enhancedLogEntry: LogEntry = {
					...logEntry,
					context: {
						...logEntry.context,
											userId: user?.id,
					tenantId: user?.tenantId,
						ip,
						serverTimestamp: new Date().toISOString(),
						batchProcessed: true,
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

				processedCount++;
			} catch (entryError) {
				errorCount++;
				logger.error("Failed to process individual log entry", entryError as Error, {
					component: "BatchLogsAPI",
					originalLogEntry: logEntry,
				});
			}
		}

		return NextResponse.json({
			success: true,
			processed: processedCount,
			errors: errorCount,
			total: logEntries.length,
		});
	} catch (error) {
		logger.error("Failed to process batch log entries", error as Error, {
			component: "BatchLogsAPI",
		});

		return NextResponse.json(
			{ error: "Failed to process batch log entries" },
			{ status: 400 }
		);
	}
}
