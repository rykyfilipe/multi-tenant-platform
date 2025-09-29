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

// Tasks-specific configuration schema
const tasksConfigSchema = z.object({
  settings: z.object({
    title: z.string().default("My Tasks"),
    showCompleted: z.boolean().default(true),
    showProgress: z.boolean().default(true),
    allowInlineEdit: z.boolean().default(true),
    allowDragReorder: z.boolean().default(true),
    defaultPriority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).default("DD/MM/YYYY"),
    maxTasks: z.number().min(1).max(100).default(50),
  }),
  style: z.object({
    theme: z.enum(["premium-light", "premium-dark", "minimal", "luxury"]).default("premium-light"),
    layout: z.enum(["list", "card", "kanban"]).default("list"),
    density: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
    backgroundColor: z.string().default("#ffffff"),
    textColor: z.string().default("#000000"),
    accentColor: z.string().default("#3b82f6"),
    borderColor: z.string().default("#e5e7eb"),
    borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).default("md"),
    shadow: z.enum(["none", "sm", "md", "lg"]).default("sm"),
    padding: z.enum(["tight", "comfortable", "spacious"]).default("comfortable"),
    showPriorityColors: z.boolean().default(true),
    showDueDates: z.boolean().default(true),
  }),
  refresh: z.object({
    enabled: z.boolean().default(false), // Tasks don't need auto-refresh
    interval: z.number().default(300000), // 5 minutes if enabled
  }),
});

type TasksConfig = z.infer<typeof tasksConfigSchema>;

interface TasksWidgetEditorProps {
  value: TasksConfig;
  onChange: (value: TasksConfig) => void;
  tenantId: number;
}

export const TasksWidgetEditor: React.FC<TasksWidgetEditorProps> = ({
  value,
  onChange,
  tenantId,
}) => {
  const updateSettings = (updates: Partial<TasksConfig["settings"]>) => {
    onChange({
      ...value,
      settings: { ...value.settings, ...updates },
    });
  };

  const updateStyle = (updates: Partial<TasksConfig["style"]>) => {
    onChange({
      ...value,
      style: { ...value.style, ...updates },
    });
  };

  const updateRefresh = (updates: Partial<TasksConfig["refresh"]>) => {
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
            <h3 className="text-sm font-medium">Tasks Configuration</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Widget Title</Label>
                <Input
                  id="title"
                  value={value.settings.title}
                  onChange={(e) => updateSettings({ title: e.target.value })}
                  placeholder="My Tasks"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="layout">Layout Style</Label>
                  <Select
                    value={value.style.layout}
                    onValueChange={(layout: "list" | "card" | "kanban") => updateStyle({ layout })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="kanban">Kanban</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTasks">Maximum Tasks</Label>
                  <Select
                    value={value.settings.maxTasks.toString()}
                    onValueChange={(max) => updateSettings({ maxTasks: parseInt(max) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 Tasks</SelectItem>
                      <SelectItem value="25">25 Tasks</SelectItem>
                      <SelectItem value="50">50 Tasks</SelectItem>
                      <SelectItem value="100">100 Tasks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultPriority">Default Priority</Label>
                  <Select
                    value={value.settings.defaultPriority}
                    onValueChange={(priority) => updateSettings({ defaultPriority: priority as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={value.settings.dateFormat}
                    onValueChange={(format) => updateSettings({ dateFormat: format as any })}
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

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Display Options</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="showCompleted">Show Completed Tasks</Label>
                    <Switch
                      id="showCompleted"
                      checked={value.settings.showCompleted}
                      onCheckedChange={(showCompleted) => updateSettings({ showCompleted })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showProgress">Show Progress Bar</Label>
                    <Switch
                      id="showProgress"
                      checked={value.settings.showProgress}
                      onCheckedChange={(showProgress) => updateSettings({ showProgress })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowInlineEdit">Allow Inline Editing</Label>
                    <Switch
                      id="allowInlineEdit"
                      checked={value.settings.allowInlineEdit}
                      onCheckedChange={(allowInlineEdit) => updateSettings({ allowInlineEdit })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowDragReorder">Allow Drag & Drop Reorder</Label>
                    <Switch
                      id="allowDragReorder"
                      checked={value.settings.allowDragReorder}
                      onCheckedChange={(allowDragReorder) => updateSettings({ allowDragReorder })}
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
                <Label htmlFor="density">Density</Label>
                <Select
                  value={value.style.density}
                  onValueChange={(density: "compact" | "comfortable" | "spacious") => updateStyle({ density })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
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
                    value={value.style.backgroundColor}
                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <Input
                    id="textColor"
                    type="color"
                    value={value.style.textColor}
                    onChange={(e) => updateStyle({ textColor: e.target.value })}
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
                    value={value.style.accentColor}
                    onChange={(e) => updateStyle({ accentColor: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borderColor">Border Color</Label>
                  <Input
                    id="borderColor"
                    type="color"
                    value={value.style.borderColor}
                    onChange={(e) => updateStyle({ borderColor: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-sm font-medium">Layout & Effects</h4>
              
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

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="showPriorityColors">Show Priority Colors</Label>
                  <Switch
                    id="showPriorityColors"
                    checked={value.style.showPriorityColors}
                    onCheckedChange={(showPriorityColors) => updateStyle({ showPriorityColors })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showDueDates">Show Due Dates</Label>
                  <Switch
                    id="showDueDates"
                    checked={value.style.showDueDates}
                    onCheckedChange={(showDueDates) => updateStyle({ showDueDates })}
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Refresh Tab */}
        <TabsContent value="refresh" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Auto Refresh</h3>
            <p className="text-sm text-muted-foreground">
              Tasks widget typically doesn't need auto-refresh since it's manually managed.
            </p>
            
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
                  Tasks will refresh every {Math.round(value.refresh.interval / 60000)} minutes
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
