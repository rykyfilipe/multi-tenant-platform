"use client";

import React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Weather-specific configuration schema
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
    theme: z.enum(["premium-light", "premium-dark", "minimal", "luxury", "platinum", "obsidian", "pearl"]).default("premium-light"),
    layout: z.enum(["compact", "detailed", "forecast-focused"]).default("detailed"),
    backgroundColor: z.string().default("#ffffff"),
    textColor: z.string().default("#000000"),
    accentColor: z.string().default("#3b82f6"),
    borderColor: z.string().default("#e5e7eb"),
    borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("md"),
    shadow: z.enum(["none", "sm", "md", "lg", "medium", "subtle", "bold"]).default("sm"),
    padding: z.enum(["tight", "comfortable", "spacious", "lg", "md", "sm"]).default("comfortable"),
    alignment: z.enum(["left", "center", "right"]).default("center"),
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
  // Temporary color states to avoid updating on every onChange
  const [tempColors, setTempColors] = React.useState<Partial<WeatherConfig["style"]>>({});

  const updateSettings = (updates: Partial<WeatherConfig["settings"]>) => {
    onChange({
      ...value,
      settings: { ...value.settings, ...updates },
    });
  };

  const updateStyle = (updates: Partial<WeatherConfig["style"]>) => {
    onChange({
      ...value,
      style: { ...value.style, ...updates },
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
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
                <p className="text-xs text-muted-foreground">
                  Enter city name (e.g., "London") or coordinates (e.g., "51.5074, -0.1278")
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="units">Temperature Units</Label>
                  <Select
                    value={value.settings.units}
                    onValueChange={(units: "metric" | "imperial") => updateSettings({ units })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Celsius (°C)</SelectItem>
                      <SelectItem value="imperial">Fahrenheit (°F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="forecastDays">Forecast Days</Label>
                  <Select
                    value={value.settings.forecastDays.toString()}
                    onValueChange={(days) => updateSettings({ forecastDays: parseInt(days) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="5">5 Days</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="layout">Widget Layout</Label>
                <Select
                  value={value.style.layout}
                  onValueChange={(layout: "compact" | "detailed" | "forecast-focused") => updateStyle({ layout })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="forecast-focused">Forecast Focused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Display Options</h4>
                
                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="showFeelsLike">Show "Feels Like"</Label>
                    <Switch
                      id="showFeelsLike"
                      checked={value.settings.showFeelsLike}
                      onCheckedChange={(showFeelsLike) => updateSettings({ showFeelsLike })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Visual Style</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={value.style.theme}
                  onValueChange={(theme: "premium-light" | "premium-dark" | "minimal" | "luxury") => updateStyle({ theme })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium-light">Premium Light</SelectItem>
                    <SelectItem value="premium-dark">Premium Dark</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alignment">Alignment</Label>
                <Select
                  value={value.style.alignment}
                  onValueChange={(alignment: "left" | "center" | "right") => updateStyle({ alignment })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Colors</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={tempColors.backgroundColor ?? value.style.backgroundColor}
                    onChange={(e) => setTempColors(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    onBlur={(e) => { updateStyle({ backgroundColor: e.target.value }); setTempColors(prev => ({ ...prev, backgroundColor: undefined })); }}
                    onMouseUp={(e) => { const val = (e.target as HTMLInputElement).value; updateStyle({ backgroundColor: val }); setTempColors(prev => ({ ...prev, backgroundColor: undefined })); }}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <Input
                    id="textColor"
                    type="color"
                    value={tempColors.textColor ?? value.style.textColor}
                    onChange={(e) => setTempColors(prev => ({ ...prev, textColor: e.target.value }))}
                    onBlur={(e) => { updateStyle({ textColor: e.target.value }); setTempColors(prev => ({ ...prev, textColor: undefined })); }}
                    onMouseUp={(e) => { const val = (e.target as HTMLInputElement).value; updateStyle({ textColor: val }); setTempColors(prev => ({ ...prev, textColor: undefined })); }}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <Input
                    id="accentColor"
                    type="color"
                    value={tempColors.accentColor ?? value.style.accentColor}
                    onChange={(e) => setTempColors(prev => ({ ...prev, accentColor: e.target.value }))}
                    onBlur={(e) => { updateStyle({ accentColor: e.target.value }); setTempColors(prev => ({ ...prev, accentColor: undefined })); }}
                    onMouseUp={(e) => { const val = (e.target as HTMLInputElement).value; updateStyle({ accentColor: val }); setTempColors(prev => ({ ...prev, accentColor: undefined })); }}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borderColor">Border Color</Label>
                  <Input
                    id="borderColor"
                    type="color"
                    value={tempColors.borderColor ?? value.style.borderColor}
                    onChange={(e) => setTempColors(prev => ({ ...prev, borderColor: e.target.value }))}
                    onBlur={(e) => { updateStyle({ borderColor: e.target.value }); setTempColors(prev => ({ ...prev, borderColor: undefined })); }}
                    onMouseUp={(e) => { const val = (e.target as HTMLInputElement).value; updateStyle({ borderColor: val }); setTempColors(prev => ({ ...prev, borderColor: undefined })); }}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Layout</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius</Label>
                  <Select
                    value={value.style.borderRadius}
                    onValueChange={(borderRadius: "none" | "sm" | "md" | "lg" | "full") => updateStyle({ borderRadius })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shadow">Shadow</Label>
                  <Select
                    value={value.style.shadow}
                    onValueChange={(shadow: "none" | "sm" | "md" | "lg") => updateStyle({ shadow })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="padding">Padding</Label>
                <Select
                  value={value.style.padding}
                  onValueChange={(padding: "tight" | "comfortable" | "spacious") => updateStyle({ padding })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tight">Tight</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
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
                  Weather updates every {Math.round(value.refresh.interval / 60000)} minutes
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
