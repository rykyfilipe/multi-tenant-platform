'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Settings, Palette, BarChart3, Database, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataEditor } from './DataEditor';
import { FilterBuilder } from './FilterBuilder';
import { TableSelector } from './TableSelector';
import { LineChartConfig, DataSource, ChartDataPoint } from './LineChartWidget';
import { FilterConfig } from '@/types/filtering-enhanced';
import { useSchemaCache } from '@/hooks/useSchemaCache';
import { api } from '@/lib/api-client';
import { BaseWidget, WidgetEditorProps, WidgetType, WidgetConfig } from '@/types/widgets';

export function WidgetEditor({ widget, onClose, onSave, tenantId, databaseId }: WidgetEditorProps) {
  const [editedWidget, setEditedWidget] = useState<BaseWidget>({ ...widget });
  const [hasChanges, setHasChanges] = useState(false);
  
  // Use schema cache for tables and columns
  const { tables, tablesLoading, loadTables } = useSchemaCache(tenantId, databaseId);

  // Auto-load tables when editor opens
  useEffect(() => {
    if (!tables && !tablesLoading) {
      console.log('[WidgetEditor] Auto-loading tables when editor opens');
      loadTables();
    }
  }, [tables, tablesLoading, loadTables]);

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
  const getDefaultConfig = (type: WidgetType) => {
    switch (type) {
      case 'chart':
        return {
          title: '',
          dataSource: {
            type: 'manual' as const,
            manualData: [
              { x: 'Jan', y: 100 },
              { x: 'Feb', y: 150 },
              { x: 'Mar', y: 200 },
              { x: 'Apr', y: 180 },
              { x: 'May', y: 250 },
            ]
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
            type: 'table' as const,
            tableId: null,
            columns: []
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
            type: 'table' as const,
            tableId: null,
            column: '',
            aggregation: 'sum'
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
          dataSource: {
            type: 'manual' as const,
            content: 'Enter your text here...'
          },
          options: {
            fontSize: 16,
            fontWeight: 'normal',
            color: '#000000',
            textAlign: 'left'
          }
        };
      default:
        return {};
    }
  };

  const updateWidget = (updates: Partial<BaseWidget>) => {
    setEditedWidget(prev => {
      const newWidget = { ...prev, ...updates };
      
      // If type changed, replace entire widget with default config for new type
      if (updates.type && updates.type !== prev.type) {
        console.log('[WidgetEditor] Type changed from', prev.type, 'to', updates.type);
        return {
          ...newWidget,
          config: getDefaultConfig(updates.type as WidgetType),
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
      console.log('[WidgetEditor] Config updated:', configUpdates);
      return {
        ...prev,
        config: newConfig
      };
    });
  };

  const updatePosition = (positionUpdates: Partial<{ x: number; y: number; width: number; height: number }>) => {
    setEditedWidget(prev => ({
      ...prev,
      position: { ...(prev.position || {}), ...positionUpdates }
    }));
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
    dataSource: { type: 'manual', manualData: [] },
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
                      onValueChange={(value) => updateWidget({ type: value as WidgetType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chart">Chart</SelectItem>
                        <SelectItem value="table">Table</SelectItem>
                        <SelectItem value="metric">Metric</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
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
                        value={editedWidget.position?.width || 8}
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
                        value={editedWidget.position?.height || 6}
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
                  {/* Table Configuration with integrated TableSelector */}
                  <TableSelector
                    tenantId={tenantId || 1}
                    selectedTableId={editedWidget.config?.dataSource?.tableId || undefined}
                    selectedColumns={editedWidget.config?.dataSource?.columns || []}
                    onColumnsChange={(columns) => updateConfig({
                      dataSource: {
                        ...editedWidget.config?.dataSource,
                        columns: columns
                      }
                    })}
                    filters={editedWidget.config?.dataSource?.filters || []}
                    onFiltersChange={(filters) => updateConfig({
                      dataSource: {
                        ...editedWidget.config?.dataSource,
                        filters: filters
                      }
                    })}
                    onTableChange={(tableId) => {
                      updateConfig({
                        dataSource: {
                          ...editedWidget.config?.dataSource,
                          tableId: tableId,
                          columns: []
                        }
                      });
                    }}
                    onColumnsChange={(columns) => updateConfig({
                      dataSource: {
                        ...editedWidget.config?.dataSource,
                        columns: columns
                      }
                    })}
                    onColumnXChange={() => {}}
                    onColumnYChange={() => {}}
                    loadTables={loadTables}
                  />

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
                  {/* KPI Configuration with integrated TableSelector */}
                  <TableSelector
                    tenantId={tenantId || 1}
                    selectedTableId={editedWidget.config?.dataSource?.tableId || undefined}
                    selectedColumnY={editedWidget.config?.dataSource?.column || ''}
                    onColumnYChange={(column) => updateConfig({
                      dataSource: {
                        ...editedWidget.config?.dataSource,
                        column: column,
                        type: 'table'
                      }
                    })}
                    filters={editedWidget.config?.dataSource?.filters || []}
                    onFiltersChange={(filters) => updateConfig({
                      dataSource: {
                        ...editedWidget.config?.dataSource,
                        filters: filters
                      }
                    })}
                    onTableChange={(tableId) => {
                      updateConfig({
                        dataSource: {
                          ...editedWidget.config?.dataSource,
                          tableId: tableId,
                          type: 'table'
                        }
                      });
                    }}
                    onColumnXChange={() => {}}
                    expectedYType="number"
                    loadTables={loadTables}
                  />

                  {/* Aggregation Options */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Aggregation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="aggregation">Aggregation Function</Label>
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
                            <SelectItem value="median">Median</SelectItem>
                            <SelectItem value="stddev">Standard Deviation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

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
                          <Select
                            value={config.dataSource?.type || 'manual'}
                            onValueChange={(value) => handleDataSourceChange({
                              ...config.dataSource,
                              type: value as 'manual' | 'table'
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4" />
                                  <span>Manual Data</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="table">
                                <div className="flex items-center space-x-2">
                                  <Database className="h-4 w-4" />
                                  <span>Table Data</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="dataSourceType">Data Source Type</Label>
                        <Select
                          value={config.dataSource?.type || 'manual'}
                          onValueChange={(value) => handleDataSourceChange({
                            ...config.dataSource,
                            type: value as 'manual' | 'table'
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span>Manual Data</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="table">
                              <div className="flex items-center space-x-2">
                                <Database className="h-4 w-4" />
                                <span>Table Data</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Manual Data Editor */}
                  {config.dataSource?.type === 'manual' && (
                    <DataEditor
                      data={config.dataSource.manualData || []}
                      columns={[
                        { name: config.xAxis?.key || 'x', type: 'string' },
                        { name: config.yAxis?.key || 'y', type: 'number' }
                      ]}
                      onDataChange={handleManualDataChange}
                      onSave={() => {}}
                    />
                  )}

                  {/* Table Data Selector */}
                  {config.dataSource?.type === 'table' && (
                    <TableSelector
                      tenantId={tenantId || 1}
                      selectedTableId={config.dataSource.tableId || undefined}
                      selectedColumnX={config.dataSource.columnX}
                      selectedColumnY={config.dataSource.columnY}
                      filters={config.dataSource?.filters || []}
                      onFiltersChange={handleFiltersChange}
                      onTableChange={handleTableChange}
                      onColumnXChange={handleColumnXChange}
                      onColumnYChange={handleColumnYChange}
                      expectedXType="text"
                      expectedYType="number"
                      loadTables={loadTables}
                    />
                  )}

                  {/* Chart Aggregation Options */}
                  {config.dataSource?.type === 'table' && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Data Aggregation</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="xAxisAggregation">X-Axis Aggregation</Label>
                            <Select
                              value={config.xAxis?.aggregation || 'none'}
                              onValueChange={(value) => handleAxisChange('xAxis', { aggregation: value })}
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
                              value={config.yAxis?.aggregation || 'sum'}
                              onValueChange={(value) => handleAxisChange('yAxis', { aggregation: value })}
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
                            value={config.dataSource?.groupBy || 'none'}
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
                  )}

                  {/* Axis Configuration */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Axis Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="xAxisKey">X-Axis Key</Label>
                          <Input
                            id="xAxisKey"
                            value={config.xAxis?.key || ''}
                            onChange={(e) => handleAxisChange('xAxis', { key: e.target.value })}
                            placeholder="X-axis data key"
                          />
                        </div>
                        <div>
                          <Label htmlFor="xAxisLabel">X-Axis Label</Label>
                          <Input
                            id="xAxisLabel"
                            value={config.xAxis?.label || ''}
                            onChange={(e) => handleAxisChange('xAxis', { label: e.target.value })}
                            placeholder="X-axis label"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="yAxisKey">Y-Axis Key</Label>
                          <Input
                            id="yAxisKey"
                            value={config.yAxis?.key || ''}
                            onChange={(e) => handleAxisChange('yAxis', { key: e.target.value })}
                            placeholder="Y-axis data key"
                          />
                        </div>
                        <div>
                          <Label htmlFor="yAxisLabel">Y-Axis Label</Label>
                          <Input
                            id="yAxisLabel"
                            value={config.yAxis?.label || ''}
                            onChange={(e) => handleAxisChange('yAxis', { label: e.target.value })}
                            placeholder="Y-axis label"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
