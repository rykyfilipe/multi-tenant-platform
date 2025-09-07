/** @format */

import { NextResponse } from 'next/server';
import { forceReconnect } from './prisma';

/**
 * Database error handler middleware
 * Automatically handles database connection errors and retries
 */
export function handleDatabaseError(error: any, context: string = 'Unknown'): NextResponse | null {
	// Check if it's a database connection error
	const isConnectionError = 
		error.code === 'P2021' || // Table does not exist
		error.code === 'P2024' || // Timed out fetching a new connection from the connection pool
		error.code === '08006' || // Connection closed by upstream database
		error.code === 'P1001' || // Can't reach database server
		error.code === 'P1002' || // The database server was reached but timed out
		error.code === 'P1003' || // Database does not exist
		error.code === 'P1008' || // Operations timed out
		error.code === 'P1017' || // Server has closed the connection
		error.message?.includes('connection closed') ||
		error.message?.includes('connection terminated') ||
		error.message?.includes('connection pool') ||
		error.message?.includes('ECONNRESET') ||
		error.message?.includes('ETIMEDOUT') ||
		error.message?.includes('ENOTFOUND') ||
		error.message?.includes('ECONNREFUSED') ||
		error.message?.includes('upstream database');

	if (isConnectionError) {
		console.error(`Database connection error in ${context}:`, error.message);
		
		// Force reconnection in background
		forceReconnect().catch(reconnectError => {
			console.error('Failed to force reconnect:', reconnectError);
		});

		return NextResponse.json(
			{ 
				error: 'Database connection temporarily unavailable. Please try again in a moment.',
				code: 'DATABASE_CONNECTION_ERROR',
				context 
			},
			{ status: 503 } // Service Unavailable
		);
	}

	// Not a connection error, return null to let other error handlers deal with it
	return null;
}

/**
 * Wrapper for API routes that automatically handles database errors
 */
export function withDatabaseErrorHandling(
	handler: (request: any, context: any) => Promise<NextResponse>
) {
	return async (request: any, context: any) => {
		try {
			return await handler(request, context);
		} catch (error: any) {
			const dbErrorResponse = handleDatabaseError(error, context?.params?.tenantId || 'Unknown');
			if (dbErrorResponse) {
				return dbErrorResponse;
			}

			// Re-throw if not a database error
			throw error;
		}
	};
}
