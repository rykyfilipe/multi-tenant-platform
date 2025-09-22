'use client';

import { useState, useEffect, useMemo } from 'react';
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
import LineChartWidget from '@/components/dashboard/LineChartWidget';
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
  const [initialWidgets, setInitialWidgets] = useState<Widget[]>([]); // Copia inițială a widget-urilor
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
      // Optimistic update: local state is updated in saveChanges function
      // No need to refresh - the saveChanges function handles optimistic updates
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
      // Optimistic discard: local state is updated in revertChanges function
      // No need to reload - the revertChanges function handles optimistic updates
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

  // Create initial copy of widgets when dashboard is selected
  useEffect(() => {
    if (selectedDashboard?.widgets) {
      console.log('[Dashboard] Creating initial copy of widgets:', selectedDashboard.widgets.length);
      setInitialWidgets([...selectedDashboard.widgets]);
    }
  }, [selectedDashboard?.widgets]);

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
    console.log('🚀 [SAVE_DEBUG] saveChanges called', {
      pendingChangesCount,
      hasSelectedDashboard: !!selectedDashboard,
      selectedDashboardId: selectedDashboard?.id,
      currentWidgetsCount: selectedDashboard?.widgets?.length || 0
    });

    if (pendingChangesCount === 0 || !selectedDashboard) {
      console.log('⚠️ [SAVE_DEBUG] Early return - no pending changes or no dashboard');
      return;
    }

    console.log('🔄 [SAVE_DEBUG] Starting save process', {
      pendingChangesCount,
      dashboardId: selectedDashboard.id,
      currentWidgetsCount: selectedDashboard.widgets.length
    });

    try {
      // Save changes to server and get the saved widgets
      console.log('📞 [SAVE_DEBUG] Calling savePendingChanges hook...');
      const savedResults = await savePendingChanges(selectedDashboard.id);
      console.log('📞 [SAVE_DEBUG] savePendingChanges returned:', savedResults);
      
      console.log('✅ [SAVE_DEBUG] Server response received', {
        hasResults: !!savedResults,
        resultsCount: savedResults?.length || 0,
        results: savedResults
      });
      
      if (savedResults && savedResults.length > 0) {
        // Process each result based on operation type
        setSelectedDashboard(prev => {
          if (!prev) return null;
          
          console.log('🔄 [STATE_DEBUG] Processing local state update', {
            currentWidgetsCount: prev.widgets.length,
            operationsToProcess: savedResults.length
          });

          let updatedWidgets = [...prev.widgets];
          
          savedResults.forEach((result: any, index: number) => {
            console.log(`🔄 [STATE_DEBUG] Processing operation ${index + 1}/${savedResults.length}`, {
              type: result.type,
              success: result.success,
              hasResult: !!result.result,
              resultData: result.result
            });
            if (result.type === 'delete' && result.result?.widgetId) {
              // Remove deleted widget
              const beforeCount = updatedWidgets.length;
              updatedWidgets = updatedWidgets.filter(w => w.id !== result.result.widgetId);
              console.log('❌ [STATE_DEBUG] Widget deleted', {
                widgetId: result.result.widgetId,
                beforeCount,
                afterCount: updatedWidgets.length
              });
            } else if (result.type === 'create' || result.type === 'update') {
              // Add or update widget
              const savedWidget = result.result;
              if (savedWidget && savedWidget.id) {
                const existingIndex = updatedWidgets.findIndex(w => w.id === savedWidget.id);
                if (existingIndex >= 0) {
                  // Update existing widget
                  updatedWidgets[existingIndex] = savedWidget;
                  console.log('✏️ [STATE_DEBUG] Widget updated', {
                    widgetId: savedWidget.id,
                    index: existingIndex,
                    title: savedWidget.title
                  });
                } else {
                  // Add new widget
                  updatedWidgets.push(savedWidget);
                  console.log('➕ [STATE_DEBUG] Widget added', {
                    widgetId: savedWidget.id,
                    newCount: updatedWidgets.length,
                    title: savedWidget.title
                  });
                }
              } else {
                console.warn('⚠️ [STATE_DEBUG] Invalid saved widget data:', savedWidget);
              }
            }
          });

          console.log('✅ [STATE_DEBUG] Local state update complete', {
            beforeCount: prev.widgets.length,
            afterCount: updatedWidgets.length,
            finalWidgetIds: updatedWidgets.map(w => w.id)
          });
          
          return {
            ...prev,
            widgets: updatedWidgets
          };
        });
        
        // Update initial widgets as well
        setInitialWidgets(prev => {
          let updatedWidgets = [...prev];
          
          savedResults.forEach((result: any) => {
            if (result.type === 'delete' && result.result?.widgetId) {
              // Remove deleted widget
              updatedWidgets = updatedWidgets.filter(w => w.id !== result.result.widgetId);
            } else if (result.type === 'create' || result.type === 'update') {
              // Add or update widget
              const savedWidget = result.result;
              if (savedWidget && savedWidget.id) {
                const existingIndex = updatedWidgets.findIndex(w => w.id === savedWidget.id);
                if (existingIndex >= 0) {
                  updatedWidgets[existingIndex] = savedWidget;
                } else {
                  updatedWidgets.push(savedWidget);
                }
              }
            }
          });
          
          return updatedWidgets;
        });
        
        console.log('✅ [STATE_DEBUG] All state updates complete', { operationsProcessed: savedResults.length });
      } else {
        console.log('⚠️ [SAVE_DEBUG] No results from server - keeping current state');
      }
      
    } catch (error) {
      console.error('❌ [SAVE_DEBUG] Error saving changes:', error);
      // Error handling is done in the hook's onError callback
    }
  };

  const revertChanges = () => {
    if (pendingChangesCount === 0) return;
    
    console.log('[Dashboard] Discarding changes optimistically');
    
    // Clear pending changes
    discardPendingChanges();
    
    // Optimistic update: Replace local state with initial copy
    if (selectedDashboard && initialWidgets.length > 0) {
      console.log('[Dashboard] Replacing local state with initial copy:', initialWidgets.length, 'widgets');
      setSelectedDashboard(prev => prev ? {
        ...prev,
        widgets: [...initialWidgets]
      } : null);
    }
    
    toast({
      title: "Changes reverted",
      description: "All pending changes have been discarded.",
    });
  };

  // Function to detect if a layout change is responsive (automatic) or manual
  const isResponsiveLayoutChange = (widgetId: number, newPosition: any, currentPosition: any) => {
    // Get the widget to check its original position
    const originalWidget = selectedDashboard?.widgets.find(w => w.id === widgetId);
    if (!originalWidget?.position) return false;

    const originalPos = originalWidget.position;
    
    // Only consider it responsive if ALL of these conditions are met:
    // 1. Only x position changed (not y, width, or height)
    // 2. The change is exactly what responsive layout would do
    // 3. The widget is being moved to a constrained position
    
    const xChanged = originalPos.x !== newPosition.x;
    const widthChanged = originalPos.width !== newPosition.width;
    const yChanged = originalPos.y !== newPosition.y;
    const heightChanged = originalPos.height !== newPosition.height;
    
    // If Y or height changed, it's definitely manual (not responsive)
    if (yChanged || heightChanged) {
      console.log('[Dashboard] Y or height changed - manual change detected');
      return false;
    }
    
    // If both x and width changed, it's likely manual
    if (xChanged && widthChanged) {
      console.log('[Dashboard] Both x and width changed - manual change detected');
      return false;
    }
    
    // Only consider it responsive if only x changed and it's a constraint change
    if (xChanged && !widthChanged && !yChanged && !heightChanged) {
      // Check if this is a typical responsive constraint (moving to left edge)
      const isMovingToLeft = newPosition.x === 0;
      const isMovingToConstraint = newPosition.x < originalPos.x;
      
      if (isMovingToLeft || isMovingToConstraint) {
        console.log('[Dashboard] X-only constraint change - likely responsive');
        return true;
      }
    }
    
    // Only consider it responsive if only width changed and it's a constraint change
    if (widthChanged && !xChanged && !yChanged && !heightChanged) {
      // Check if this is a typical responsive constraint (reducing width)
      const isReducingWidth = newPosition.width < originalPos.width;
      const isAtConstraint = newPosition.width <= 2 || newPosition.width <= 4 || newPosition.width <= 6 || newPosition.width <= 10;
      
      if (isReducingWidth && isAtConstraint) {
        console.log('[Dashboard] Width-only constraint change - likely responsive');
        return true;
      }
    }
    
    console.log('[Dashboard] Manual change detected - not responsive');
    return false;
  };

  const handleLayoutChange = (layout: any[]) => {
    if (!isEditMode) return;

    console.log('[Dashboard] handleLayoutChange called with layout:', layout);

    layout.forEach((item) => {
      const widgetId = parseInt(item.i);
      const newPosition = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      };

      // Get current widget data (including pending changes) for comparison
      const allWidgets = getAllWidgets();
      const currentWidget = allWidgets.find(w => w.id === widgetId);
      const currentPosition = currentWidget?.position;

      console.log('[Dashboard] Layout change for widget:', {
        widgetId,
        newPosition,
        currentPosition,
        foundWidget: !!currentWidget,
        isNewWidget: currentWidget === undefined
      });

      // Only add pending change if this is a manual change (not responsive)
      if (currentWidget && currentPosition) {
        // Check if this is a responsive change by comparing with expected responsive position
        const isResponsiveChange = isResponsiveLayoutChange(widgetId, newPosition, currentPosition);
        
        if (isResponsiveChange) {
          console.log('[Dashboard] Responsive change detected, skipping pending change');
          return;
        }

        const positionChanged = 
          currentPosition.x !== newPosition.x ||
          currentPosition.y !== newPosition.y ||
          currentPosition.width !== newPosition.width ||
          currentPosition.height !== newPosition.height;

        if (positionChanged) {
          console.log('[Dashboard] Manual position change detected, adding pending change');
          // Get original position from database for comparison
          const originalWidget = selectedDashboard?.widgets.find(w => w.id === widgetId);
          const originalPosition = originalWidget?.position;
          
          console.log('[Dashboard] Adding pending change with data:', {
            widgetId,
            newPosition,
            originalPosition,
            type: 'update'
          });
          
          addPendingChange('update', widgetId, { position: newPosition }, { position: originalPosition });
          
          console.log('[Dashboard] Pending change added successfully');
        } else {
          console.log('[Dashboard] Position unchanged, skipping pending change');
        }
      } else {
        console.log('[Dashboard] Widget not found or no current position, skipping pending change');
      }
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
          optimizedWidth = 12; // Tables need maximum width for columns
          optimizedHeight = 8; // Tables need more height for rows
          break;
        case 'chart':
          optimizedWidth = 10; // Charts need more width for better visibility
          optimizedHeight = 7; // Taller for better chart visibility
          break;
        case 'metric':
          optimizedWidth = 4; // KPI widgets are compact but readable
          optimizedHeight = 4; // Square format for metrics
          break;
        case 'text':
          optimizedWidth = 8; // Text widgets need more width for content
          optimizedHeight = 5; // More height for text content
          break;
        case 'tasks':
          optimizedWidth = 10; // Tasks need width for task lists
          optimizedHeight = 8; // More height for task items
          break;
        case 'calendar':
          optimizedWidth = 12; // Calendar needs maximum width
          optimizedHeight = 10; // Calendar needs height for month view
          break;
        case 'weather':
          optimizedWidth = 6; // Weather widgets are medium
          optimizedHeight = 6; // Square format for weather
          break;
        case 'clock':
          optimizedWidth = 4; // Clock widgets are compact
          optimizedHeight = 4; // Square format for clock
          break;
        default:
          optimizedWidth = 8;
          optimizedHeight = 6;
      }
    }
    
    const gridWidth = 12; // Total grid width
    const maxY = 20; // Maximum Y position to search
    
    console.log('[Dashboard] Finding free position for widget:', {
      widgetType,
      optimizedWidth,
      optimizedHeight,
      totalWidgets: widgets.length
    });
    
    // Create a grid to track occupied positions
    const occupied = new Set<string>();
    
    widgets.forEach((widget, index) => {
      if (widget.position) {
        const { x, y, width: w, height: h } = widget.position;
        console.log(`[Dashboard] Widget ${index} occupies:`, { x, y, w, h });
        
        // Mark all cells occupied by this widget
        for (let dy = 0; dy < h; dy++) {
          for (let dx = 0; dx < w; dx++) {
            occupied.add(`${x + dx},${y + dy}`);
          }
        }
      }
    });
    
    console.log('[Dashboard] Total occupied cells:', occupied.size);
    
    // Find the first free position, prioritizing top-left positions
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x <= gridWidth - optimizedWidth; x++) {
        let canPlace = true;
        let conflictCells: string[] = [];
        
        // Check if this position is free
        for (let dy = 0; dy < optimizedHeight; dy++) {
          for (let dx = 0; dx < optimizedWidth; dx++) {
            const cellKey = `${x + dx},${y + dy}`;
            if (occupied.has(cellKey)) {
              canPlace = false;
              conflictCells.push(cellKey);
            }
          }
          if (!canPlace) break;
        }
        
        if (canPlace) {
          console.log('[Dashboard] Found free position:', { x, y, width: optimizedWidth, height: optimizedHeight });
          return { x, y, width: optimizedWidth, height: optimizedHeight };
        } else if (y < 3) { // Only log conflicts for first few rows to avoid spam
          console.log(`[Dashboard] Position ${x},${y} has conflicts:`, conflictCells.slice(0, 5));
        }
      }
    }
    
    // If no free position found, find the lowest Y position and place there
    let lowestY = 0;
    widgets.forEach(widget => {
      if (widget.position) {
        const widgetBottom = (widget.position.y || 0) + (widget.position.height || 4);
        lowestY = Math.max(lowestY, widgetBottom);
      }
    });
    
    console.log('[Dashboard] No free position found, using fallback position:', { 
      x: 0, 
      y: lowestY, 
      width: optimizedWidth, 
      height: optimizedHeight,
      reason: 'No free space found in grid'
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
      ...Array.from(pendingChangesMap.values())
        .filter(change => change.type === 'create' && change.data)
        .map(change => change.data as Widget)
    ];
    const freePosition = findFreePosition(allWidgets, 8, 6, type);

    const newWidget: Partial<Widget> = {
      type,
      title: `New ${type} Widget`,
      position: freePosition,
      config: defaultConfig,
      isVisible: true,
      order: (selectedDashboard?.widgets ?? []).length || 0,
    };
    
    console.log('[Dashboard] Creating new widget:', newWidget);
    console.log('[Dashboard] Free position found:', freePosition);
    console.log('[Dashboard] All widgets used for position calculation:', allWidgets.length);

    // Generate temporary ID for the new widget
    const tempId = Date.now();
    
    // Add to pending changes with logica inteligentă
    addPendingChange('create', tempId, newWidget);

    // Nu mai adaug în local state - getFinalWidget se ocupă de afișare
    // Widget-ul va apărea în UI prin pending changes
  };

  // Funcție helper pentru a obține toate widget-urile (din DB + locale)
  const getAllWidgets = () => {
    const dbWidgets = selectedDashboard?.widgets ?? [];
    const localWidgets: Widget[] = [];
    
    console.log('[Dashboard] getAllWidgets called:', {
      dbWidgetsCount: dbWidgets.length,
      pendingChangesSize: pendingChangesMap.size,
      pendingChanges: Array.from(pendingChangesMap.entries())
    });
    
    // Adaugă widget-urile locale din pending changes
    pendingChangesMap.forEach((change, key) => {
      console.log('[Dashboard] Processing pending change:', { key, change });
      if (change.type === 'create' && change.data) {
        // Cheia este formatată ca "create_${widgetId}"
        const keyStr = String(key);
        console.log('[Dashboard] Key string:', keyStr);
        if (keyStr.startsWith('create_')) {
          const widgetId = keyStr.replace('create_', '');
          const localWidget: Widget = {
            id: parseInt(widgetId), // Extrage ID-ul din cheie
            ...change.data,
          } as Widget;
          console.log('[Dashboard] Created local widget:', localWidget);
          localWidgets.push(localWidget);
        }
      }
    });
    
    const allWidgets = [...dbWidgets, ...localWidgets];
    
    // Filtrează widget-urile care sunt marcate pentru ștergere
    const filteredWidgets = allWidgets.filter(widget => {
      const finalWidget = getFinalWidget(widget);
      const shouldShow = finalWidget !== null;
      if (!shouldShow) {
        console.log('[Dashboard] Filtering out deleted widget:', widget.id);
      }
      return shouldShow;
    });
    
    // Sort widgets by ID to ensure consistent order for ResponsiveGridLayout
    const sortedWidgets = filteredWidgets.sort((a, b) => {
      // Sort by ID to maintain consistent order
      const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
      const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
      return aId - bId;
    });
    
    console.log('[Dashboard] getAllWidgets result:', {
      dbWidgetsCount: dbWidgets.length,
      localWidgetsCount: localWidgets.length,
      totalBeforeFilter: allWidgets.length,
      totalAfterFilter: filteredWidgets.length,
      sortedCount: sortedWidgets.length
    });
    
    return sortedWidgets;
  };

  // Generate layouts directly without memoization to prevent automatic recalculation
  const generateLayouts = () => {
    const widgets = getAllWidgets();
    return {
      lg: widgets.map(w => ({
        i: w.id.toString(),
        x: w.position?.x || 0,
        y: w.position?.y || 0,
        w: w.position?.width || 4,
        h: w.position?.height || 4,
      })),
      md: widgets.map(w => ({
        i: w.id.toString(),
        x: Math.min(w.position?.x || 0, 9),
        y: w.position?.y || 0,
        w: Math.min(w.position?.width || 4, 10),
        h: w.position?.height || 4,
      })),
      sm: widgets.map(w => ({
        i: w.id.toString(),
        x: Math.min(w.position?.x || 0, 5),
        y: w.position?.y || 0,
        w: Math.min(w.position?.width || 4, 6),
        h: w.position?.height || 4,
      })),
      xs: widgets.map(w => ({
        i: w.id.toString(),
        x: Math.min(w.position?.x || 0, 3),
        y: w.position?.y || 0,
        w: Math.min(w.position?.width || 4, 4),
        h: w.position?.height || 4,
      })),
      xxs: widgets.map(w => ({
        i: w.id.toString(),
        x: 0,
        y: w.position?.y || 0,
        w: 2,
        h: w.position?.height || 4,
      }))
    };
  };

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

    // Use the widget directly if no pending changes (after save)
    const finalWidget = displayWidget || widget;

    switch (finalWidget.type) {
      case 'chart': {
        const subType = (finalWidget?.config?.chartType) || (finalWidget as any).subType || 'line';
        if (subType === 'bar') {
          return (
            <BarChartWidget 
              widget={finalWidget} 
              isEditMode={isEditMode}
              tenantId={tenant?.id}
              databaseId={1}
              onEdit={() => {
                console.log('Bar chart edit clicked:', widget.id);
                handleWidgetClick(widget);
              }}
              onDelete={() => {
                console.log('Bar chart delete clicked:', widget.id);
                handleWidgetDelete(Number(widget.id));
              }}
            />
          );
        }
        if (subType === 'pie') {
          return (
            <PieChartWidget 
              widget={finalWidget} 
              isEditMode={isEditMode}
              tenantId={tenant?.id}
              databaseId={1}
              onEdit={() => {
                console.log('Pie chart edit clicked:', widget.id);
                handleWidgetClick(widget);
              }}
              onDelete={() => {
                console.log('Pie chart delete clicked:', widget.id);
                handleWidgetDelete(Number(widget.id));
              }}
            />
          );
        }
        return (
          <LineChartWidget 
            widget={displayWidget} 
            isEditMode={isEditMode}
            tenantId={tenant?.id}
            databaseId={1}
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Dashboards
                </h1>
              </div>
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
                  <div className="flex items-center space-x-3 bg-slate-50 rounded-lg px-3 py-2">
                    <Label htmlFor="edit-mode" className="text-sm font-medium text-slate-700">
                      Edit Mode
                    </Label>
                    <Switch
                      id="edit-mode"
                      checked={isEditMode}
                      onCheckedChange={setIsEditMode}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>
                  
                  {isEditMode && (
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={saveChanges}
                        disabled={pendingChangesCount === 0 || isSaving}
                        className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
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
                        className="flex items-center space-x-2 border-slate-300 hover:bg-slate-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Revert</span>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        {selectedDashboard ? (
          <div className="space-y-6">
            {/* Dashboard Info */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {selectedDashboard.name}
                  </h2>
                  {selectedDashboard.description && (
                    <p className="text-slate-600 mb-4 text-lg">{selectedDashboard.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>{selectedDashboard._count.widgets} widgets</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="capitalize">{selectedDashboard.mode} mode</span>
                    </div>
                    {selectedDashboard.isPublic && (
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Public</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {isEditMode && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">Add Widget:</span>
                      <TooltipProvider>
                        <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-1">
                          {WIDGET_TYPES.map((widgetType) => {
                            const IconComponent = widgetType.icon;
                            return (
                              <Tooltip key={widgetType.type}>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddWidget(widgetType.type)}
                                    className="h-8 w-8 p-0 hover:bg-white hover:shadow-sm transition-all duration-200"
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
                  
                  <div className="flex items-center space-x-2">
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
                      className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Layout */}
            <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm p-6">
              <ResponsiveGridLayout
                className="layout"
                layouts={generateLayouts()}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={80}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                onLayoutChange={handleLayoutChange}
                margin={[16, 16]}
                containerPadding={[8, 8]}
                useCSSTransforms={false}
                transformScale={1}
                preventCollision={false}
                compactType={null}
                autoSize={true}
                allowOverlap={false}
                verticalCompact={false}
              >
                {getAllWidgets().map((widget) => (
                  <div 
                    key={widget.id} 
                    className="widget-container h-full w-full min-h-[200px]"
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
                      className="h-full w-full p-1"
                      whileHover={isEditMode ? { scale: 1.01 } : {}}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="h-full w-full bg-white/90 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                        {renderWidget(widget)}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </ResponsiveGridLayout>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Settings className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Dashboard Selected</h3>
            <p className="text-slate-600 mb-8 text-lg max-w-md mx-auto">
              Select a dashboard from the dropdown or create a new one to get started.
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
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
            onUpdate={handleWidgetUpdate} // Real-time updates
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
