'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Widget } from '@/types/dashboard';
import WidgetRenderer from './WidgetRenderer';
import { toast } from 'sonner';

// Dynamic import to avoid SSR issues
const ResponsiveGridLayout = dynamic(
  () => import('react-grid-layout').then(mod => mod.Responsive),
  { ssr: false }
);

interface DashboardCanvasProps {
  dashboard: any;
  widgets: Widget[];
  onWidgetsUpdate: (widgets: Widget[]) => void;
  onWidgetSelect: (widget: Widget | null) => void;
  onAutoSave: () => void;
}

export default function DashboardCanvas({
  dashboard,
  widgets,
  onWidgetsUpdate,
  onWidgetSelect,
  onAutoSave,
}: DashboardCanvasProps) {
  const [layout, setLayout] = useState<any[]>([]);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);

  // Convert widgets to grid layout format
  useEffect(() => {
    const gridLayout = widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: widget.position.minW || 2,
      minH: widget.position.minH || 2,
      maxW: widget.position.maxW || 12,
      maxH: widget.position.maxH || 12,
    }));
    setLayout(gridLayout);
  }, [widgets]);

  const handleLayoutChange = useCallback((newLayout: any[]) => {
    setLayout(newLayout);
    
    // Update widget positions
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = newLayout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            ...widget.position,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          },
        };
      }
      return widget;
    });

    onWidgetsUpdate(updatedWidgets);
    onAutoSave();
  }, [widgets, onWidgetsUpdate, onAutoSave]);

  const handleWidgetClick = useCallback((widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId);
    if (widget) {
      setSelectedWidgetId(widgetId);
      onWidgetSelect(widget);
    }
  }, [widgets, onWidgetSelect]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas itself, not on a widget
    if (e.target === e.currentTarget) {
      setSelectedWidgetId(null);
      onWidgetSelect(null);
    }
  }, [onWidgetSelect]);

  const handleWidgetDelete = useCallback(async (widgetId: string) => {
    try {
      const response = await fetch(`/api/widgets/${widgetId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete widget');
      }

      const updatedWidgets = widgets.filter(w => w.id !== widgetId);
      onWidgetsUpdate(updatedWidgets);
      onAutoSave();
      
      if (selectedWidgetId === widgetId) {
        setSelectedWidgetId(null);
        onWidgetSelect(null);
      }
      
      toast.success('Widget deleted successfully');
    } catch (error) {
      console.error('Error deleting widget:', error);
      toast.error('Failed to delete widget');
    }
  }, [widgets, onWidgetsUpdate, onAutoSave, selectedWidgetId, onWidgetSelect]);

  return (
    <div 
      className="h-full p-4 bg-muted/20"
      onClick={handleCanvasClick}
    >
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={50}
        onLayoutChange={handleLayoutChange}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".widget-drag-handle"
        margin={[16, 16]}
        containerPadding={[16, 16]}
      >
        {widgets.map((widget) => (
          <div key={widget.id} className="widget-container">
            <div 
              className={`
                widget-drag-handle w-full h-full cursor-move
                ${selectedWidgetId === widget.id ? 'ring-2 ring-primary' : ''}
              `}
              onClick={() => handleWidgetClick(widget.id)}
            >
              <WidgetRenderer
                widget={widget}
                isSelected={selectedWidgetId === widget.id}
                onDelete={() => handleWidgetDelete(widget.id)}
              />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
      
      {widgets.length === 0 && (
        <div className="flex items-center justify-center h-64 text-center">
          <div className="text-muted-foreground">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
            <p className="text-sm">
              Drag widgets from the toolbar above to start building your dashboard
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
