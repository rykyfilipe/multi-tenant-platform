"use client";

import React from "react";
import { z } from "zod";
import { notesWidgetConfigSchemaV1 } from "@/widgets/schemas/notes-v1";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings as SettingsIcon, 
  Palette,
  Layout,
  Zap,
  Info
} from "lucide-react";

interface NotesWidgetEditorProps {
  value: z.infer<typeof notesWidgetConfigSchemaV1>;
  onChange: (value: z.infer<typeof notesWidgetConfigSchemaV1>) => void;
  tenantId: number;
}

export const NotesWidgetEditor: React.FC<NotesWidgetEditorProps> = ({ 
  value, 
  onChange 
}) => {
  const updateSettings = (updates: Partial<typeof value.settings>) => {
    onChange({
      ...value,
      settings: { ...value.settings, ...updates },
    });
  };

  const updateStyle = (updates: Partial<typeof value.style>) => {
    onChange({
      ...value,
      style: { ...value.style, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="features">
            <Zap className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="style">
            <Palette className="h-4 w-4 mr-2" />
            Style
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
              <CardDescription>Configure what to show in notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showDates">Show Dates</Label>
                <Switch
                  id="showDates"
                  checked={value.settings.showDates}
                  onCheckedChange={(checked) => updateSettings({ showDates: checked })}
                />
              </div>

              <div>
                <Label>Date Format</Label>
                <Select
                  value={value.settings.dateFormat}
                  onValueChange={(val) => updateSettings({ dateFormat: val as any })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relative">Relative (2h ago)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showPinnedFirst">Show Pinned First</Label>
                <Switch
                  id="showPinnedFirst"
                  checked={value.settings.showPinnedFirst}
                  onCheckedChange={(checked) => updateSettings({ showPinnedFirst: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>Control editing and deletion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="allowInlineEdit">Allow Inline Edit</Label>
                <Switch
                  id="allowInlineEdit"
                  checked={value.settings.allowInlineEdit}
                  onCheckedChange={(checked) => updateSettings({ allowInlineEdit: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allowDelete">Allow Delete</Label>
                <Switch
                  id="allowDelete"
                  checked={value.settings.allowDelete}
                  onCheckedChange={(checked) => updateSettings({ allowDelete: checked })}
                />
              </div>

              <div>
                <Label>Max Notes: {value.settings.maxNotes}</Label>
                <Slider
                  value={[value.settings.maxNotes]}
                  onValueChange={([val]) => updateSettings({ maxNotes: val })}
                  min={1}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
              <CardDescription>Default settings for new notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Default Color</Label>
                <Select
                  value={value.settings.defaultColor}
                  onValueChange={(val) => updateSettings({ defaultColor: val as any })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yellow">🟡 Yellow (Classic)</SelectItem>
                    <SelectItem value="blue">🔵 Blue</SelectItem>
                    <SelectItem value="green">🟢 Green</SelectItem>
                    <SelectItem value="pink">🩷 Pink</SelectItem>
                    <SelectItem value="purple">🟣 Purple</SelectItem>
                    <SelectItem value="gray">⚪ Gray</SelectItem>
                    <SelectItem value="orange">🟠 Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab - Level 2 & 3 */}
        <TabsContent value="features" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Enable advanced features for your notes widget
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Level 2 Features</CardTitle>
              <CardDescription>Intermediate functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableSearch">Search Notes</Label>
                  <p className="text-xs text-muted-foreground">Enable search bar for filtering notes</p>
                </div>
                <Switch
                  id="enableSearch"
                  checked={value.settings.enableSearch}
                  onCheckedChange={(checked) => updateSettings({ enableSearch: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableTags">Tags & Categories</Label>
                  <p className="text-xs text-muted-foreground">Allow tagging notes with #tags</p>
                </div>
                <Switch
                  id="enableTags"
                  checked={value.settings.enableTags}
                  onCheckedChange={(checked) => updateSettings({ enableTags: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enablePinning">Pin Notes</Label>
                  <p className="text-xs text-muted-foreground">Pin important notes to the top</p>
                </div>
                <Switch
                  id="enablePinning"
                  checked={value.settings.enablePinning}
                  onCheckedChange={(checked) => updateSettings({ enablePinning: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableChecklists">Checklists</Label>
                  <p className="text-xs text-muted-foreground">Create task lists with checkboxes</p>
                </div>
                <Switch
                  id="enableChecklists"
                  checked={value.settings.enableChecklists}
                  onCheckedChange={(checked) => updateSettings({ enableChecklists: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Level 3 Features</CardTitle>
              <CardDescription>Advanced functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableMarkdown">Markdown Support</Label>
                  <p className="text-xs text-muted-foreground">Write notes in Markdown format</p>
                </div>
                <Switch
                  id="enableMarkdown"
                  checked={value.settings.enableMarkdown}
                  onCheckedChange={(checked) => updateSettings({ enableMarkdown: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableReminders" className="opacity-50">Reminders (Coming Soon)</Label>
                  <p className="text-xs text-muted-foreground opacity-50">Set reminders for notes</p>
                </div>
                <Switch
                  id="enableReminders"
                  checked={value.settings.enableReminders}
                  onCheckedChange={(checked) => updateSettings({ enableReminders: checked })}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableLinking" className="opacity-50">Link Widgets (Coming Soon)</Label>
                  <p className="text-xs text-muted-foreground opacity-50">Link notes to other widgets</p>
                </div>
                <Switch
                  id="enableLinking"
                  checked={value.settings.enableLinking}
                  onCheckedChange={(checked) => updateSettings({ enableLinking: checked })}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Layout Configuration</CardTitle>
              <CardDescription>Configure how notes are displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Layout Type</Label>
                <Select
                  value={value.settings.layout}
                  onValueChange={(val) => updateSettings({ layout: val as any })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="masonry">Masonry (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {value.settings.layout === "grid" && (
                <div>
                  <Label>Grid Columns: {value.settings.columns}</Label>
                  <Slider
                    value={[value.settings.columns]}
                    onValueChange={([val]) => updateSettings({ columns: val })}
                    min={1}
                    max={4}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Responsive: 1 col on mobile, {Math.min(value.settings.columns, 2)} on tablet, {value.settings.columns} on desktop
                  </p>
                </div>
              )}

              <div>
                <Label>Gap Between Notes: {value.style.gap}px</Label>
                <Slider
                  value={[value.style.gap]}
                  onValueChange={([val]) => updateStyle({ gap: val })}
                  min={0}
                  max={50}
                  step={2}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Card Styling</CardTitle>
              <CardDescription>Customize note card appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Border Radius: {value.style.cardBorderRadius}px</Label>
                <Slider
                  value={[value.style.cardBorderRadius]}
                  onValueChange={([val]) => updateStyle({ cardBorderRadius: val })}
                  min={0}
                  max={50}
                  step={2}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Card Padding: {value.style.cardPadding}px</Label>
                <Slider
                  value={[value.style.cardPadding]}
                  onValueChange={([val]) => updateStyle({ cardPadding: val })}
                  min={0}
                  max={50}
                  step={2}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Shadow</Label>
                <Select
                  value={value.style.cardShadow}
                  onValueChange={(val) => updateStyle({ cardShadow: val as any })}
                >
                  <SelectTrigger className="mt-2">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Font sizes for notes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title Font Size: {value.style.titleFontSize}px</Label>
                <Slider
                  value={[value.style.titleFontSize]}
                  onValueChange={([val]) => updateStyle({ titleFontSize: val })}
                  min={12}
                  max={32}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Content Font Size: {value.style.contentFontSize}px</Label>
                <Slider
                  value={[value.style.contentFontSize]}
                  onValueChange={([val]) => updateStyle({ contentFontSize: val })}
                  min={10}
                  max={24}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Font Family</Label>
                <Select
                  value={value.style.fontFamily}
                  onValueChange={(val) => updateStyle({ fontFamily: val })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, system-ui, sans-serif">Inter (Default)</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia (Serif)</SelectItem>
                    <SelectItem value="Courier New, monospace">Courier New (Mono)</SelectItem>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Comic Sans MS, cursive">Comic Sans (Fun)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
