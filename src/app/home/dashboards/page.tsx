'use client';

import { useState, useEffect, useCallback } from 'react';
import './dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Plus, Save, Edit3, Eye, Settings, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LineChartWidget } from '@/components/dashboard/LineChartWidget';
import BarChartWidget from '@/components/dashboard/BarChartWidget';
import PieChartWidget from '@/components/dashboard/PieChartWidget';
import { WidgetEditor } from '@/components/dashboard/WidgetEditor';
import { DashboardSelector } from '@/components/dashboard/DashboardSelector';
import { useDashboardStore } from '@/hooks/useDashboardStore';
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
  id: number;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: any;
  isVisible: boolean;
  order: number;
}

interface PendingChange {
  type: 'create' | 'update' | 'delete';
  widgetId?: number;
  data?: Partial<Widget>;
}

export default function DashboardsPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [showWidgetEditor, setShowWidgetEditor] = useState(false);
  
  const { toast } = useToast();
  const { tenant } = useApp();

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
      
      // Select default dashboard if available
      const defaultDashboard = data.dashboards.find((d: Dashboard) => d.isDefault);
      if (defaultDashboard) {
        setSelectedDashboard(defaultDashboard);
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
    if (pendingChanges.length === 0) return;

    try {
      setIsSaving(true);
      
      // Process pending changes
      for (const change of pendingChanges) {
        if (change.type === 'create' && change.data) {
          await fetch(`/api/dashboards/${selectedDashboard?.id}/widgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change.data),
          });
        } else if (change.type === 'update' && change.widgetId && change.data) {
          await fetch(`/api/dashboards/${selectedDashboard?.id}/widgets/${change.widgetId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(change.data),
          });
        } else if (change.type === 'delete' && change.widgetId) {
          await fetch(`/api/dashboards/${selectedDashboard?.id}/widgets/${change.widgetId}`, {
            method: 'DELETE',
          });
        }
      }

      // Clear pending changes and refresh dashboard
      setPendingChanges([]);
      await fetchDashboards();
      
      toast({
        title: 'Success',
        description: 'Changes saved successfully',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const revertChanges = () => {
    if (pendingChanges.length === 0) return;
    
    // Clear pending changes and reload dashboard data
    setPendingChanges([]);
    if (selectedDashboard) {
      fetchDashboards();
    }
    
    toast({
      title: "Changes reverted",
      description: "All pending changes have been discarded.",
    });
  };

  const handleLayoutChange = (layout: any[]) => {
    if (!isEditMode) return;

    const changes: PendingChange[] = layout.map((item) => ({
      type: 'update',
      widgetId: parseInt(item.i),
      data: {
        position: {
          x: item.x,
          y: item.y,
          width: item.w,
          height: item.h,
        },
      },
    }));

    setPendingChanges(prev => {
      const filtered = prev.filter(change => 
        !changes.some(c => c.widgetId === change.widgetId && change.type === 'update')
      );
      return [...filtered, ...changes];
    });
  };

  const handleWidgetClick = (widget: Widget) => {
    console.log('Widget clicked:', widget.id, 'Edit mode:', isEditMode);
    if (isEditMode) {
      setEditingWidget(widget);
      setShowWidgetEditor(true);
    }
  };

  const handleWidgetUpdate = (updatedWidget: Widget) => {
    setPendingChanges(prev => {
      const filtered = prev.filter(change => 
        !(change.widgetId === updatedWidget.id && change.type === 'update')
      );
      return [...filtered, {
        type: 'update',
        widgetId: updatedWidget.id,
        data: updatedWidget,
      }];
    });

    // Update local state immediately for better UX
    setSelectedDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: prev.widgets.map(w => w.id === updatedWidget.id ? updatedWidget : w),
      };
    });
  };

  const handleAddWidget = (type: string) => {
    // Create default config based on widget type
    let defaultConfig = {};
    
    if (type === 'chart') {
      defaultConfig = {
        chartType: 'line',
        dataSource: {
          tableId: 1, // Default table ID - will be updated when user selects a table
          columnX: 'id', // Default column - will be updated when user selects columns
          columnY: 'id', // Default column - will be updated when user selects columns
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
    }

    const newWidget: Partial<Widget> = {
      type,
      title: `New ${type} Widget`,
      position: { x: 0, y: 0, width: 6, height: 4 },
      config: defaultConfig,
      isVisible: true,
      order: selectedDashboard?.widgets.length || 0,
    };

    setPendingChanges(prev => [...prev, {
      type: 'create',
      data: newWidget,
    }]);

    // Add to local state immediately
    const tempWidget: Widget = {
      id: Date.now(), // Temporary ID
      ...newWidget,
    } as Widget;

    setSelectedDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: [...prev.widgets, tempWidget],
      };
    });
  };

  const renderWidget = (widget: Widget) => {
    // Check if widget has pending changes and use them for live preview
    const pendingChange = pendingChanges.find(change => 
      change.widgetId === widget.id && change.type === 'update'
    );
    
    const displayWidget = pendingChange && pendingChange.data 
      ? { ...widget, ...pendingChange.data }
      : widget;

    switch (widget.type) {
      case 'chart': {
        const subType = (displayWidget?.config?.chartType) || (displayWidget as any).subType || 'line';
        if (subType === 'bar') {
          return (
            <BarChartWidget 
              widget={displayWidget} 
              isEditMode={isEditMode}
              onEdit={() => handleWidgetClick(widget)}
            />
          );
        }
        if (subType === 'pie') {
          return (
            <PieChartWidget 
              widget={displayWidget} 
              isEditMode={isEditMode}
              onEdit={() => handleWidgetClick(widget)}
            />
          );
        }
        return (
          <LineChartWidget 
            widget={displayWidget} 
            isEditMode={isEditMode}
            onEdit={() => handleWidgetClick(widget)}
          />
        );
      }
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
                      disabled={pendingChanges.length === 0 || isSaving}
                      className="flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>
                        {isSaving ? 'Saving...' : `Save (${pendingChanges.length})`}
                      </span>
                    </Button>
                    
                    <Button
                      onClick={revertChanges}
                      disabled={pendingChanges.length === 0}
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
                  <Button
                    onClick={() => handleAddWidget('chart')}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Widget</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Grid Layout */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: selectedDashboard.widgets.map(w => ({
                  i: w.id.toString(),
                  x: w.position.x,
                  y: w.position.y,
                  w: w.position.width,
                  h: w.position.height,
                })) }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={60}
                isDraggable={isEditMode}
                isResizable={isEditMode}
                onLayoutChange={handleLayoutChange}
                margin={[16, 16]}
                containerPadding={[0, 0]}
              >
                {selectedDashboard.widgets.map((widget) => (
                  <div 
                    key={widget.id} 
                    className="widget-container"
                    onClick={(e) => {
                      console.log('Widget container clicked:', widget.id);
                      if (isEditMode) {
                        e.stopPropagation();
                        handleWidgetClick(widget);
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
