'use client';

import { useState, useEffect, useCallback } from 'react';
import './dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Plus, Save, Edit3, Eye, Settings, X, RotateCcw, BarChart3, Database, TrendingUp, FileText, LineChart, PieChart, BarChart, Activity, Type, Trash2, Clock, CheckSquare, Cloud, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LineChartWidget } from '@/components/dashboard/LineChartWidget';
import BarChartWidget from '@/components/dashboard/BarChartWidget';
import PieChartWidget from '@/components/dashboard/PieChartWidget';
import TableWidget from '@/components/dashboard/TableWidget';
import KPIWidget from '@/components/dashboard/KPIWidget';
import TextWidget from '@/components/dashboard/TextWidget';
import ClockWidget from '@/components/dashboard/ClockWidget';
import TasksWidget from '@/components/dashboard/TasksWidget';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import CalendarWidget from '@/components/dashboard/CalendarWidget';
import { WidgetEditor } from '@/components/dashboard/WidgetEditor';
import { DashboardSelector } from '@/components/dashboard/DashboardSelector';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { useWidgetPendingChanges } from '@/hooks/useWidgetPendingChanges';
import { SaveChangesButton } from '@/components/dashboard/SaveChangesButton';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  mode: 'view' | 'edit';
  isPublic: boolean;
  isDefault: boolean;
  widgets: Widget[];
  _count: { widgets: number };
}

interface Widget {
  id: number | string;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: any;
  isVisible: boolean;
  order: number;
}

// Removed PendingChange interface - now using the one from useWidgetPendingChanges hook

// Widget type definitions with icons and labels
const WIDGET_TYPES = [
  {
    type: 'chart',
    label: 'Chart',
    icon: BarChart3,
    description: 'Add a chart widget (line, bar, or pie)',
    subTypes: [
      { type: 'line', label: 'Line Chart', icon: LineChart },
      { type: 'bar', label: 'Bar Chart', icon: BarChart },
      { type: 'pie', label: 'Pie Chart', icon: PieChart }
    ]
  },
  {
    type: 'table',
    label: 'Table',
    icon: Database,
    description: 'Add a data table widget'
  },
  {
    type: 'metric',
    label: 'KPI',
    icon: Activity,
    description: 'Add a KPI/metric widget'
  },
  {
    type: 'text',
    label: 'Text',
    icon: Type,
    description: 'Add a text widget'
  },
  {
    type: 'clock',
    label: 'Clock',
    icon: Clock,
    description: 'Add a clock widget with timezone support'
  },
  {
    type: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    description: 'Add a tasks widget with data persistence'
  },
  {
    type: 'weather',
    label: 'Weather',
    icon: Cloud,
    description: 'Add a weather widget with real data'
  },
  {
    type: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    description: 'Add a calendar widget with events'
  }
];

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { toast } = useToast();
  const { tenant } = useApp();

  // Use the enhanced pending changes hook with batch system
  const {
    pendingChanges,
    pendingChangesMap,
    isSaving,
    pendingChangesCount,
    changesByType,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    savePendingChanges,
    discardPendingChanges,
    saveNow,
    hasPendingChange,
    getPendingChange,
    getFinalWidget,
    setSaveFunction,
  } = useWidgetPendingChanges({
    autoSaveDelay: -1, // Dezactivează auto-save - se salvează doar la click
    onSuccess: (results) => {
      console.log('Widget changes saved successfully:', results);
      // Refresh dashboard data after successful save
      if (selectedDashboard) {
        fetchDashboards();
      }
    },
    onError: (error) => {
      console.error('Failed to save widget changes:', error);
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    },
    onDiscard: () => {
      console.log('Discarding changes optimistically');
      // Nu mai face reload - pending changes se vor curăța automat
      // Widget-urile locale vor dispărea din UI prin getFinalWidget
    },
  });

  // Fetch dashboards on component mount
  useEffect(() => {
    fetchDashboards();
  }, []);

  // Set save function when dashboard is selected
  useEffect(() => {
    if (selectedDashboard?.id) {
      setSaveFunction(selectedDashboard.id);
    }
  }, [selectedDashboard?.id, setSaveFunction]);

  const fetchDashboards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/dashboards');
      if (!response.ok) throw new Error('Failed to fetch dashboards');
      
      const data = await response.json();
      setDashboards(data.dashboards);
      
      // Select default dashboard if available, otherwise select first dashboard
      const defaultDashboard = data.dashboards.find((d: Dashboard) => d.isDefault);
      if (defaultDashboard) {
        setSelectedDashboard(defaultDashboard);
      } else if (data.dashboards.length > 0) {
        // Auto-select first dashboard if no default is set
        setSelectedDashboard(data.dashboards[0]);
      } else {
        // Create a default dashboard if none exist
        await createDefaultDashboard();
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboards',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDefaultDashboard = async () => {
    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'My Dashboard',
          description: 'Default dashboard',
          isPublic: false,
          isDefault: true
        }),
      });

      if (!response.ok) throw new Error('Failed to create default dashboard');
      
      const newDashboard = await response.json();
      setDashboards(prev => [...prev, newDashboard]);
      setSelectedDashboard(newDashboard);
      
      toast({
        title: 'Success',
        description: 'Default dashboard created',
      });
    } catch (error) {
      console.error('Error creating default dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to create default dashboard',
        variant: 'destructive',
      });
    }
  };

  const createDashboard = async (data: { name: string; description?: string; isPublic?: boolean }) => {
    try {
      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create dashboard');
      
      const newDashboard = await response.json();
      setDashboards(prev => [...prev, newDashboard]);
      setSelectedDashboard(newDashboard);
      setShowCreateDialog(false);
      
      toast({
        title: 'Success',
        description: 'Dashboard created successfully',
      });
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to create dashboard',
        variant: 'destructive',
      });
    }
  };

  const deleteDashboard = async () => {
    if (!selectedDashboard) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/dashboards/${selectedDashboard.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete dashboard');
      
      // Update local state - remove the deleted dashboard
      setDashboards(prev => prev.filter(d => d.id !== selectedDashboard.id));
      
      // Select another dashboard or clear selection
      const remainingDashboards = dashboards.filter(d => d.id !== selectedDashboard.id);
      if (remainingDashboards.length > 0) {
        // Select the first remaining dashboard
        setSelectedDashboard(remainingDashboards[0]);
      } else {
        // No dashboards left, clear selection
        setSelectedDashboard(null);
      }
      
      setShowDeleteDialog(false);
      
      toast({
        title: 'Success',
        description: 'Dashboard deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete dashboard',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const saveChanges = async () => {
    if (pendingChangesCount === 0 || !selectedDashboard) return;

    try {
      await savePendingChanges(selectedDashboard.id);
      // Refresh dashboard data after successful save
      await fetchDashboards();
    } catch (error) {
      console.error('Error saving changes:', error);
      // Error handling is done in the hook's onError callback
    }
  };

  const revertChanges = () => {
    if (pendingChangesCount === 0) return;
    
    // Clear pending changes and reload dashboard data
    discardPendingChanges();
    
    toast({
      title: "Changes reverted",
      description: "All pending changes have been discarded.",
    });
  };

  const handleLayoutChange = (layout: any[]) => {
    if (!isEditMode) return;

    layout.forEach((item) => {
      const widgetId = parseInt(item.i);
      const newPosition = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      // Get original widget data for comparison
      const originalWidget = selectedDashboard?.widgets.find(w => w.id === widgetId);
      const originalPosition = originalWidget?.position;

      addPendingChange('update', widgetId, { position: newPosition }, { position: originalPosition });
    });
  };

  const handleWidgetClick = (widget: Widget) => {
    if (isEditMode) {
      setEditingWidget(widget);
      setShowWidgetEditor(true);
    }
  };

  const handleWidgetUpdate = (updatedWidget: Widget) => {
    console.log('[Dashboard] handleWidgetUpdate called with:', updatedWidget);
    // Get original widget data for comparison (fără modificările pending)
    const originalWidget = selectedDashboard?.widgets.find(w => w.id === updatedWidget.id);
    console.log('[Dashboard] Original widget:', originalWidget);
    
    // Folosește logica inteligentă - dacă este widget nou, modifică direct în pendingChanges
    // Dacă este widget existent, adaugă la pending changes
    addPendingChange('update', updatedWidget.id, updatedWidget, originalWidget);
    
    // Nu mai actualizez local state aici - getFinalWidget se ocupă de afișare
  };

  const handleWidgetDelete = (widgetId: number) => {
    console.log('[Dashboard] handleWidgetDelete called with:', widgetId);
    // Get original widget data for comparison
    const originalWidget = selectedDashboard?.widgets.find(w => w.id === widgetId);
    console.log('[Dashboard] Original widget for delete:', originalWidget);
    
    // Folosește logica inteligentă pentru ștergere
    addPendingChange('delete', widgetId, null, originalWidget);
    
    // Nu mai actualizez local state aici - getFinalWidget se ocupă de afișare
    toast({
      title: 'Widget Deleted',
      description: 'Widget will be permanently deleted when you save changes.',
    });
  };

  // Function to find a free position for a new widget with optimized default sizes
  const findFreePosition = (widgets: Widget[], width: number = 6, height: number = 4, widgetType?: string) => {
    // Set optimized default dimensions based on widget type
    let optimizedWidth = width;
    let optimizedHeight = height;
    
    if (widgetType) {
      switch (widgetType) {
        case 'table':
          optimizedWidth = 8; // Tables need more width for columns
          optimizedHeight = 6; // Tables need more height for rows
          break;
        case 'chart':
          optimizedWidth = 6; // Charts work well in square-ish format
          optimizedHeight = 5; // Slightly taller for better chart visibility
          break;
        case 'metric':
          optimizedWidth = 3; // KPI widgets are compact
          optimizedHeight = 3; // Square format for metrics
          break;
        case 'text':
          optimizedWidth = 4; // Text widgets are medium width
          optimizedHeight = 3; // Compact height for text
          break;
        default:
          optimizedWidth = 6;
          optimizedHeight = 4;
      }
    }
    const gridWidth = 12; // Total grid width
    const maxY = 20; // Maximum Y position to search
    
    // Create a grid to track occupied positions
    const occupied = new Set<string>();
    
    widgets.forEach(widget => {
      if (widget.position) {
        const { x, y, width: w, height: h } = widget.position;
        // Mark all cells occupied by this widget
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            occupied.add(`${x + dx},${y + dy}`);
          }
        }
      }
    });
    
    // Find the first free position, prioritizing top-left positions
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x <= gridWidth - optimizedWidth; x++) {
        let canPlace = true;
        
        // Check if this position is free
        for (let dy = 0; dy < optimizedHeight; dy++) {
          for (let dx = 0; dx < optimizedWidth; dx++) {
            if (occupied.has(`${x + dx},${y + dy}`)) {
              canPlace = false;
              break;
            }
          }
          if (!canPlace) break;
        }
        
        if (canPlace) {
          return { x, y, width: optimizedWidth, height: optimizedHeight };
        }
      }
    }
    
    // If no free position found, find the lowest Y position and place there
    let lowestY = 0;
    widgets.forEach(widget => {
      if (widget.position) {
        lowestY = Math.max(lowestY, (widget.position.y || 0) + (widget.position.height || 4));
      }
    });
    
    return { x: 0, y: lowestY, width: optimizedWidth, height: optimizedHeight };
  };

  const handleAddWidget = (type: string, subType?: string) => {
    // Create default config based on widget type
    let defaultConfig = {};
    
    if (type === 'chart') {
      const chartType = subType || 'line';
      defaultConfig = {
        chartType: chartType,
        dataSource: {
          tableId: 0, // No default table - user must select one
          columnX: '', // No default column - will be updated when user selects columns
          columnY: '', // No default column - will be updated when user selects columns
          filters: []
        },
        options: {
          title: '',
          xAxisLabel: 'X Axis',
          yAxisLabel: 'Y Axis',
          colors: ['#3B82F6'],
          showLegend: true,
          showGrid: true
        },
        // Additional fields for LineChartWidget compatibility
        xAxis: { key: 'id', label: 'X Axis', type: 'category' },
        yAxis: { key: 'id', label: 'Y Axis', type: 'number' }
      };
    } else if (type === 'table') {
      defaultConfig = {
        dataSource: {
          tableId: 0, // No default table - user must select one
          columns: [], // No default columns - will be updated when user selects columns
          filters: [],
          sortBy: 'id',
          sortOrder: 'asc'
        },
        options: {
          pageSize: 10,
          showPagination: true,
          showSearch: true,
          showExport: true,
          showColumnSelector: true
        }
      };
    } else if (type === 'metric') {
      defaultConfig = {
        dataSource: {
          type: 'table',
          tableId: 0, // No default table - user must select one
          column: '', // No default column - user must select one
          aggregation: '', // No default aggregation - user must select one
          filters: []
        },
        options: {
          format: 'number',
          decimals: 0,
          prefix: '',
          suffix: '',
          showChange: true,
          showTrend: true
        }
      };
    } else if (type === 'text') {
      defaultConfig = {
        dataSource: {
          type: 'manual',
          content: 'Enter your text content here...'
        },
        type: 'plain',
        options: {
          fontSize: 'base',
          textAlign: 'left',
          backgroundColor: '',
          textColor: '',
          padding: 'md',
          showBorder: true,
          borderRadius: 'md'
        }
      };
    } else if (type === 'clock') {
      defaultConfig = {
        timezone: 'local',
        format: '24h',
        showDate: true,
        showSeconds: true,
        showTimezone: true,
        style: {
          fontSize: '2xl',
          fontFamily: 'mono',
          color: '',
          backgroundColor: ''
        }
      };
    } else if (type === 'tasks') {
      defaultConfig = {
        showCompleted: true,
        showPriority: true,
        maxTasks: 50,
        sortBy: 'created',
        style: {
          showDates: true,
          compactMode: false
        }
      };
    } else if (type === 'weather') {
      defaultConfig = {
        city: 'London',
        country: 'UK',
        units: 'metric',
        showDetails: true,
        showForecast: false,
        refreshInterval: 30,
        style: {
          showIcon: true,
          compactMode: false
        }
      };
    } else if (type === 'calendar') {
      defaultConfig = {
        viewMode: 'month',
        showWeekends: true,
        startOfWeek: 'monday',
        maxEvents: 100,
        style: {
          compactMode: false,
          showTime: true,
          showLocation: true
        }
      };
    }

    // Find a free position for the new widget, considering both existing widgets and pending changes
    const allWidgets = [
      ...(selectedDashboard?.widgets ?? []),
      ...pendingChanges
        .filter(change => change.type === 'create' && change.data)
        .map(change => change.data as Widget)
    ];
    const freePosition = findFreePosition(allWidgets, 6, 4, type);

    const newWidget: Partial<Widget> = {
      type,
      title: `New ${type} Widget`,
      position: freePosition,
      config: defaultConfig,
      isVisible: true,
      order: (selectedDashboard?.widgets ?? []).length || 0,
    };
    
    console.log('[Dashboard] Creating new widget:', newWidget);

    // Generate temporary ID for the new widget
    const tempId = Date.now();
    
    // Add to pending changes with logica inteligentă
    addPendingChange('create', tempId, newWidget);

    // Nu mai adaug în local state - getFinalWidget se ocupă de afișare
    // Widget-ul va apărea în UI prin pending changes
  };

  // Funcție helper pentru a obține toate widget-urile (din DB + locale)
  const getAllWidgets = useCallback(() => {
    const dbWidgets = selectedDashboard?.widgets ?? [];
    const localWidgets: Widget[] = [];
    
    // Adaugă widget-urile locale din pending changes
    pendingChanges.forEach((change, key) => {
      if (change.type === 'create' && change.data) {
        // Cheia este formatată ca "create_${widgetId}"
        const widgetId = key.replace('create_', '');
        const localWidget: Widget = {
          id: parseInt(widgetId), // Extrage ID-ul din cheie
          ...change.data,
        } as Widget;
        localWidgets.push(localWidget);
      }
    });
    
    return [...dbWidgets, ...localWidgets];
  }, [selectedDashboard?.widgets, pendingChanges]);

  const renderWidget = (widget: Widget) => {
    // Folosește logica inteligentă pentru a obține widget-ul final cu toate modificările aplicate
    const displayWidget = getFinalWidget(widget);
    console.log('[Dashboard] renderWidget:', { 
      originalWidget: widget, 
      displayWidget,
      widgetId: widget.id,
      hasPendingChanges: hasPendingChange(widget.id, 'update') || hasPendingChange(widget.id, 'create')
    });
    
    // Dacă widget-ul a fost șters, nu-l afișa
    if (!displayWidget) {
      console.log('[Dashboard] Widget deleted, not rendering:', widget.id);
      return null;
    }

    switch (displayWidget.type) {
      case 'chart': {
        const subType = (displayWidget?.config?.chartType) || (displayWidget as any).subType || 'line';
        if (subType === 'bar') {
          return (
            <BarChartWidget 
              widget={displayWidget} 
              isEditMode={isEditMode}
              onEdit={() => {
                console.log('Bar chart edit clicked:', widget.id);
                handleWidgetClick(widget);
              }}
              onDelete={() => {
                console.log('Bar chart delete clicked:', widget.id);
                handleWidgetDelete(Number(widget.id));
              }}
              tenantId={tenant?.id}
              databaseId={1}
            />
          );
        }
        if (subType === 'pie') {
          return (
            <PieChartWidget 
              widget={displayWidget} 
              isEditMode={isEditMode}
              onEdit={() => {
                console.log('Pie chart edit clicked:', widget.id);
                handleWidgetClick(widget);
              }}
              onDelete={() => {
                console.log('Pie chart delete clicked:', widget.id);
                handleWidgetDelete(Number(widget.id));
              }}
              tenantId={tenant?.id}
              databaseId={1}
            />
          );
        }
        return (
          <LineChartWidget 
            widget={displayWidget} 
            isEditMode={isEditMode}
            onEdit={() => {
              console.log('Line chart edit clicked:', widget.id);
              handleWidgetClick(widget);
            }}
            onDelete={() => {
              console.log('Line chart delete clicked:', widget.id);
              handleWidgetDelete(Number(widget.id));
            }}
          />
        );
      }
      case 'table':
        return (
          <TableWidget 
            widget={displayWidget} 
            isEditMode={isEditMode}
            onEdit={() => {
              console.log('Table edit clicked:', widget.id);
              handleWidgetClick(widget);
            }}
            onDelete={() => {
              console.log('Table delete clicked:', widget.id);
              handleWidgetDelete(Number(widget.id));
            }}
            tenantId={tenant?.id}
            databaseId={1}
          />
        );
      case 'metric':
        return (
          <KPIWidget
            widget={displayWidget}
            isEditMode={isEditMode}
            onEdit={() => {
              console.log('KPI edit clicked:', widget.id);
              handleWidgetClick(widget);
            }}
            onDelete={() => {
              console.log('KPI delete clicked:', widget.id);
              handleWidgetDelete(Number(widget.id));
            }}
            tenantId={tenant?.id}
            databaseId={1}
          />
        );
      case 'text':
        return (
          <TextWidget
            widget={displayWidget}
            isEditMode={isEditMode}
            onEdit={() => {
              console.log('Text edit clicked:', widget.id);
              handleWidgetClick(widget);
            }}
            onDelete={() => {
              console.log('Text delete clicked:', widget.id);
              handleWidgetDelete(Number(widget.id));
            }}
          />
        );
      case 'clock':
        return (
          <ClockWidget
            widget={displayWidget}
            isEditMode={isEditMode}
            onEdit={() => {
              console.log('Clock edit clicked:', widget.id);
              handleWidgetClick(widget);
            }}
            onDelete={() => {
              console.log('Clock delete clicked:', widget.id);
              handleWidgetDelete(Number(widget.id));
            }}
          />
        );
      case 'tasks':
        return (
          <TasksWidget
            widget={displayWidget}
            isEditMode={isEditMode}
            onEdit={() => {
              console.log('Tasks edit clicked:', widget.id);
              handleWidgetClick(widget);
            }}
            onDelete={() => {
              console.log('Tasks delete clicked:', widget.id);
              handleWidgetDelete(Number(widget.id));
            }}
          />
        );
      case 'weather':
        return (
          <WeatherWidget
            widget={displayWidget}
            isEditMode={isEditMode}
            onEdit={() => {
              console.log('Weather edit clicked:', widget.id);
              handleWidgetClick(widget);
            }}
            onDelete={() => {
              console.log('Weather delete clicked:', widget.id);
              handleWidgetDelete(Number(widget.id));
            }}
          />
        );
      case 'calendar':
        return (
          <CalendarWidget
            widget={displayWidget}
            isEditMode={isEditMode}
            onEdit={() => {
              console.log('Calendar edit clicked:', widget.id);
              handleWidgetClick(widget);
            }}
            onDelete={() => {
              console.log('Calendar delete clicked:', widget.id);
              handleWidgetDelete(Number(widget.id));
            }}
          />
        );
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Settings className="h-8 w-8 mx-auto mb-2" />
              <p>Widget type "{widget.type}" not implemented</p>
            </div>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Dashboards</h1>
            <DashboardSelector
              dashboards={dashboards}
              selectedDashboard={selectedDashboard}
              onSelect={setSelectedDashboard}
              onCreateNew={() => setShowCreateDialog(true)}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedDashboard && (
              <>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="edit-mode" className="text-sm font-medium">
                    Edit Mode
                  </Label>
                  <Switch
                    id="edit-mode"
                    checked={isEditMode}
                    onCheckedChange={setIsEditMode}
                  />
                </div>
                
                {isEditMode && (
                  <>
                    <Button
                      onClick={saveChanges}
                      disabled={pendingChangesCount === 0 || isSaving}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>
                        {isSaving ? 'Saving...' : `Save (${pendingChangesCount})`}
                      </span>
                    </Button>
                    
                    <Button
                      onClick={revertChanges}
                      disabled={pendingChangesCount === 0}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Revert</span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {selectedDashboard ? (
          <div className="space-y-6">
            {/* Dashboard Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedDashboard.name}
                  </h2>
                  {selectedDashboard.description && (
                    <p className="text-gray-600 mt-1">{selectedDashboard.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>{selectedDashboard._count.widgets} widgets</span>
                    <span>•</span>
                    <span>{selectedDashboard.mode} mode</span>
                    {selectedDashboard.isPublic && (
                      <>
                        <span>•</span>
                        <span>Public</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {isEditMode && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700 mr-2">Add Widget:</span>
                      <TooltipProvider>
                        <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                          {WIDGET_TYPES.map((widgetType) => {
                            const IconComponent = widgetType.icon;
                            return (
                              <Tooltip key={widgetType.type}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddWidget(widgetType.type)}
                                    className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm"
                                  >
                                    <IconComponent className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{widgetType.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </TooltipProvider>
                    </div>
                  )}
                  
                  {/* Save Changes Button */}
                  <SaveChangesButton
                    pendingChanges={pendingChanges}
                    isSaving={isSaving}
                    onSave={() => selectedDashboard && savePendingChanges(selectedDashboard.id)}
                    onDiscard={discardPendingChanges}
                    size="sm"
                    showDetails={true}
                  />
                  
                  {/* Delete Dashboard Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Dashboard</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ResponsiveGridLayout
                className="layout"
                layouts={{ 
                  lg: getAllWidgets().map(w => ({
                    i: w.id.toString(),
                    x: w.position?.x || 0,
                    y: w.position?.y || 0,
                    w: w.position?.width || 4,
                    h: w.position?.height || 4,
                  })),
                  md: getAllWidgets().map(w => ({
                    i: w.id.toString(),
                    x: Math.min(w.position?.x || 0, 9),
                    y: w.position?.y || 0,
                    w: Math.min(w.position?.width || 4, 10),
                    h: w.position?.height || 4,
                  })),
                  sm: getAllWidgets().map(w => ({
                    i: w.id.toString(),
                    x: Math.min(w.position?.x || 0, 5),
                    y: w.position?.y || 0,
                    w: Math.min(w.position?.width || 4, 6),
                    h: w.position?.height || 4,
                  })),
                  xs: getAllWidgets().map(w => ({
                    i: w.id.toString(),
                    x: Math.min(w.position?.x || 0, 3),
                    y: w.position?.y || 0,
                    w: Math.min(w.position?.width || 4, 4),
                    h: w.position?.height || 4,
                  })),
                  xxs: getAllWidgets().map(w => ({
                    i: w.id.toString(),
                    x: 0,
                    y: w.position?.y || 0,
                    w: 2,
                    h: w.position?.height || 4,
                  }))
                }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={60}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                onLayoutChange={handleLayoutChange}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                useCSSTransforms={true}
                transformScale={1}
                preventCollision={false}
                compactType="vertical"
              >
                {getAllWidgets().map((widget) => (
                  <div 
                    key={widget.id} 
                    className="widget-container"
                    onMouseDown={(e) => {
                      // Allow buttons to work by checking if click is on a button
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        e.stopPropagation();
                      }
                    }}
                    onTouchStart={(e) => {
                      // Handle touch events for mobile
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        e.stopPropagation();
                      }
                    }}
                    onTouchEnd={(e) => {
                      // Prevent default touch behavior for buttons
                      const target = e.target as HTMLElement;
                      if (target.closest('button')) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <motion.div
                      className="h-full"
                      whileHover={isEditMode ? { scale: 1.02 } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      {renderWidget(widget)}
                    </motion.div>
                  </div>
                ))}
              </ResponsiveGridLayout>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Dashboard Selected</h3>
            <p className="text-gray-600 mb-6">Select a dashboard from the dropdown or create a new one.</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Create Dashboard Dialog */}
      <CreateDashboardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={createDashboard}
      />

      {/* Delete Dashboard Confirmation Dialog */}
      <DeleteDashboardDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={deleteDashboard}
        dashboardName={selectedDashboard?.name || ''}
        isDeleting={isDeleting}
      />

      {/* Widget Editor Side Panel */}
      <AnimatePresence>
        {showWidgetEditor && editingWidget && (
          <WidgetEditor
            widget={editingWidget}
            onClose={() => {
              setShowWidgetEditor(false);
              setEditingWidget(null);
            }}
            onSave={handleWidgetUpdate}
            tenantId={tenant?.id || 1}
            databaseId={1} // Default database ID for now
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Create Dashboard Dialog Component
function CreateDashboardDialog({ 
  open, 
  onOpenChange, 
  onCreate 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onCreate: (data: { name: string; description?: string; isPublic?: boolean }) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onCreate(formData);
    setFormData({ name: '', description: '', isPublic: false });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Dashboard</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter dashboard name"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter dashboard description"
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublic"
              checked={formData.isPublic}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
            />
            <Label htmlFor="isPublic">Make this dashboard public</Label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Dashboard</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Delete Dashboard Confirmation Dialog Component
function DeleteDashboardDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  dashboardName,
  isDeleting
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onConfirm: () => void;
  dashboardName: string;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <span>Delete Dashboard</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the dashboard <strong>"{dashboardName}"</strong>? 
            This action cannot be undone and will permanently remove the dashboard and all its widgets.
          </p>
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Dashboard'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
