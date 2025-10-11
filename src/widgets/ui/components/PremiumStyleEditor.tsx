"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumTheme, ChartPremiumStyle, KPIPremiumStyle, TablePremiumStyle } from "@/widgets/styles/premiumStyles";
import { Palette, Sparkles, Layout, Eye } from "lucide-react";

interface PremiumStyleEditorProps {
  widgetType: 'chart' | 'kpi' | 'table' | 'weather' | 'clock' | 'tasks';
  value: any;
  onChange: (value: any) => void;
}

export const PremiumStyleEditor: React.FC<PremiumStyleEditorProps> = ({
  widgetType,
  value,
  onChange,
}) => {
  const updateStyle = (updates: Partial<any>) => {
    onChange({
      ...value,
      ...updates,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Premium Themes
          </CardTitle>
          <CardDescription>
            Choose from elegant, luxury themes for your widget
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Selection */}
          <div className="space-y-2">
            <Label htmlFor="theme">Widget Theme</Label>
            <Select
              value={value.theme || 'transparent'}
              onValueChange={(theme: PremiumTheme) => updateStyle({ theme })}
            >
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transparent">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-dashed border-gray-400" />
                    <span>Transparent (Clean)</span>
                  </div>
                </SelectItem>
                <SelectItem value="glass">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white/10 backdrop-blur-sm border border-white/20" />
                    <span>Glass (Modern)</span>
                  </div>
                </SelectItem>
                <SelectItem value="minimal">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-gray-300" />
                    <span>Minimal (Simple)</span>
                  </div>
                </SelectItem>
                <SelectItem value="luxury">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-yellow-700 to-yellow-900 border border-yellow-600" />
                    <span>Luxury (Gold)</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark-elegant">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-900 border border-gray-700" />
                    <span>Dark Elegant</span>
                  </div>
                </SelectItem>
                <SelectItem value="light-premium">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-white border border-gray-200 shadow-sm" />
                    <span>Light Premium</span>
                  </div>
                </SelectItem>
                <SelectItem value="gradient-soft">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-400/20 to-pink-400/20 border border-purple-300" />
                    <span>Gradient Soft</span>
                  </div>
                </SelectItem>
                <SelectItem value="neo-brutalism">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-none bg-white border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]" />
                    <span>Neo Brutalism</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Premium themes control the overall look and feel of your widget
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart-specific styles */}
      {widgetType === 'chart' && (
        <ChartStyleEditor value={value} onChange={updateStyle} />
      )}

      {/* KPI-specific styles */}
      {widgetType === 'kpi' && (
        <KPIStyleEditor value={value} onChange={updateStyle} />
      )}

      {/* Table-specific styles */}
      {widgetType === 'table' && (
        <TableStyleEditor value={value} onChange={updateStyle} />
      )}
    </div>
  );
};

// Chart-specific style editor
const ChartStyleEditor: React.FC<{
  value: ChartPremiumStyle;
  onChange: (value: Partial<ChartPremiumStyle>) => void;
}> = ({ value, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Chart Styling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Background & Transparency */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="transparentBg">Transparent Background</Label>
            <Switch
              id="transparentBg"
              checked={value.transparentBackground ?? false}
              onCheckedChange={(transparentBackground) => onChange({ transparentBackground })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Makes chart background fully transparent - perfect for overlaying on dashboards
          </p>
        </div>

        {!value.transparentBackground && (
          <div className="flex items-center justify-between">
            <Label htmlFor="showBg">Show Background</Label>
            <Switch
              id="showBg"
              checked={value.showBackground ?? true}
              onCheckedChange={(showBackground) => onChange({ showBackground })}
            />
          </div>
        )}

        {/* Grid Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="gridOpacity">Grid Opacity</Label>
            <span className="text-sm text-muted-foreground">
              {Math.round((value.gridOpacity ?? 0.1) * 100)}%
            </span>
          </div>
          <Slider
            id="gridOpacity"
            min={0}
            max={1}
            step={0.1}
            value={[value.gridOpacity ?? 0.1]}
            onValueChange={([gridOpacity]) => onChange({ gridOpacity })}
          />
          <p className="text-xs text-muted-foreground">
            Control the visibility of grid lines
          </p>
        </div>

        {/* Axis Style */}
        <div className="space-y-2">
          <Label htmlFor="axisStyle">Axis Style</Label>
          <Select
            value={value.axisStyle || 'solid'}
            onValueChange={(axisStyle: any) => onChange({ axisStyle })}
          >
            <SelectTrigger id="axisStyle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="dashed">Dashed</SelectItem>
              <SelectItem value="dotted">Dotted</SelectItem>
              <SelectItem value="none">None (Invisible)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="showLegend">Show Legend</Label>
            <Switch
              id="showLegend"
              checked={value.showLegend ?? true}
              onCheckedChange={(showLegend) => onChange({ showLegend })}
            />
          </div>

          {value.showLegend && (
            <div className="space-y-2 pl-6">
              <Label htmlFor="legendPos">Legend Position</Label>
              <Select
                value={value.legendPosition || 'top'}
                onValueChange={(legendPosition: any) => onChange({ legendPosition })}
              >
                <SelectTrigger id="legendPos">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="bottom">Bottom</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Color Scheme */}
        <div className="space-y-2">
          <Label htmlFor="colorScheme">Color Scheme</Label>
          <Select
            value={value.colorScheme || 'default'}
            onValueChange={(colorScheme: any) => onChange({ colorScheme })}
          >
            <SelectTrigger id="colorScheme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default (Vibrant)</SelectItem>
              <SelectItem value="pastel">Pastel (Soft)</SelectItem>
              <SelectItem value="vibrant">Vibrant (Bold)</SelectItem>
              <SelectItem value="monochrome">Monochrome (Grayscale)</SelectItem>
              <SelectItem value="luxury">Luxury (Gold/Silver)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Animation Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="animDuration">Animation Duration</Label>
            <span className="text-sm text-muted-foreground">
              {value.animationDuration ?? 750}ms
            </span>
          </div>
          <Slider
            id="animDuration"
            min={0}
            max={2000}
            step={50}
            value={[value.animationDuration ?? 750]}
            onValueChange={([animationDuration]) => onChange({ animationDuration })}
          />
        </div>
      </CardContent>
    </Card>
  );
};

// KPI-specific style editor
const KPIStyleEditor: React.FC<{
  value: KPIPremiumStyle;
  onChange: (value: Partial<KPIPremiumStyle>) => void;
}> = ({ value, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5" />
          KPI Styling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Layout */}
        <div className="space-y-2">
          <Label htmlFor="kpiLayout">Layout Style</Label>
          <Select
            value={value.layout || 'compact'}
            onValueChange={(layout: any) => onChange({ layout })}
          >
            <SelectTrigger id="kpiLayout">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Icon Style */}
        <div className="space-y-2">
          <Label htmlFor="iconStyle">Icon Style</Label>
          <Select
            value={value.iconStyle || 'outline'}
            onValueChange={(iconStyle: any) => onChange({ iconStyle })}
          >
            <SelectTrigger id="iconStyle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="filled">Filled</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Number Size */}
        <div className="space-y-2">
          <Label htmlFor="numSize">Number Size</Label>
          <Select
            value={value.numberSize || 'lg'}
            onValueChange={(numberSize: any) => onChange({ numberSize })}
          >
            <SelectTrigger id="numSize">
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

        {/* Show Trend */}
        <div className="flex items-center justify-between">
          <Label htmlFor="showTrend">Show Trend Indicator</Label>
          <Switch
            id="showTrend"
            checked={value.showTrend ?? true}
            onCheckedChange={(showTrend) => onChange({ showTrend })}
          />
        </div>

        {/* Show Sparkline */}
        <div className="flex items-center justify-between">
          <Label htmlFor="showSparkline">Show Sparkline Chart</Label>
          <Switch
            id="showSparkline"
            checked={value.showSparkline ?? false}
            onCheckedChange={(showSparkline) => onChange({ showSparkline })}
          />
        </div>

        {/* Accent Position */}
        <div className="space-y-2">
          <Label htmlFor="accentPos">Accent Bar Position</Label>
          <Select
            value={value.accentPosition || 'top'}
            onValueChange={(accentPosition: any) => onChange({ accentPosition })}
          >
            <SelectTrigger id="accentPos">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="top">Top</SelectItem>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="bottom">Bottom</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

// Table-specific style editor
const TableStyleEditor: React.FC<{
  value: TablePremiumStyle;
  onChange: (value: Partial<TablePremiumStyle>) => void;
}> = ({ value, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Table Styling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Style */}
        <div className="space-y-2">
          <Label htmlFor="headerStyle">Header Style</Label>
          <Select
            value={value.headerStyle || 'bold'}
            onValueChange={(headerStyle: any) => onChange({ headerStyle })}
          >
            <SelectTrigger id="headerStyle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="subtle">Subtle</SelectItem>
              <SelectItem value="accent">Accent Color</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Row Hover */}
        <div className="flex items-center justify-between">
          <Label htmlFor="rowHover">Row Hover Effect</Label>
          <Switch
            id="rowHover"
            checked={value.rowHover ?? true}
            onCheckedChange={(rowHover) => onChange({ rowHover })}
          />
        </div>

        {/* Striped Rows */}
        <div className="flex items-center justify-between">
          <Label htmlFor="stripedRows">Striped Rows</Label>
          <Switch
            id="stripedRows"
            checked={value.stripedRows ?? false}
            onCheckedChange={(stripedRows) => onChange({ stripedRows })}
          />
        </div>

        {/* Border Style */}
        <div className="space-y-2">
          <Label htmlFor="borderStyle">Border Style</Label>
          <Select
            value={value.borderStyle || 'horizontal'}
            onValueChange={(borderStyle: any) => onChange({ borderStyle })}
          >
            <SelectTrigger id="borderStyle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Borders</SelectItem>
              <SelectItem value="horizontal">Horizontal Only</SelectItem>
              <SelectItem value="vertical">Vertical Only</SelectItem>
              <SelectItem value="none">No Borders</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cell Padding */}
        <div className="space-y-2">
          <Label htmlFor="cellPadding">Cell Padding</Label>
          <Select
            value={value.cellPadding || 'normal'}
            onValueChange={(cellPadding: any) => onChange({ cellPadding })}
          >
            <SelectTrigger id="cellPadding">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="relaxed">Relaxed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <Label htmlFor="fontSize">Font Size</Label>
          <Select
            value={value.fontSize || 'md'}
            onValueChange={(fontSize: any) => onChange({ fontSize })}
          >
            <SelectTrigger id="fontSize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

