import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, ClockConfig, WidgetEntity } from '@/types/widget';

interface ClockEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: ClockConfig };
}

export default function ClockEditor({ widget, onSave, onCancel, isOpen }: ClockEditorProps) {
  const [config, setConfig] = useState<ClockConfig>({
    timezone: 'UTC',
    format: '24h',
    showDate: true,
    showSeconds: true,
    style: 'digital',
    ...widget.config
  });

  const handleSave = () => {
    onSave({
      ...widget,
      config,
      type: 'clock'
    });
  };

  const handleConfigChange = (key: keyof ClockConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Clock Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={config.timezone} onValueChange={(value) => handleConfigChange('timezone', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="format">Time Format</Label>
              <Select value={config.format} onValueChange={(value: any) => handleConfigChange('format', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="style">Style</Label>
              <Select value={config.style} onValueChange={(value: any) => handleConfigChange('style', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="analog">Analog</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="showDate"
                checked={config.showDate}
                onCheckedChange={(checked) => handleConfigChange('showDate', checked)}
              />
              <Label htmlFor="showDate">Show Date</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showSeconds"
                checked={config.showSeconds}
                onCheckedChange={(checked) => handleConfigChange('showSeconds', checked)}
              />
              <Label htmlFor="showSeconds">Show Seconds</Label>
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
