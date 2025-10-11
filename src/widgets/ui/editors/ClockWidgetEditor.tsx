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

// Clock-specific configuration schema
const clockConfigSchema = z.object({
  settings: z.object({
    timezone: z.string().default("local"),
    format: z.enum(["12h", "24h"]).default("24h"),
    showDate: z.boolean().default(true),
    showSeconds: z.boolean().default(true),
    showTimezone: z.boolean().default(false),
    clockType: z.enum(["digital", "analog"]).default("digital"),
    dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).default("DD/MM/YYYY"),
  }),
  style: z.object({
    theme: z.enum(["premium-light", "premium-dark", "minimal", "luxury", "platinum", "obsidian", "pearl"]).default("premium-light"),
    fontSize: z.enum(["sm", "md", "lg", "xl", "2xl"]).default("xl"),
    fontFamily: z.enum(["sans", "serif", "mono"]).default("mono"),
    backgroundColor: z.string().default("#ffffff"),
    textColor: z.string().default("#000000"),
    borderColor: z.string().default("#e5e7eb"),
    borderRadius: z.enum(["none", "sm", "md", "lg", "xl", "2xl", "full"]).default("md"),
    shadow: z.enum(["none", "sm", "md", "lg", "medium", "subtle", "bold"]).default("sm"),
    padding: z.enum(["tight", "comfortable", "spacious", "lg", "md", "sm"]).default("comfortable"),
    alignment: z.enum(["left", "center", "right"]).default("center"),
  }),
  refresh: z.object({
    enabled: z.boolean().default(true),
    interval: z.number().default(1000), // 1 second for clock
  }),
});

type ClockConfig = z.infer<typeof clockConfigSchema>;

interface ClockWidgetEditorProps {
  value: ClockConfig;
  onChange: (value: ClockConfig) => void;
  tenantId: number;
}

export const ClockWidgetEditor: React.FC<ClockWidgetEditorProps> = ({
  value,
  onChange,
  tenantId,
}) => {
  // Temporary color states to avoid updating on every onChange
  const [tempColors, setTempColors] = React.useState<Partial<ClockConfig["style"]>>({});

  const updateSettings = (updates: Partial<ClockConfig["settings"]>) => {
    onChange({
      ...value,
      settings: { ...value.settings, ...updates },
    });
  };

  const updateStyle = (updates: Partial<ClockConfig["style"]>) => {
    onChange({
      ...value,
      style: { ...value.style, ...updates },
    });
  };

  const updateRefresh = (updates: Partial<ClockConfig["refresh"]>) => {
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
            <h3 className="text-sm font-medium">Clock Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={value.settings.timezone}
                  onValueChange={(timezone) => updateSettings({ timezone })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local Time</SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">New York</SelectItem>
                    <SelectItem value="America/Los_Angeles">Los Angeles</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Europe/Paris">Paris</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Time Format</Label>
                <Select
                  value={value.settings.format}
                  onValueChange={(format: "12h" | "24h") => updateSettings({ format })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clockType">Clock Type</Label>
              <Select
                value={value.settings.clockType}
                onValueChange={(clockType: "digital" | "analog") => updateSettings({ clockType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="analog">Analog</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={value.settings.dateFormat}
                onValueChange={(dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD") => updateSettings({ dateFormat })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Display Options</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showDate">Show Date</Label>
                <Switch
                  id="showDate"
                  checked={value.settings.showDate}
                  onCheckedChange={(showDate) => updateSettings({ showDate })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showSeconds">Show Seconds</Label>
                <Switch
                  id="showSeconds"
                  checked={value.settings.showSeconds}
                  onCheckedChange={(showSeconds) => updateSettings({ showSeconds })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showTimezone">Show Timezone</Label>
                <Switch
                  id="showTimezone"
                  checked={value.settings.showTimezone}
                  onCheckedChange={(showTimezone) => updateSettings({ showTimezone })}
                />
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
                <Label htmlFor="fontSize">Font Size</Label>
                <Select
                  value={value.style.fontSize}
                  onValueChange={(fontSize: "sm" | "md" | "lg" | "xl" | "2xl") => updateStyle({ fontSize })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
                    <SelectItem value="2xl">2X Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={value.style.fontFamily}
                  onValueChange={(fontFamily: "sans" | "serif" | "mono") => updateStyle({ fontFamily })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sans">Sans Serif</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="mono">Monospace</SelectItem>
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
                <Label htmlFor="refreshInterval">Refresh Interval (milliseconds)</Label>
                <Input
                  id="refreshInterval"
                  type="number"
                  min="100"
                  max="60000"
                  step="100"
                  value={value.refresh.interval}
                  onChange={(e) => updateRefresh({ interval: parseInt(e.target.value) || 1000 })}
                  placeholder="1000"
                />
                <p className="text-xs text-muted-foreground">
                  Clock updates every {value.refresh.interval}ms
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
