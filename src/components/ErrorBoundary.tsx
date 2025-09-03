/** @format */

"use client";

import React, { Component, ReactNode } from "react";
import { logger } from "@/lib/error-logger";

interface ErrorBoundaryState {
	hasError: boolean;
	error?: Error;
	errorInfo?: string;
}

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: string) => void;
	component?: string;
}

/**
 * Global Error Boundary for catching React component errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return {
			hasError: true,
			error,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		const context = {
			component: this.props.component || "Unknown",
			url: typeof window !== "undefined" ? window.location.href : undefined,
			userAgent: typeof window !== "undefined" ? navigator.userAgent : undefined,
		};

		// Log to centralized system
		logger.error(`React Error Boundary: ${error.message}`, error, context, {
			componentStack: errorInfo.componentStack,
			errorBoundary: this.props.component,
		});

		// Call custom error handler if provided
		if (this.props.onError) {
			this.props.onError(error, errorInfo.componentStack);
		}

		this.setState({
			error,
			errorInfo: errorInfo.componentStack,
		});
	}

	render() {
		if (this.state.hasError) {
			// Custom fallback UI
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default error UI
			return (
				<div className="flex min-h-[400px] w-full items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
							<svg
								className="h-8 w-8 text-destructive"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
						<p className="text-sm text-muted-foreground mb-4">
							We've logged this error and will investigate it.
						</p>
						<button
							onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
							className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
						>
							Try Again
						</button>
						{process.env.NODE_ENV === "development" && this.state.error && (
							<details className="mt-4 text-left">
								<summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
									Error Details (Development Only)
								</summary>
								<pre className="mt-2 whitespace-pre-wrap rounded bg-muted p-4 text-xs text-muted-foreground overflow-auto">
									{this.state.error.toString()}
									{this.state.errorInfo}
								</pre>
							</details>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
	Component: React.ComponentType<P>,
	componentName?: string
) {
	const WrappedComponent = (props: P) => (
		<ErrorBoundary component={componentName || Component.name}>
			<Component {...props} />
		</ErrorBoundary>
	);

	WrappedComponent.displayName = `withErrorBoundary(${componentName || Component.name})`;
	return WrappedComponent;
}

/**
 * Hook for manual error reporting
 */
export function useErrorHandler() {
	return (error: Error, context?: string) => {
		logger.error(`Manual Error Report: ${error.message}`, error, {
			component: context,
			url: typeof window !== "undefined" ? window.location.href : undefined,
		});
	};
}