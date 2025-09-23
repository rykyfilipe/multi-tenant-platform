import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { WidgetEditorProps, WidgetEntity } from '@/types/widget';
import { InteractivePieChartConfig } from '../InteractivePieChartWidget';
import { TableSelector } from '../TableSelector';
import StyleOptions from './StyleOptions';
import { generateChartColors, getColorPaletteNames, type ColorPalette } from '@/lib/chart-colors';

interface InteractivePieChartEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: InteractivePieChartConfig };
}

export default function InteractivePieChartEditor({ widget, onSave, onCancel, isOpen }: InteractivePieChartEditorProps) {
  const [config, setConfig] = useState<InteractivePieChartConfig>({
    title: '',
    dataSource: { type: 'table', tableId: 0, columns: [] },
    xAxis: { key: 'x', label: 'X Axis', type: 'text', columns: [] },
    yAxis: { key: 'y', label: 'Y Axis', type: 'number', columns: [] },
    options: {
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
      colorPalette: 'luxury',
      strokeWidth: 2,
      innerRadius: 0,
      outerRadius: 80,
      paddingAngle: 2,
      stroke: '#ffffff',
      showActiveShape: true,
      showPercentage: true,
      showValue: true,
      labelPosition: 'outside',
      animationDuration: 300,
      hoverScale: 1.1,
      showLegend: true,
      showDataSummary: false,
      animation: true,
      backgroundColor: 'transparent',
      borderRadius: 'lg'
    },
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  useEffect(() => {
    if (widget.dataSource?.type === 'table') {
      setAvailableColumns(['category', 'value', 'count', 'percentage', 'name', 'amount']);
    } else {
      setAvailableColumns([]);
    }
  }, [widget.dataSource]);

  const handleSave = () => {
    if (!config.dataSource || config.dataSource.tableId === 0) {
      alert('Please select a table and configure columns');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'interactive-pie'
    });
  };

  const handleConfigChange = (key: keyof InteractivePieChartConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleOptionsChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [key]: value
      }
    }));
  };

  const handleStyleChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      options: {
        ...prev.options,
        style: {
          ...prev.options?.style,
          [key]: value
        }
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Interactive Pie Chart</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data Source Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Source</h3>
            <TableSelector
              dataSource={widget.dataSource || { type: 'table', tableId: 0, columns: [] }}
              onDataSourceChange={(dataSource) => {
                widget.dataSource = dataSource as any;
                if (dataSource.xColumns && dataSource.xColumns.length > 0) {
                  handleConfigChange('xAxis', { 
                    key: dataSource.xColumns[0], 
                    label: dataSource.xColumns[0], 
                    type: 'category', 
                    columns: dataSource.xColumns 
                  });
                }
                if (dataSource.yColumns && dataSource.yColumns.length > 0) {
                  handleConfigChange('yAxis', { 
                    key: dataSource.yColumns[0], 
                    label: dataSource.yColumns[0], 
                    type: 'number', 
                    columns: dataSource.yColumns 
                  });
                }
              }}
              widgetType="chart"
              supportedAxes={['x', 'y']}
              expectedXType="text"
              expectedYType="number"
            />
          </div>

          {/* Chart Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Chart Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Chart Title</Label>
                <input
                  id="title"
                  type="text"
                  value={config.title || ''}
                  onChange={(e) => handleConfigChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter chart title"
                />
              </div>
            </div>
          </div>

          {/* Color Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Color Configuration</h3>
            <div>
              <Label htmlFor="colorPalette">Color Palette</Label>
              <Select 
                value={config.options?.colorPalette || 'luxury'} 
                onValueChange={(value: ColorPalette) => {
                  handleOptionsChange('colorPalette', value);
                  const previewColors = generateChartColors(4, value);
                  handleOptionsChange('colors', previewColors);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select color palette" />
                </SelectTrigger>
                <SelectContent>
                  {getColorPaletteNames().map(palette => (
                    <SelectItem key={palette.key} value={palette.key}>
                      <div className="flex items-center space-x-2">
                        <span>{palette.name}</span>
                        <span className="text-xs text-muted-foreground">- {palette.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Interactive Pie Chart Specific Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Interactive Pie Chart Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showActiveShape"
                    checked={config.options?.showActiveShape !== false}
                    onCheckedChange={(checked) => handleOptionsChange('showActiveShape', checked)}
                  />
                  <Label htmlFor="showActiveShape">Show Active Shape</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showPercentage"
                    checked={config.options?.showPercentage !== false}
                    onCheckedChange={(checked) => handleOptionsChange('showPercentage', checked)}
                  />
                  <Label htmlFor="showPercentage">Show Percentage</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showValue"
                    checked={config.options?.showValue !== false}
                    onCheckedChange={(checked) => handleOptionsChange('showValue', checked)}
                  />
                  <Label htmlFor="showValue">Show Value</Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showLegend"
                    checked={config.options?.showLegend !== false}
                    onCheckedChange={(checked) => handleOptionsChange('showLegend', checked)}
                  />
                  <Label htmlFor="showLegend">Show Legend</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showDataSummary"
                    checked={config.options?.showDataSummary || false}
                    onCheckedChange={(checked) => handleOptionsChange('showDataSummary', checked)}
                  />
                  <Label htmlFor="showDataSummary">Show Data Summary</Label>
                </div>
              </div>
            </div>

            {/* Label position selection */}
            <div>
              <Label htmlFor="labelPosition">Label Position</Label>
              <Select 
                value={config.options?.labelPosition || 'outside'} 
                onValueChange={(value) => handleOptionsChange('labelPosition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select label position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inside">Inside</SelectItem>
                  <SelectItem value="outside">Outside</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sliders for numeric values */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Inner Radius: {config.options?.innerRadius || 0}</Label>
                <Slider
                  value={[config.options?.innerRadius || 0]}
                  onValueChange={([value]) => handleOptionsChange('innerRadius', value)}
                  min={0}
                  max={100}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Outer Radius: {config.options?.outerRadius || 80}</Label>
                <Slider
                  value={[config.options?.outerRadius || 80]}
                  onValueChange={([value]) => handleOptionsChange('outerRadius', value)}
                  min={50}
                  max={150}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Padding Angle: {config.options?.paddingAngle || 2}</Label>
                <Slider
                  value={[config.options?.paddingAngle || 2]}
                  onValueChange={([value]) => handleOptionsChange('paddingAngle', value)}
                  min={0}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Hover Scale: {config.options?.hoverScale || 1.1}</Label>
                <Slider
                  value={[config.options?.hoverScale || 1.1]}
                  onValueChange={([value]) => handleOptionsChange('hoverScale', value)}
                  min={1}
                  max={1.5}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Animation duration */}
            <div>
              <Label>Animation Duration: {config.options?.animationDuration || 300}ms</Label>
              <Slider
                value={[config.options?.animationDuration || 300]}
                onValueChange={([value]) => handleOptionsChange('animationDuration', value)}
                min={100}
                max={1000}
                step={50}
                className="mt-2"
              />
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Style Options</h3>
            <StyleOptions
              style={config.options?.style || {}}
              onStyleChange={handleStyleChange}
              widgetType="chart"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
