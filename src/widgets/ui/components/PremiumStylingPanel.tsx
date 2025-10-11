"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Eye, Layout, Type } from "lucide-react";
import { cn } from "@/lib/utils";

// Premium styling options specific to each widget type
export interface PremiumStyleOptions {
  // Common options for all widgets
  transparentBackground?: boolean;
  showBorders?: boolean;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  borderWidth?: 'thin' | 'normal' | 'thick';
  borderColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  
  // Background options
  backgroundColor?: string;
  backgroundOpacity?: number;
  gradientBackground?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDirection?: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-br' | 'to-bl';
  
  // Typography
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  fontWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  textColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose';
  
  // Table-specific
  headerStyle?: 'solid' | 'transparent' | 'gradient';
  headerBg?: string;
  headerTextColor?: string;
  stripedRows?: boolean;
  alternateRowBg?: string;
  hoverEffect?: boolean;
  cellPadding?: 'compact' | 'normal' | 'comfortable';
  showHeader?: boolean;
  showFooter?: boolean;
  rowTextColor?: string;
  
  // Chart-specific
  axisColor?: string;
  gridColor?: string;
  gridOpacity?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  chartColors?: string[];
  smoothCurves?: boolean;
  fillOpacity?: number;
  
  // KPI-specific
  showIcon?: boolean;
  iconPosition?: 'left' | 'top';
  valueSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  showTrend?: boolean;
  trendPosition?: 'inline' | 'below';
  compactMode?: boolean;
}

interface PremiumStylingPanelProps {
  widgetType: 'chart' | 'table' | 'kpi' | 'tasks' | 'clock' | 'weather';
  value: PremiumStyleOptions;
  onChange: (value: PremiumStyleOptions) => void;
}

export const PremiumStylingPanel: React.FC<PremiumStylingPanelProps> = ({
  widgetType,
  value,
  onChange,
}) => {
  const updateStyle = (updates: Partial<PremiumStyleOptions>) => {
    onChange({ ...value, ...updates });
  };

  return (
    <div className="space-y-6">
      {/* Common Styling Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Background & Container
          </CardTitle>
          <CardDescription>
            Premium container styling options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transparent Background */}
          <div className="flex items-center justify-between">
            <Label htmlFor="transparentBg" className="flex flex-col gap-1">
              <span>Transparent Background</span>
              <span className="font-normal text-xs text-muted-foreground">
                Remove background for a clean, minimalist look
              </span>
            </Label>
            <Switch
              id="transparentBg"
              checked={value.transparentBackground || false}
              onCheckedChange={(checked) => updateStyle({ transparentBackground: checked })}
            />
          </div>

          {/* Borders */}
          <div className="flex items-center justify-between">
            <Label htmlFor="showBorders">Show Borders</Label>
            <Switch
              id="showBorders"
              checked={value.showBorders !== false}
              onCheckedChange={(checked) => updateStyle({ showBorders: checked })}
            />
          </div>

          {value.showBorders !== false && (
            <div className="grid grid-cols-2 gap-4 pl-6">
              <div className="space-y-2">
                <Label htmlFor="borderWidth" className="text-xs">Border Width</Label>
                <Select
                  value={value.borderWidth || 'normal'}
                  onValueChange={(val: any) => updateStyle({ borderWidth: val })}
                >
                  <SelectTrigger id="borderWidth" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thin">Thin</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="thick">Thick</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="borderStyle" className="text-xs">Border Style</Label>
                <Select
                  value={value.borderStyle || 'solid'}
                  onValueChange={(val: any) => updateStyle({ borderStyle: val })}
                >
                  <SelectTrigger id="borderStyle" className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Border Radius */}
          <div className="space-y-2">
            <Label htmlFor="borderRadius">Border Radius</Label>
            <Select
              value={value.borderRadius || 'lg'}
              onValueChange={(val: any) => updateStyle({ borderRadius: val })}
            >
              <SelectTrigger id="borderRadius">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Sharp)</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
                <SelectItem value="full">Full (Pill)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shadow */}
          <div className="space-y-2">
            <Label htmlFor="shadow">Shadow</Label>
            <Select
              value={value.shadow || 'md'}
              onValueChange={(val: any) => updateStyle({ shadow: val })}
            >
              <SelectTrigger id="shadow">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
                <SelectItem value="2xl">2X Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Padding */}
          <div className="space-y-2">
            <Label htmlFor="padding">Inner Padding</Label>
            <Select
              value={value.padding || 'md'}
              onValueChange={(val: any) => updateStyle({ padding: val })}
            >
              <SelectTrigger id="padding">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="sm">Small</SelectItem>
                <SelectItem value="md">Medium</SelectItem>
                <SelectItem value="lg">Large</SelectItem>
                <SelectItem value="xl">Extra Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Typography Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Type className="h-4 w-4" />
            Typography
          </CardTitle>
          <CardDescription>
            Text styling options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Font Size */}
            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={value.fontSize || 'sm'}
                onValueChange={(val: any) => updateStyle({ fontSize: val })}
              >
                <SelectTrigger id="fontSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xs">Extra Small</SelectItem>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Font Weight */}
            <div className="space-y-2">
              <Label htmlFor="fontWeight">Font Weight</Label>
              <Select
                value={value.fontWeight || 'normal'}
                onValueChange={(val: any) => updateStyle({ fontWeight: val })}
              >
                <SelectTrigger id="fontWeight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="semibold">Semi Bold</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table-Specific Options */}
      {widgetType === 'table' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layout className="h-4 w-4" />
              Table-Specific Styling
            </CardTitle>
            <CardDescription>
              Options specific to table widgets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Header Style */}
            <div className="space-y-2">
              <Label htmlFor="headerStyle">Header Style</Label>
              <Select
                value={value.headerStyle || 'solid'}
                onValueChange={(val: any) => updateStyle({ headerStyle: val })}
              >
                <SelectTrigger id="headerStyle">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="transparent">Transparent</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Striped Rows */}
            <div className="flex items-center justify-between">
              <Label htmlFor="stripedRows">Striped Rows</Label>
              <Switch
                id="stripedRows"
                checked={value.stripedRows || false}
                onCheckedChange={(checked) => updateStyle({ stripedRows: checked })}
              />
            </div>

            {/* Hover Effect */}
            <div className="flex items-center justify-between">
              <Label htmlFor="hoverEffect">Hover Effect</Label>
              <Switch
                id="hoverEffect"
                checked={value.hoverEffect !== false}
                onCheckedChange={(checked) => updateStyle({ hoverEffect: checked })}
              />
            </div>

            {/* Cell Padding */}
            <div className="space-y-2">
              <Label htmlFor="cellPadding">Cell Padding</Label>
              <Select
                value={value.cellPadding || 'normal'}
                onValueChange={(val: any) => updateStyle({ cellPadding: val })}
              >
                <SelectTrigger id="cellPadding">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Header/Footer */}
            <div className="flex items-center justify-between">
              <Label htmlFor="showHeader">Show Header</Label>
              <Switch
                id="showHeader"
                checked={value.showHeader !== false}
                onCheckedChange={(checked) => updateStyle({ showHeader: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="showFooter">Show Footer</Label>
              <Switch
                id="showFooter"
                checked={value.showFooter !== false}
                onCheckedChange={(checked) => updateStyle({ showFooter: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart-Specific Options */}
      {widgetType === 'chart' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layout className="h-4 w-4" />
              Chart-Specific Styling
            </CardTitle>
            <CardDescription>
              Options specific to chart widgets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show Grid */}
            <div className="flex items-center justify-between">
              <Label htmlFor="showGrid">Show Grid</Label>
              <Switch
                id="showGrid"
                checked={value.showGrid !== false}
                onCheckedChange={(checked) => updateStyle({ showGrid: checked })}
              />
            </div>

            {/* Grid Opacity */}
            {value.showGrid !== false && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="gridOpacity">Grid Opacity</Label>
                <Select
                  value={((value.gridOpacity || 0.2) * 100).toString()}
                  onValueChange={(val) => updateStyle({ gridOpacity: parseInt(val) / 100 })}
                >
                  <SelectTrigger id="gridOpacity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="70">70%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show Legend */}
            <div className="flex items-center justify-between">
              <Label htmlFor="showLegend">Show Legend</Label>
              <Switch
                id="showLegend"
                checked={value.showLegend !== false}
                onCheckedChange={(checked) => updateStyle({ showLegend: checked })}
              />
            </div>

            {/* Legend Position */}
            {value.showLegend !== false && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="legendPosition">Legend Position</Label>
                <Select
                  value={value.legendPosition || 'bottom'}
                  onValueChange={(val: any) => updateStyle({ legendPosition: val })}
                >
                  <SelectTrigger id="legendPosition">
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
            )}

            {/* Smooth Curves */}
            <div className="flex items-center justify-between">
              <Label htmlFor="smoothCurves">Smooth Curves</Label>
              <Switch
                id="smoothCurves"
                checked={value.smoothCurves !== false}
                onCheckedChange={(checked) => updateStyle({ smoothCurves: checked })}
              />
            </div>

            {/* Fill Opacity */}
            <div className="space-y-2">
              <Label htmlFor="fillOpacity">Fill Opacity</Label>
              <Select
                value={((value.fillOpacity || 0.6) * 100).toString()}
                onValueChange={(val) => updateStyle({ fillOpacity: parseInt(val) / 100 })}
              >
                <SelectTrigger id="fillOpacity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (No Fill)</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                  <SelectItem value="40">40%</SelectItem>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="80">80%</SelectItem>
                  <SelectItem value="100">100% (Solid)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI-Specific Options */}
      {widgetType === 'kpi' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layout className="h-4 w-4" />
              KPI-Specific Styling
            </CardTitle>
            <CardDescription>
              Options specific to KPI widgets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show Icon */}
            <div className="flex items-center justify-between">
              <Label htmlFor="showIcon">Show Icon</Label>
              <Switch
                id="showIcon"
                checked={value.showIcon !== false}
                onCheckedChange={(checked) => updateStyle({ showIcon: checked })}
              />
            </div>

            {/* Value Size */}
            <div className="space-y-2">
              <Label htmlFor="valueSize">Value Size</Label>
              <Select
                value={value.valueSize || 'xl'}
                onValueChange={(val: any) => updateStyle({ valueSize: val })}
              >
                <SelectTrigger id="valueSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                  <SelectItem value="xl">Extra Large</SelectItem>
                  <SelectItem value="2xl">2X Large</SelectItem>
                  <SelectItem value="3xl">3X Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show Trend */}
            <div className="flex items-center justify-between">
              <Label htmlFor="showTrend">Show Trend</Label>
              <Switch
                id="showTrend"
                checked={value.showTrend !== false}
                onCheckedChange={(checked) => updateStyle({ showTrend: checked })}
              />
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between">
              <Label htmlFor="compactMode">Compact Mode</Label>
              <Switch
                id="compactMode"
                checked={value.compactMode || false}
                onCheckedChange={(checked) => updateStyle({ compactMode: checked })}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

