'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Eye, Save, ArrowLeft, Settings } from 'lucide-react';
import { Dashboard, Widget } from '@/types/dashboard';
import TopToolbar from './TopToolbar';
import DashboardCanvas from './DashboardCanvas';
import RightPanelEditor from './RightPanelEditor';
import { toast } from 'sonner';

interface DashboardEditorProps {
  dashboard: Dashboard;
  widgets: Widget[];
}

export default function DashboardEditor({ dashboard, widgets: initialWidgets }: DashboardEditorProps) {
  const [widgets, setWidgets] = useState<Widget[]>(initialWidgets);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const router = useRouter();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const handleWidgetSelect = useCallback((widget: Widget | null) => {
    setSelectedWidget(widget);
  }, []);

  const handleWidgetUpdate = useCallback((updatedWidget: Widget) => {
    setWidgets(prev => prev.map(w => w.id === updatedWidget.id ? updatedWidget : w));
  }, []);

  const handleWidgetsUpdate = useCallback((updatedWidgets: Widget[]) => {
    setWidgets(updatedWidgets);
  }, []);

  const handleAddWidget = useCallback(async (widgetType: string, position: { x: number; y: number }) => {
    const newWidget: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'> = {
      dashboardId: dashboard.id,
      type: widgetType as any,
      config: getDefaultConfig(widgetType),
      position: {
        x: position.x,
        y: position.y,
        w: 6,
        h: 4,
        minW: 2,
        minH: 2,
      },
      orderIndex: widgets.length,
    };

    try {
      const response = await fetch('/api/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWidget),
      });

      if (!response.ok) {
        throw new Error('Failed to create widget');
      }

      const createdWidget = await response.json();
      setWidgets(prev => [...prev, createdWidget]);
      setSelectedWidget(createdWidget);
      toast.success('Widget added successfully');
    } catch (error) {
      console.error('Error creating widget:', error);
      toast.error('Failed to create widget');
    }
  }, [dashboard.id, widgets.length]);

  const handleSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaving(true);
    try {
      // Collect all widget updates
      const updates = widgets.map(widget => ({
        id: widget.id,
        config: widget.config,
        position: widget.position,
        parentId: widget.parentId,
        orderIndex: widget.orderIndex,
      }));

      const response = await fetch('/api/widgets/batch', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to save dashboard');
      }

      setLastSaved(new Date());
      toast.success('Dashboard saved successfully');
    } catch (error) {
      console.error('Error saving dashboard:', error);
      toast.error('Failed to save dashboard');
    } finally {
      setIsSaving(false);
    }
  }, [widgets]);

  const handleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save after 2 seconds of inactivity
  }, [handleSave]);

  const handleViewMode = () => {
    router.push(`/home/dashboards/${dashboard.id}/view`);
  };

  const handleBackToList = () => {
    router.push('/home/dashboards');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboards
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">{dashboard.name}</h1>
            <p className="text-sm text-muted-foreground">
              Last saved: {lastSaved.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewMode}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Mode
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <TopToolbar onAddWidget={handleAddWidget} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto">
          <DashboardCanvas
            dashboard={dashboard}
            widgets={widgets}
            onWidgetsUpdate={handleWidgetsUpdate}
            onWidgetSelect={handleWidgetSelect}
            onAutoSave={handleAutoSave}
          />
        </div>

        {/* Right Panel */}
        {selectedWidget && (
          <div className="w-80 border-l bg-card overflow-y-auto">
            <RightPanelEditor
              widget={selectedWidget}
              onWidgetUpdate={handleWidgetUpdate}
              onAutoSave={handleAutoSave}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultConfig(widgetType: string) {
  switch (widgetType) {
    case 'title':
      return {
        id: crypto.randomUUID(),
        text: 'New Title',
        fontSize: 24,
        fontWeight: 600,
        color: '#111827',
        alignment: 'left',
        backgroundColor: 'transparent',
        padding: 8,
      };
    case 'paragraph':
      return {
        id: crypto.randomUUID(),
        text: 'Enter your text here...',
        fontSize: 14,
        color: '#374151',
        lineHeight: 1.6,
        alignment: 'left',
        backgroundColor: 'transparent',
        padding: 8,
      };
    case 'list':
      return {
        id: crypto.randomUUID(),
        items: ['Item 1', 'Item 2', 'Item 3'],
        listType: 'bullet',
        fontSize: 14,
        color: '#374151',
        spacing: 4,
        backgroundColor: 'transparent',
        padding: 8,
      };
    case 'table':
      return {
        id: crypto.randomUUID(),
        tableName: '',
        columns: [],
        pageSize: 10,
        showHeader: true,
        showPagination: true,
        sortable: true,
        filterable: true,
        backgroundColor: 'transparent',
        padding: 8,
      };
    case 'chart':
      return {
        id: crypto.randomUUID(),
        tableName: '',
        x: '',
        y: '',
        chartType: 'bar',
        aggregate: 'sum',
        colorScheme: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
        showLegend: true,
        showGrid: true,
        backgroundColor: 'transparent',
        padding: 8,
      };
    case 'container':
      return {
        id: crypto.randomUUID(),
        background: '#ffffff',
        border: { width: 1, color: '#e5e7eb', radius: 8, style: 'solid' },
        padding: 12,
        margin: 0,
        shadow: 'sm',
        children: [],
      };
    case 'progress':
      return {
        id: crypto.randomUUID(),
        value: 50,
        max: 100,
        label: 'Progress',
        showPercentage: true,
        color: '#3b82f6',
        size: 'md',
        variant: 'default',
        backgroundColor: 'transparent',
        padding: 8,
      };
    default:
      return {
        id: crypto.randomUUID(),
        backgroundColor: 'transparent',
        padding: 8,
      };
  }
}
