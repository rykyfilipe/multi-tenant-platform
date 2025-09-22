'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Settings, Palette, BarChart3, Database, FileText, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { Badge } from '@/components/ui/badge';
import { DataEditor } from './DataEditor';
import { FilterBuilder } from './FilterBuilder';
import { TableSelector } from './TableSelector';
// import { EnhancedTableSelector } from './EnhancedTableSelector'; // Removed - using TableSelector now
import { AggregationSelector } from './AggregationSelector';
import { LineChartConfig, DataSource, ChartDataPoint } from './LineChartWidget';
import type { DataSource } from './TableSelector';
import type { AggregationConfig } from './AggregationSelector';
import { FilterConfig } from '@/types/filtering';
import { api } from '@/lib/api-client';

interface Widget {
  id: number | string;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: LineChartConfig | any;
  isVisible: boolean;
  order: number;
}

interface WidgetEditorProps {
  widget: Widget;
  onClose: () => void;
  onSave: (widget: Widget) => void;
  onUpdate?: (widget: Widget) => void; // New prop for real-time updates
  tenantId: number;
  databaseId: number;
}

export function WidgetEditor({ widget, onClose, onSave, onUpdate, tenantId, databaseId }: WidgetEditorProps) {
  const [editedWidget, setEditedWidget] = useState<Widget>({ ...widget });
  const [hasChanges, setHasChanges] = useState(false);
  
  // State for tables and columns (direct loading without cache)
  const [tables, setTables] = useState<any[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [columns, setColumns] = useState<any[]>([]);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);
  
  // Debouncing refs for color picker
  const colorUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get selected table info for display
  const selectedTable = tables?.find(t => t.id === editedWidget.config?.dataSource?.tableId);
  const selectedTableColumns = columns || [];
  
  // Get selected columns info for display
  const selectedXColumns = editedWidget.config?.dataSource?.xAxis?.columns || [];
  const selectedYColumns = editedWidget.config?.dataSource?.yAxis?.columns || [];
  
  // Function to determine if configuration is complete
  const isConfigurationComplete = () => {
    const dataSource = editedWidget.config?.dataSource;
    if (!dataSource || !selectedTable) return false;
    
    switch (widget.type) {
      case 'table':
        return true; // Table widget just needs a table selected
      case 'metric':
        return selectedYColumns.length > 0; // KPI needs at least one Y column
      case 'chart':
        const chartType = editedWidget.config?.chartType || 'line';
        if (chartType === 'pie') {
          return selectedXColumns.length > 0 && selectedYColumns.length > 0;
        } else {
          return selectedXColumns.length > 0 && selectedYColumns.length > 0;
        }
      default:
        return true;
    }
  };

  // Load tables when editor opens
  const loadTables = async () => {
    if (!tenantId || !databaseId) return;
    
    setTablesLoading(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/databases/${databaseId}/tables`);
      if (response.ok) {
        const data = await response.json();
        setTables(data.tables || []);
      } else {
        console.error('Failed to load tables:', response.statusText);
        setTables([]);
      }
    } catch (error) {
      console.error('Error loading tables:', error);
      setTables([]);
    } finally {
      setTablesLoading(false);
    }
  };

  // Auto-load tables when editor opens
  useEffect(() => {
    if (tables.length === 0 && !tablesLoading) {
      console.log('[WidgetEditor] Auto-loading tables when editor opens');
      loadTables();
    }
  }, [tables.length, tablesLoading]);

  // Load columns when table is selected
  const loadColumns = async (tableId: number) => {
    if (!tenantId || !databaseId) return;
    
    setIsLoadingColumns(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/columns`);
      if (response.ok) {
        const data = await response.json();
        setColumns(data.columns || []);
      } else {
        console.error('Failed to load columns:', response.statusText);
        setColumns([]);
      }
    } catch (error) {
      console.error('Error loading columns:', error);
      setColumns([]);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  // Auto-load columns when table is selected
  useEffect(() => {
    const tableId = editedWidget.config?.dataSource?.tableId;
    if (tableId && !isLoadingColumns && columns.length === 0) {
      console.log('[WidgetEditor] Auto-loading columns for selected table:', tableId);
      loadColumns(tableId);
    }
  }, [editedWidget.config?.dataSource?.tableId, isLoadingColumns, columns.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (colorUpdateTimeoutRef.current) {
        clearTimeout(colorUpdateTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(editedWidget) !== JSON.stringify(widget));
  }, [editedWidget, widget]);

  // Initialize widget config if needed
  useEffect(() => {
    if (!editedWidget.config || Object.keys(editedWidget.config).length === 0) {
      console.log('[WidgetEditor] Initializing default config for type:', editedWidget.type);
      setEditedWidget(prev => ({
        ...prev,
        config: getDefaultConfig(prev.type)
      }));
    }
  }, [editedWidget.type, editedWidget.config]);

  const handleSave = () => {
    onSave(editedWidget);
    onClose();
  };

  // Default configurations for each widget type
  const getDefaultConfig = (type: string) => {
    switch (type) {
      case 'chart':
        return {
          title: '',
          dataSource: {
            type: 'manual',
            manualData: [
              { x: 'Jan', y: 100 },
              { x: 'Feb', y: 150 },
              { x: 'Mar', y: 200 },
              { x: 'Apr', y: 180 },
              { x: 'May', y: 250 },
            ],
            xAxis: { key: 'x', label: 'Month', type: 'text', columns: [] },
            yAxis: { key: 'y', label: 'Value', type: 'number', columns: [] }
          },
          xAxis: { key: 'x', label: 'Month', type: 'category' },
          yAxis: { key: 'y', label: 'Value', type: 'number' },
          options: {
            colors: ['#3B82F6'],
            showLegend: true,
            showGrid: true,
            strokeWidth: 2,
            dotSize: 4,
            curveType: 'monotone'
          }
        };
      case 'table':
        return {
          dataSource: {
            type: 'table',
            tableId: undefined,
            columns: [],
            xAxis: { key: '', label: '', type: 'text', columns: [] },
            yAxis: { key: '', label: '', type: 'number', columns: [] }
          },
          options: {
            showHeader: true,
            showPagination: true,
            pageSize: 10,
            sortable: true
          }
        };
      case 'metric':
        return {
          dataSource: {
            type: 'table',
            tableId: undefined,
            column: '',
            aggregation: 'sum',
            xAxis: { key: '', label: '', type: 'text', columns: [] },
            yAxis: { key: '', label: '', type: 'number', columns: [] }
          },
          options: {
            format: 'number',
            prefix: '',
            suffix: '',
            decimals: 0
          }
        };
      case 'text':
        return {
          content: 'Enter your text here...',
          options: {
            fontSize: 16,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left'
          }
        };
      case 'filter':
        return {
          filters: [],
          options: {
            showLabels: true,
            showOperators: true,
            allowMultiple: true
          }
        };
      default:
        return {};
    }
  };

  const updateWidget = (updates: Partial<Widget>) => {
    setEditedWidget(prev => {
      const newWidget = { ...prev, ...updates };
      
      // If type changed, replace entire widget with default config for new type
      if (updates.type && updates.type !== prev.type) {
        console.log('[WidgetEditor] Type changed from', prev.type, 'to', updates.type);
        return {
          ...newWidget,
          config: getDefaultConfig(updates.type as string),
          title: `New ${updates.type} Widget`
        };
      }
      
      return newWidget;
    });
  };

  const updateConfig = (configUpdates: any) => {
    setEditedWidget(prev => {
      const currentConfig = prev.config || {};
      const newConfig = { ...currentConfig, ...configUpdates };
      const updatedWidget = {
        ...prev,
        config: newConfig
      };
      
      // Send real-time update to parent component
      if (onUpdate) {
        onUpdate(updatedWidget);
      }
      
      return updatedWidget;
    });
    
    setHasChanges(true);
  };

  // Debounced color update function
  const debouncedColorUpdate = (column: string, color: string) => {
    // Clear previous timeout
    if (colorUpdateTimeoutRef.current) {
      clearTimeout(colorUpdateTimeoutRef.current);
    }
    
    // Set new timeout for 300ms
    colorUpdateTimeoutRef.current = setTimeout(() => {
      const currentColumnColors = editedWidget.config?.options?.columnColors || {};
      updateConfig({
        options: {
          ...editedWidget.config?.options,
          columnColors: {
            ...currentColumnColors,
            [column]: color
          }
        }
      });
    }, 300);
  };

  const updatePosition = (positionUpdates: Partial<{ x: number; y: number; width: number; height: number }>) => {
    setEditedWidget(prev => {
      const updatedWidget = {
        ...prev,
        position: { ...(prev.position || {}), ...positionUpdates }
      };
      
      // Send real-time update to parent component
      if (onUpdate) {
        onUpdate(updatedWidget);
      }
      
      return updatedWidget;
    });
    
    setHasChanges(true);
  };

  // LineChart-specific handlers
  const handleDataSourceChange = (dataSource: DataSource) => {
    updateConfig({ dataSource });
  };

  const handleManualDataChange = (data: ChartDataPoint[]) => {
    const currentDataSource = editedWidget.config?.dataSource || {};
    const newDataSource = {
      ...currentDataSource,
      manualData: data
    };
    updateConfig({ dataSource: newDataSource });
  };

  const handleFiltersChange = (filters: FilterConfig[]) => {
    const currentDataSource = editedWidget.config?.dataSource || {};
    const newDataSource = {
      ...currentDataSource,
      filters
    };
    updateConfig({ dataSource: newDataSource });
  };

  const handleTableChange = (tableId: number) => {
    const currentDataSource = editedWidget.config?.dataSource || {};
    const newDataSource = {
      ...currentDataSource,
      type: 'table' as const,
      tableId,
      columnX: '',
      columnY: ''
    };
    updateConfig({ dataSource: newDataSource });
  };

  const handleColumnXChange = (column: string) => {
    const currentDataSource = editedWidget.config?.dataSource || {};
    const newDataSource = {
      ...currentDataSource,
      columnX: column
    };
    updateConfig({ dataSource: newDataSource });
    
    // Update xAxis key to match selected column
    updateConfig({ 
      xAxis: { 
        key: column, 
        label: column, 
        type: 'category' 
      } 
    });
  };

  const handleColumnYChange = (column: string) => {
    const currentDataSource = editedWidget.config?.dataSource || {};
    const newDataSource = {
      ...currentDataSource,
      columnY: column
    };
    updateConfig({ dataSource: newDataSource });
    
    // Update yAxis key to match selected column
    updateConfig({ 
      yAxis: { 
        key: column, 
        label: column, 
        type: 'number' 
      } 
    });
  };

  const handleAxisChange = (axis: 'xAxis' | 'yAxis', updates: any) => {
    updateConfig({
      [axis]: { ...editedWidget.config?.[axis], ...updates }
    });
  };

  const isLineChart = widget.type === 'chart';
  const config = (editedWidget.config as LineChartConfig) || {
    title: '',
    dataSource: { 
      type: 'manual', 
      manualData: [],
      xAxis: { key: 'x', label: 'X Axis', type: 'text', columns: [] },
      yAxis: { key: 'y', label: 'Y Axis', type: 'number', columns: [] }
    },
    xAxis: { key: 'x', label: 'X Axis', type: 'category' },
    yAxis: { key: 'y', label: 'Y Axis', type: 'number' },
    options: {}
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-[600px] bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Widget Editor</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
            </TabsList>

            {/* General Tab */}
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editedWidget.title || ''}
                      onChange={(e) => updateWidget({ title: e.target.value })}
                      placeholder="Enter widget title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Widget Type</Label>
                    <Select
                      value={editedWidget.type}
                      onValueChange={(value) => updateWidget({ type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chart">Chart</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="metric">Metric</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="clock">Clock</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="calendar">Calendar</SelectItem>
                        <SelectItem value="filter">Filter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isVisible"
                      checked={editedWidget.isVisible}
                      onCheckedChange={(checked) => updateWidget({ isVisible: checked })}
                    />
                    <Label htmlFor="isVisible">Visible</Label>
                  </div>

                  <div>
                    <Label htmlFor="order">Order</Label>
                    <Input
                      id="order"
                      type="number"
                      value={editedWidget.order}
                      onChange={(e) => updateWidget({ order: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Position & Size</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="x">X Position</Label>
                      <Input
                        id="x"
                        type="number"
                        value={editedWidget.position?.x || 0}
                        onChange={(e) => updatePosition({ x: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="y">Y Position</Label>
                      <Input
                        id="y"
                        type="number"
                        value={editedWidget.position?.y || 0}
                        onChange={(e) => updatePosition({ y: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        value={editedWidget.position?.width || 4}
                        onChange={(e) => updatePosition({ width: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        value={editedWidget.position?.height || 4}
                        onChange={(e) => updatePosition({ height: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="20"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data" className="space-y-4">
              {widget.type === 'table' ? (
                <div className="space-y-4">
                  {/* Table Information Display */}
                  {selectedTable && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>Selected Table: {selectedTable.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Columns:</span>
                            <span className="font-medium">{selectedTableColumns.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Description:</span>
                            <span className="font-medium">{selectedTable.description || 'No description'}</span>
                          </div>
                          {selectedTableColumns.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-2">Available columns:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedTableColumns.map((column: any) => (
                                  <Badge key={column.id} variant="outline" className="text-xs">
                                    {column.name}
                                    <span className="ml-1 text-muted-foreground">({column.type})</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Enhanced Table Configuration */}
                  <EnhancedTableSelector
                    dataSource={editedWidget.config?.dataSource as DataSource || { 
                      type: 'table',
                      xAxis: { key: '', label: '', type: 'text', columns: [] },
                      yAxis: { key: '', label: '', type: 'number', columns: [] }
                    }}
                    onDataSourceChange={(newDataSource) => {
                      updateConfig({ dataSource: newDataSource });
                    }}
                    widgetType="table"
                    tenantId={tenantId}
                  />
                  
                  {/* Column Selection Status */}
                  {(selectedXColumns.length > 0 || selectedYColumns.length > 0) && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center space-x-2">
                          <CheckSquare className="h-4 w-4" />
                          <span>Column Selection</span>
                          {isConfigurationComplete() ? (
                            <Badge variant="default" className="ml-auto">Complete</Badge>
                          ) : (
                            <Badge variant="secondary" className="ml-auto">Incomplete</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {selectedXColumns.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">X-Axis Columns:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedXColumns.map((column: string) => (
                                  <Badge key={column} variant="secondary" className="text-xs">
                                    {column}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {selectedYColumns.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Y-Axis Columns:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedYColumns.map((column: string) => (
                                  <Badge key={column} variant="secondary" className="text-xs">
                                    {column}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {!isConfigurationComplete() && (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                              <p className="font-medium">Configuration incomplete</p>
                              <p>Please select the required columns to complete the widget configuration.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Table Aggregation Options */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Data Aggregation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="tableAggregation">Default Aggregation</Label>
                          <Select
                            value={editedWidget.config?.dataSource?.aggregation || 'none'}
                            onValueChange={(value) => updateConfig({
                              dataSource: {
                                ...editedWidget.config?.dataSource,
                                aggregation: value === 'none' ? undefined : value
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Aggregation</SelectItem>
                              <SelectItem value="sum">Sum</SelectItem>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="avg">Average</SelectItem>
                              <SelectItem value="min">Minimum</SelectItem>
                              <SelectItem value="max">Maximum</SelectItem>
                              <SelectItem value="median">Median</SelectItem>
                              <SelectItem value="stddev">Standard Deviation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="tableGroupBy">Group By</Label>
                          <Select
                            value={editedWidget.config?.dataSource?.groupBy || 'none'}
                            onValueChange={(value) => updateConfig({
                              dataSource: {
                                ...editedWidget.config?.dataSource,
                                groupBy: value === 'none' ? undefined : value
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Grouping</SelectItem>
                              <SelectItem value="day">Day</SelectItem>
                              <SelectItem value="week">Week</SelectItem>
                              <SelectItem value="month">Month</SelectItem>
                              <SelectItem value="quarter">Quarter</SelectItem>
                              <SelectItem value="year">Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Table Options */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Display Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pageSize">Page Size</Label>
                          <Input
                            id="pageSize"
                            type="number"
                            value={editedWidget.config?.options?.pageSize || 10}
                            onChange={(e) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                pageSize: parseInt(e.target.value) || 10
                              }
                            })}
                            min="1"
                            max="100"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showPagination"
                            checked={editedWidget.config?.options?.showPagination !== false}
                            onCheckedChange={(checked) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                showPagination: checked
                              }
                            })}
                          />
                          <Label htmlFor="showPagination">Show Pagination</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showSearch"
                            checked={editedWidget.config?.options?.showSearch !== false}
                            onCheckedChange={(checked) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                showSearch: checked
                              }
                            })}
                          />
                          <Label htmlFor="showSearch">Show Search</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showExport"
                            checked={editedWidget.config?.options?.showExport !== false}
                            onCheckedChange={(checked) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                showExport: checked
                              }
                            })}
                          />
                          <Label htmlFor="showExport">Show Export</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : widget.type === 'metric' ? (
                <div className="space-y-4">
                  {/* Table Information Display */}
                  {selectedTable && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center space-x-2">
                          <Database className="h-4 w-4" />
                          <span>Selected Table: {selectedTable.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Columns:</span>
                            <span className="font-medium">{selectedTableColumns.length}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Description:</span>
                            <span className="font-medium">{selectedTable.description || 'No description'}</span>
                          </div>
                          {selectedTableColumns.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-2">Available columns:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedTableColumns.map((column: any) => (
                                  <Badge key={column.id} variant="outline" className="text-xs">
                                    {column.name}
                                    <span className="ml-1 text-muted-foreground">({column.type})</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Enhanced KPI Configuration */}
                  <EnhancedTableSelector
                    dataSource={editedWidget.config?.dataSource as DataSource || { 
                      type: 'table',
                      xAxis: { key: '', label: '', type: 'text', columns: [] },
                      yAxis: { key: '', label: '', type: 'number', columns: [] }
                    }}
                    onDataSourceChange={(newDataSource) => {
                      updateConfig({ dataSource: newDataSource });
                    }}
                    widgetType="kpi"
                    expectedYType="number"
                    tenantId={tenantId}
                  />
                  
                  {/* Column Selection Status */}
                  {selectedYColumns.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center space-x-2">
                          <CheckSquare className="h-4 w-4" />
                          <span>Column Selection</span>
                          {isConfigurationComplete() ? (
                            <Badge variant="default" className="ml-auto">Complete</Badge>
                          ) : (
                            <Badge variant="secondary" className="ml-auto">Incomplete</Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {selectedYColumns.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">Value Columns:</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedYColumns.map((column: string) => (
                                  <Badge key={column} variant="secondary" className="text-xs">
                                    {column}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {!isConfigurationComplete() && (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                              <p className="font-medium">Configuration incomplete</p>
                              <p>Please select at least one value column for the KPI widget.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Enhanced Aggregation Options */}
                  <AggregationSelector
                    config={editedWidget.config?.dataSource?.aggregationConfig || { primary: 'sum' }}
                    onConfigChange={(aggregationConfig) => {
                      console.log('[WidgetEditor] Aggregation config change:', aggregationConfig);
                      updateConfig({
                        dataSource: {
                          ...editedWidget.config?.dataSource,
                          aggregationConfig: aggregationConfig,
                          // Set legacy aggregation for compatibility
                          aggregation: aggregationConfig.primary
                        }
                      });
                    }}
                    columnType="number"
                  />

                  {/* KPI Options */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Display Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="format">Format</Label>
                          <Select
                            value={editedWidget.config?.options?.format || 'number'}
                            onValueChange={(value) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                format: value as 'number' | 'currency' | 'percentage'
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="currency">Currency</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="decimals">Decimals</Label>
                          <Input
                            id="decimals"
                            type="number"
                            value={editedWidget.config?.options?.decimals || 0}
                            onChange={(e) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                decimals: parseInt(e.target.value) || 0
                              }
                            })}
                            min="0"
                            max="10"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="prefix">Prefix</Label>
                          <Input
                            id="prefix"
                            value={editedWidget.config?.options?.prefix || ''}
                            onChange={(e) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                prefix: e.target.value
                              }
                            })}
                            placeholder="$"
                          />
                        </div>
                        <div>
                          <Label htmlFor="suffix">Suffix</Label>
                          <Input
                            id="suffix"
                            value={editedWidget.config?.options?.suffix || ''}
                            onChange={(e) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                suffix: e.target.value
                              }
                            })}
                            placeholder="%"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showChange"
                            checked={editedWidget.config?.options?.showChange || false}
                            onCheckedChange={(checked) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                showChange: checked
                              }
                            })}
                          />
                          <Label htmlFor="showChange">Show Change</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showTrend"
                            checked={editedWidget.config?.options?.showTrend || false}
                            onCheckedChange={(checked) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                showTrend: checked
                              }
                            })}
                          />
                          <Label htmlFor="showTrend">Show Trend</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : widget.type === 'text' ? (
                <div className="space-y-4">
                  {/* Text Configuration */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          value={editedWidget.config?.content || ''}
                          onChange={(e) => updateConfig({
                            content: e.target.value
                          })}
                          placeholder="Enter your text content..."
                          rows={8}
                        />
                      </div>
                      <div>
                        <Label htmlFor="textType">Content Type</Label>
                        <Select
                          value={editedWidget.config?.type || 'plain'}
                          onValueChange={(value) => updateConfig({
                            type: value as 'markdown' | 'html' | 'plain'
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="plain">Plain Text</SelectItem>
                            <SelectItem value="markdown">Markdown</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Text Options */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Display Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fontSize">Font Size</Label>
                          <Select
                            value={editedWidget.config?.options?.fontSize || 'base'}
                            onValueChange={(value) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                fontSize: value as 'sm' | 'base' | 'lg' | 'xl' | '2xl'
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="base">Base</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                              <SelectItem value="xl">Extra Large</SelectItem>
                              <SelectItem value="2xl">2X Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="textAlign">Text Align</Label>
                          <Select
                            value={editedWidget.config?.options?.textAlign || 'left'}
                            onValueChange={(value) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                textAlign: value as 'left' | 'center' | 'right' | 'justify'
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                              <SelectItem value="justify">Justify</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="textColor">Text Color</Label>
                          <Input
                            id="textColor"
                            value={editedWidget.config?.options?.textColor || ''}
                            onChange={(e) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                textColor: e.target.value
                              }
                            })}
                            placeholder="#000000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="backgroundColor">Background Color</Label>
                          <Input
                            id="backgroundColor"
                            value={editedWidget.config?.options?.backgroundColor || ''}
                            onChange={(e) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                backgroundColor: e.target.value
                              }
                            })}
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showBorder"
                            checked={editedWidget.config?.options?.showBorder !== false}
                            onCheckedChange={(checked) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                showBorder: checked
                              }
                            })}
                          />
                          <Label htmlFor="showBorder">Show Border</Label>
                        </div>
                        <div>
                          <Label htmlFor="padding">Padding</Label>
                          <Select
                            value={editedWidget.config?.options?.padding || 'md'}
                            onValueChange={(value) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                padding: value as 'sm' | 'md' | 'lg'
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sm">Small</SelectItem>
                              <SelectItem value="md">Medium</SelectItem>
                              <SelectItem value="lg">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : widget.type === 'clock' ? (
                <div className="space-y-4">
                  {/* Clock Configuration */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Clock Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={editedWidget.config?.timezone || 'local'}
                          onValueChange={(value) => updateConfig({ timezone: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="local">Local Time</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">New York</SelectItem>
                            <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                            <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="format">Time Format</Label>
                          <Select
                            value={editedWidget.config?.format || '24h'}
                            onValueChange={(value) => updateConfig({ format: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                              <SelectItem value="24h">24 Hour</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showSeconds"
                            checked={editedWidget.config?.showSeconds !== false}
                            onCheckedChange={(checked) => updateConfig({ showSeconds: checked })}
                          />
                          <Label htmlFor="showSeconds">Show Seconds</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showDate"
                            checked={editedWidget.config?.showDate !== false}
                            onCheckedChange={(checked) => updateConfig({ showDate: checked })}
                          />
                          <Label htmlFor="showDate">Show Date</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showTimezone"
                            checked={editedWidget.config?.showTimezone !== false}
                            onCheckedChange={(checked) => updateConfig({ showTimezone: checked })}
                          />
                          <Label htmlFor="showTimezone">Show Timezone</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : widget.type === 'tasks' ? (
                <div className="space-y-4">
                  {/* Tasks Configuration */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Tasks Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="maxTasks">Max Tasks</Label>
                          <Input
                            id="maxTasks"
                            type="number"
                            value={editedWidget.config?.maxTasks || 50}
                            onChange={(e) => updateConfig({ maxTasks: parseInt(e.target.value) || 50 })}
                            min="1"
                            max="1000"
                          />
                        </div>
                        <div>
                          <Label htmlFor="sortBy">Sort By</Label>
                          <Select
                            value={editedWidget.config?.sortBy || 'created'}
                            onValueChange={(value) => updateConfig({ sortBy: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created">Created Date</SelectItem>
                              <SelectItem value="priority">Priority</SelectItem>
                              <SelectItem value="alphabetical">Alphabetical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showCompleted"
                            checked={editedWidget.config?.showCompleted !== false}
                            onCheckedChange={(checked) => updateConfig({ showCompleted: checked })}
                          />
                          <Label htmlFor="showCompleted">Show Completed</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showPriority"
                            checked={editedWidget.config?.showPriority !== false}
                            onCheckedChange={(checked) => updateConfig({ showPriority: checked })}
                          />
                          <Label htmlFor="showPriority">Show Priority</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showDates"
                            checked={editedWidget.config?.style?.showDates !== false}
                            onCheckedChange={(checked) => updateConfig({ 
                              style: { 
                                ...editedWidget.config?.style, 
                                showDates: checked 
                              } 
                            })}
                          />
                          <Label htmlFor="showDates">Show Dates</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="compactMode"
                            checked={editedWidget.config?.style?.compactMode || false}
                            onCheckedChange={(checked) => updateConfig({ 
                              style: { 
                                ...editedWidget.config?.style, 
                                compactMode: checked 
                              } 
                            })}
                          />
                          <Label htmlFor="compactMode">Compact Mode</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : widget.type === 'weather' ? (
                <div className="space-y-4">
                  {/* Weather Configuration */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Weather Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={editedWidget.config?.city || ''}
                            onChange={(e) => updateConfig({ city: e.target.value })}
                            placeholder="Enter city name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={editedWidget.config?.country || ''}
                            onChange={(e) => updateConfig({ country: e.target.value })}
                            placeholder="Enter country code (e.g., UK, US)"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="units">Units</Label>
                          <Select
                            value={editedWidget.config?.units || 'metric'}
                            onValueChange={(value) => updateConfig({ units: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="metric">Metric (°C, m/s)</SelectItem>
                              <SelectItem value="imperial">Imperial (°F, mph)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="refreshInterval">Refresh Interval (minutes)</Label>
                          <Input
                            id="refreshInterval"
                            type="number"
                            value={editedWidget.config?.refreshInterval || 30}
                            onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) || 30 })}
                            min="5"
                            max="1440"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showDetails"
                            checked={editedWidget.config?.showDetails !== false}
                            onCheckedChange={(checked) => updateConfig({ showDetails: checked })}
                          />
                          <Label htmlFor="showDetails">Show Details</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showIcon"
                            checked={editedWidget.config?.style?.showIcon !== false}
                            onCheckedChange={(checked) => updateConfig({ 
                              style: { 
                                ...editedWidget.config?.style, 
                                showIcon: checked 
                              } 
                            })}
                          />
                          <Label htmlFor="showIcon">Show Weather Icon</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : widget.type === 'calendar' ? (
                <div className="space-y-4">
                  {/* Calendar Configuration */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Calendar Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="viewMode">View Mode</Label>
                          <Select
                            value={editedWidget.config?.viewMode || 'month'}
                            onValueChange={(value) => updateConfig({ viewMode: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="month">Month View</SelectItem>
                              <SelectItem value="week">Week View</SelectItem>
                              <SelectItem value="day">Day View</SelectItem>
                              <SelectItem value="list">List View</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="startOfWeek">Start of Week</Label>
                          <Select
                            value={editedWidget.config?.startOfWeek || 'monday'}
                            onValueChange={(value) => updateConfig({ startOfWeek: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monday">Monday</SelectItem>
                              <SelectItem value="sunday">Sunday</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="maxEvents">Max Events</Label>
                          <Input
                            id="maxEvents"
                            type="number"
                            value={editedWidget.config?.maxEvents || 100}
                            onChange={(e) => updateConfig({ maxEvents: parseInt(e.target.value) || 100 })}
                            min="10"
                            max="1000"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showWeekends"
                            checked={editedWidget.config?.showWeekends !== false}
                            onCheckedChange={(checked) => updateConfig({ showWeekends: checked })}
                          />
                          <Label htmlFor="showWeekends">Show Weekends</Label>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showTime"
                            checked={editedWidget.config?.style?.showTime !== false}
                            onCheckedChange={(checked) => updateConfig({ 
                              style: { 
                                ...editedWidget.config?.style, 
                                showTime: checked 
                              } 
                            })}
                          />
                          <Label htmlFor="showTime">Show Time</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showLocation"
                            checked={editedWidget.config?.style?.showLocation !== false}
                            onCheckedChange={(checked) => updateConfig({ 
                              style: { 
                                ...editedWidget.config?.style, 
                                showLocation: checked 
                              } 
                            })}
                          />
                          <Label htmlFor="showLocation">Show Location</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : isLineChart ? (
                <div className="space-y-4">
                  {/* Chart Subtype & Data Source */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Chart Type & Data Source</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="chartSubtype">Chart Subtype</Label>
                          <Select
                            value={(config as any)?.chartType || 'line'}
                            onValueChange={(value) => updateConfig({ ...(config || {}), chartType: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="line">Line</SelectItem>
                              <SelectItem value="bar">Bar</SelectItem>
                              <SelectItem value="pie">Pie</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="dataSourceType">Data Source Type</Label>
                          <div className="flex items-center space-x-2 px-3 py-2 border rounded-md bg-muted">
                            <Database className="h-4 w-4" />
                            <span>Table Data</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="dataSourceType">Data Source Type</Label>
                        <div className="flex items-center space-x-2 px-3 py-2 border rounded-md bg-muted">
                          <Database className="h-4 w-4" />
                          <span>Table Data</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Enhanced Table Data Selector */}
                  <EnhancedTableSelector
                    dataSource={config.dataSource as EnhancedDataSource || { 
                      type: 'table',
                      xAxis: { key: '', label: '', type: 'text', columns: [] },
                      yAxis: { key: '', label: '', type: 'number', columns: [] }
                    }}
                    onDataSourceChange={(newDataSource) => {
                      updateConfig({ dataSource: newDataSource });
                    }}
                    widgetType="chart"
                    supportedAxes={['x', 'y']}
                    allowMultiColumn={true}
                    expectedXType="text"
                    expectedYType="number"
                    tenantId={tenantId}
                  />
                  

                  {/* Chart Aggregation Options */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Data Aggregation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="xAxisAggregation">X-Axis Aggregation</Label>
                          <Select
                            value={(config.dataSource as any)?.xAxis?.aggregation || 'none'}
                            onValueChange={(value) => updateConfig({
                              dataSource: {
                                ...config.dataSource,
                                xAxis: {
                                  ...(config.dataSource as any)?.xAxis,
                                  aggregation: value === 'none' ? undefined : value
                                }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Aggregation</SelectItem>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="distinct">Distinct Count</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="yAxisAggregation">Y-Axis Aggregation</Label>
                          <Select
                            value={(config.dataSource as any)?.yAxis?.aggregation || 'sum'}
                            onValueChange={(value) => updateConfig({
                              dataSource: {
                                ...config.dataSource,
                                yAxis: {
                                  ...(config.dataSource as any)?.yAxis,
                                  aggregation: value === 'none' ? undefined : value
                                }
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sum">Sum</SelectItem>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="avg">Average</SelectItem>
                              <SelectItem value="min">Minimum</SelectItem>
                              <SelectItem value="max">Maximum</SelectItem>
                              <SelectItem value="median">Median</SelectItem>
                              <SelectItem value="stddev">Standard Deviation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="groupBy">Group By</Label>
                        <Select
                          value={(config.dataSource as any)?.groupBy || 'none'}
                          onValueChange={(value) => updateConfig({
                            dataSource: {
                              ...config.dataSource,
                              groupBy: value === 'none' ? undefined : value
                            }
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Grouping</SelectItem>
                            <SelectItem value="day">Day</SelectItem>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="quarter">Quarter</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Column Colors (only for Line and Bar charts) */}
                  {((config as any)?.chartType === 'line' || (config as any)?.chartType === 'bar') && (config.dataSource as any)?.yAxis?.columns && (config.dataSource as any).yAxis.columns.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Column Colors</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Customize colors for each Y-axis column
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {(config.dataSource as any).yAxis.columns.map((column: string, index: number) => (
                          <div key={column} className="flex items-center justify-between">
                            <Label htmlFor={`color-${column}`} className="text-sm font-medium">
                              {column}
                            </Label>
                            <ColorPicker
                              value={(config.options?.columnColors?.[column]) || '#3B82F6'}
                              onChange={(color) => debouncedColorUpdate(column, color)}
                              className="w-32"
                            />
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                </div>
              ) : (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4" />
                      <span>Data Source</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editedWidget.type === 'text' && (
                      <div>
                        <Label htmlFor="content">Content</Label>
                        <Textarea
                          id="content"
                          value={editedWidget.config?.content || ''}
                          onChange={(e) => updateConfig({ content: e.target.value })}
                          placeholder="Enter text content"
                          rows={4}
                        />
                      </div>
                    )}

                    {editedWidget.type === 'metric' && (
                      <>
                        <div>
                          <Label htmlFor="metricTableId">Table ID</Label>
                          <Input
                            id="metricTableId"
                            type="number"
                            value={editedWidget.config?.dataSource?.tableId || ''}
                            onChange={(e) => updateConfig({
                              dataSource: {
                                ...editedWidget.config?.dataSource,
                                tableId: parseInt(e.target.value) || 0
                              }
                            })}
                            placeholder="Enter table ID"
                          />
                        </div>

                        <div>
                          <Label htmlFor="metricColumn">Column</Label>
                          <Input
                            id="metricColumn"
                            value={editedWidget.config?.dataSource?.column || ''}
                            onChange={(e) => updateConfig({
                              dataSource: {
                                ...editedWidget.config?.dataSource,
                                column: e.target.value
                              }
                            })}
                            placeholder="Column name"
                          />
                        </div>

                        <div>
                          <Label htmlFor="aggregation">Aggregation</Label>
                          <Select
                            value={editedWidget.config?.dataSource?.aggregation || 'sum'}
                            onValueChange={(value) => updateConfig({
                              dataSource: {
                                ...editedWidget.config?.dataSource,
                                aggregation: value
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sum">Sum</SelectItem>
                              <SelectItem value="count">Count</SelectItem>
                              <SelectItem value="avg">Average</SelectItem>
                              <SelectItem value="min">Minimum</SelectItem>
                              <SelectItem value="max">Maximum</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Style Tab */}
            <TabsContent value="style" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <Palette className="h-4 w-4" />
                    <span>Appearance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLineChart ? (
                    <>
                      {/* Chart Title */}
                      <div>
                        <Label htmlFor="chartTitle">Chart Title</Label>
                        <Input
                          id="chartTitle"
                          value={config.title || ''}
                          onChange={(e) => updateConfig({ title: e.target.value })}
                          placeholder="Chart title"
                        />
                      </div>

                      {/* Chart Options */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="strokeWidth">Stroke Width</Label>
                            <Input
                              id="strokeWidth"
                              type="number"
                              min="1"
                              max="10"
                              value={config.options?.strokeWidth || 2}
                              onChange={(e) => updateConfig({
                                options: {
                                  ...config.options,
                                  strokeWidth: parseInt(e.target.value) || 2
                                }
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="dotSize">Dot Size</Label>
                            <Input
                              id="dotSize"
                              type="number"
                              min="1"
                              max="10"
                              value={config.options?.dotSize || 4}
                              onChange={(e) => updateConfig({
                                options: {
                                  ...config.options,
                                  dotSize: parseInt(e.target.value) || 4
                                }
                              })}
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="curveType">Curve Type</Label>
                          <Select
                            value={config.options?.curveType || 'monotone'}
                            onValueChange={(value) => updateConfig({
                              options: {
                                ...config.options,
                                curveType: value
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monotone">Monotone</SelectItem>
                              <SelectItem value="linear">Linear</SelectItem>
                              <SelectItem value="step">Step</SelectItem>
                              <SelectItem value="stepBefore">Step Before</SelectItem>
                              <SelectItem value="stepAfter">Step After</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="showLegend"
                              checked={config.options?.showLegend !== false}
                              onCheckedChange={(checked) => updateConfig({
                                options: {
                                  ...config.options,
                                  showLegend: checked
                                }
                              })}
                            />
                            <Label htmlFor="showLegend">Show Legend</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="showGrid"
                              checked={config.options?.showGrid !== false}
                              onCheckedChange={(checked) => updateConfig({
                                options: {
                                  ...config.options,
                                  showGrid: checked
                                }
                              })}
                            />
                            <Label htmlFor="showGrid">Show Grid</Label>
                          </div>
                        </div>

                        {/* Colors */}
                        <div>
                          <Label htmlFor="colors">Colors (comma-separated hex codes)</Label>
                          <Input
                            id="colors"
                            value={config.options?.colors?.join(', ') || '#3B82F6'}
                            onChange={(e) => updateConfig({
                              options: {
                                ...config.options,
                                colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                              }
                            })}
                            placeholder="#3B82F6, #EF4444, #10B981"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {editedWidget.type === 'text' && (
                        <>
                          <div>
                            <Label htmlFor="fontSize">Font Size</Label>
                            <Select
                              value={editedWidget.config?.options?.fontSize || 'medium'}
                              onValueChange={(value) => updateConfig({
                                options: {
                                  ...editedWidget.config?.options,
                                  fontSize: value
                                }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="small">Small</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="large">Large</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="textAlign">Text Alignment</Label>
                            <Select
                              value={editedWidget.config?.options?.textAlign || 'left'}
                              onValueChange={(value) => updateConfig({
                                options: {
                                  ...editedWidget.config?.options,
                                  textAlign: value
                                }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Left</SelectItem>
                                <SelectItem value="center">Center</SelectItem>
                                <SelectItem value="right">Right</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {hasChanges ? 'Unsaved changes' : 'No changes'}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
