/**
 * Bar Chart Widget Editor
 * Configuration editor for bar chart widgets
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, BarChartConfig, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';

interface BarChartEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: BarChartConfig };
}

export default function BarChartEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen 
}: BarChartEditorProps) {
  const [config, setConfig] = useState<BarChartConfig>({
    xAxis: '',
    yAxis: '',
    series: [],
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
    showLegend: true,
    orientation: 'vertical',
    stacked: false,
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  useEffect(() => {
    if (widget.dataSource?.type === 'table') {
      setAvailableColumns(['category', 'value', 'sales', 'revenue', 'profit', 'date', 'region']);
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
      type: 'bar'
    });
  };

  const handleConfigChange = (key: keyof BarChartConfig, value: any) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Bar Chart</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orientation">Orientation</Label>
              <Select value={config.orientation} onValueChange={(value: any) => handleConfigChange('orientation', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
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
                id="stacked"
                checked={config.stacked}
                onCheckedChange={(checked) => handleConfigChange('stacked', checked)}
              />
              <Label htmlFor="stacked">Stacked Bars</Label>
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