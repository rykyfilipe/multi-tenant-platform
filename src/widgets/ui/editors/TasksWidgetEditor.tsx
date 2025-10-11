"use client";

import React from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksStyleEditor } from "./TasksStyleEditor";
import { tasksStyleSchema } from "@/widgets/schemas/tasks-v2";

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
  style: tasksStyleSchema,
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

  const updateRefresh = (updates: Partial<TasksConfig["refresh"]>) => {
    onChange({
      ...value,
      refresh: { ...value.refresh, ...updates },
    });
  };

  const updateStyle = (style: TasksConfig["style"]) => {
    onChange({
      ...value,
      style,
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

              <div className="space-y-2">
                <Label htmlFor="defaultPriority">Default Priority</Label>
                <Select
                  value={value.settings.defaultPriority}
                  onValueChange={(defaultPriority: any) => updateSettings({ defaultPriority })}
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

              <div className="space-y-2">
                <Label htmlFor="maxTasks">Maximum Tasks</Label>
                <Input
                  id="maxTasks"
                  type="number"
                  min="1"
                  max="100"
                  value={value.settings.maxTasks}
                  onChange={(e) => updateSettings({ maxTasks: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Display Options</h4>

              <div className="flex items-center justify-between">
                <Label htmlFor="showCompleted">Show Completed</Label>
                <Switch
                  id="showCompleted"
                  checked={value.settings.showCompleted}
                  onCheckedChange={(showCompleted) => updateSettings({ showCompleted })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showProgress">Show Progress</Label>
                <Switch
                  id="showProgress"
                  checked={value.settings.showProgress}
                  onCheckedChange={(showProgress) => updateSettings({ showProgress })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allowInlineEdit">Allow Inline Edit</Label>
                <Switch
                  id="allowInlineEdit"
                  checked={value.settings.allowInlineEdit}
                  onCheckedChange={(allowInlineEdit) => updateSettings({ allowInlineEdit })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allowDragReorder">Allow Drag Reorder</Label>
                <Switch
                  id="allowDragReorder"
                  checked={value.settings.allowDragReorder}
                  onCheckedChange={(allowDragReorder) => updateSettings({ allowDragReorder })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Widget Styling</h3>
            <p className="text-sm text-muted-foreground">
              Customize the appearance of your Tasks widget with advanced styling options.
            </p>
            <TasksStyleEditor
              value={value.style}
              onChange={updateStyle}
            />
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
                  Tasks refresh every {Math.round(value.refresh.interval / 60000)} minute(s)
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
