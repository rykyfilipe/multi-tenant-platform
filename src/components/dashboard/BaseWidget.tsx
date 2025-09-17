import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, RefreshCw, Edit3, Trash2 } from 'lucide-react';

export interface BaseWidgetProps {
  widget: {
    id: number;
    title?: string | null;
    type: string;
    config?: any;
  };
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  showRefresh?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function BaseWidget({
  widget,
  isEditMode = false,
  onEdit,
  onDelete,
  isLoading = false,
  error = null,
  onRefresh,
  showRefresh = false,
  children,
  className = ""
}: BaseWidgetProps) {
  const config = widget.config || {};
  const title = widget.title || config.title || `Widget ${widget.id}`;

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center space-x-2 widget-header-buttons">
            {showRefresh && onRefresh && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRefresh();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                disabled={isLoading}
                className="z-10 relative"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            )}
            {isEditMode && onEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Edit button clicked for widget:', widget.id);
                  onEdit();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="z-10 relative"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            {isEditMode && onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Delete button clicked for widget:', widget.id);
                  onDelete();
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseUp={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="z-10 relative text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 h-full">
        <div className="h-full min-h-[200px]">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
