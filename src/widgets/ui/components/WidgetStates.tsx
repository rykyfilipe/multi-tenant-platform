"use client";

import React from "react";
import { BaseWidget } from "./BaseWidget";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Database, Loader2 } from "lucide-react";

interface BaseStateProps {
  widget?: {
    title?: string | null;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

// ============================================================================
// LOADING STATE - Standardized skeleton
// ============================================================================

interface LoadingStateProps extends BaseStateProps {
  variant?: 'table' | 'chart' | 'kpi' | 'default';
}

export const WidgetLoadingState: React.FC<LoadingStateProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode,
  variant = 'default'
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'table':
        return (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        );
      
      case 'chart':
        return (
          <div className="space-y-3 w-full">
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
          </div>
        );
      
      case 'kpi':
        return (
          <div className="space-y-3">
            <Skeleton className="h-16 w-32 mx-auto" />
            <Skeleton className="h-4 w-24 mx-auto" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        );
      
      default:
        return (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        );
    }
  };

  return (
    <BaseWidget 
      title={widget?.title} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
    >
      <div className="h-full w-full p-4 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading data...</span>
          </div>
          {renderSkeleton()}
        </div>
      </div>
    </BaseWidget>
  );
};

// ============================================================================
// ERROR STATE - Standardized error display
// ============================================================================

interface ErrorStateProps extends BaseStateProps {
  error: Error | string;
  title?: string;
}

export const WidgetErrorState: React.FC<ErrorStateProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode,
  error,
  title = "Error loading data"
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <BaseWidget 
      title={widget?.title} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
    >
      <div className="h-full w-full p-4 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
              <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {errorMessage}
          </p>
        </div>
      </div>
    </BaseWidget>
  );
};

// ============================================================================
// EMPTY STATE - Standardized no data display
// ============================================================================

interface EmptyStateProps extends BaseStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export const WidgetEmptyState: React.FC<EmptyStateProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode,
  title = "No data available",
  message = "Configure the widget to display data",
  icon
}) => {
  return (
    <BaseWidget 
      title={widget?.title} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
    >
      <div className="h-full w-full p-4 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="flex justify-center mb-3">
            <div className="rounded-full bg-muted p-3">
              {icon || <Database className="h-6 w-6 text-muted-foreground" />}
            </div>
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {message}
          </p>
        </div>
      </div>
    </BaseWidget>
  );
};

