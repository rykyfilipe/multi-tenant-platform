import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { WidgetEditorProps, WidgetEntity } from '@/types/widget';
import { ScatterChartConfig } from '../ScatterChartWidget';
import { TableSelector } from '../TableSelector';
import StyleOptions from './StyleOptions';
import { generateChartColors, getColorPaletteNames, type ColorPalette } from '@/lib/chart-colors';

interface ScatterChartEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: ScatterChartConfig };
}

export default function ScatterChartEditor({ widget, onSave, onCancel, isOpen }: ScatterChartEditorProps) {
  const [config, setConfig] = useState<ScatterChartConfig>({
    title: '',
    dataSource: { type: 'table', tableId: 0, columns: [] },
    xAxis: { key: 'x', label: 'X Axis', type: 'number', columns: [] },
    yAxis: { key: 'y', label: 'Y Axis', type: 'number', columns: [] },
    options: {
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
      colorPalette: 'luxury',
      dotSize: 6,
      dotOpacity: 0.8,
      strokeWidth: 1,
      stroke: '#3b82f6',
      showReferenceLine: false,
      referenceValue: { x: 0, y: 0 },
      showReferenceDot: false,
      referenceDot: { x: 0, y: 0, label: 'Reference' },
      fillOpacity: 0.8,
      hoverScale: 1.2,
      showTrendLine: false,
      trendLineColor: '#3b82f6',
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
      setAvailableColumns(['x', 'y', 'value', 'score', 'rating', 'price', 'quantity']);
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
      type: 'scatter'
    });
  };

  const handleConfigChange = (key: keyof ScatterChartConfig, value: any) => {
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
          <DialogTitle>Configure Scatter Chart</DialogTitle>
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
                    type: 'number', 
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
              expectedXType="number"
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

          {/* Scatter Chart Specific Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Scatter Chart Options</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showReferenceLine"
                    checked={config.options?.showReferenceLine || false}
                    onCheckedChange={(checked) => handleOptionsChange('showReferenceLine', checked)}
                  />
                  <Label htmlFor="showReferenceLine">Show Reference Line</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showReferenceDot"
                    checked={config.options?.showReferenceDot || false}
                    onCheckedChange={(checked) => handleOptionsChange('showReferenceDot', checked)}
                  />
                  <Label htmlFor="showReferenceDot">Show Reference Dot</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showTrendLine"
                    checked={config.options?.showTrendLine || false}
                    onCheckedChange={(checked) => handleOptionsChange('showTrendLine', checked)}
                  />
                  <Label htmlFor="showTrendLine">Show Trend Line</Label>
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

            {/* Sliders for numeric values */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Dot Size: {config.options?.dotSize || 6}</Label>
                <Slider
                  value={[config.options?.dotSize || 6]}
                  onValueChange={([value]) => handleOptionsChange('dotSize', value)}
                  min={2}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Dot Opacity: {((config.options?.dotOpacity || 0.8) * 100).toFixed(0)}%</Label>
                <Slider
                  value={[config.options?.dotOpacity || 0.8]}
                  onValueChange={([value]) => handleOptionsChange('dotOpacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Fill Opacity: {((config.options?.fillOpacity || 0.8) * 100).toFixed(0)}%</Label>
                <Slider
                  value={[config.options?.fillOpacity || 0.8]}
                  onValueChange={([value]) => handleOptionsChange('fillOpacity', value)}
                  min={0.1}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Hover Scale: {config.options?.hoverScale || 1.2}</Label>
                <Slider
                  value={[config.options?.hoverScale || 1.2]}
                  onValueChange={([value]) => handleOptionsChange('hoverScale', value)}
                  min={1}
                  max={2}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Reference line values */}
            {config.options?.showReferenceLine && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="referenceX">Reference Line X</Label>
                  <input
                    id="referenceX"
                    type="number"
                    value={config.options?.referenceValue?.x || 0}
                    onChange={(e) => handleOptionsChange('referenceValue', { 
                      ...config.options?.referenceValue, 
                      x: Number(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="referenceY">Reference Line Y</Label>
                  <input
                    id="referenceY"
                    type="number"
                    value={config.options?.referenceValue?.y || 0}
                    onChange={(e) => handleOptionsChange('referenceValue', { 
                      ...config.options?.referenceValue, 
                      y: Number(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Reference dot values */}
            {config.options?.showReferenceDot && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="refDotX">Reference Dot X</Label>
                  <input
                    id="refDotX"
                    type="number"
                    value={config.options?.referenceDot?.x || 0}
                    onChange={(e) => handleOptionsChange('referenceDot', { 
                      ...config.options?.referenceDot, 
                      x: Number(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="refDotY">Reference Dot Y</Label>
                  <input
                    id="refDotY"
                    type="number"
                    value={config.options?.referenceDot?.y || 0}
                    onChange={(e) => handleOptionsChange('referenceDot', { 
                      ...config.options?.referenceDot, 
                      y: Number(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="refDotLabel">Reference Dot Label</Label>
                  <input
                    id="refDotLabel"
                    type="text"
                    value={config.options?.referenceDot?.label || 'Reference'}
                    onChange={(e) => handleOptionsChange('referenceDot', { 
                      ...config.options?.referenceDot, 
                      label: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Trend line color */}
            {config.options?.showTrendLine && (
              <div>
                <Label htmlFor="trendLineColor">Trend Line Color</Label>
                <input
                  id="trendLineColor"
                  type="color"
                  value={config.options?.trendLineColor || '#3b82f6'}
                  onChange={(e) => handleOptionsChange('trendLineColor', e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
