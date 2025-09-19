/**
 * Widget Loading Component
 * Provides consistent loading states for widgets
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface WidgetLoadingProps {
  type?: 'skeleton' | 'spinner' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export function WidgetLoading({ 
  type = 'skeleton', 
  size = 'md', 
  className,
  message = 'Loading...'
}: WidgetLoadingProps) {
  const sizeClasses = {
    sm: 'h-16',
    md: 'h-32',
    lg: 'h-48'
  };

  if (type === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center', sizeClasses[size], className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className={cn('flex items-center justify-center', sizeClasses[size], className)}>
        <div className="text-center">
          <div className="flex space-x-1 mb-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={cn('flex items-center justify-center', sizeClasses[size], className)}>
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full animate-pulse mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }

  // Default skeleton loading
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}

/**
 * Chart-specific loading component
 */
export function ChartLoading({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

/**
 * Table-specific loading component
 */
export function TableLoading({ className, rows = 5 }: { className?: string; rows?: number }) {
  return (
    <div className={cn('space-y-2 p-4', className)}>
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-28" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-28" />
        </div>
      ))}
    </div>
  );
}

/**
 * Metric-specific loading component
 */
export function MetricLoading({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center h-32', className)}>
      <div className="text-center">
        <Skeleton className="h-12 w-24 mx-auto mb-2" />
        <Skeleton className="h-4 w-16 mx-auto" />
      </div>
    </div>
  );
}

export default WidgetLoading;
