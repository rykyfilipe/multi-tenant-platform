/** @format */

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
		this.setState({ error, errorInfo });
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return <ErrorFallback error={this.state.error} />;
		}

		return this.props.children;
	}
}

function ErrorFallback({ error }: { error?: Error }) {
	const router = useRouter();

	const handleRefresh = () => {
		window.location.reload();
	};

	const handleGoHome = () => {
		router.push("/");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
						<AlertTriangle className="h-6 w-6 text-destructive" />
					</div>
					<CardTitle className="text-xl">Something went wrong</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<p className="text-sm text-muted-foreground text-center">
						We encountered an unexpected error. Please try refreshing the page or go back to the home page.
					</p>
					
					{process.env.NODE_ENV === "development" && error && (
						<details className="text-xs">
							<summary className="cursor-pointer text-muted-foreground">
								Error details (development only)
							</summary>
							<pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
								{error.message}
								{error.stack && `\n\n${error.stack}`}
							</pre>
						</details>
					)}

					<div className="flex gap-2">
						<Button onClick={handleRefresh} className="flex-1">
							<RefreshCw className="w-4 h-4 mr-2" />
							Refresh Page
						</Button>
						<Button onClick={handleGoHome} variant="outline" className="flex-1">
							<Home className="w-4 h-4 mr-2" />
							Go Home
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default ErrorBoundary; 