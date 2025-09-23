import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Settings, Palette } from 'lucide-react';
import { WidgetEditorProps, WidgetEntity } from '@/types/widget';
import { TableSelector } from '../TableSelector';
import { KPIConfig } from '../KPIWidget';
import StyleOptions from './StyleOptions';

interface KPIEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: KPIConfig };
}

export default function KPIEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen
}: KPIEditorProps) {
  const [config, setConfig] = useState<KPIConfig>({
    title: '',
    dataSource: {
      type: 'table',
      tableId: 0,
      yAxis: {
        key: 'value',
        label: 'Value',
        type: 'number',
        columns: []
      }
    },
    aggregation: 'sum',
    formatting: {
      type: 'number',
      decimals: 0,
      prefix: '',
      suffix: ''
    },
    display: {
      showTrend: true,
      showComparison: false,
      customLabel: '',
      secondaryMetric: ''
    },
    style: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6'
    },
    ...widget.config
  });

  const handleSave = () => {
    if (!config.dataSource.tableId || !config.dataSource.yAxis?.columns?.length) {
      alert('Please select a table and column for the KPI widget');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'metric'
    });
  };

  const handleConfigChange = (key: keyof KPIConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDataSourceChange = (dataSource: any) => {
    setConfig(prev => ({
      ...prev,
      dataSource
    }));
  };

  const handleFormattingChange = (key: keyof KPIConfig['formatting'], value: any) => {
    setConfig(prev => ({
      ...prev,
      formatting: {
        ...prev.formatting,
        [key]: value
      }
    }));
  };

  const handleDisplayChange = (key: keyof KPIConfig['display'], value: any) => {
    setConfig(prev => ({
      ...prev,
      display: {
        ...prev.display,
        [key]: value
      }
    }));
  };

  const handleStyleChange = (key: keyof KPIConfig['style'], value: any) => {
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-gray-900">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <span>Configure KPI Widget</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2 text-gray-900">
                <Settings className="h-4 w-4 text-gray-600" />
                <span>Basic Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Widget Title
                  </Label>
                  <Input
                    id="title"
                    value={config.title || ''}
                    onChange={(e) => handleConfigChange('title', e.target.value)}
                    placeholder="Enter widget title"
                    className="mt-1 border-gray-200 focus:border-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Source Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Data Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TableSelector
                dataSource={config.dataSource}
                onDataSourceChange={handleDataSourceChange}
                widgetType="kpi"
                supportedAxes={['y']}
                expectedYType="number"
              />
            </CardContent>
          </Card>

          {/* Aggregation Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Aggregation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="aggregation" className="text-sm font-medium text-gray-700">
                  Aggregation Function
                </Label>
                <Select
                  value={config.aggregation}
                  onValueChange={(value: any) => handleConfigChange('aggregation', value)}
                >
                  <SelectTrigger className="mt-1 border-gray-200 focus:border-gray-400">
                    <SelectValue placeholder="Select aggregation function" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">
                      <div className="flex flex-col">
                        <span className="font-medium">Sum</span>
                        <span className="text-xs text-gray-500">Total of all values</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="avg">
                      <div className="flex flex-col">
                        <span className="font-medium">Average</span>
                        <span className="text-xs text-gray-500">Mean of all values</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="min">
                      <div className="flex flex-col">
                        <span className="font-medium">Minimum</span>
                        <span className="text-xs text-gray-500">Smallest value</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="max">
                      <div className="flex flex-col">
                        <span className="font-medium">Maximum</span>
                        <span className="text-xs text-gray-500">Largest value</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="count">
                      <div className="flex flex-col">
                        <span className="font-medium">Count</span>
                        <span className="text-xs text-gray-500">Number of records</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Formatting Configuration */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Value Formatting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="formatType" className="text-sm font-medium text-gray-700">
                    Format Type
                  </Label>
                  <Select
                    value={config.formatting.type}
                    onValueChange={(value: any) => handleFormattingChange('type', value)}
                  >
                    <SelectTrigger className="mt-1 border-gray-200 focus:border-gray-400">
                      <SelectValue placeholder="Select format type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </SelectTrigger>
                </div>
                
                <div>
                  <Label htmlFor="decimals" className="text-sm font-medium text-gray-700">
                    Decimal Places
                  </Label>
                  <Select
                    value={config.formatting.decimals.toString()}
                    onValueChange={(value) => handleFormattingChange('decimals', parseInt(value))}
                  >
                    <SelectTrigger className="mt-1 border-gray-200 focus:border-gray-400">
                      <SelectValue placeholder="Select decimal places" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0</SelectItem>
                      <SelectItem value="1">1</SelectItem>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                    </SelectContent>
                  </SelectTrigger>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prefix" className="text-sm font-medium text-gray-700">
                    Prefix (optional)
                  </Label>
                  <Input
                    id="prefix"
                    value={config.formatting.prefix || ''}
                    onChange={(e) => handleFormattingChange('prefix', e.target.value)}
                    placeholder="e.g., $, €"
                    className="mt-1 border-gray-200 focus:border-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="suffix" className="text-sm font-medium text-gray-700">
                    Suffix (optional)
                  </Label>
                  <Input
                    id="suffix"
                    value={config.formatting.suffix || ''}
                    onChange={(e) => handleFormattingChange('suffix', e.target.value)}
                    placeholder="e.g., %, units"
                    className="mt-1 border-gray-200 focus:border-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-900">
                Display Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showTrend" className="text-sm font-medium text-gray-700">
                      Show Trend Indicator
                    </Label>
                    <p className="text-xs text-gray-500">Display trend arrow and percentage change</p>
                  </div>
                  <Switch
                    id="showTrend"
                    checked={config.display.showTrend}
                    onCheckedChange={(checked) => handleDisplayChange('showTrend', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="showComparison" className="text-sm font-medium text-gray-700">
                      Show Comparison
                    </Label>
                    <p className="text-xs text-gray-500">Display comparison with previous period</p>
                  </div>
                  <Switch
                    id="showComparison"
                    checked={config.display.showComparison}
                    onCheckedChange={(checked) => handleDisplayChange('showComparison', checked)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customLabel" className="text-sm font-medium text-gray-700">
                  Custom Label (optional)
                </Label>
                <Input
                  id="customLabel"
                  value={config.display.customLabel || ''}
                  onChange={(e) => handleDisplayChange('customLabel', e.target.value)}
                  placeholder="e.g., Total Revenue, Active Users"
                  className="mt-1 border-gray-200 focus:border-gray-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Style Options */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center space-x-2 text-gray-900">
                <Palette className="h-4 w-4 text-gray-600" />
                <span>Style Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="textColor" className="text-sm font-medium text-gray-700">
                    Text Color
                  </Label>
                  <Input
                    id="textColor"
                    type="color"
                    value={config.style?.textColor || '#1f2937'}
                    onChange={(e) => handleStyleChange('textColor', e.target.value)}
                    className="mt-1 h-10 border-gray-200 focus:border-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="accentColor" className="text-sm font-medium text-gray-700">
                    Accent Color
                  </Label>
                  <Input
                    id="accentColor"
                    type="color"
                    value={config.style?.accentColor || '#3b82f6'}
                    onChange={(e) => handleStyleChange('accentColor', e.target.value)}
                    className="mt-1 h-10 border-gray-200 focus:border-gray-400"
                  />
                </div>
                
                <div>
                  <Label htmlFor="backgroundColor" className="text-sm font-medium text-gray-700">
                    Background Color
                  </Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={config.style?.backgroundColor || '#ffffff'}
                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                    className="mt-1 h-10 border-gray-200 focus:border-gray-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Style Options */}
          <StyleOptions
            style={config.style || {}}
            onStyleChange={(key, value) => handleStyleChange(key as any, value)}
            widgetType="metric"
          />
        </div>

        <DialogFooter className="flex justify-end space-x-2 pt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gray-900 hover:bg-gray-800 text-white"
          >
            Save Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
