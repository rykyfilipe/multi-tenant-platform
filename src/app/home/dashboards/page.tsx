'use client';

import { useState, useEffect, useCallback } from 'react';
import './dashboard.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Plus, Save, Edit3, Eye, Settings, X, RotateCcw, BarChart3, Database, TrendingUp, FileText } from 'lucide-react';
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
import TableWidget from '@/components/dashboard/TableWidget';
import KPIWidget from '@/components/dashboard/KPIWidget';
import TextWidget from '@/components/dashboard/TextWidget';
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
  id: number | string;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: any;
  isVisible: boolean;
  order: number;
}

interface PendingChange {
  type: 'create' | 'update' | 'delete';
  widgetId?: number | string;
  data?: Partial<Widget> | null;
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
    if (pendingChanges.length === 0) return;

    try {
      setIsSaving(true);
      
      // Prepare batch operations
      const operations = pendingChanges.map(change => ({
        type: change.type,
        widgetId: change.widgetId,
        data: change.data,
      }));

      // Send batch request
      const response = await fetch(`/api/dashboards/${selectedDashboard?.id}/widgets/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operations }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      const result = await response.json();
      
      if (!result.success) {
        // Handle partial failures
        const failedOperations = result.errors.map((err: any) => 
          `Operation ${err.index + 1} (${err.type}): ${err.error}`
        ).join(', ');
        
        toast({
          title: 'Partial Success',
          description: `Saved ${result.summary.successful} of ${result.summary.total} changes. Errors: ${failedOperations}`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'All changes saved successfully',
        });
      }

      // Clear pending changes and refresh dashboard
      setPendingChanges([]);
      await fetchDashboards();
      
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save changes',
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
    if (isEditMode) {
      setEditingWidget(widget);
      setShowWidgetEditor(true);
    }
  };

  const handleWidgetUpdate = (updatedWidget: Widget) => {
    setPendingChanges(prev => {
      const filtered = prev.filter(change => 
        !(change.widgetId === Number(updatedWidget.id) && change.type === 'update')
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
        widgets: (prev.widgets ?? []).map(w => Number(w.id) === Number(updatedWidget.id) ? updatedWidget : w),
      };
    });
  };

  const handleWidgetDelete = (widgetId: number) => {
    // Add to pending changes for batch processing
    setPendingChanges(prev => [...prev, {
      type: 'delete',
      widgetId: widgetId,
      data: null
    }]);

    // Update local state immediately for better UX
    setSelectedDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        widgets: (prev.widgets ?? []).filter(w => Number(w.id) !== widgetId),
      };
    });

    toast({
      title: 'Widget Deleted',
      description: 'Widget will be permanently deleted when you save changes.',
    });
  };

  // Function to find a free position for a new widget
  const findFreePosition = (widgets: Widget[], width: number = 6, height: number = 4) => {
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
        lowestY = Math.max(lowestY, (widget.position.y || 0) + (widget.position.height || 4));
      }
    });
    
    return { x: 0, y: lowestY, width, height };
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
    } else if (type === 'table') {
      defaultConfig = {
        dataSource: {
          tableId: 1, // Default table ID - will be updated when user selects a table
          columns: ['id'], // Default columns - will be updated when user selects columns
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
          tableId: 1, // Default table ID - will be updated when user selects a table
          column: 'id', // Default column - will be updated when user selects column
          aggregation: 'sum',
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
    }

    // Find a free position for the new widget, considering both existing widgets and pending changes
    const allWidgets = [
      ...(selectedDashboard?.widgets ?? []),
      ...pendingChanges
        .filter(change => change.type === 'create' && change.data)
        .map(change => change.data as Widget)
    ];
    const freePosition = findFreePosition(allWidgets);

    const newWidget: Partial<Widget> = {
      type,
      title: `New ${type} Widget`,
      position: freePosition,
      config: defaultConfig,
      isVisible: true,
      order: (selectedDashboard?.widgets ?? []).length || 0,
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
        widgets: [...(prev.widgets ?? []), tempWidget],
      };
    });
  };

  const renderWidget = (widget: Widget) => {
    // Check if widget has pending changes and use them for live preview
    const pendingChange = pendingChanges.find(change => 
      change.widgetId === Number(widget.id) && change.type === 'update'
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
                  <Select onValueChange={(value) => handleAddWidget(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add Widget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chart">
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>Chart</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="table">
                        <div className="flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>Table</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="metric">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4" />
                          <span>KPI/Metric</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="text">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>Text</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Grid Layout */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: (selectedDashboard?.widgets ?? []).map(w => ({
                  i: w.id.toString(),
                  x: w.position?.x || 0,
                  y: w.position?.y || 0,
                  w: w.position?.width || 4,
                  h: w.position?.height || 4,
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
                {(selectedDashboard?.widgets ?? []).map((widget) => (
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
