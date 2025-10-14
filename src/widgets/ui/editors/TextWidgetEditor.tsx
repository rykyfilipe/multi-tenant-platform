"use client";

import React from "react";
import { z } from "zod";
import { textWidgetConfigSchemaV1 } from "@/widgets/schemas/text-v1";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Type, 
  Palette, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold,
  Italic,
  Underline
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TextWidgetEditorProps {
  value: z.infer<typeof textWidgetConfigSchemaV1>;
  onChange: (value: z.infer<typeof textWidgetConfigSchemaV1>) => void;
  tenantId: number;
}

export const TextWidgetEditor: React.FC<TextWidgetEditorProps> = ({ 
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

  // Font size options
  const fontSizeOptions = [
    { value: 'small', label: 'Small (14px)', size: 14 },
    { value: 'normal', label: 'Normal (16px)', size: 16 },
    { value: 'large', label: 'Large (24px)', size: 24 },
    { value: 'xlarge', label: 'Extra Large (32px)', size: 32 },
  ];

  const currentFontSize = typeof value.settings.fontSize === 'number' 
    ? value.settings.fontSize 
    : fontSizeOptions.find(opt => opt.value === value.settings.fontSize)?.size || 16;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="content">
            <Type className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="style">
            <Palette className="h-4 w-4 mr-2" />
            Style
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Text Content</CardTitle>
              <CardDescription>Edit your text content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={value.settings.content}
                  onChange={(e) => updateSettings({ content: e.target.value })}
                  placeholder="Enter your text..."
                  className="mt-2 min-h-[120px] font-mono"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Formatting</CardTitle>
              <CardDescription>Text formatting options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Bold, Italic, Underline */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Label htmlFor="bold" className="cursor-pointer flex items-center gap-2">
                    <Bold className="h-4 w-4" />
                    Bold
                  </Label>
                  <Switch
                    id="bold"
                    checked={value.settings.bold}
                    onCheckedChange={(checked) => updateSettings({ bold: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Label htmlFor="italic" className="cursor-pointer flex items-center gap-2">
                    <Italic className="h-4 w-4" />
                    Italic
                  </Label>
                  <Switch
                    id="italic"
                    checked={value.settings.italic}
                    onCheckedChange={(checked) => updateSettings({ italic: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Label htmlFor="underline" className="cursor-pointer flex items-center gap-2">
                    <Underline className="h-4 w-4" />
                    Underline
                  </Label>
                  <Switch
                    id="underline"
                    checked={value.settings.underline}
                    onCheckedChange={(checked) => updateSettings({ underline: checked })}
                  />
                </div>
              </div>

              {/* Alignment */}
              <div>
                <Label>Text Alignment</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { value: 'left', icon: AlignLeft, label: 'Left' },
                    { value: 'center', icon: AlignCenter, label: 'Center' },
                    { value: 'right', icon: AlignRight, label: 'Right' },
                    { value: 'justify', icon: AlignJustify, label: 'Justify' },
                  ].map(({ value: alignValue, icon: Icon, label }) => (
                    <button
                      key={alignValue}
                      onClick={() => updateSettings({ alignment: alignValue as any })}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 border rounded-lg transition-all",
                        value.settings.alignment === alignValue
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <Label>Font Size</Label>
                <Select
                  value={typeof value.settings.fontSize === 'string' ? value.settings.fontSize : 'custom'}
                  onValueChange={(val) => {
                    if (val === 'custom') {
                      updateSettings({ fontSize: currentFontSize });
                    } else {
                      updateSettings({ fontSize: val as any });
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Font Size Slider */}
              {typeof value.settings.fontSize === 'number' && (
                <div>
                  <Label>Custom Size: {value.settings.fontSize}px</Label>
                  <Slider
                    value={[value.settings.fontSize]}
                    onValueChange={([val]) => updateSettings({ fontSize: val })}
                    min={8}
                    max={120}
                    step={1}
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Style Tab */}
        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
              <CardDescription>Text and background colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={value.style.textColor}
                    onChange={(e) => updateStyle({ textColor: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={value.style.textColor}
                    onChange={(e) => updateStyle({ textColor: e.target.value })}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="backgroundColor">Background Color</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={value.style.backgroundColor === 'transparent' ? '#ffffff' : value.style.backgroundColor}
                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    value={value.style.backgroundColor}
                    onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                    className="flex-1"
                    placeholder="transparent"
                  />
                </div>
              </div>

              <div>
                <Label>Background Opacity: {Math.round(value.style.backgroundOpacity * 100)}%</Label>
                <Slider
                  value={[value.style.backgroundOpacity]}
                  onValueChange={([val]) => updateStyle({ backgroundOpacity: val })}
                  min={0}
                  max={1}
                  step={0.05}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Container</CardTitle>
              <CardDescription>Padding, border, and shadow</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Padding</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <Label className="text-xs">Top: {value.style.padding.top}px</Label>
                    <Slider
                      value={[value.style.padding.top]}
                      onValueChange={([val]) => updateStyle({ 
                        padding: { ...value.style.padding, top: val } 
                      })}
                      min={0}
                      max={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Right: {value.style.padding.right}px</Label>
                    <Slider
                      value={[value.style.padding.right]}
                      onValueChange={([val]) => updateStyle({ 
                        padding: { ...value.style.padding, right: val } 
                      })}
                      min={0}
                      max={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bottom: {value.style.padding.bottom}px</Label>
                    <Slider
                      value={[value.style.padding.bottom]}
                      onValueChange={([val]) => updateStyle({ 
                        padding: { ...value.style.padding, bottom: val } 
                      })}
                      min={0}
                      max={100}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Left: {value.style.padding.left}px</Label>
                    <Slider
                      value={[value.style.padding.left]}
                      onValueChange={([val]) => updateStyle({ 
                        padding: { ...value.style.padding, left: val } 
                      })}
                      min={0}
                      max={100}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Border Radius: {value.style.borderRadius}px</Label>
                <Slider
                  value={[value.style.borderRadius]}
                  onValueChange={([val]) => updateStyle({ borderRadius: val })}
                  min={0}
                  max={50}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="borderEnabled">Show Border</Label>
                <Switch
                  id="borderEnabled"
                  checked={value.style.border.enabled}
                  onCheckedChange={(checked) => updateStyle({ 
                    border: { ...value.style.border, enabled: checked } 
                  })}
                />
              </div>

              {value.style.border.enabled && (
                <div>
                  <Label htmlFor="borderColor">Border Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="borderColor"
                      type="color"
                      value={value.style.border.color}
                      onChange={(e) => updateStyle({ 
                        border: { ...value.style.border, color: e.target.value } 
                      })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={value.style.border.color}
                      onChange={(e) => updateStyle({ 
                        border: { ...value.style.border, color: e.target.value } 
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="shadowEnabled">Show Shadow</Label>
                <Switch
                  id="shadowEnabled"
                  checked={value.style.shadow.enabled}
                  onCheckedChange={(checked) => updateStyle({ 
                    shadow: { ...value.style.shadow, enabled: checked } 
                  })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Advanced text styling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Line Height: {value.style.lineHeight}</Label>
                <Slider
                  value={[value.style.lineHeight]}
                  onValueChange={([val]) => updateStyle({ lineHeight: val })}
                  min={0.8}
                  max={3}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Letter Spacing: {value.style.letterSpacing}px</Label>
                <Slider
                  value={[value.style.letterSpacing]}
                  onValueChange={([val]) => updateStyle({ letterSpacing: val })}
                  min={-2}
                  max={10}
                  step={0.5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
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
                    <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                    <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
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

