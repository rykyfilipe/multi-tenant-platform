/**
 * Metric Widget Editor
 * Configuration editor for metric widgets
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, MetricConfig, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';

interface MetricEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: MetricConfig };
}

export default function MetricEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen 
}: MetricEditorProps) {
  const [config, setConfig] = useState<MetricConfig>({
    valueColumn: '',
    comparisonColumn: '',
    format: 'number',
    title: '',
    subtitle: '',
    showTrend: false,
    style: {
      layout: 'card',
      size: 'medium',
      alignment: 'center',
      valueStyle: 'default',
      titleStyle: 'default',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6',
      borderColor: '#e5e7eb',
      borderRadius: 'medium',
      shadow: 'small',
      padding: 'comfortable'
    },
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Load available columns from data source
  useEffect(() => {
    if (widget.dataSource?.type === 'table') {
      setAvailableColumns(['value', 'sales', 'revenue', 'profit', 'count', 'percentage']);
    } else {
      setAvailableColumns([]);
    }
  }, [widget.dataSource]);

  const handleSave = () => {
    if (!config.valueColumn) {
      alert('Please select a value column');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'metric'
    });
  };

  const handleConfigChange = (key: keyof MetricConfig, value: any) => {
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
          <DialogTitle>Configure Metric</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Data Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valueColumn">Value Column *</Label>
                <Select value={config.valueColumn} onValueChange={(value) => handleConfigChange('valueColumn', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value column" />
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
                <Label htmlFor="comparisonColumn">Comparison Column</Label>
                <Select value={config.comparisonColumn || ''} onValueChange={(value) => handleConfigChange('comparisonColumn', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select comparison column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
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

          {/* Display Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  value={config.title || ''}
                  onChange={(e) => handleConfigChange('title', e.target.value)}
                  placeholder="Enter metric title"
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  value={config.subtitle || ''}
                  onChange={(e) => handleConfigChange('subtitle', e.target.value)}
                  placeholder="Enter metric subtitle"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="format">Format</Label>
                <Select value={config.format} onValueChange={(value: any) => handleConfigChange('format', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="decimal">Decimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showTrend"
                  checked={config.showTrend}
                  onCheckedChange={(checked) => handleConfigChange('showTrend', checked)}
                />
                <Label htmlFor="showTrend">Show Trend</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Style Options */}
        <div className="space-y-4">
          <StyleOptions
            style={config.style || {}}
            onStyleChange={handleStyleChange}
            widgetType="metric"
          />
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