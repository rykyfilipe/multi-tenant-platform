/**
 * Calendar Widget Editor
 * Configuration editor for calendar widgets
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ColorPicker } from '@/components/ui/color-picker';
import { WidgetEditorProps, CalendarConfig, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';

interface CalendarEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: CalendarConfig };  
}

export default function CalendarEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen 
}: CalendarEditorProps) {
  const [config, setConfig] = useState<CalendarConfig>({
    dateColumn: '',
    titleColumn: '',
    descriptionColumn: '',
    colorColumn: '',
    showWeekends: true,
    defaultView: 'month',
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Load available columns from data source
  useEffect(() => {
    if (widget.dataSource?.type === 'table') {
      // In a real implementation, this would fetch column names from the table
      setAvailableColumns([
        'date', 'start_date', 'end_date', 'title', 'description', 
        'event_name', 'color', 'status', 'priority', 'location'
      ]);
    } else {
      setAvailableColumns([]);
    }
  }, [widget.dataSource]);

  const handleSave = () => {
    if (!config.dateColumn) {
      alert('Please select a date column');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'calendar'
    });
  };

  const handleConfigChange = (key: keyof CalendarConfig, value: any) => {
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
          <DialogTitle>Configure Calendar</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Required Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Required Configuration</h3>
            
            <div>
              <Label htmlFor="dateColumn">Date Column *</Label>
              <Select value={config.dateColumn} onValueChange={(value) => handleConfigChange('dateColumn', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date column" />
                </SelectTrigger>
                <SelectContent>
                  {availableColumns.map(column => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                This column must contain valid date values
              </p>
            </div>
          </div>

          {/* Optional Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Optional Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titleColumn">Title Column</Label>
                <Select value={config.titleColumn || ''} onValueChange={(value) => handleConfigChange('titleColumn', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select title column (optional)" />
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

              <div>
                <Label htmlFor="descriptionColumn">Description Column</Label>
                <Select value={config.descriptionColumn || ''} onValueChange={(value) => handleConfigChange('descriptionColumn', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select description column (optional)" />
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

              <div>
                <Label htmlFor="colorColumn">Color Column</Label>
                <Select value={config.colorColumn || ''} onValueChange={(value) => handleConfigChange('colorColumn', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color column (optional)" />
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
                <Label htmlFor="defaultView">Default View</Label>
                <Select value={config.defaultView} onValueChange={(value: any) => handleConfigChange('defaultView', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showWeekends"
                  checked={config.showWeekends}
                  onCheckedChange={(checked) => handleConfigChange('showWeekends', checked)}
                />
                <Label htmlFor="showWeekends">Show Weekends</Label>
              </div>
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Style Options</h3>
            <StyleOptions
              style={config.style || {}}
              onStyleChange={handleStyleChange}
              widgetType="calendar"
            />
          </div>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">
                <p><strong>Date Column:</strong> {config.dateColumn || 'Not selected'}</p>
                <p><strong>Title Column:</strong> {config.titleColumn || 'None'}</p>
                <p><strong>Description Column:</strong> {config.descriptionColumn || 'None'}</p>
                <p><strong>Color Column:</strong> {config.colorColumn || 'None'}</p>
                <p><strong>Default View:</strong> {config.defaultView}</p>
                <p><strong>Show Weekends:</strong> {config.showWeekends ? 'Yes' : 'No'}</p>
              </div>
            </div>
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
