/**
 * Table Widget Editor
 * Configuration editor for table widgets
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, TableConfig, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';

interface TableEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: TableConfig };
}

export default function TableEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen 
}: TableEditorProps) {
  const [config, setConfig] = useState<TableConfig>({
    columns: [],
    showHeader: true,
    showFooter: false,
    pageSize: 10,
    sortable: true,
    filterable: true,
    style: {
      theme: 'default',
      headerStyle: 'default',
      rowHover: false,
      cellPadding: 'comfortable',
      fontSize: 'medium',
      borderStyle: 'thin',
      headerBackground: '#f8fafc',
      headerTextColor: '#1f2937',
      rowBackground: '#ffffff',
      alternateRowColor: '#f9fafb',
      borderColor: '#e5e7eb'
    },
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [newColumn, setNewColumn] = useState('');

  // Load available columns from data source
  useEffect(() => {
    if (widget.dataSource?.type === 'table') {
      setAvailableColumns(['id', 'name', 'email', 'date', 'value', 'status', 'category']);
    } else {
      setAvailableColumns([]);
    }
  }, [widget.dataSource]);

  const handleSave = () => {
    if (!config.columns || config.columns.length === 0) {
      alert('Please add at least one column');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'table'
    });
  };

  const handleConfigChange = (key: keyof TableConfig, value: any) => {
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

  const addColumn = () => {
    if (newColumn && !config.columns.includes(newColumn)) {
      setConfig(prev => ({
        ...prev,
        columns: [...prev.columns, newColumn]
      }));
      setNewColumn('');
    }
  };

  const removeColumn = (index: number) => {
    setConfig(prev => ({
      ...prev,
      columns: prev.columns.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Table</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Column Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Column Configuration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="newColumn">Add Column</Label>
              <div className="flex gap-2">
                <Select value={newColumn} onValueChange={setNewColumn}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select column to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns
                      .filter(col => !config.columns.includes(col))
                      .map(column => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={addColumn} disabled={!newColumn}>
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Selected Columns</Label>
              <div className="space-y-1">
                {config.columns.map((column, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span>{column}</span>
                    <Button
                      onClick={() => removeColumn(index)}
                      variant="outline"
                      size="sm"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Display Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pageSize">Page Size</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={config.pageSize}
                  onChange={(e) => handleConfigChange('pageSize', parseInt(e.target.value) || 10)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showHeader"
                  checked={config.showHeader}
                  onCheckedChange={(checked) => handleConfigChange('showHeader', checked)}
                />
                <Label htmlFor="showHeader">Show Header</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showFooter"
                  checked={config.showFooter}
                  onCheckedChange={(checked) => handleConfigChange('showFooter', checked)}
                />
                <Label htmlFor="showFooter">Show Footer</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="sortable"
                  checked={config.sortable}
                  onCheckedChange={(checked) => handleConfigChange('sortable', checked)}
                />
                <Label htmlFor="sortable">Sortable</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="filterable"
                  checked={config.filterable}
                  onCheckedChange={(checked) => handleConfigChange('filterable', checked)}
                />
                <Label htmlFor="filterable">Filterable</Label>
              </div>
            </div>
          </div>
        </div>

        {/* Style Options */}
        <div className="space-y-4">
          <StyleOptions
            style={config.style || {}}
            onStyleChange={handleStyleChange}
            widgetType="table"
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