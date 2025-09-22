/**
 * KPI Widget Editor
 * Configuration editor for KPI widgets with aggregation functions
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { WidgetEditorProps, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';
import { getAvailableAggregations, getAggregationLabel, getAggregationDescription } from '@/lib/aggregation-utils';

interface KPIConfig {
  title?: string;
  subtitle?: string;
  dataSource: {
    type: 'table' | 'manual';
    tableId?: number;
    column?: string;
    aggregation?: string;
    showMultipleAggregations?: boolean;
    selectedAggregations?: string[];
    compareWithPrevious?: boolean;
    filters?: any[];
  };
  options?: {
    format?: 'number' | 'currency' | 'percentage' | 'decimal';
    decimals?: number;
    prefix?: string;
    suffix?: string;
    showChange?: boolean;
    showTrend?: boolean;
    showMultipleValues?: boolean;
    showAggregationType?: boolean;
    showDataCount?: boolean;
    layout?: 'single' | 'grid' | 'list';
    thresholds?: {
      warning?: number;
      danger?: number;
      success?: number;
    };
    colors?: {
      positive?: string;
      negative?: string;
      neutral?: string;
      primary?: string;
      secondary?: string;
    };
  };
  style?: {
    layout?: 'card' | 'minimal' | 'bordered' | 'gradient' | 'glass';
    size?: 'small' | 'medium' | 'large' | 'xl';
    alignment?: 'left' | 'center' | 'right';
    valueStyle?: 'default' | 'bold' | 'outlined' | 'gradient';
    titleStyle?: 'default' | 'bold' | 'italic' | 'uppercase';
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    borderColor?: string;
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    shadow?: 'none' | 'small' | 'medium' | 'large';
    padding?: 'compact' | 'comfortable' | 'spacious';
  };
}

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
    subtitle: '',
    dataSource: {
      type: 'table',
      tableId: undefined,
      column: '',
      aggregation: 'sum',
      showMultipleAggregations: false,
      selectedAggregations: [],
      compareWithPrevious: false,
      filters: []
    },
    options: {
      format: 'number',
      decimals: 0,
      prefix: '',
      suffix: '',
      showChange: true,
      showTrend: true,
      showMultipleValues: false,
      showAggregationType: true,
      showDataCount: true,
      layout: 'single',
      thresholds: {
        warning: 0,
        danger: 0,
        success: 0
      },
      colors: {
        positive: '#10b981',
        negative: '#ef4444',
        neutral: '#6b7280',
        primary: '#3b82f6',
        secondary: '#8b5cf6'
      }
    },
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
  const [availableTables, setAvailableTables] = useState<Array<{id: number, name: string}>>([]);

  // Load available columns and tables
  useEffect(() => {
    // Mock data - in real implementation, fetch from API
    setAvailableColumns(['revenue', 'sales', 'profit', 'users', 'orders', 'conversion_rate', 'cost', 'margin']);
    setAvailableTables([
      { id: 1, name: 'Sales Data' },
      { id: 2, name: 'User Analytics' },
      { id: 3, name: 'Financial Metrics' }
    ]);
  }, []);

  const handleSave = () => {
    if (!config.dataSource.column) {
      alert('Please select a column');
      return;
    }
    if (!config.dataSource.aggregation) {
      alert('Please select an aggregation function');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'kpi'
    });
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDataSourceChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      dataSource: {
        ...prev.dataSource,
        [key]: value
      }
    }));
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
      style: {
        ...prev.style,
        [key]: value
      }
    }));
  };

  const availableAggregations = getAvailableAggregations();

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure KPI Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={config.title || ''}
                  onChange={(e) => handleConfigChange('title', e.target.value)}
                  placeholder="Enter KPI title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  value={config.subtitle || ''}
                  onChange={(e) => handleConfigChange('subtitle', e.target.value)}
                  placeholder="Enter KPI subtitle"
                />
              </div>
            </div>
          </div>

          {/* Data Source Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Data Source</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataSourceType">Data Source Type</Label>
                <Select
                  value={config.dataSource.type}
                  onValueChange={(value) => handleDataSourceChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select data source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">Database Table</SelectItem>
                    <SelectItem value="manual">Manual Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config.dataSource.type === 'table' && (
                <div className="space-y-2">
                  <Label htmlFor="tableId">Table</Label>
                  <Select
                    value={config.dataSource.tableId?.toString() || ''}
                    onValueChange={(value) => handleDataSourceChange('tableId', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTables.map(table => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          {table.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="column">Column *</Label>
                <Select
                  value={config.dataSource.column || ''}
                  onValueChange={(value) => handleDataSourceChange('column', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
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

              <div className="space-y-2">
                <Label htmlFor="aggregation">Aggregation Function *</Label>
                <Select
                  value={config.dataSource.aggregation || ''}
                  onValueChange={(value) => handleDataSourceChange('aggregation', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select aggregation" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAggregations.map(agg => (
                      <SelectItem key={agg} value={agg}>
                        <div>
                          <div className="font-medium">{getAggregationLabel(agg as any)}</div>
                          <div className="text-sm text-muted-foreground">{getAggregationDescription(agg as any)}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Aggregation Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Aggregation Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showMultipleAggregations"
                  checked={config.dataSource.showMultipleAggregations || false}
                  onCheckedChange={(checked) => handleDataSourceChange('showMultipleAggregations', checked)}
                />
                <Label htmlFor="showMultipleAggregations">Show Multiple Aggregations</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="compareWithPrevious"
                  checked={config.dataSource.compareWithPrevious || false}
                  onCheckedChange={(checked) => handleDataSourceChange('compareWithPrevious', checked)}
                />
                <Label htmlFor="compareWithPrevious">Compare with Previous Period</Label>
              </div>
            </div>

            {config.dataSource.showMultipleAggregations && (
              <div className="space-y-2">
                <Label>Select Multiple Aggregations</Label>
                <div className="grid grid-cols-2 gap-2">
                  {availableAggregations.map(agg => (
                    <div key={agg} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`agg-${agg}`}
                        checked={config.dataSource.selectedAggregations?.includes(agg) || false}
                        onChange={(e) => {
                          const current = config.dataSource.selectedAggregations || [];
                          const updated = e.target.checked
                            ? [...current, agg]
                            : current.filter(a => a !== agg);
                          handleDataSourceChange('selectedAggregations', updated);
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={`agg-${agg}`} className="text-sm">
                        {getAggregationLabel(agg as any)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Display Options</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="format">Number Format</Label>
                <Select
                  value={config.options?.format || 'number'}
                  onValueChange={(value) => handleOptionsChange('format', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="decimal">Decimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="decimals">Decimal Places</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={config.options?.decimals || 0}
                  onChange={(e) => handleOptionsChange('decimals', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  value={config.options?.prefix || ''}
                  onChange={(e) => handleOptionsChange('prefix', e.target.value)}
                  placeholder="e.g., $, €, #"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="suffix">Suffix</Label>
                <Input
                  value={config.options?.suffix || ''}
                  onChange={(e) => handleOptionsChange('suffix', e.target.value)}
                  placeholder="e.g., %, units, items"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showChange"
                  checked={config.options?.showChange || false}
                  onCheckedChange={(checked) => handleOptionsChange('showChange', checked)}
                />
                <Label htmlFor="showChange">Show Change Percentage</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showTrend"
                  checked={config.options?.showTrend || false}
                  onCheckedChange={(checked) => handleOptionsChange('showTrend', checked)}
                />
                <Label htmlFor="showTrend">Show Trend Indicator</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showAggregationType"
                  checked={config.options?.showAggregationType || false}
                  onCheckedChange={(checked) => handleOptionsChange('showAggregationType', checked)}
                />
                <Label htmlFor="showAggregationType">Show Aggregation Type</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showDataCount"
                  checked={config.options?.showDataCount || false}
                  onCheckedChange={(checked) => handleOptionsChange('showDataCount', checked)}
                />
                <Label htmlFor="showDataCount">Show Data Count</Label>
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
