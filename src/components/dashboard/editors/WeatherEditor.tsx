import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WidgetEditorProps, WeatherConfig } from '@/types/widget';

interface WeatherEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: WeatherConfig };
}

export default function WeatherEditor({ widget, onSave, onCancel, isOpen }: WeatherEditorProps) {
  const [config, setConfig] = useState<WeatherConfig>({
    location: '',
    units: 'metric',
    showForecast: true,
    forecastDays: 5,
    ...widget.config
  });

  const handleSave = () => {
    onSave({
      ...widget,
      config,
      type: 'weather'
    });
  };

  const handleConfigChange = (key: keyof WeatherConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Weather Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              value={config.location || ''}
              onChange={(e) => handleConfigChange('location', e.target.value)}
              placeholder="Enter city name or coordinates"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter city name (e.g., "London") or coordinates (e.g., "51.5074,-0.1278")
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="units">Temperature Units</Label>
              <Select value={config.units} onValueChange={(value: any) => handleConfigChange('units', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="metric">Metric (°C)</SelectItem>
                  <SelectItem value="imperial">Imperial (°F)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="forecastDays">Forecast Days</Label>
              <Select value={config.forecastDays?.toString()} onValueChange={(value) => handleConfigChange('forecastDays', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="showForecast"
                checked={config.showForecast}
                onCheckedChange={(checked) => handleConfigChange('showForecast', checked)}
              />
              <Label htmlFor="showForecast">Show Forecast</Label>
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
