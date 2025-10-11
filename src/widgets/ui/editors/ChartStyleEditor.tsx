"use client";

import React, { useState } from "react";
import { z } from "zod";
import { chartStyleSchema } from "@/widgets/schemas/chart-v2";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Grid3x3, Type, Eye, Sparkles, ChevronDown, ChevronRight, Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSelector } from "./ThemeSelector";
import { ThemePreset } from "@/widgets/themes";

type ChartStyle = z.infer<typeof chartStyleSchema>;

interface ChartStyleEditorProps {
  value: ChartStyle;
  onChange: (value: ChartStyle) => void;
  chartType: "line" | "bar" | "area" | "pie" | "radar" | "scatter";
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

export const ChartStyleEditor: React.FC<ChartStyleEditorProps> = ({ value, onChange, chartType }) => {
  // Ensure all nested objects exist with defaults (backward compatibility)
  const safeValue: ChartStyle = {
    ...value,
    backgroundOpacity: value.backgroundOpacity ?? 1,
    borderRadius: typeof value.borderRadius === 'string' ? 8 : (value.borderRadius ?? 8),
    padding: typeof value.padding === 'string' ? { top: 20, right: 20, bottom: 20, left: 20 } : (value.padding || { top: 20, right: 20, bottom: 20, left: 20 }),
    line: value.line || { width: 2, tension: 0.4, style: "solid", cap: "round", join: "round", gradient: { enabled: false, startOpacity: 0.8, endOpacity: 0.1 } },
    points: value.points || { show: true, radius: 4, hoverRadius: 6, borderWidth: 2, borderColor: "#FFFFFF", style: "circle" },
    bars: value.bars || { borderRadius: 4, borderWidth: 0, barPercentage: 0.8, categoryPercentage: 0.9 },
    grid: value.grid || { show: true, color: "rgba(0, 0, 0, 0.1)", lineWidth: 1, drawBorder: true, drawOnChartArea: true, drawTicks: true, tickLength: 8, style: "solid", dashPattern: [5, 5] },
    axes: value.axes || { x: { show: true, color: "#666666", fontSize: 12, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "400", rotation: 0, labelOffset: 10 }, y: { show: true, color: "#666666", fontSize: 12, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "400", labelOffset: 10 } },
    legend: value.legend || { show: true, position: "bottom", align: "center", fontSize: 12, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "400", color: "#333333", padding: 10, boxWidth: 40, boxHeight: 12 },
    tooltip: value.tooltip || { enabled: true, backgroundColor: "rgba(0, 0, 0, 0.8)", titleColor: "#FFFFFF", bodyColor: "#FFFFFF", borderColor: "rgba(255, 255, 255, 0.3)", borderWidth: 1, borderRadius: 6, padding: 12, fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" },
    animation: value.animation || { enabled: true, duration: 750, easing: "easeInOutQuad" },
  };

  const updateStyle = (updates: Partial<ChartStyle>) => {
    onChange({ ...safeValue, ...updates });
  };

  const updateNestedStyle = <K extends keyof ChartStyle>(
    key: K,
    updates: Partial<ChartStyle[K]>
  ) => {
    onChange({
      ...safeValue,
      [key]: { ...(safeValue[key] as any), ...updates },
    });
  };

  const showLineSettings = chartType === "line" || chartType === "area";
  const showBarSettings = chartType === "bar";

  return (
    <div className="space-y-4">
      <Tabs defaultValue="themes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="themes" className="text-xs">
            <Paintbrush className="h-3 w-3 mr-1" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="general" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="chart" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Chart
          </TabsTrigger>
          <TabsTrigger value="axes" className="text-xs">
            <Grid3x3 className="h-3 w-3 mr-1" />
            Axes
          </TabsTrigger>
          <TabsTrigger value="legend" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Legend
          </TabsTrigger>
          <TabsTrigger value="tooltip" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Tooltip
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
                Select a beautiful preset theme or customize your own styling
              </p>
            </div>
            
            <ThemeSelector
              currentTheme={value?.themeName}
              onThemeSelect={(themeName) => updateStyle({ themeName })}
              onApplyTheme={(theme: ThemePreset) => {
                // Apply all theme properties to the style
                const newStyle = {
                  ...safeValue,
                  themeName: theme.name,
                  backgroundColor: theme.chart.backgroundColor,
                  textColor: theme.chart.textColor,
                  borderColor: theme.chart.borderColor,
                  borderWidth: theme.chart.borderWidth,
                  borderRadius: theme.chart.borderRadius,
                  padding: theme.chart.padding,
                  shadow: theme.chart.shadow.enabled ? theme.chart.shadow.size : "none",
                  backgroundGradient: theme.chart.backgroundGradient,
                  line: { ...safeValue.line, color: theme.chart.line.color, width: theme.chart.line.width },
                  grid: { ...safeValue.grid, enabled: theme.chart.grid.enabled, color: theme.chart.grid.color, opacity: theme.chart.grid.opacity },
                  axes: { ...safeValue.axes, color: theme.chart.axes.color, fontSize: theme.chart.axes.fontSize, fontWeight: theme.chart.axes.fontWeight },
                };
                onChange(newStyle as any);
              }}
              widgetType="chart"
            />
          </div>
        </TabsContent>

        {/* ===== GENERAL TAB ===== */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Background & Container" 
            icon={<Sparkles className="h-4 w-4" />}
            defaultOpen={true}
          >
            <ColorPicker
              label="Background Color"
              value={safeValue.backgroundColor}
              onChange={(val) => updateStyle({ backgroundColor: val })}
            />
            <SliderInput
              label="Background Opacity"
              value={value?.backgroundOpacity || 1}
              onChange={(val) => updateStyle({ backgroundOpacity: val })}
              min={0}
              max={1}
              step={0.1}
            />
            <SliderInput
              label="Border Radius"
              value={safeValue.borderRadius}
              onChange={(val) => updateStyle({ borderRadius: val })}
              min={0}
              max={50}
              unit="px"
            />
          </CollapsibleSection>

          <CollapsibleSection 
            title="Padding" 
            icon={<Grid3x3 className="h-4 w-4" />}
          >
            <div className="grid grid-cols-2 gap-3">
              <SliderInput
                label="Top"
                value={safeValue.padding.top}
                onChange={(val) => updateNestedStyle('padding', { top: val })}
                min={0}
                max={100}
                unit="px"
              />
              <SliderInput
                label="Right"
                value={safeValue.padding.right}
                onChange={(val) => updateNestedStyle('padding', { right: val })}
                min={0}
                max={100}
                unit="px"
              />
              <SliderInput
                label="Bottom"
                value={safeValue.padding.bottom}
                onChange={(val) => updateNestedStyle('padding', { bottom: val })}
                min={0}
                max={100}
                unit="px"
              />
              <SliderInput
                label="Left"
                value={safeValue.padding.left}
                onChange={(val) => updateNestedStyle('padding', { left: val })}
                min={0}
                max={100}
                unit="px"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Animation" 
            icon={<Sparkles className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Enable Animations</Label>
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
                  max={5000}
                  step={50}
                  unit="ms"
                />
                <div className="space-y-2">
                  <Label>Easing Function</Label>
                  <Select
                    value={safeValue.animation.easing}
                    onValueChange={(val: any) => updateNestedStyle('animation', { easing: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="easeInQuad">Ease In Quad</SelectItem>
                      <SelectItem value="easeOutQuad">Ease Out Quad</SelectItem>
                      <SelectItem value="easeInOutQuad">Ease In Out Quad</SelectItem>
                      <SelectItem value="easeInCubic">Ease In Cubic</SelectItem>
                      <SelectItem value="easeOutCubic">Ease Out Cubic</SelectItem>
                      <SelectItem value="easeInOutCubic">Ease In Out Cubic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CollapsibleSection>
        </TabsContent>

        {/* ===== CHART TAB ===== */}
        <TabsContent value="chart" className="space-y-4 mt-4">
          {showLineSettings && (
            <CollapsibleSection 
              title="Line & Area Settings" 
              icon={<Palette className="h-4 w-4" />}
              defaultOpen={true}
            >
              <SliderInput
                label="Line Width"
                value={safeValue.line.width}
                onChange={(val) => updateNestedStyle('line', { width: val })}
                min={0.5}
                max={10}
                step={0.5}
                unit="px"
              />
              <SliderInput
                label="Curve Tension"
                value={safeValue.line.tension}
                onChange={(val) => updateNestedStyle('line', { tension: val })}
                min={0}
                max={1}
                step={0.1}
                description="0 = straight lines, 1 = maximum curve"
              />
              <div className="space-y-2">
                <Label>Line Style</Label>
                <Select
                  value={safeValue.line.style}
                  onValueChange={(val: any) => updateNestedStyle('line', { style: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <Label>Enable Gradient Fill</Label>
                  <Switch
                    checked={safeValue.line.gradient.enabled}
                    onCheckedChange={(val) => updateNestedStyle('line', { 
                      gradient: { ...value.line.gradient, enabled: val }
                    })}
                  />
                </div>
                {safeValue.line.gradient.enabled && (
                  <div className="space-y-3 pl-4">
                    <SliderInput
                      label="Start Opacity"
                      value={safeValue.line.gradient.startOpacity}
                      onChange={(val) => updateNestedStyle('line', { 
                        gradient: { ...safeValue.line.gradient, startOpacity: val }
                      })}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <SliderInput
                      label="End Opacity"
                      value={safeValue.line.gradient.endOpacity}
                      onChange={(val) => updateNestedStyle('line', { 
                        gradient: { ...safeValue.line.gradient, endOpacity: val }
                      })}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {showLineSettings && (
            <CollapsibleSection 
              title="Data Points" 
              icon={<Sparkles className="h-4 w-4" />}
            >
              <div className="flex items-center justify-between">
                <Label>Show Points</Label>
                <Switch
                  checked={safeValue.points.show}
                  onCheckedChange={(val) => updateNestedStyle('points', { show: val })}
                />
              </div>
              {safeValue.points.show && (
                <>
                  <SliderInput
                    label="Point Radius"
                    value={safeValue.points.radius}
                    onChange={(val) => updateNestedStyle('points', { radius: val })}
                    min={0}
                    max={20}
                    unit="px"
                  />
                  <SliderInput
                    label="Hover Radius"
                    value={safeValue.points.hoverRadius}
                    onChange={(val) => updateNestedStyle('points', { hoverRadius: val })}
                    min={0}
                    max={30}
                    unit="px"
                  />
                  <SliderInput
                    label="Border Width"
                    value={safeValue.points.borderWidth}
                    onChange={(val) => updateNestedStyle('points', { borderWidth: val })}
                    min={0}
                    max={10}
                    unit="px"
                  />
                  <ColorPicker
                    label="Border Color"
                    value={safeValue.points.borderColor}
                    onChange={(val) => updateNestedStyle('points', { borderColor: val })}
                  />
                  <div className="space-y-2">
                    <Label>Point Style</Label>
                    <Select
                      value={safeValue.points.style}
                      onValueChange={(val: any) => updateNestedStyle('points', { style: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="cross">Cross</SelectItem>
                        <SelectItem value="rect">Rectangle</SelectItem>
                        <SelectItem value="triangle">Triangle</SelectItem>
                        <SelectItem value="star">Star</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CollapsibleSection>
          )}

          {showBarSettings && (
            <CollapsibleSection 
              title="Bar Settings" 
              icon={<Palette className="h-4 w-4" />}
              defaultOpen={true}
            >
              <SliderInput
                label="Border Radius"
                value={safeValue.bars.borderRadius}
                onChange={(val) => updateNestedStyle('bars', { borderRadius: val })}
                min={0}
                max={50}
                unit="px"
              />
              <SliderInput
                label="Border Width"
                value={safeValue.bars.borderWidth}
                onChange={(val) => updateNestedStyle('bars', { borderWidth: val })}
                min={0}
                max={10}
                unit="px"
              />
              {safeValue.bars.borderWidth > 0 && (
                <ColorPicker
                  label="Border Color"
                  value={safeValue.bars.borderColor || "#000000"}
                  onChange={(val) => updateNestedStyle('bars', { borderColor: val })}
                />
              )}
              <SliderInput
                label="Bar Percentage"
                value={safeValue.bars.barPercentage}
                onChange={(val) => updateNestedStyle('bars', { barPercentage: val })}
                min={0.1}
                max={1}
                step={0.1}
                description="Width of bars relative to available space"
              />
              <SliderInput
                label="Category Percentage"
                value={safeValue.bars.categoryPercentage}
                onChange={(val) => updateNestedStyle('bars', { categoryPercentage: val })}
                min={0.1}
                max={1}
                step={0.1}
                description="Spacing between bar groups"
              />
            </CollapsibleSection>
          )}

          <CollapsibleSection 
            title="Grid" 
            icon={<Grid3x3 className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Show Grid</Label>
              <Switch
                checked={safeValue.grid.show}
                onCheckedChange={(val) => updateNestedStyle('grid', { show: val })}
              />
            </div>
            {safeValue.grid.show && (
              <>
                <ColorPicker
                  label="Grid Color"
                  value={safeValue.grid.color}
                  onChange={(val) => updateNestedStyle('grid', { color: val })}
                />
                <SliderInput
                  label="Line Width"
                  value={safeValue.grid.lineWidth}
                  onChange={(val) => updateNestedStyle('grid', { lineWidth: val })}
                  min={0}
                  max={5}
                  step={0.5}
                  unit="px"
                />
                <div className="space-y-2">
                  <Label>Grid Style</Label>
                  <Select
                    value={safeValue.grid.style}
                    onValueChange={(val: any) => updateNestedStyle('grid', { style: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </CollapsibleSection>
        </TabsContent>

        {/* ===== AXES TAB ===== */}
        <TabsContent value="axes" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="X Axis" 
            icon={<Type className="h-4 w-4" />}
            defaultOpen={true}
          >
            <div className="flex items-center justify-between">
              <Label>Show X Axis</Label>
              <Switch
                checked={safeValue.axes.x.show}
                onCheckedChange={(val) => updateNestedStyle('axes', { 
                  x: { ...value.axes.x, show: val }
                })}
              />
            </div>
            {safeValue.axes.x.show && (
              <>
                <ColorPicker
                  label="Text Color"
                  value={safeValue.axes.x.color}
                  onChange={(val) => updateNestedStyle('axes', { 
                    x: { ...safeValue.axes.x, color: val }
                  })}
                />
                <SliderInput
                  label="Font Size"
                  value={safeValue.axes.x.fontSize}
                  onChange={(val) => updateNestedStyle('axes', { 
                    x: { ...safeValue.axes.x, fontSize: val }
                  })}
                  min={8}
                  max={24}
                  unit="px"
                />
                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <Select
                    value={safeValue.axes.x.fontWeight}
                    onValueChange={(val: any) => updateNestedStyle('axes', { 
                      x: { ...safeValue.axes.x, fontWeight: val }
                    })}
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
                <SliderInput
                  label="Label Rotation"
                  value={safeValue.axes.x.rotation}
                  onChange={(val) => updateNestedStyle('axes', { 
                    x: { ...safeValue.axes.x, rotation: val }
                  })}
                  min={-90}
                  max={90}
                  unit="°"
                />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection 
            title="Y Axis" 
            icon={<Type className="h-4 w-4" />}
            defaultOpen={true}
          >
            <div className="flex items-center justify-between">
              <Label>Show Y Axis</Label>
              <Switch
                checked={safeValue.axes.y.show}
                onCheckedChange={(val) => updateNestedStyle('axes', { 
                  y: { ...value.axes.y, show: val }
                })}
              />
            </div>
            {safeValue.axes.y.show && (
              <>
                <ColorPicker
                  label="Text Color"
                  value={safeValue.axes.y.color}
                  onChange={(val) => updateNestedStyle('axes', { 
                    y: { ...safeValue.axes.y, color: val }
                  })}
                />
                <SliderInput
                  label="Font Size"
                  value={safeValue.axes.y.fontSize}
                  onChange={(val) => updateNestedStyle('axes', { 
                    y: { ...safeValue.axes.y, fontSize: val }
                  })}
                  min={8}
                  max={24}
                  unit="px"
                />
                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <Select
                    value={safeValue.axes.y.fontWeight}
                    onValueChange={(val: any) => updateNestedStyle('axes', { 
                      y: { ...safeValue.axes.y, fontWeight: val }
                    })}
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
              </>
            )}
          </CollapsibleSection>
        </TabsContent>

        {/* ===== LEGEND TAB ===== */}
        <TabsContent value="legend" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Legend Settings" 
            icon={<Type className="h-4 w-4" />}
            defaultOpen={true}
          >
            <div className="flex items-center justify-between">
              <Label>Show Legend</Label>
              <Switch
                checked={safeValue.legend.show}
                onCheckedChange={(val) => updateNestedStyle('legend', { show: val })}
              />
            </div>
            {safeValue.legend.show && (
              <>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select
                    value={safeValue.legend.position}
                    onValueChange={(val: any) => updateNestedStyle('legend', { position: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Alignment</Label>
                  <Select
                    value={safeValue.legend.align}
                    onValueChange={(val: any) => updateNestedStyle('legend', { align: val })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Start</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="end">End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ColorPicker
                  label="Text Color"
                  value={safeValue.legend.color}
                  onChange={(val) => updateNestedStyle('legend', { color: val })}
                />
                <SliderInput
                  label="Font Size"
                  value={safeValue.legend.fontSize}
                  onChange={(val) => updateNestedStyle('legend', { fontSize: val })}
                  min={8}
                  max={24}
                  unit="px"
                />
                <div className="space-y-2">
                  <Label>Font Weight</Label>
                  <Select
                    value={safeValue.legend.fontWeight}
                    onValueChange={(val: any) => updateNestedStyle('legend', { fontWeight: val })}
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
              </>
            )}
          </CollapsibleSection>
        </TabsContent>

        {/* ===== TOOLTIP TAB ===== */}
        <TabsContent value="tooltip" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Tooltip Settings" 
            icon={<Eye className="h-4 w-4" />}
            defaultOpen={true}
          >
            <div className="flex items-center justify-between">
              <Label>Enable Tooltips</Label>
              <Switch
                checked={safeValue.tooltip.enabled}
                onCheckedChange={(val) => updateNestedStyle('tooltip', { enabled: val })}
              />
            </div>
            {safeValue.tooltip.enabled && (
              <>
                <ColorPicker
                  label="Background Color"
                  value={safeValue.tooltip.backgroundColor}
                  onChange={(val) => updateNestedStyle('tooltip', { backgroundColor: val })}
                />
                <ColorPicker
                  label="Title Color"
                  value={safeValue.tooltip.titleColor}
                  onChange={(val) => updateNestedStyle('tooltip', { titleColor: val })}
                />
                <ColorPicker
                  label="Body Color"
                  value={safeValue.tooltip.bodyColor}
                  onChange={(val) => updateNestedStyle('tooltip', { bodyColor: val })}
                />
                <SliderInput
                  label="Border Radius"
                  value={safeValue.tooltip.borderRadius}
                  onChange={(val) => updateNestedStyle('tooltip', { borderRadius: val })}
                  min={0}
                  max={20}
                  unit="px"
                />
                <SliderInput
                  label="Padding"
                  value={safeValue.tooltip.padding}
                  onChange={(val) => updateNestedStyle('tooltip', { padding: val })}
                  min={0}
                  max={30}
                  unit="px"
                />
                <SliderInput
                  label="Font Size"
                  value={safeValue.tooltip.fontSize}
                  onChange={(val) => updateNestedStyle('tooltip', { fontSize: val })}
                  min={8}
                  max={24}
                  unit="px"
                />
              </>
            )}
          </CollapsibleSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};

