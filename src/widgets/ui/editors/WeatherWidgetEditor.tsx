"use client";

import React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeatherStyleEditor } from "./WeatherStyleEditor";

// Weather-specific configuration schema - SIMPLIFIED
const weatherConfigSchema = z.object({
  settings: z.object({
    location: z.string().default(""),
    units: z.enum(["metric", "imperial"]).default("metric"),
    showForecast: z.boolean().default(true),
    forecastDays: z.number().min(1).max(7).default(5),
    showHumidity: z.boolean().default(true),
    showWindSpeed: z.boolean().default(true),
    showPressure: z.boolean().default(false),
    showUVIndex: z.boolean().default(false),
    showFeelsLike: z.boolean().default(true),
  }),
  style: z.object({
    // Simplified - renderer uses UI component defaults
  }),
  refresh: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().default(300000), // 5 minutes
  }),
});

type WeatherConfig = z.infer<typeof weatherConfigSchema>;

interface WeatherWidgetEditorProps {
  value: WeatherConfig;
  onChange: (value: WeatherConfig) => void;
  tenantId: number;
}

export const WeatherWidgetEditor: React.FC<WeatherWidgetEditorProps> = ({
  value,
  onChange,
  tenantId,
}) => {
  const updateSettings = (updates: Partial<WeatherConfig["settings"]>) => {
    onChange({
      ...value,
      settings: { ...value.settings, ...updates },
    });
  };

  const updateRefresh = (updates: Partial<WeatherConfig["refresh"]>) => {
    onChange({
      ...value,
      refresh: { ...value.refresh, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="refresh">Refresh</TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Weather Configuration</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={value.settings.location}
                  onChange={(e) => updateSettings({ location: e.target.value })}
                  placeholder="Enter city name or coordinates"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="units">Units</Label>
                <Select
                  value={value.settings.units}
                  onValueChange={(units: "metric" | "imperial") => updateSettings({ units })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (°C, km/h)</SelectItem>
                    <SelectItem value="imperial">Imperial (°F, mph)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="forecastDays">Forecast Days</Label>
                <Input
                  id="forecastDays"
                  type="number"
                  min="1"
                  max="7"
                  value={value.settings.forecastDays}
                  onChange={(e) => updateSettings({ forecastDays: parseInt(e.target.value) || 5 })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Display Options</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="showForecast">Show Forecast</Label>
                <Switch
                  id="showForecast"
                  checked={value.settings.showForecast}
                  onCheckedChange={(showForecast) => updateSettings({ showForecast })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showHumidity">Show Humidity</Label>
                <Switch
                  id="showHumidity"
                  checked={value.settings.showHumidity}
                  onCheckedChange={(showHumidity) => updateSettings({ showHumidity })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showWindSpeed">Show Wind Speed</Label>
                <Switch
                  id="showWindSpeed"
                  checked={value.settings.showWindSpeed}
                  onCheckedChange={(showWindSpeed) => updateSettings({ showWindSpeed })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showPressure">Show Pressure</Label>
                <Switch
                  id="showPressure"
                  checked={value.settings.showPressure}
                  onCheckedChange={(showPressure) => updateSettings({ showPressure })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showUVIndex">Show UV Index</Label>
                <Switch
                  id="showUVIndex"
                  checked={value.settings.showUVIndex}
                  onCheckedChange={(showUVIndex) => updateSettings({ showUVIndex })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showFeelsLike">Show Feels Like</Label>
                <Switch
                  id="showFeelsLike"
                  checked={value.settings.showFeelsLike}
                  onCheckedChange={(showFeelsLike) => updateSettings({ showFeelsLike })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Style Tab - Minimal */}
        <TabsContent value="style" className="space-y-4">
          <WeatherStyleEditor 
            value={value.style as any} 
            onChange={(style) => onChange({ ...value, style: style as any })}
          />
        </TabsContent>

        {/* Refresh Tab */}
        <TabsContent value="refresh" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Auto Refresh</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="refreshEnabled">Enable Auto Refresh</Label>
              <Switch
                id="refreshEnabled"
                checked={value.refresh.enabled}
                onCheckedChange={(enabled) => updateRefresh({ enabled })}
              />
            </div>

            {value.refresh.enabled && (
              <div className="space-y-2">
                <Label htmlFor="refreshInterval">Refresh Interval (minutes)</Label>
                <Select
                  value={Math.round(value.refresh.interval / 60000).toString()}
                  onValueChange={(minutes) => updateRefresh({ interval: parseInt(minutes) * 60000 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Minute</SelectItem>
                    <SelectItem value="5">5 Minutes</SelectItem>
                    <SelectItem value="10">10 Minutes</SelectItem>
                    <SelectItem value="15">15 Minutes</SelectItem>
                    <SelectItem value="30">30 Minutes</SelectItem>
                    <SelectItem value="60">1 Hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Weather data updates every {Math.round(value.refresh.interval / 60000)} minute(s)
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
