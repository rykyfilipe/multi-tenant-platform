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
import { Textarea } from "@/components/ui/textarea";

// Custom widget configuration schema - very flexible
const customConfigSchema = z.object({
  settings: z.object({
    title: z.string().default("Custom Widget"),
    description: z.string().default(""),
    customCode: z.string().default(""),
    contentType: z.enum(["text", "html", "markdown", "json"]).default("text"),
    allowEdit: z.boolean().default(false),
    showBorder: z.boolean().default(true),
    enableScrolling: z.boolean().default(true),
    maxHeight: z.number().min(100).max(1000).default(300),
  }),
  style: z.object({
    theme: z.enum(["premium-light", "premium-dark", "minimal", "luxury"]).default("premium-light"),
    backgroundColor: z.string().default("#ffffff"),
    textColor: z.string().default("#000000"),
    borderColor: z.string().default("#e5e7eb"),
    borderRadius: z.enum(["none", "sm", "md", "lg", "full"]).default("md"),
    shadow: z.enum(["none", "sm", "md", "lg"]).default("sm"),
    padding: z.enum(["tight", "comfortable", "spacious"]).default("comfortable"),
    alignment: z.enum(["left", "center", "right"]).default("left"),
    fontSize: z.enum(["xs", "sm", "md", "lg", "xl"]).default("md"),
    fontFamily: z.enum(["sans", "serif", "mono"]).default("sans"),
    lineHeight: z.enum(["tight", "normal", "relaxed"]).default("normal"),
  }),
  refresh: z.object({
    enabled: z.boolean().default(false),
    interval: z.number().default(300000), // 5 minutes
  }),
});

type CustomConfig = z.infer<typeof customConfigSchema>;

interface CustomWidgetEditorProps {
  value: CustomConfig;
  onChange: (value: CustomConfig) => void;
  tenantId: number;
}

export const CustomWidgetEditor: React.FC<CustomWidgetEditorProps> = ({
  value,
  onChange,
  tenantId,
}) => {
  const updateSettings = (updates: Partial<CustomConfig["settings"]>) => {
    onChange({
      ...value,
      settings: { ...value.settings, ...updates },
    });
  };

  const updateStyle = (updates: Partial<CustomConfig["style"]>) => {
    onChange({
      ...value,
      style: { ...value.style, ...updates },
    });
  };

  const updateRefresh = (updates: Partial<CustomConfig["refresh"]>) => {
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
            <h3 className="text-sm font-medium">Custom Widget Configuration</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Widget Title</Label>
                <Input
                  id="title"
                  value={value.settings.title}
                  onChange={(e) => updateSettings({ title: e.target.value })}
                  placeholder="Custom Widget"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={value.settings.description}
                  onChange={(e) => updateSettings({ description: e.target.value })}
                  placeholder="Describe what this widget displays..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select
                    value={value.settings.contentType}
                    onValueChange={(contentType) => updateSettings({ contentType: contentType as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxHeight">Max Height (px)</Label>
                  <Input
                    id="maxHeight"
                    type="number"
                    min="100"
                    max="1000"
                    value={value.settings.maxHeight}
                    onChange={(e) => updateSettings({ maxHeight: parseInt(e.target.value) || 300 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customCode">Custom Content</Label>
                <Textarea
                  id="customCode"
                  value={value.settings.customCode}
                  onChange={(e) => updateSettings({ customCode: e.target.value })}
                  placeholder="Enter your custom content here..."
                  rows={6}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Content type: {value.settings.contentType.toUpperCase()}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Behavior Options</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allowEdit">Allow Inline Editing</Label>
                    <Switch
                      id="allowEdit"
                      checked={value.settings.allowEdit}
                      onCheckedChange={(allowEdit) => updateSettings({ allowEdit })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showBorder">Show Border</Label>
                    <Switch
                      id="showBorder"
                      checked={value.settings.showBorder}
                      onCheckedChange={(showBorder) => updateSettings({ showBorder })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableScrolling">Enable Scrolling</Label>
                    <Switch
                      id="enableScrolling"
                      checked={value.settings.enableScrolling}
                      onCheckedChange={(enableScrolling) => updateSettings({ enableScrolling })}
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
                <Label htmlFor="alignment">Text Alignment</Label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Select
                  value={value.style.fontSize}
                  onValueChange={(fontSize: "xs" | "sm" | "md" | "lg" | "xl") => updateStyle({ fontSize })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="xs">Extra Small</SelectItem>
                    <SelectItem value="sm">Small</SelectItem>
                    <SelectItem value="md">Medium</SelectItem>
                    <SelectItem value="lg">Large</SelectItem>
                    <SelectItem value="xl">Extra Large</SelectItem>
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

            <div className="space-y-2">
              <Label htmlFor="lineHeight">Line Height</Label>
              <Select
                value={value.style.lineHeight}
                onValueChange={(lineHeight: "tight" | "normal" | "relaxed") => updateStyle({ lineHeight })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
          </div>
        </TabsContent>

        {/* Refresh Tab */}
        <TabsContent value="refresh" className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Auto Refresh</h3>
            <p className="text-sm text-muted-foreground">
              Custom widgets typically don't need auto-refresh unless they display dynamic content.
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
                  Widget will refresh every {Math.round(value.refresh.interval / 60000)} minutes
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
