/**
 * Widget Empty State Component
 * Provides consistent empty states for widgets
 */

import React from 'react';
import { 
  BarChart3, 
  Database, 
  TrendingUp, 
  FileText, 
  CheckSquare,
  Clock,
  Calendar,
  Cloud,
  Plus, 
  Settings,
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WidgetType } from '@/types/widgets';

interface WidgetEmptyStateProps {
  type: WidgetType;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const widgetIcons: Record<WidgetType, React.ComponentType<{ className?: string }>> = {
  chart: BarChart3,
  table: Database,
  metric: TrendingUp,
  text: FileText,
  tasks: CheckSquare,
  clock: Clock,
  calendar: Calendar,
  weather: Cloud
};

const defaultMessages: Record<WidgetType, string> = {
  chart: 'No data available for this chart',
  table: 'No data available for this table',
  metric: 'No data available for this metric',
  text: 'No content available',
  tasks: 'No tasks available',
  clock: 'Clock not available',
  calendar: 'No calendar data available',
  weather: 'Weather data not available'
};

export function WidgetEmptyState({ 
  type, 
  message, 
  action, 
  className 
}: WidgetEmptyStateProps) {
  const Icon = widgetIcons[type];
  const displayMessage = message || defaultMessages[type];

  return (
    <div className={cn(
      'flex items-center justify-center h-full min-h-[200px]',
      'text-center p-6',
      className
    )}>
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">
            {displayMessage}
          </h3>
          <p className="text-sm text-muted-foreground">
            {type === 'chart' && 'Configure your data source to see the chart'}
            {type === 'table' && 'Select a table and columns to display data'}
            {type === 'metric' && 'Choose a column and aggregation to calculate metrics'}
            {type === 'text' && 'Add some content to display in this widget'}
          </p>
        </div>

        {action && (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Widget configuration empty state
 */
export function WidgetConfigEmptyState({ 
  type, 
  onConfigure,
  className 
}: {
  type: WidgetType;
  onConfigure: () => void;
  className?: string;
}) {
  return (
    <WidgetEmptyState
      type={type}
      message={`Configure your ${type} widget`}
      action={{
        label: 'Configure',
        onClick: onConfigure
      }}
      className={className}
    />
  );
}

/**
 * Widget error empty state
 */
export function WidgetErrorEmptyState({ 
  error,
  onRetry,
  className 
}: {
  error: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      'flex items-center justify-center h-full min-h-[200px]',
      'text-center p-6',
      className
    )}>
      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-destructive">
            Error loading widget
          </h3>
          <p className="text-sm text-muted-foreground">
            {error}
          </p>
        </div>

        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-4"
          >
            <Settings className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

export default WidgetEmptyState;
