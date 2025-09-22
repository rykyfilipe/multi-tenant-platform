/**
 * Refactored Dashboard Page
 * Fully scalable, clean, and type-safe widget system
 */

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react';
import { Plus, Settings, Eye, Edit3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import { useDashboardStore, useDashboardSelectors, useDashboardActions } from '@/hooks/useDashboardStore';
import { useWidgetPendingChanges } from '@/hooks/useWidgetPendingChanges';
import { 
  WidgetEntity, 
  WidgetId, 
  WidgetType,
  WidgetEditorProps,
  WidgetError 
} from '@/types/widget';
import { 
  getWidgetEditor, 
  isValidWidgetType,
  mapWidgetData 
} from '@/lib/widget-registry';
import { 
  validateWidgetConfig,
  createWidgetError,
  logWidgetError,
  hasDataErrors,
  getDataErrorMessage
} from '@/lib/widget-data-mapper';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface RefactoredDashboardPageProps {
  dashboardId: number;
  dashboardName: string;
  initialWidgets?: WidgetEntity[];
}

// Error boundary for widget editors
class WidgetEditorErrorBoundary extends React.Component<
  { children: React.ReactNode; widgetId: WidgetId; widgetType: WidgetType },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const widgetError = createWidgetError(
      'editor',
      error.message,
      this.props.widgetId,
      this.props.widgetType,
      errorInfo
    );
    logWidgetError(widgetError);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading widget editor for {this.props.widgetType} widget.
            Please try refreshing the page.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

// Widget renderer with error handling
const WidgetRenderer: React.FC<{
  widget: WidgetEntity;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ widget, isEditing, onEdit, onDelete }) => {
  const [mappedData, setMappedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load and map widget data
  useEffect(() => {
    const loadWidgetData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate data loading (in real implementation, this would fetch from API)
        const mockData = [
          { id: 1, name: 'Item 1', value: 100, date: '2024-01-01' },
          { id: 2, name: 'Item 2', value: 200, date: '2024-01-02' },
          { id: 3, name: 'Item 3', value: 150, date: '2024-01-03' }
        ];

        // Map data using the centralized mapper
        const result = mapWidgetData(widget.type, mockData, widget.config);
        
        if (hasDataErrors(result)) {
          setError(getDataErrorMessage(result) || 'Unknown data error');
        } else {
          setMappedData(result.data);
        }

      } catch (err) {
        const widgetError = createWidgetError(
          'data',
          err instanceof Error ? err.message : 'Unknown error',
          widget.id,
          widget.type
        );
        logWidgetError(widgetError);
        setError(widgetError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadWidgetData();
  }, [widget]);

  const renderWidgetContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    // Render widget content based on type
    switch (widget.type) {
      case 'line':
      case 'bar':
      case 'pie':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm text-gray-600">{widget.type.toUpperCase()} Chart</div>
              <div className="text-xs text-gray-400 mt-1">
                {mappedData?.length || 0} data points
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm text-gray-600">Table</div>
              <div className="text-xs text-gray-400 mt-1">
                {mappedData?.rows?.length || 0} rows
              </div>
            </div>
          </div>
        );

      case 'metric':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📈</div>
              <div className="text-sm text-gray-600">Metric</div>
              <div className="text-xs text-gray-400 mt-1">
                Value: {mappedData?.value || 'N/A'}
              </div>
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm text-gray-600">Calendar</div>
              <div className="text-xs text-gray-400 mt-1">
                {mappedData?.length || 0} events
              </div>
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-sm text-gray-600">Tasks</div>
              <div className="text-xs text-gray-400 mt-1">
                {mappedData?.length || 0} tasks
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">❓</div>
              <div className="text-sm text-gray-600">Unknown Widget</div>
              <div className="text-xs text-gray-400 mt-1">
                Type: {widget.type}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {widget.title || 'Untitled Widget'}
        </CardTitle>
        {isEditing && (
          <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Settings className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-grow p-2">
        {renderWidgetContent()}
      </CardContent>
    </Card>
  );
};

export function RefactoredDashboardPage({ 
  dashboardId, 
  dashboardName, 
  initialWidgets = [] 
}: RefactoredDashboardPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<WidgetEntity | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [widgetErrors, setWidgetErrors] = useState<WidgetError[]>([]);

  const { selectedDashboard, isLoading } = useDashboardSelectors();
  const { addWidget, updateWidget, removeWidget } = useDashboardActions();
  const { pendingChangesCount, isSaving } = useWidgetPendingChanges();
  const hasChanges = pendingChangesCount > 0;
  
  const widgets = selectedDashboard?.widgets || [];

  // Load initial widgets
  useEffect(() => {
    if (initialWidgets.length > 0) {
      // Add widgets to the store
      initialWidgets.forEach((widget: any) => addWidget(widget));
    }
  }, [initialWidgets, addWidget]);

  // Convert widgets to grid layout format
  const layout = useMemo(() => {
    return widgets.map((widget) => ({
      i: widget.id.toString(),
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.width,
      h: widget.position.height,
    }));
  }, [widgets]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    if (!isEditing) return;
    
    // Update widget positions
    newLayout.forEach(item => {
      const widget = widgets.find((w: any) => w.id.toString() === item.i);
      if (widget) {
        updateWidget(Number(widget.id), {
          position: {
            x: item.x,
            y: item.y,
            width: item.w,
            height: item.h,
          },
        });
      }
    });

    // Update order
    const newOrder = newLayout.map(item => 
      widgets.find((w: any) => w.id.toString() === item.i)?.id as number
    ).filter(Boolean);
    
    if (newOrder.length > 0) {
      // Update widget order by updating each widget's position
      newOrder.forEach((widgetId, index) => {
        const widget = widgets.find(w => w.id === widgetId);
        if (widget) {
          updateWidget(Number(widgetId), { order: index });
        }
      });
    }
  }, [isEditing, widgets, updateWidget]);

  const handleCreateWidget = useCallback(() => {
    setIsCreatingNew(true);
    setSelectedWidget(null);
    setIsEditorOpen(true);
  }, []);

  const handleEditWidget = useCallback((widget: any) => {
    // Validate widget configuration before opening editor
    const validation = validateWidgetConfig(widget.type, widget.config);
    if (!validation.isValid) {
      const widgetError = createWidgetError(
        'editor',
        `Invalid configuration: ${validation.errors.join(', ')}`,
        widget.id,
        widget.type
      );
      setWidgetErrors(prev => [...prev, widgetError]);
      logWidgetError(widgetError);
      return;
    }

    setIsCreatingNew(false);
    setSelectedWidget(widget);
    setIsEditorOpen(true);
  }, []);

  const handleDeleteWidget = useCallback((widgetId: WidgetId) => {
    if (confirm('Are you sure you want to delete this widget?')) {
      removeWidget(Number(widgetId));
    }
  }, [removeWidget]);

  const handleSaveWidget = useCallback((widget: any) => {
    // Validate widget before saving
    if (widget.type && widget.config) {
      const validation = validateWidgetConfig(widget.type, widget.config);
      if (!validation.isValid) {
        alert(`Invalid widget configuration: ${validation.errors.join(', ')}`);
        return;
      }
    }

    if (isCreatingNew) {
      addWidget(widget);
    } else {
      updateWidget(Number(widget.id), widget);
    }
    setIsEditorOpen(false);
    setSelectedWidget(null);
    setIsCreatingNew(false);
  }, [isCreatingNew, addWidget, updateWidget]);

  const handleCancelEdit = useCallback(() => {
    setIsEditorOpen(false);
    setSelectedWidget(null);
    setIsCreatingNew(false);
  }, []);

  // Get the appropriate editor component
  const WidgetEditorComponent = useMemo(() => {
    if (!selectedWidget?.type || !isValidWidgetType(selectedWidget.type)) {
      return null;
    }

    return getWidgetEditor(selectedWidget.type);
  }, [selectedWidget?.type]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{dashboardName}</h1>
          <p className="text-gray-600">
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
            {hasChanges && <span className="text-orange-600 ml-2">• Unsaved changes</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Pending Changes Indicator */}
          {hasChanges && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-1 rounded-md text-sm">
              Unsaved changes
            </div>
          )}
          
          {/* Mode Toggle */}
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2"
          >
            {isEditing ? (
              <>
                <Eye className="h-4 w-4" />
                View Mode
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4" />
                Edit Mode
              </>
            )}
          </Button>
          
          {/* Add Widget */}
          {isEditing && (
            <Button onClick={handleCreateWidget} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
          )}
        </div>
      </div>

      {/* Widget Errors */}
      {widgetErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {widgetErrors.length} widget error{widgetErrors.length > 1 ? 's' : ''} detected.
            Check console for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Content */}
      {widgets.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-gray-400 mb-4">
              <Settings className="h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No widgets yet
            </h3>
            <p className="text-gray-600 text-center mb-4">
              Start building your dashboard by adding your first widget.
            </p>
            {isEditing && (
              <Button onClick={handleCreateWidget} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Widget
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="bg-gray-50 rounded-lg p-4">
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            isDraggable={isEditing}
            isResizable={isEditing}
            onLayoutChange={handleLayoutChange}
            margin={[16, 16]}
            containerPadding={[0, 0]}
          >
            {widgets.map((widget: any) => (
              <div key={widget.id.toString()} className="relative">
                <WidgetRenderer
                  widget={widget}
                  isEditing={isEditing}
                  onEdit={() => handleEditWidget(widget)}
                  onDelete={() => handleDeleteWidget(widget.id)}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}

      {/* Dynamic Widget Editor Modal */}
      {isEditorOpen && WidgetEditorComponent && selectedWidget && (
        <WidgetEditorErrorBoundary 
          widgetId={selectedWidget.id} 
          widgetType={selectedWidget.type}
        >
          <Suspense fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg">
                <div className="text-gray-500">Loading editor...</div>
              </div>
            </div>
          }>
            <WidgetEditorComponent
              widget={selectedWidget}
              onSave={handleSaveWidget}
              onCancel={handleCancelEdit}
              isOpen={isEditorOpen}
            />
          </Suspense>
        </WidgetEditorErrorBoundary>
      )}

      {/* Fallback for invalid widget types */}
      {isEditorOpen && !WidgetEditorComponent && selectedWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Invalid Widget Type
            </h3>
            <p className="text-gray-600 mb-4">
              Widget type "{selectedWidget.type}" is not supported or has no editor available.
            </p>
            <Button onClick={handleCancelEdit} className="w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Conflict Resolution Modal - Placeholder */}
      {/* TODO: Implement conflict resolution modal */}
    </div>
  );
}
