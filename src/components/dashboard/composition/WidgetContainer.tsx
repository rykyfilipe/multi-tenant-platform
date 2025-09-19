/**
 * Widget Container Component
 * Provides common container functionality for all widgets
 */

import React from 'react';
import { BaseWidget, WidgetProps } from '@/types/widgets';
import { cn } from '@/lib/utils';

interface WidgetContainerProps {
  widget: BaseWidget;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  showRefresh?: boolean;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStyleEdit?: () => void;
}

export function WidgetContainer({
  widget,
  children,
  className,
  style,
  loading = false,
  error = null,
  onRefresh,
  showRefresh = false,
  ...props
}: WidgetContainerProps) {
  return (
    <div
      className={cn(
        'widget-container',
        'relative',
        'rounded-lg',
        'border',
        'bg-background',
        'shadow-sm',
        'transition-all',
        'duration-200',
        'hover:shadow-md',
        className
      )}
      style={style}
      data-widget-id={widget.id}
      data-widget-type={widget.type}
    >
      {/* Widget Header */}
      <div className="widget-header flex items-center justify-between p-4 border-b">
        <div className="widget-title">
          <h3 className="text-lg font-semibold text-foreground">
            {widget.title || `Untitled ${widget.type} Widget`}
          </h3>
        </div>
        
        {/* Widget Actions */}
        <div className="widget-actions flex items-center space-x-2">
          {showRefresh && onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Refresh data"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="widget-content p-4">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center h-32 text-destructive">
            <div className="text-center">
              <div className="text-sm font-medium mb-1">Error loading data</div>
              <div className="text-xs text-muted-foreground">{error}</div>
            </div>
          </div>
        )}
        
        {!loading && !error && children}
      </div>
    </div>
  );
}

export default WidgetContainer;
