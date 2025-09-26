"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Bug, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget Error Boundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Widget Error
            </CardTitle>
            <CardDescription>
              Something went wrong while rendering this widget.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Error Details</span>
              </div>
              <code className="text-xs text-muted-foreground break-all">
                {this.state.error?.message || "Unknown error occurred"}
              </code>
            </div>

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline" size="sm" className="gap-2">
                <Home className="h-4 w-4" />
                Reload Page
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
                  Stack Trace (Development)
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-32 bg-muted p-2 rounded">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Hook for error boundary functionality
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error("Captured error:", error);
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};

// Higher-order component for error boundaries
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <WidgetErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </WidgetErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};
