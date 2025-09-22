/**
 * Line Chart Widget Editor
 * Configuration editor for line chart widgets
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { WidgetEditorProps, LineChartConfig, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';

interface LineChartEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: LineChartConfig };
}

export default function LineChartEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen 
}: LineChartEditorProps) {
  const [config, setConfig] = useState<LineChartConfig>({
    xAxis: '',
    yAxis: '',
    series: [],
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
    showLegend: true,
    showGrid: true,
    curveType: 'linear',
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Load available columns from data source
  useEffect(() => {
    if (widget.dataSource?.type === 'table') {
      // In a real implementation, this would fetch column names from the table
      setAvailableColumns(['date', 'value', 'category', 'sales', 'revenue', 'profit']);
    } else {
      setAvailableColumns([]);
    }
  }, [widget.dataSource]);

  const handleSave = () => {
    if (!config.xAxis || !config.yAxis) {
      alert('Please select both X and Y axis columns');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'line'
    });
  };

  const handleConfigChange = (key: keyof LineChartConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStyleChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [key]: value
      }
    }));
  };

  const addSeries = () => {
    setConfig(prev => ({
      ...prev,
      series: [...(prev.series || []), '']
    }));
  };

  const removeSeries = (index: number) => {
    setConfig(prev => ({
      ...prev,
      series: prev.series?.filter((_, i) => i !== index) || []
    }));
  };

  const updateSeries = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      series: prev.series?.map((item, i) => i === index ? value : item) || []
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Line Chart</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="xAxis">X Axis Column</Label>
                <Select value={config.xAxis} onValueChange={(value) => handleConfigChange('xAxis', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select X axis column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="yAxis">Y Axis Column</Label>
                <Select value={config.yAxis} onValueChange={(value) => handleConfigChange('yAxis', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Y axis column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Series Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Series Configuration</h3>
              <Button onClick={addSeries} size="sm">
                Add Series
              </Button>
            </div>

            {config.series?.map((series, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select value={series} onValueChange={(value) => updateSeries(index, value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select series column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => removeSeries(index)}
                  variant="outline"
                  size="sm"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Visual Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Visual Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="curveType">Curve Type</Label>
                <Select value={config.curveType} onValueChange={(value: any) => handleConfigChange('curveType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="monotone">Monotone</SelectItem>
                    <SelectItem value="step">Step</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showLegend"
                  checked={config.showLegend}
                  onCheckedChange={(checked) => handleConfigChange('showLegend', checked)}
                />
                <Label htmlFor="showLegend">Show Legend</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showGrid"
                  checked={config.showGrid}
                  onCheckedChange={(checked) => handleConfigChange('showGrid', checked)}
                />
                <Label htmlFor="showGrid">Show Grid</Label>
              </div>
            </div>
          </div>

          {/* Color Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Colors</h3>
            <div className="grid grid-cols-4 gap-2">
              {config.colors?.map((color, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => {
                      const newColors = [...(config.colors || [])];
                      newColors[index] = e.target.value;
                      handleConfigChange('colors', newColors);
                    }}
                    className="w-8 h-8 rounded border"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Style Options</h3>
            <StyleOptions
              style={config.style || {}}
              onStyleChange={handleStyleChange}
              widgetType="chart"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
