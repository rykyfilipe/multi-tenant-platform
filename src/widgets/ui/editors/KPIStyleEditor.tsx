"use client";

import React, { useState } from "react";
import { z } from "zod";
import { kpiStyleSchema } from "@/widgets/schemas/kpi-v2";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Type, TrendingUp, Sparkles, ChevronDown, ChevronRight, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSelector } from "./ThemeSelector";
import { ThemePreset } from "@/widgets/themes";

type KPIStyle = z.infer<typeof kpiStyleSchema>;

interface KPIStyleEditorProps {
  value: KPIStyle;
  onChange: (value: KPIStyle) => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border/60 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-card hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-card border-t border-border/60 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ label, value, onChange, description }) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  description?: string;
}

const SliderInput: React.FC<SliderInputProps> = ({ 
  label, 
  value, 
  onChange, 
  min, 
  max, 
  step = 1,
  unit = "",
  description 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-sm text-muted-foreground">{value}{unit}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

export const KPIStyleEditor: React.FC<KPIStyleEditorProps> = ({ value, onChange }) => {
  // Ensure all nested objects exist with defaults
  const safeValue: KPIStyle = {
    backgroundColor: value.backgroundColor || "#FFFFFF",
    borderRadius: typeof value.borderRadius === 'string' ? 12 : (value.borderRadius ?? 12),
    backgroundGradient: value.backgroundGradient || { enabled: false, from: "#FFFFFF", to: "#F3F4F6", direction: "to-br" },
    border: value.border || { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" },
    shadow: value.shadow || { enabled: true, size: "sm", color: "rgba(0, 0, 0, 0.1)" },
    padding: typeof value.padding === 'string' ? { x: 24, y: 20 } : (value.padding || { x: 24, y: 20 }),
    value: value.value || { fontSize: 36, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "700", color: "#111827", gradient: { enabled: false, from: "#3B82F6", to: "#8B5CF6" } },
    label: value.label || { fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "500", color: "#6B7280", textTransform: "none", letterSpacing: 0 },
    trend: value.trend || { positive: { color: "#10B981", backgroundColor: "rgba(16, 185, 129, 0.1)", iconSize: 16 }, negative: { color: "#EF4444", backgroundColor: "rgba(239, 68, 68, 0.1)", iconSize: 16 }, fontSize: 12, fontWeight: "600", showIcon: true, showPercentage: true },
    icon: value.icon || { enabled: false, size: 24, color: "#3B82F6", backgroundColor: "rgba(59, 130, 246, 0.1)", position: "left" },
    hover: value.hover || { enabled: true, scale: 1.02, shadow: true, transition: 200 },
    animation: value.animation || { enabled: true, duration: 500, delay: 0 },
  };

  const updateStyle = (updates: Partial<KPIStyle>) => {
    onChange({ ...safeValue, ...updates });
  };

  const updateNestedStyle = <K extends keyof KPIStyle>(
    key: K,
    updates: Partial<KPIStyle[K]>
  ) => {
    onChange({
      ...safeValue,
      [key]: { ...(safeValue[key] as any), ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="themes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="themes" className="text-xs">
            <Paintbrush className="h-3 w-3 mr-1" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="card" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            Card
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Content
          </TabsTrigger>
          <TabsTrigger value="trend" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trend
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Effects
          </TabsTrigger>
        </TabsList>

        {/* ===== THEMES TAB ===== */}
        <TabsContent value="themes" className="space-y-4 mt-4">
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
                <Paintbrush className="h-5 w-5" />
                Choose a Theme
              </h3>
              <p className="text-sm text-muted-foreground">
                Select a beautiful preset theme to transform your KPI widget
              </p>
            </div>
            
            <ThemeSelector
              currentTheme={value?.themeName}
              onThemeSelect={(themeName) => updateStyle({ themeName })}
              onApplyTheme={(theme: ThemePreset) => {
                // Apply ALL theme properties
                const newStyle = {
                  ...safeValue,
                  themeName: theme.name,
                  // Container
                  backgroundColor: theme.kpi.backgroundColor,
                  textColor: theme.kpi.textColor,
                  borderColor: theme.kpi.borderColor,
                  borderRadius: theme.kpi.borderRadius,
                  padding: theme.kpi.padding,
                  shadow: theme.kpi.shadow.enabled ? { 
                    enabled: true, 
                    size: theme.kpi.shadow.size, 
                    color: theme.kpi.shadow.color 
                  } : { enabled: false, size: "md", color: "rgba(0, 0, 0, 0.1)" },
                  // Value styling
                  value: {
                    ...safeValue.value,
                    color: theme.kpi.value.color,
                    fontSize: theme.kpi.value.fontSize,
                    fontWeight: theme.kpi.value.fontWeight === "bold" ? "700" :
                                theme.kpi.value.fontWeight === "semibold" ? "600" :
                                theme.kpi.value.fontWeight === "medium" ? "500" : "400"
                  },
                  // Label styling
                  label: {
                    ...safeValue.label,
                    color: theme.kpi.label.color,
                    fontSize: theme.kpi.label.fontSize,
                    fontWeight: theme.kpi.label.fontWeight === "medium" ? "500" : "400"
                  },
                  // Trend styling
                  trend: {
                    ...safeValue.trend,
                    positiveColor: theme.kpi.trend.positiveColor,
                    negativeColor: theme.kpi.trend.negativeColor
                  }
                };
                onChange(newStyle as any);
              }}
              widgetType="kpi"
            />
          </div>
        </TabsContent>

        {/* ===== CARD TAB ===== */}
        <TabsContent value="card" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Background" 
            icon={<Sparkles className="h-4 w-4" />}
            defaultOpen={true}
          >
            <ColorPicker
              label="Background Color"
              value={value.backgroundColor}
              onChange={(val) => updateStyle({ backgroundColor: val })}
            />
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label>Enable Gradient</Label>
                <Switch
                  checked={safeValue.backgroundGradient.enabled}
                  onCheckedChange={(val) => updateNestedStyle('backgroundGradient', { enabled: val })}
                />
              </div>
              {safeValue.backgroundGradient.enabled && (
                <div className="space-y-3 pl-4">
                  <ColorPicker
                    label="From"
                    value={safeValue.backgroundGradient.from}
                    onChange={(val) => updateNestedStyle('backgroundGradient', { from: val })}
                  />
                  <ColorPicker
                    label="To"
                    value={safeValue.backgroundGradient.to}
                    onChange={(val) => updateNestedStyle('backgroundGradient', { to: val })}
                  />
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      value={safeValue.backgroundGradient.direction}
                      onValueChange={(val: any) => updateNestedStyle('backgroundGradient', { direction: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to-r">Left to Right</SelectItem>
                        <SelectItem value="to-br">Top-Left to Bottom-Right</SelectItem>
                        <SelectItem value="to-b">Top to Bottom</SelectItem>
                        <SelectItem value="to-bl">Top-Right to Bottom-Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Border & Shadow" 
            icon={<Target className="h-4 w-4" />}
          >
            <SliderInput
              label="Border Radius"
              value={safeValue.borderRadius}
              onChange={(val) => updateStyle({ borderRadius: val })}
              min={0}
              max={50}
              unit="px"
            />
            <div className="flex items-center justify-between">
              <Label>Show Border</Label>
              <Switch
                checked={safeValue.border.enabled}
                onCheckedChange={(val) => updateNestedStyle('border', { enabled: val })}
              />
            </div>
            {safeValue.border.enabled && (
              <>
                <SliderInput
                  label="Border Width"
                  value={safeValue.border.width}
                  onChange={(val) => updateNestedStyle('border', { width: val })}
                  min={0}
                  max={10}
                  unit="px"
                />
                <ColorPicker
                  label="Border Color"
                  value={safeValue.border.color}
                  onChange={(val) => updateNestedStyle('border', { color: val })}
                />
              </>
            )}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label>Show Shadow</Label>
                <Switch
                  checked={safeValue.shadow.enabled}
                  onCheckedChange={(val) => updateNestedStyle('shadow', { enabled: val })}
                />
              </div>
              {safeValue.shadow.enabled && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Shadow Size</Label>
                    <Select
                      value={safeValue.shadow.size}
                      onValueChange={(val: any) => updateNestedStyle('shadow', { size: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Padding" 
            icon={<Target className="h-4 w-4" />}
          >
            <div className="grid grid-cols-2 gap-3">
              <SliderInput
                label="Horizontal"
                value={safeValue.padding.x}
                onChange={(val) => updateNestedStyle('padding', { x: val })}
                min={0}
                max={100}
                unit="px"
              />
              <SliderInput
                label="Vertical"
                value={safeValue.padding.y}
                onChange={(val) => updateNestedStyle('padding', { y: val })}
                min={0}
                max={100}
                unit="px"
              />
            </div>
          </CollapsibleSection>
        </TabsContent>

        {/* ===== CONTENT TAB ===== */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Value Styling" 
            icon={<Type className="h-4 w-4" />}
            defaultOpen={true}
          >
            <SliderInput
              label="Font Size"
              value={safeValue.value.fontSize}
              onChange={(val) => updateNestedStyle('value', { fontSize: val })}
              min={16}
              max={80}
              unit="px"
            />
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={safeValue.value.fontWeight}
                onValueChange={(val: any) => updateNestedStyle('value', { fontWeight: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="400">Regular</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semibold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                  <SelectItem value="800">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ColorPicker
              label="Text Color"
              value={safeValue.value.color}
              onChange={(val) => updateNestedStyle('value', { color: val })}
            />
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label>Gradient Text</Label>
                <Switch
                  checked={safeValue.value.gradient.enabled}
                  onCheckedChange={(val) => updateNestedStyle('value', { 
                    gradient: { ...value.value.gradient, enabled: val }
                  })}
                />
              </div>
              {safeValue.value.gradient.enabled && (
                <div className="space-y-3 pl-4">
                  <ColorPicker
                    label="From"
                    value={safeValue.value.gradient.from}
                    onChange={(val) => updateNestedStyle('value', { 
                      gradient: { ...safeValue.value.gradient, from: val }
                    })}
                  />
                  <ColorPicker
                    label="To"
                    value={safeValue.value.gradient.to}
                    onChange={(val) => updateNestedStyle('value', { 
                      gradient: { ...safeValue.value.gradient, to: val }
                    })}
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Label Styling" 
            icon={<Type className="h-4 w-4" />}
          >
            <SliderInput
              label="Font Size"
              value={safeValue.label.fontSize}
              onChange={(val) => updateNestedStyle('label', { fontSize: val })}
              min={8}
              max={24}
              unit="px"
            />
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={safeValue.label.fontWeight}
                onValueChange={(val: any) => updateNestedStyle('label', { fontWeight: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light</SelectItem>
                  <SelectItem value="400">Regular</SelectItem>
                  <SelectItem value="500">Medium</SelectItem>
                  <SelectItem value="600">Semibold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ColorPicker
              label="Text Color"
              value={safeValue.label.color}
              onChange={(val) => updateNestedStyle('label', { color: val })}
            />
            <div className="space-y-2">
              <Label>Text Transform</Label>
              <Select
                value={safeValue.label.textTransform}
                onValueChange={(val: any) => updateNestedStyle('label', { textTransform: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="uppercase">UPPERCASE</SelectItem>
                  <SelectItem value="lowercase">lowercase</SelectItem>
                  <SelectItem value="capitalize">Capitalize</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SliderInput
              label="Letter Spacing"
              value={safeValue.label.letterSpacing}
              onChange={(val) => updateNestedStyle('label', { letterSpacing: val })}
              min={-2}
              max={5}
              step={0.1}
              unit="px"
            />
          </CollapsibleSection>
        </TabsContent>

        {/* ===== TREND TAB ===== */}
        <TabsContent value="trend" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Positive Trend" 
            icon={<TrendingUp className="h-4 w-4" />}
            defaultOpen={true}
          >
            <ColorPicker
              label="Text Color"
              value={safeValue.trend.positive.color}
              onChange={(val) => updateNestedStyle('trend', { 
                positive: { ...value.trend.positive, color: val }
              })}
            />
            <ColorPicker
              label="Background Color"
              value={safeValue.trend.positive.backgroundColor}
              onChange={(val) => updateNestedStyle('trend', { 
                positive: { ...value.trend.positive, backgroundColor: val }
              })}
            />
            <SliderInput
              label="Icon Size"
              value={safeValue.trend.positive.iconSize}
              onChange={(val) => updateNestedStyle('trend', { 
                positive: { ...value.trend.positive, iconSize: val }
              })}
              min={12}
              max={32}
              unit="px"
            />
          </CollapsibleSection>

          <CollapsibleSection 
            title="Negative Trend" 
            icon={<TrendingUp className="h-4 w-4 rotate-180" />}
          >
            <ColorPicker
              label="Text Color"
              value={safeValue.trend.negative.color}
              onChange={(val) => updateNestedStyle('trend', { 
                negative: { ...value.trend.negative, color: val }
              })}
            />
            <ColorPicker
              label="Background Color"
              value={safeValue.trend.negative.backgroundColor}
              onChange={(val) => updateNestedStyle('trend', { 
                negative: { ...value.trend.negative, backgroundColor: val }
              })}
            />
            <SliderInput
              label="Icon Size"
              value={safeValue.trend.negative.iconSize}
              onChange={(val) => updateNestedStyle('trend', { 
                negative: { ...value.trend.negative, iconSize: val }
              })}
              min={12}
              max={32}
              unit="px"
            />
          </CollapsibleSection>

          <CollapsibleSection 
            title="Trend Options" 
            icon={<Sparkles className="h-4 w-4" />}
          >
            <SliderInput
              label="Font Size"
              value={safeValue.trend.fontSize}
              onChange={(val) => updateNestedStyle('trend', { fontSize: val })}
              min={10}
              max={24}
              unit="px"
            />
            <div className="flex items-center justify-between">
              <Label>Show Icon</Label>
              <Switch
                checked={safeValue.trend.showIcon}
                onCheckedChange={(val) => updateNestedStyle('trend', { showIcon: val })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Percentage</Label>
              <Switch
                checked={safeValue.trend.showPercentage}
                onCheckedChange={(val) => updateNestedStyle('trend', { showPercentage: val })}
              />
            </div>
          </CollapsibleSection>
        </TabsContent>

        {/* ===== EFFECTS TAB ===== */}
        <TabsContent value="effects" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Hover Effect" 
            icon={<Sparkles className="h-4 w-4" />}
            defaultOpen={true}
          >
            <div className="flex items-center justify-between">
              <Label>Enable Hover</Label>
              <Switch
                checked={safeValue.hover.enabled}
                onCheckedChange={(val) => updateNestedStyle('hover', { enabled: val })}
              />
            </div>
              {safeValue.hover.enabled && (
              <>
                <SliderInput
                  label="Scale"
                  value={safeValue.hover.scale}
                  onChange={(val) => updateNestedStyle('hover', { scale: val })}
                  min={1}
                  max={1.2}
                  step={0.01}
                />
                <div className="flex items-center justify-between">
                  <Label>Shadow on Hover</Label>
                  <Switch
                    checked={safeValue.hover.shadow}
                    onCheckedChange={(val) => updateNestedStyle('hover', { shadow: val })}
                  />
                </div>
                <SliderInput
                  label="Transition"
                  value={safeValue.hover.transition}
                  onChange={(val) => updateNestedStyle('hover', { transition: val })}
                  min={0}
                  max={1000}
                  step={50}
                  unit="ms"
                />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection 
            title="Animation" 
            icon={<Sparkles className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Enable Animation</Label>
              <Switch
                checked={safeValue.animation.enabled}
                onCheckedChange={(val) => updateNestedStyle('animation', { enabled: val })}
              />
            </div>
              {safeValue.animation.enabled && (
              <>
                <SliderInput
                  label="Duration"
                  value={safeValue.animation.duration}
                  onChange={(val) => updateNestedStyle('animation', { duration: val })}
                  min={0}
                  max={2000}
                  step={50}
                  unit="ms"
                />
                <SliderInput
                  label="Delay"
                  value={safeValue.animation.delay}
                  onChange={(val) => updateNestedStyle('animation', { delay: val })}
                  min={0}
                  max={1000}
                  step={50}
                  unit="ms"
                />
              </>
            )}
          </CollapsibleSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};

