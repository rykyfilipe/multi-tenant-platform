/**
 * Tasks Widget Editor
 * Configuration editor for tasks widgets
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, TasksConfig, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';

interface TasksEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: TasksConfig };
}

export default function TasksEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen 
}: TasksEditorProps) {
  const [config, setConfig] = useState<TasksConfig>({
    titleColumn: '',
    statusColumn: '',
    priorityColumn: '',
    assigneeColumn: '',
    dueDateColumn: '',
    showCompleted: true,
    showPriority: true,
    showAssignee: true,
    ...widget.config
  });

  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Load available columns from data source
  useEffect(() => {
    if (widget.dataSource?.type === 'table') {
      setAvailableColumns(['title', 'status', 'priority', 'assignee', 'dueDate', 'description', 'id']);
    } else {
      setAvailableColumns([]);
    }
  }, [widget.dataSource]);

  const handleSave = () => {
    if (!config.titleColumn || !config.statusColumn) {
      alert('Please select both title and status columns');
      return;
    }

    onSave({
      ...widget,
      config,
      type: 'tasks'
    });
  };

  const handleConfigChange = (key: keyof TasksConfig, value: any) => {
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
          <DialogTitle>Configure Tasks Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Required Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Required Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="titleColumn">Title Column *</Label>
                <Select value={config.titleColumn} onValueChange={(value) => handleConfigChange('titleColumn', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select title column" />
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
                <Label htmlFor="statusColumn">Status Column *</Label>
                <Select value={config.statusColumn} onValueChange={(value) => handleConfigChange('statusColumn', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status column" />
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
            </div>
          </div>

          {/* Optional Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Optional Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priorityColumn">Priority Column</Label>
                <Select value={config.priorityColumn || ''} onValueChange={(value) => handleConfigChange('priorityColumn', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assigneeColumn">Assignee Column</Label>
                <Select value={config.assigneeColumn || ''} onValueChange={(value) => handleConfigChange('assigneeColumn', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {availableColumns.map(column => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dueDateColumn">Due Date Column</Label>
                <Select value={config.dueDateColumn || ''} onValueChange={(value) => handleConfigChange('dueDateColumn', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select due date column (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
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

          {/* Display Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showCompleted"
                  checked={config.showCompleted}
                  onCheckedChange={(checked) => handleConfigChange('showCompleted', checked)}
                />
                <Label htmlFor="showCompleted">Show Completed Tasks</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showPriority"
                  checked={config.showPriority}
                  onCheckedChange={(checked) => handleConfigChange('showPriority', checked)}
                />
                <Label htmlFor="showPriority">Show Priority</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showAssignee"
                  checked={config.showAssignee}
                  onCheckedChange={(checked) => handleConfigChange('showAssignee', checked)}
                />
                <Label htmlFor="showAssignee">Show Assignee</Label>
              </div>
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Style Options</h3>
            <StyleOptions
              style={config.style || {}}
              onStyleChange={handleStyleChange}
              widgetType="tasks"
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