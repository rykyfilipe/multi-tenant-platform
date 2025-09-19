/**
 * Widget Error Boundary
 * Catches and handles errors in widget components
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BaseWidget } from '@/types/widgets';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  widget: BaseWidget;
  children: ReactNode;
  onRetry?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[WidgetErrorBoundary] Error in widget ${this.props.widget.id}:`, error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full min-h-[200px] bg-destructive/5 rounded-lg border border-destructive/20">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-destructive mb-2">
              Widget Error
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Something went wrong with this widget
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Error Details
                  </summary>
                  <pre className="text-xs text-destructive mt-2 p-2 bg-destructive/10 rounded overflow-auto">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WidgetErrorBoundary;
