'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Settings, Palette, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Widget {
  id: number;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: any;
  isVisible: boolean;
  order: number;
}

interface WidgetEditorProps {
  widget: Widget;
  onClose: () => void;
  onSave: (widget: Widget) => void;
}

export function WidgetEditor({ widget, onClose, onSave }: WidgetEditorProps) {
  const [editedWidget, setEditedWidget] = useState<Widget>({ ...widget });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(JSON.stringify(editedWidget) !== JSON.stringify(widget));
  }, [editedWidget, widget]);

  const handleSave = () => {
    onSave(editedWidget);
    onClose();
  };

  const updateWidget = (updates: Partial<Widget>) => {
    setEditedWidget(prev => ({ ...prev, ...updates }));
  };

  const updateConfig = (configUpdates: any) => {
    setEditedWidget(prev => ({
      ...prev,
      config: { ...prev.config, ...configUpdates }
    }));
  };

  const updatePosition = (positionUpdates: Partial<{ x: number; y: number; width: number; height: number }>) => {
    setEditedWidget(prev => ({
      ...prev,
      position: { ...prev.position, ...positionUpdates }
    }));
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 h-full w-96 bg-white border-l border-gray-200 shadow-xl z-50"
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
                        value={editedWidget.position.x}
                        onChange={(e) => updatePosition({ x: parseInt(e.target.value) || 0 })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="y">Y Position</Label>
                      <Input
                        id="y"
                        type="number"
                        value={editedWidget.position.y}
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
                        value={editedWidget.position.width}
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
                        value={editedWidget.position.height}
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
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Data Source</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editedWidget.type === 'chart' && (
                    <>
                      <div>
                        <Label htmlFor="chartType">Chart Type</Label>
                        <Select
                          value={editedWidget.config?.chartType || 'line'}
                          onValueChange={(value) => updateConfig({ chartType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="line">Line Chart</SelectItem>
                            <SelectItem value="bar">Bar Chart</SelectItem>
                            <SelectItem value="pie">Pie Chart</SelectItem>
                            <SelectItem value="area">Area Chart</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="tableId">Table ID</Label>
                        <Input
                          id="tableId"
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

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="columnX">X Column</Label>
                          <Input
                            id="columnX"
                            value={editedWidget.config?.dataSource?.columnX || ''}
                            onChange={(e) => updateConfig({
                              dataSource: {
                                ...editedWidget.config?.dataSource,
                                columnX: e.target.value
                              }
                            })}
                            placeholder="X axis column"
                          />
                        </div>
                        <div>
                          <Label htmlFor="columnY">Y Column</Label>
                          <Input
                            id="columnY"
                            value={editedWidget.config?.dataSource?.columnY || ''}
                            onChange={(e) => updateConfig({
                              dataSource: {
                                ...editedWidget.config?.dataSource,
                                columnY: e.target.value
                              }
                            })}
                            placeholder="Y axis column"
                          />
                        </div>
                      </div>
                    </>
                  )}

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
                  {editedWidget.type === 'chart' && (
                    <>
                      <div>
                        <Label htmlFor="chartTitle">Chart Title</Label>
                        <Input
                          id="chartTitle"
                          value={editedWidget.config?.options?.title || ''}
                          onChange={(e) => updateConfig({
                            options: {
                              ...editedWidget.config?.options,
                              title: e.target.value
                            }
                          })}
                          placeholder="Chart title"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="xAxisLabel">X Axis Label</Label>
                          <Input
                            id="xAxisLabel"
                            value={editedWidget.config?.options?.xAxisLabel || ''}
                            onChange={(e) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                xAxisLabel: e.target.value
                              }
                            })}
                            placeholder="X axis label"
                          />
                        </div>
                        <div>
                          <Label htmlFor="yAxisLabel">Y Axis Label</Label>
                          <Input
                            id="yAxisLabel"
                            value={editedWidget.config?.options?.yAxisLabel || ''}
                            onChange={(e) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                yAxisLabel: e.target.value
                              }
                            })}
                            placeholder="Y axis label"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showLegend"
                            checked={editedWidget.config?.options?.showLegend !== false}
                            onCheckedChange={(checked) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                showLegend: checked
                              }
                            })}
                          />
                          <Label htmlFor="showLegend">Show Legend</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="showGrid"
                            checked={editedWidget.config?.options?.showGrid !== false}
                            onCheckedChange={(checked) => updateConfig({
                              options: {
                                ...editedWidget.config?.options,
                                showGrid: checked
                              }
                            })}
                          />
                          <Label htmlFor="showGrid">Show Grid</Label>
                        </div>
                      </div>
                    </>
                  )}

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
