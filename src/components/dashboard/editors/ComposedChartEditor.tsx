import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { WidgetEditorProps, WidgetEntity } from '@/types/widget';
import { ComposedChartConfig } from '../ComposedChartWidget';
import { TableSelector } from '../TableSelector';
import StyleOptions from './StyleOptions';
import { generateChartColors, getColorPaletteNames, type ColorPalette } from '@/lib/chart-colors';

interface ComposedChartEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: ComposedChartConfig };
}

export default function ComposedChartEditor({ widget, onSave, onCancel, isOpen }: ComposedChartEditorProps) {
  const [config, setConfig] = useState<ComposedChartConfig>({
    title: '',
    dataSource: { type: 'table', tableId: 0, columns: [] },
    xAxis: { key: 'x', label: 'X Axis', type: 'text', columns: [] },
    yAxis: { key: 'y', label: 'Y Axis', type: 'number', columns: [] },
    options: {
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
      colorPalette: 'luxury',
      strokeWidth: 2,
      dotSize: 4,
      curveType: 'monotone',
      barColumns: [],
      lineColumns: [],
      barOpacity: 0.8,
      barRadius: 4,
      showBrush: false,
      showReferenceLine: false,
      referenceValue: 0,
      stackedBars: false,
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
      setAvailableColumns(['category', 'value', 'count', 'percentage', 'name', 'date', 'amount']);
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
      type: 'composed'
    });
  };

  const handleConfigChange = (key: keyof ComposedChartConfig, value: any) => {
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
          <DialogTitle>Configure Composed Chart</DialogTitle>
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

          {/* Composed Chart Specific Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Composed Chart Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="stackedBars"
                    checked={config.options?.stackedBars || false}
                    onCheckedChange={(checked) => handleOptionsChange('stackedBars', checked)}
                  />
                  <Label htmlFor="stackedBars">Stacked Bars</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showBrush"
                    checked={config.options?.showBrush || false}
                    onCheckedChange={(checked) => handleOptionsChange('showBrush', checked)}
                  />
                  <Label htmlFor="showBrush">Show Brush (Zoom)</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showReferenceLine"
                    checked={config.options?.showReferenceLine || false}
                    onCheckedChange={(checked) => handleOptionsChange('showReferenceLine', checked)}
                  />
                  <Label htmlFor="showReferenceLine">Show Reference Line</Label>
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

            {/* Curve type selection */}
            <div>
              <Label htmlFor="curveType">Line Curve Type</Label>
              <Select 
                value={config.options?.curveType || 'monotone'} 
                onValueChange={(value) => handleOptionsChange('curveType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select curve type" />
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

            {/* Sliders for numeric values */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Stroke Width: {config.options?.strokeWidth || 2}</Label>
                <Slider
                  value={[config.options?.strokeWidth || 2]}
                  onValueChange={([value]) => handleOptionsChange('strokeWidth', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Dot Size: {config.options?.dotSize || 4}</Label>
                <Slider
                  value={[config.options?.dotSize || 4]}
                  onValueChange={([value]) => handleOptionsChange('dotSize', value)}
                  min={2}
                  max={12}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Bar Opacity: {((config.options?.barOpacity || 0.8) * 100).toFixed(0)}%</Label>
                <Slider
                  value={[config.options?.barOpacity || 0.8]}
                  onValueChange={([value]) => handleOptionsChange('barOpacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Reference line value */}
            {config.options?.showReferenceLine && (
              <div>
                <Label htmlFor="referenceValue">Reference Line Value</Label>
                <input
                  id="referenceValue"
                  type="number"
                  value={config.options?.referenceValue || 0}
                  onChange={(e) => handleOptionsChange('referenceValue', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reference value"
                />
              </div>
            )}
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
