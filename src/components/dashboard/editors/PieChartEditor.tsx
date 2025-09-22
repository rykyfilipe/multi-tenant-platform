import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, PieChartConfig } from '@/types/widget';

interface PieChartEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: PieChartConfig };
}

export default function PieChartEditor({ widget, onSave, onCancel, isOpen }: PieChartEditorProps) {
  const [config, setConfig] = useState<PieChartConfig>({
    labelColumn: '',
    valueColumn: '',
    colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'],
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

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Pie Chart</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}