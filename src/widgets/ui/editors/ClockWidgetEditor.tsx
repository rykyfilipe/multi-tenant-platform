"use client";

import React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Clock-specific configuration schema - SIMPLIFIED
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
    fontFamily: z.enum(["sans", "serif", "mono"]).default("mono"),
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
                    <SelectItem value="12h">12 Hour</SelectItem>
                    <SelectItem value="24h">24 Hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  onValueChange={(dateFormat: any) => updateSettings({ dateFormat })}
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
            </div>

            <div className="space-y-3">
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

        {/* Style Tab - Simplified */}
        <TabsContent value="style" className="space-y-4">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Theme & Font</h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={value.style.theme}
                  onValueChange={(theme: any) => updateStyle({ theme })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium-light">Premium Light</SelectItem>
                    <SelectItem value="premium-dark">Premium Dark</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="obsidian">Obsidian</SelectItem>
                    <SelectItem value="pearl">Pearl</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
