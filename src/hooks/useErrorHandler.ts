/** @format */

import { useState, useCallback, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";
import { EnhancedError, ErrorMessageGenerator } from "@/components/errors/ErrorDisplay";

interface ErrorHandlerOptions {
	autoRetry?: boolean;
	retryDelay?: number;
	maxRetries?: number;
	showToast?: boolean;
	logError?: boolean;
}

/**
 * Hook for handling errors with enhanced user experience
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
	const { user, tenant } = useApp();
	const [errors, setErrors] = useState<EnhancedError[]>([]);
	const [retryCounts, setRetryCounts] = useState<Record<string, number>>({});

	const {
		autoRetry = false,
		retryDelay = 1000,
		maxRetries = 3,
		showToast = true,
		logError = true,
	} = options;

	// Log errors to centralized logging
	useEffect(() => {
		if (logError && errors.length > 0) {
			errors.forEach(error => {
				logger.error(`Enhanced error: ${error.title}`, new Error(error.message), {
					component: "useErrorHandler",
					userId: user?.id,
					tenantId: tenant?.id,
					errorId: error.id,
					errorType: error.type,
					errorSeverity: error.severity,
					errorCode: error.code,
					context: error.context,
				});
			});
		}
	}, [errors, logError, user?.id, tenant?.id]);

	const addError = useCallback((error: EnhancedError) => {
		setErrors(prev => [error, ...prev.slice(0, 9)]); // Keep last 10 errors

		// Auto-retry if enabled
		if (autoRetry && error.type === "network") {
			scheduleRetry(error.id);
		}
	}, [autoRetry]);

	const removeError = useCallback((errorId: string) => {
		setErrors(prev => prev.filter(error => error.id !== errorId));
		setRetryCounts(prev => {
			const newCounts = { ...prev };
			delete newCounts[errorId];
			return newCounts;
		});
	}, []);

	const clearAllErrors = useCallback(() => {
		setErrors([]);
		setRetryCounts({});
	}, []);

	const scheduleRetry = useCallback((errorId: string) => {
		const currentRetries = retryCounts[errorId] || 0;
		
		if (currentRetries < maxRetries) {
			setTimeout(() => {
				setRetryCounts(prev => ({
					...prev,
					[errorId]: currentRetries + 1,
				}));
				
				// Trigger retry logic here
				logger.info("Auto-retry scheduled", {
					component: "useErrorHandler",
					errorId,
					retryAttempt: currentRetries + 1,
					maxRetries,
				});
			}, retryDelay * (currentRetries + 1)); // Exponential backoff
		}
	}, [retryCounts, maxRetries, retryDelay]);

	const handleValidationError = useCallback((
		field: string,
		message: string,
		solutions?: any[]
	) => {
		const error = ErrorMessageGenerator.createValidationError(field, message, solutions);
		addError(error);
		return error;
	}, [addError]);

	const handleNetworkError = useCallback((
		message: string,
		solutions?: any[]
	) => {
		const error = ErrorMessageGenerator.createNetworkError(message, solutions);
		addError(error);
		return error;
	}, [addError]);

	const handlePermissionError = useCallback((
		resource: string,
		solutions?: any[]
	) => {
		const error = ErrorMessageGenerator.createPermissionError(resource, solutions);
		addError(error);
		return error;
	}, [addError]);

	const handleBusinessError = useCallback((
		message: string,
		solutions?: any[]
	) => {
		const error = ErrorMessageGenerator.createBusinessError(message, solutions);
		addError(error);
		return error;
	}, [addError]);

	const handleGenericError = useCallback((
		title: string,
		message: string,
		severity: "low" | "medium" | "high" | "critical" = "medium",
		type: "validation" | "network" | "permission" | "system" | "business" | "unknown" = "unknown"
	) => {
		const error: EnhancedError = {
			id: `generic-${Date.now()}`,
			title,
			message,
			severity,
			type,
			timestamp: new Date().toISOString(),
			solutions: [
				{
					id: "contact-support",
					title: "Contact Support",
					description: "If this error persists, please contact our support team.",
					action: {
						text: "Contact Support",
						href: "/support",
					},
				},
			],
		};
		addError(error);
		return error;
	}, [addError]);

	const handleApiError = useCallback(async (response: Response, context?: Record<string, unknown>) => {
		let error: EnhancedError;

		try {
			const errorData = await response.json();
			
			switch (response.status) {
				case 400:
					error = ErrorMessageGenerator.createValidationError(
						"Request",
						errorData.message || "Invalid request data",
						[
							{
								id: "check-request",
								title: "Check Request Data",
								description: "Please verify that all required fields are provided and correctly formatted.",
								estimatedTime: "2 minutes",
							},
						]
					);
					break;
					
				case 401:
					error = ErrorMessageGenerator.createPermissionError(
						"Authentication",
						[
							{
								id: "re-authenticate",
								title: "Sign In Again",
								description: "Your session has expired. Please sign in again.",
								action: {
									text: "Sign In",
									href: "/auth/signin",
								},
							},
						]
					);
					break;
					
				case 403:
					error = ErrorMessageGenerator.createPermissionError(
						"Resource",
						[
							{
								id: "request-access",
								title: "Request Access",
								description: "You don't have permission to perform this action.",
								action: {
									text: "Request Access",
									onClick: () => {
										// This would open a request access form
										logger.info("Access request initiated", {
											component: "useErrorHandler",
											resource: "API endpoint",
										});
									},
								},
							},
						]
					);
					break;
					
				case 404:
					error = handleGenericError(
						"Resource Not Found",
						"The requested resource could not be found.",
						"medium",
						"system"
					);
					break;
					
				case 429:
					error = ErrorMessageGenerator.createBusinessError(
						"Rate limit exceeded. Please wait before making another request.",
						[
							{
								id: "wait-and-retry",
								title: "Wait and Retry",
								description: "You've made too many requests. Please wait a moment and try again.",
								estimatedTime: "1 minute",
							},
						]
					);
					break;
					
				case 500:
				case 502:
				case 503:
				case 504:
					error = ErrorMessageGenerator.createNetworkError(
						"Server error. Our team has been notified and is working to resolve this issue.",
						[
							{
								id: "retry-later",
								title: "Retry Later",
								description: "This is a temporary server issue. Please try again in a few minutes.",
								estimatedTime: "5 minutes",
							},
							{
								id: "contact-support",
								title: "Contact Support",
								description: "If the issue persists, please contact our support team.",
								action: {
									text: "Contact Support",
									href: "/support",
								},
							},
						]
					);
					break;
					
				default:
					error = handleGenericError(
						"Unexpected Error",
						errorData.message || "An unexpected error occurred",
						"medium"
					);
			}
		} catch (parseError) {
			error = ErrorMessageGenerator.createNetworkError(
				"Failed to process server response",
				[
					{
						id: "retry-request",
						title: "Retry Request",
						description: "The server response could not be processed. Please try again.",
						action: {
							text: "Retry",
							onClick: () => window.location.reload(),
						},
					},
				]
			);
		}

		// Add context if provided
		if (context) {
			error.context = { ...error.context, ...context };
		}

		addError(error);
		return error;
	}, [addError, handleGenericError]);

	const handleAsyncError = useCallback(async <T>(
		asyncFunction: () => Promise<T>,
		errorContext?: {
			title?: string;
			fallbackMessage?: string;
			solutions?: any[];
		}
	): Promise<T | null> => {
		try {
			return await asyncFunction();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
			const title = errorContext?.title || "Operation Failed";
			
			const enhancedError = handleGenericError(
				title,
				errorContext?.fallbackMessage || errorMessage,
				"medium",
				"system"
			);

			// Add custom solutions if provided
			if (errorContext?.solutions) {
				enhancedError.solutions = errorContext.solutions;
			}

			return null;
		}
	}, [handleGenericError]);

	const retryError = useCallback((errorId: string) => {
		const error = errors.find(e => e.id === errorId);
		if (error) {
			// Remove the error and let the retry logic handle it
			removeError(errorId);
			
			// Log retry attempt
			logger.info("Error retry initiated", {
				component: "useErrorHandler",
				errorId,
				errorType: error.type,
				userId: user?.id,
			});
		}
	}, [errors, removeError, user?.id]);

	return {
		// State
		errors,
		retryCounts,
		
		// Actions
		addError,
		removeError,
		clearAllErrors,
		retryError,
		
		// Specific error handlers
		handleValidationError,
		handleNetworkError,
		handlePermissionError,
		handleBusinessError,
		handleGenericError,
		handleApiError,
		handleAsyncError,
		
		// Utilities
		hasErrors: errors.length > 0,
		errorCount: errors.length,
		criticalErrors: errors.filter(e => e.severity === "critical"),
		highPriorityErrors: errors.filter(e => e.severity === "high" || e.severity === "critical"),
	};
}
