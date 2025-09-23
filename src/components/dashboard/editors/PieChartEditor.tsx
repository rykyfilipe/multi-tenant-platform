import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, PieChartConfig, WidgetEntity } from '@/types/widget';
import { TableSelector } from '../TableSelector';
import StyleOptions from './StyleOptions';
import { generateChartColors, getColorPaletteNames, type ColorPalette } from '@/lib/chart-colors';

interface PieChartEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: PieChartConfig };
}

export default function PieChartEditor({ widget, onSave, onCancel, isOpen }: PieChartEditorProps) {
  const [config, setConfig] = useState<PieChartConfig>({
    labelColumn: '',
    valueColumn: '',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
    colorPalette: 'luxury', // Default to luxury palette
    showLegend: true,
    showPercentage: true,
    innerRadius: 0,
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  useEffect(() => {
    if (widget.dataSource?.type === 'table') {
      setAvailableColumns(['category', 'value', 'count', 'percentage', 'name']);
    } else {
      setAvailableColumns([]);
    }
  }, [widget.dataSource]);

  const handleSave = () => {
    if (!config.labelColumn || !config.valueColumn) {
      alert('Please select both label and value columns');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'pie'
    });
  };

  const handleConfigChange = (key: keyof PieChartConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
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
          <DialogTitle>Configure Pie Chart</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Data Source Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Source</h3>
            <TableSelector
              dataSource={widget.dataSource || { type: 'table', tableId: 0, columns: [] }}
              onDataSourceChange={(dataSource) => {
                // Update widget dataSource - cast to widget DataSource type
                widget.dataSource = dataSource as any;
                // Update config with selected columns
                if (dataSource.xColumns && dataSource.xColumns.length > 0) {
                  handleConfigChange('labelColumn', dataSource.xColumns[0]);
                }
                if (dataSource.yColumns && dataSource.yColumns.length > 0) {
                  handleConfigChange('valueColumn', dataSource.yColumns[0]);
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
                <Label htmlFor="labelColumn">Label Column</Label>
                <Select value={config.labelColumn} onValueChange={(value) => handleConfigChange('labelColumn', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select label column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valueColumn">Value Column</Label>
                <Select value={config.valueColumn} onValueChange={(value) => handleConfigChange('valueColumn', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Color Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Color Configuration</h3>
            <div>
              <Label htmlFor="colorPalette">Color Palette</Label>
              <Select 
                value={config.colorPalette || 'luxury'} 
                onValueChange={(value: ColorPalette) => {
                  handleConfigChange('colorPalette', value);
                  // Generate preview colors
                  const previewColors = generateChartColors(4, value);
                  handleConfigChange('colors', previewColors);
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
            
            {/* Color preview */}
            {config.colors && (
              <div className="space-y-2">
                <Label>Color Preview</Label>
                <div className="flex space-x-2">
                  {config.colors.slice(0, 6).map((color, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}
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
                id="showPercentage"
                checked={config.showPercentage}
                onCheckedChange={(checked) => handleConfigChange('showPercentage', checked)}
              />
              <Label htmlFor="showPercentage">Show Percentage</Label>
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
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}