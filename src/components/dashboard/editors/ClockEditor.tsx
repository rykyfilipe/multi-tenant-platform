/**
 * Clock Widget Editor
 * Configuration editor for clock widgets
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, ClockConfig, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';

interface ClockEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: ClockConfig };
}

export default function ClockEditor({ 
  widget, 
  onSave, 
  onCancel, 
  isOpen 
}: ClockEditorProps) {
  const [config, setConfig] = useState<ClockConfig>({
    title: '',
    timezone: 'local',
    format: '24h',
    showDate: true,
    showSeconds: true,
    showTimezone: true,
    clockType: 'digital',
    style: {
      fontSize: '2xl',
      fontFamily: 'mono',
      color: '#000000',
      backgroundColor: 'transparent',
      theme: 'light',
      size: 'medium',
      layout: 'vertical'
    },
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

  const timezones = [
    { value: 'local', label: 'Local Time' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Chicago', label: 'Chicago (CST)' },
    { value: 'America/Denver', label: 'Denver (MST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Kolkata', label: 'Mumbai (IST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
    { value: 'Pacific/Auckland', label: 'Auckland (NZST)' }
  ];

  const clockTypes = [
    { value: 'digital', label: 'Digital Clock', description: 'Classic digital time display' },
    { value: 'analog', label: 'Analog Clock', description: 'Traditional clock with hands' },
    { value: 'flip', label: 'Flip Clock', description: 'Retro flip-style display' },
    { value: 'binary', label: 'Binary Clock', description: 'Time displayed in binary' },
    { value: 'world', label: 'World Clock', description: 'Multiple timezones at once' },
    { value: 'stopwatch', label: 'Stopwatch', description: 'Timer with start/stop controls' },
    { value: 'timer', label: 'Timer', description: 'Countdown timer' },
    { value: 'countdown', label: 'Countdown', description: 'Countdown to specific date' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Clock Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Configuration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={config.title || ''}
                onChange={(e) => handleConfigChange('title', e.target.value)}
                placeholder="Enter clock title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clockType">Clock Type</Label>
              <Select
                value={config.clockType || 'digital'}
                onValueChange={(value) => handleConfigChange('clockType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select clock type" />
                </SelectTrigger>
                <SelectContent>
                  {clockTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={config.timezone || 'local'}
                onValueChange={(value) => handleConfigChange('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Time Format</Label>
              <Select
                value={config.format || '24h'}
                onValueChange={(value) => handleConfigChange('format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Display Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="showDate"
                  checked={config.showDate || false}
                  onCheckedChange={(checked) => handleConfigChange('showDate', checked)}
                />
                <Label htmlFor="showDate">Show Date</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showSeconds"
                  checked={config.showSeconds || false}
                  onCheckedChange={(checked) => handleConfigChange('showSeconds', checked)}
                />
                <Label htmlFor="showSeconds">Show Seconds</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showTimezone"
                  checked={config.showTimezone || false}
                  onCheckedChange={(checked) => handleConfigChange('showTimezone', checked)}
                />
                <Label htmlFor="showTimezone">Show Timezone</Label>
              </div>
            </div>
          </div>

          {/* Style Options */}
          <div className="space-y-4">
            <StyleOptions
              style={config.style || {}}
              onStyleChange={handleStyleChange}
              widgetType="clock"
            />
          </div>

          {/* Clock-specific style options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Clock Specific Styling</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select
                  value={config.style?.fontSize || '2xl'}
                  onValueChange={(value) => handleStyleChange('fontSize', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                    <SelectItem value="2xl">2X Large</SelectItem>
                    <SelectItem value="3xl">3X Large</SelectItem>
                    <SelectItem value="4xl">4X Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={config.style?.fontFamily || 'mono'}
                  onValueChange={(value) => handleStyleChange('fontFamily', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select font family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mono">Monospace</SelectItem>
                    <SelectItem value="sans">Sans Serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={config.style?.theme || 'light'}
                  onValueChange={(value) => handleStyleChange('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="neon">Neon</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="glass">Glass</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Select
                  value={config.style?.size || 'medium'}
                  onValueChange={(value) => handleStyleChange('size', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                  </SelectContent>
                </Select>
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