'use client';

import { useState, useEffect, useCallback } from 'react';
import './dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Plus, Save, Edit3, Eye, Settings, X, RotateCcw, BarChart3, Database, TrendingUp, FileText, CheckSquare, Clock, Calendar, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WidgetRegistry, WidgetFactory } from '@/components/dashboard';
import { WidgetEditor } from '@/components/dashboard/WidgetEditor';
import { WidgetLazyLoading } from '@/components/dashboard/WidgetLazyLoading';
import { DashboardSelector } from '@/components/dashboard/DashboardSelector';
import { DashboardDetailsEditor } from '@/components/dashboard/DashboardDetailsEditor';
import { useDashboardStore } from '@/hooks/useDashboardStore';
import { useWidgetPendingChanges } from '@/hooks/useWidgetPendingChanges';
import { useToast } from '@/hooks/use-toast';
import { useApp } from '@/contexts/AppContext';
import { BaseWidget, WidgetType, Position, WidgetConfig } from '@/types/widgets';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

// Using BaseWidget from centralized types
type Widget = BaseWidget;

// Removed PendingChange interface - now using the one from useWidgetPendingChanges hook

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  const [showDetailsEditor, setShowDetailsEditor] = useState(false);
  const [pendingDashboardSwitch, setPendingDashboardSwitch] = useState<Dashboard | null>(null);
  const [showUnsavedChangesAlert, setShowUnsavedChangesAlert] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { toast } = useToast();
  const { tenant } = useApp();

  // Use the new pending changes hook
  const {
    pendingChanges,
    isSaving,
    pendingChangesCount,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    savePendingChanges,
    discardPendingChanges,
    hasPendingChange,
    getPendingChange,
  } = useWidgetPendingChanges({
    onSuccess: (results) => {
      toast({
        title: 'Success',
        description: 'All changes saved successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    },
  });

  // Fetch dashboards on component mount
  useEffect(() => {
    fetchDashboards();
  }, []);

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
    if (selectedDashboard) {
      fetchDashboards();
    }
    
    toast({
      title: "Changes reverted",
      description: "All pending changes have been discarded.",
    });
  };

  // Handle dashboard switch with unsaved changes check
  const handleDashboardSwitch = (dashboard: Dashboard) => {
    if (pendingChangesCount > 0) {
      // Show alert for unsaved changes
      setPendingDashboardSwitch(dashboard);
      setShowUnsavedChangesAlert(true);
    } else {
      // Switch directly if no pending changes
      switchToDashboard(dashboard);
    }
  };

  // Actually switch to the dashboard
  const switchToDashboard = async (dashboard: Dashboard) => {
    try {
      setIsLoading(true);
      
      // Clear pending changes
      discardPendingChanges();
      
      // Fetch the specific dashboard with widgets
      const response = await fetch(`/api/dashboards/${dashboard.id}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      
      const data = await response.json();
      setSelectedDashboard(data);
      
      // Reset edit mode when switching dashboards
      setIsEditMode(false);
      
    } catch (error) {
      console.error('Error switching dashboard:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle unsaved changes alert actions
  const handleUnsavedChangesAction = (action: 'save' | 'discard' | 'cancel') => {
    setShowUnsavedChangesAlert(false);
    
    if (action === 'cancel') {
      setPendingDashboardSwitch(null);
      return;
    }
    
    if (action === 'save') {
      // Save changes first, then switch
      if (selectedDashboard) {
        saveChanges().then(() => {
          if (pendingDashboardSwitch) {
            switchToDashboard(pendingDashboardSwitch);
            setPendingDashboardSwitch(null);
          }
        });
      }
    } else if (action === 'discard') {
      // Discard changes and switch
      discardPendingChanges();
      if (pendingDashboardSwitch) {
        switchToDashboard(pendingDashboardSwitch);
        setPendingDashboardSwitch(null);
      }
    }
  };

  // Handle dashboard details update
  const handleDashboardDetailsUpdate = async (data: { name: string; description?: string; isPublic?: boolean }) => {
    if (!selectedDashboard) return;

    try {
      const response = await fetch(`/api/dashboards/${selectedDashboard.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update dashboard');
      }

      const updatedDashboard = await response.json();
      
      // Update local state
      setDashboards(prev => 
        prev.map(d => d.id === selectedDashboard.id ? updatedDashboard : d)
      );
      setSelectedDashboard(updatedDashboard);

      toast({
        title: 'Success',
        description: 'Dashboard details updated successfully',
      });
    } catch (error) {
      console.error('Error updating dashboard details:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update dashboard details',
        variant: 'destructive',
      });
      throw error; // Re-throw to let the editor handle it
    }
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
    // Check if this is a new widget (create) or existing widget (update)
    const isNewWidget = !selectedDashboard?.widgets.find(w => w.id === updatedWidget.id);
    
    if (isNewWidget) {
      // For new widgets, update the create pending change
      addPendingChange('create', updatedWidget.id, updatedWidget);
    } else {
      // For existing widgets, get original widget data for comparison
      const originalWidget = selectedDashboard?.widgets.find(w => w.id === updatedWidget.id);
      addPendingChange('update', updatedWidget.id, updatedWidget, originalWidget);
    }

    // Update local state immediately for better UX
    setSelectedDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: (prev.widgets ?? []).map(w => w.id === updatedWidget.id ? updatedWidget : w),
      };
    });
  };

  const handleWidgetDelete = (widgetId: number) => {
    // Add to pending changes for batch processing
    addPendingChange('delete', widgetId, null);

    // Update local state immediately for better UX
    setSelectedDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: (prev.widgets ?? []).filter(w => w.id !== widgetId),
      };
    });

    toast({
      title: 'Widget Deleted',
      description: 'Widget will be permanently deleted when you save changes.',
    });
  };

  // Function to find a free position for a new widget
  const findFreePosition = (widgets: Widget[], width: number = 8, height: number = 6) => {
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
      for (let x = 0; x <= gridWidth - width; x++) {
        let canPlace = true;
        
        // Check if this position is free
        for (let dy = 0; dy < height; dy++) {
          for (let dx = 0; dx < width; dx++) {
            if (occupied.has(`${x + dx},${y + dy}`)) {
              canPlace = false;
              break;
            }
          }
          if (!canPlace) break;
        }
        
        if (canPlace) {
          return { x, y, width, height };
        }
      }
    }
    
    // If no free position found, find the lowest Y position and place there
    let lowestY = 0;
    widgets.forEach(widget => {
      if (widget.position) {
        lowestY = Math.max(lowestY, (widget.position.y || 0) + (widget.position.height || 6));
      }
    });
    
    return { x: 0, y: lowestY, width, height };
  };

  const handleAddWidget = (type: string) => {
    // Get all existing widgets for smart positioning
    const allWidgets = [
      ...(selectedDashboard?.widgets ?? []),
      ...pendingChanges
        .filter(change => change.type === 'create' && change.data)
        .map(change => change.data as Widget)
    ];

    // Create widget using factory with smart positioning
    const newWidget = WidgetFactory.createWithSmartPosition(
      type as WidgetType,
      allWidgets,
      {
        order: (selectedDashboard?.widgets ?? []).length || 0,
      }
    );


    // Add to pending changes
    addPendingChange('create', newWidget.id, newWidget);

    // Add to local state immediately
    setSelectedDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: [...(prev.widgets ?? []), newWidget as Widget],
      };
    });

    // Open widget editor immediately for live preview
    setEditingWidget(newWidget as Widget);
    setShowWidgetEditor(true);
  };

  // Function to handle editing a widget within a container
  const handleEditWidget = (widgetId: string) => {
    // Find the widget and open the editor
    const widget = selectedDashboard?.widgets.find(w => w.id === widgetId);
    if (widget) {
      setEditingWidget(widget);
      setShowWidgetEditor(true);
    }
  };

  // Function to handle deleting a widget from a container
  const handleDeleteWidget = (widgetId: string) => {
    // Add to pending changes for deletion
    addPendingChange('delete', widgetId, null);
    
    // Remove from local state immediately
    setSelectedDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: prev.widgets.filter(w => w.id !== widgetId)
      };
    });
  };

  const renderWidget = (widget: Widget) => {
    // Check if widget has pending changes and use them for live preview
    const pendingChange = getPendingChange(widget.id, 'update');
    
    const displayWidget = pendingChange && pendingChange.data 
      ? { ...widget, ...pendingChange.data }
      : widget;

    // Use lazy loading for better performance
    return (
      <WidgetLazyLoading
        widget={displayWidget as BaseWidget}
        onWidgetProps={() => ({
          isEditMode,
          onEdit: () => {
            console.log('Widget edit clicked:', widget.id);
            handleWidgetClick(widget);
          },
          onDelete: () => {
            console.log('Widget delete clicked:', widget.id);
            handleWidgetDelete(Number(widget.id));
          },
          onAddWidget: (type: string) => {
            console.log('Add widget:', type);
            handleAddWidget(type);
          },
          onConfigChange: (newConfig: any) => {
            console.log('Widget config changed:', widget.id, newConfig);
            handleWidgetUpdate({ ...widget, config: newConfig });
          },
          tenantId: tenant?.id,
          databaseId: 1
        })}
        threshold={0.1}
        rootMargin="100px"
      />
    );
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
              onSelect={handleDashboardSwitch}
              onCreateNew={() => setShowCreateDialog(true)}
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedDashboard && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetailsEditor(true)}
                  className="flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Details</span>
                </Button>
                
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
                
                {isEditMode && (
                  <div className="flex items-center space-x-2 bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                    <span className="text-sm font-medium text-gray-900 mr-3">Add Widget:</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('chart')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add Chart Widget"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm">Chart</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('table')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add Table Widget"
                      >
                        <Database className="h-4 w-4" />
                        <span className="text-sm">Table</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('metric')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add KPI/Metric Widget"
                      >
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">KPI</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('text')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add Text Widget"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">Text</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('tasks')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add Tasks Widget"
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span className="text-sm">Tasks</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('clock')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add Clock Widget"
                      >
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">Clock</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('calendar')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add Calendar Widget"
                      >
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Calendar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('weather')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add Weather Widget"
                      >
                        <Cloud className="h-4 w-4" />
                        <span className="text-sm">Weather</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddWidget('container')}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 text-gray-700 transition-colors rounded-lg"
                        title="Add Container Widget"
                      >
                        <BarChart3 className="h-4 w-4" />
                        <span className="text-sm">Container</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grid Layout */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div
                onMouseDown={(e: React.MouseEvent) => {
                  // Allow button interactions by checking if click is on interactive elements
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
                    setIsDragging(true);
                    e.stopPropagation();
                    // Reset dragging state after a short delay
                    setTimeout(() => setIsDragging(false), 100);
                  }
                }}
              >
                <ResponsiveGridLayout
                  className="layout"
                  layouts={{ lg: (selectedDashboard?.widgets ?? []).map(w => ({
                    i: w.id.toString(),
                    x: w.position?.x || 0,
                    y: w.position?.y || 0,
                    w: w.position?.width || 8,
                    h: w.position?.height || 6,
                  })) }}
                  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                  rowHeight={60}
                  isDraggable={isEditMode && !isDragging}
                  isResizable={isEditMode && !isDragging}
                  onLayoutChange={handleLayoutChange}
                  margin={[16, 16]}
                  containerPadding={[0, 0]}
              >
                {(selectedDashboard?.widgets ?? []).map((widget) => (
                  <div 
                    key={widget.id} 
                    className="widget-container"
                    onMouseDown={(e) => {
                      // Allow buttons to work by checking if click is on interactive elements
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
                        e.stopPropagation();
                        e.preventDefault();
                        setIsDragging(true);
                        // Reset dragging state after a short delay
                        setTimeout(() => setIsDragging(false), 200);
                      }
                    }}
                    onClick={(e) => {
                      // Prevent widget selection when clicking on interactive elements
                      const target = e.target as HTMLElement;
                      if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <motion.div
                      className="h-full"
                      whileHover={isEditMode ? { scale: 1.02 } : {}}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => {
                        // Prevent widget selection when clicking on interactive elements
                        const target = e.target as HTMLElement;
                        if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea')) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      {renderWidget(widget)}
                    </motion.div>
                  </div>
                ))}
              </ResponsiveGridLayout>
              </div>
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

      {/* Dashboard Details Editor */}
      {selectedDashboard && (
        <DashboardDetailsEditor
          dashboard={selectedDashboard}
          isOpen={showDetailsEditor}
          onClose={() => setShowDetailsEditor(false)}
          onSave={handleDashboardDetailsUpdate}
        />
      )}

      {/* Unsaved Changes Alert */}
      <AlertDialog open={showUnsavedChangesAlert} onOpenChange={setShowUnsavedChangesAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have {pendingChangesCount} unsaved change{pendingChangesCount !== 1 ? 's' : ''} in the current dashboard. 
              What would you like to do with these changes before switching to "{pendingDashboardSwitch?.name}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleUnsavedChangesAction('cancel')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleUnsavedChangesAction('discard')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard Changes
            </AlertDialogAction>
            <AlertDialogAction onClick={() => handleUnsavedChangesAction('save')}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
