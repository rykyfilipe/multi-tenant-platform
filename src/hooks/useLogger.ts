/** @format */

import { useCallback } from "react";
import { logger, type LogContext } from "@/lib/error-logger";
import { useApp } from "@/contexts/AppContext";
import { useSession } from "next-auth/react";

/**
 * Hook for structured logging in React components
 * Replaces console.log/console.error with centralized logging
 */
export function useLogger(component?: string) {
	const { user, tenant } = useApp();
	const { data: session } = useSession();

	// Build context for all logs from this component
	const buildContext = useCallback((additionalContext?: Partial<LogContext>): LogContext => {
		return {
			userId: user?.id?.toString(),
			tenantId: tenant?.id?.toString(),
			sessionId: session?.user?.email,
			component,
			url: typeof window !== "undefined" ? window.location.href : undefined,
			userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
			...additionalContext,
		};
	}, [user, tenant, session, component]);

	// Debug logging (development only)
	const debug = useCallback((message: string, metadata?: Record<string, unknown>, context?: Partial<LogContext>) => {
		logger.debug(message, buildContext(context), metadata);
	}, [buildContext]);

	// Info logging
	const info = useCallback((message: string, metadata?: Record<string, unknown>, context?: Partial<LogContext>) => {
		logger.info(message, buildContext(context), metadata);
	}, [buildContext]);

	// Warning logging
	const warn = useCallback((message: string, metadata?: Record<string, unknown>, context?: Partial<LogContext>) => {
		logger.warn(message, buildContext(context), metadata);
	}, [buildContext]);

	// Error logging
	const error = useCallback((message: string, err?: Error, metadata?: Record<string, unknown>, context?: Partial<LogContext>) => {
		logger.error(message, err, buildContext(context), metadata);
	}, [buildContext]);

	// Fatal error logging
	const fatal = useCallback((message: string, err?: Error, metadata?: Record<string, unknown>, context?: Partial<LogContext>) => {
		logger.fatal(message, err, buildContext(context), metadata);
	}, [buildContext]);

	// Activity logging for user actions
	const activity = useCallback((action: string, metadata?: Record<string, unknown>, context?: Partial<LogContext>) => {
		logger.activity(action, buildContext({ action, ...context }), metadata);
	}, [buildContext]);

	// Performance logging
	const performance = useCallback((metric: string, value: number, context?: Partial<LogContext>) => {
		logger.performance(metric, value, buildContext(context));
	}, [buildContext]);

	// Security event logging
	const security = useCallback((event: string, metadata?: Record<string, unknown>, context?: Partial<LogContext>) => {
		logger.security(event, buildContext(context), metadata);
	}, [buildContext]);

	return {
		debug,
		info,
		warn,
		error,
		fatal,
		activity,
		performance,
		security,
	};
}

/**
 * Legacy console replacement for gradual migration
 * @deprecated Use useLogger hook instead
 */
export const console = {
	log: (message: string, ...args: unknown[]) => {
		logger.info(message, undefined, { args });
	},
	info: (message: string, ...args: unknown[]) => {
		logger.info(message, undefined, { args });
	},
	warn: (message: string, ...args: unknown[]) => {
		logger.warn(message, undefined, { args });
	},
	error: (message: string, error?: Error, ...args: unknown[]) => {
		logger.error(message, error, undefined, { args });
	},
	debug: (message: string, ...args: unknown[]) => {
		logger.debug(message, undefined, { args });
	},
};
