"use client";

import React, { useState } from "react";
import { z } from "zod";
import { tableStyleSchema } from "@/widgets/schemas/table-v2";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table as TableIcon, Type, Eye, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type TableStyle = z.infer<typeof tableStyleSchema>;

interface TableStyleEditorProps {
  value: TableStyle;
  onChange: (value: TableStyle) => void;
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

export const TableStyleEditor: React.FC<TableStyleEditorProps> = ({ value, onChange }) => {
  // Ensure all nested objects exist with defaults (backward compatibility)
  const safeValue: TableStyle = {
    ...value,
    borderRadius: typeof value.borderRadius === 'string' ? 8 : (value.borderRadius ?? 8),
    border: value.border || { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" },
    header: value.header || { backgroundColor: "#F9FAFB", textColor: "#111827", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "600", textAlign: "left", textTransform: "none", letterSpacing: 0, padding: { x: 16, y: 12 }, borderBottom: { enabled: true, width: 2, color: "rgba(0, 0, 0, 0.1)" }, sticky: true },
    rows: value.rows || { fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "400", textColor: "#374151", textAlign: "left", padding: { x: 16, y: 12 }, minHeight: 48, alternateColors: { enabled: true, even: "#FFFFFF", odd: "#F9FAFB" }, hover: { enabled: true, backgroundColor: "#F3F4F6", transition: 150 }, borderBottom: { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.05)", style: "solid" } },
    cells: value.cells || { verticalBorder: { enabled: false, width: 1, color: "rgba(0, 0, 0, 0.05)" }, compact: false },
    selection: value.selection || { enabled: true, backgroundColor: "rgba(59, 130, 246, 0.1)", borderColor: "rgba(59, 130, 246, 0.5)", borderWidth: 2 },
    footer: value.footer || { backgroundColor: "#F9FAFB", textColor: "#111827", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "600", padding: { x: 16, y: 12 }, borderTop: { enabled: true, width: 2, color: "rgba(0, 0, 0, 0.1)" } },
    scrollbar: value.scrollbar || { width: 8, trackColor: "rgba(0, 0, 0, 0.05)", thumbColor: "rgba(0, 0, 0, 0.2)", thumbHoverColor: "rgba(0, 0, 0, 0.3)" },
    emptyState: value.emptyState || { textColor: "#9CA3AF", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif" },
  };

  const updateStyle = (updates: Partial<TableStyle>) => {
    onChange({ ...safeValue, ...updates });
  };

  const updateNestedStyle = <K extends keyof TableStyle>(
    key: K,
    updates: Partial<TableStyle[K]>
  ) => {
    onChange({
      ...safeValue,
      [key]: { ...(safeValue[key] as any), ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="general" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="header" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Header
          </TabsTrigger>
          <TabsTrigger value="rows" className="text-xs">
            <TableIcon className="h-3 w-3 mr-1" />
            Rows
          </TabsTrigger>
          <TabsTrigger value="cells" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Cells
          </TabsTrigger>
        </TabsList>

        {/* ===== GENERAL TAB ===== */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Container" 
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
              value={safeValue.backgroundOpacity}
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
            title="Table Border" 
            icon={<TableIcon className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Enable Border</Label>
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
                <div className="space-y-2">
                  <Label>Border Style</Label>
                  <Select
                    value={safeValue.border.style}
                    onValueChange={(val: any) => updateNestedStyle('border', { style: val })}
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

          <CollapsibleSection 
            title="Scrollbar" 
            icon={<Eye className="h-4 w-4" />}
          >
            <SliderInput
              label="Width"
                value={safeValue.scrollbar.width}
              onChange={(val) => updateNestedStyle('scrollbar', { width: val })}
              min={4}
              max={20}
              unit="px"
            />
            <ColorPicker
              label="Track Color"
                value={safeValue.scrollbar.trackColor}
              onChange={(val) => updateNestedStyle('scrollbar', { trackColor: val })}
            />
            <ColorPicker
              label="Thumb Color"
                value={safeValue.scrollbar.thumbColor}
              onChange={(val) => updateNestedStyle('scrollbar', { thumbColor: val })}
            />
            <ColorPicker
              label="Thumb Hover Color"
                value={safeValue.scrollbar.thumbHoverColor}
              onChange={(val) => updateNestedStyle('scrollbar', { thumbHoverColor: val })}
            />
          </CollapsibleSection>
        </TabsContent>

        {/* ===== HEADER TAB ===== */}
        <TabsContent value="header" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Header Style" 
            icon={<Type className="h-4 w-4" />}
            defaultOpen={true}
          >
            <ColorPicker
              label="Background Color"
              value={value.header.backgroundColor}
              onChange={(val) => updateNestedStyle('header', { backgroundColor: val })}
            />
            <ColorPicker
              label="Text Color"
              value={value.header.textColor}
              onChange={(val) => updateNestedStyle('header', { textColor: val })}
            />
            <SliderInput
              label="Font Size"
              value={value.header.fontSize}
              onChange={(val) => updateNestedStyle('header', { fontSize: val })}
              min={8}
              max={24}
              unit="px"
            />
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={safeValue.header.fontWeight}
                onValueChange={(val: any) => updateNestedStyle('header', { fontWeight: val })}
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
                  <SelectItem value="800">Extra Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <Select
                value={safeValue.header.textAlign}
                onValueChange={(val: any) => updateNestedStyle('header', { textAlign: val })}
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
            <div className="space-y-2">
              <Label>Text Transform</Label>
              <Select
                value={safeValue.header.textTransform}
                onValueChange={(val: any) => updateNestedStyle('header', { textTransform: val })}
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
              value={value.header.letterSpacing}
              onChange={(val) => updateNestedStyle('header', { letterSpacing: val })}
              min={-2}
              max={5}
              step={0.1}
              unit="px"
            />
          </CollapsibleSection>

          <CollapsibleSection 
            title="Header Padding" 
            icon={<Sparkles className="h-4 w-4" />}
          >
            <div className="grid grid-cols-2 gap-3">
              <SliderInput
                label="Horizontal"
                value={safeValue.header.padding.x}
                onChange={(val) => updateNestedStyle('header', { 
                  padding: { ...value.header.padding, x: val }
                })}
                min={0}
                max={50}
                unit="px"
              />
              <SliderInput
                label="Vertical"
                value={safeValue.header.padding.y}
                onChange={(val) => updateNestedStyle('header', { 
                  padding: { ...value.header.padding, y: val }
                })}
                min={0}
                max={50}
                unit="px"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Header Border" 
            icon={<TableIcon className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Bottom Border</Label>
              <Switch
                checked={value.header.borderBottom.enabled}
                onCheckedChange={(val) => updateNestedStyle('header', { 
                  borderBottom: { ...value.header.borderBottom, enabled: val }
                })}
              />
            </div>
            {value.header.borderBottom.enabled && (
              <>
                <SliderInput
                  label="Border Width"
                  value={safeValue.header.borderBottom.width}
                  onChange={(val) => updateNestedStyle('header', { 
                    borderBottom: { ...value.header.borderBottom, width: val }
                  })}
                  min={0}
                  max={10}
                  unit="px"
                />
                <ColorPicker
                  label="Border Color"
                  value={safeValue.header.borderBottom.color}
                  onChange={(val) => updateNestedStyle('header', { 
                    borderBottom: { ...value.header.borderBottom, color: val }
                  })}
                />
              </>
            )}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Label>Sticky Header</Label>
              <Switch
                checked={value.header.sticky}
                onCheckedChange={(val) => updateNestedStyle('header', { sticky: val })}
              />
            </div>
          </CollapsibleSection>
        </TabsContent>

        {/* ===== ROWS TAB ===== */}
        <TabsContent value="rows" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Row Typography" 
            icon={<Type className="h-4 w-4" />}
            defaultOpen={true}
          >
            <ColorPicker
              label="Text Color"
              value={value.rows.textColor}
              onChange={(val) => updateNestedStyle('rows', { textColor: val })}
            />
            <SliderInput
              label="Font Size"
              value={value.rows.fontSize}
              onChange={(val) => updateNestedStyle('rows', { fontSize: val })}
              min={8}
              max={24}
              unit="px"
            />
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={value.rows.fontWeight}
                onValueChange={(val: any) => updateNestedStyle('rows', { fontWeight: val })}
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
            <div className="space-y-2">
              <Label>Text Alignment</Label>
              <Select
                value={value.rows.textAlign}
                onValueChange={(val: any) => updateNestedStyle('rows', { textAlign: val })}
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
          </CollapsibleSection>

          <CollapsibleSection 
            title="Row Sizing & Padding" 
            icon={<Sparkles className="h-4 w-4" />}
          >
            <SliderInput
              label="Min Height"
              value={value.rows.minHeight}
              onChange={(val) => updateNestedStyle('rows', { minHeight: val })}
              min={20}
              max={200}
              unit="px"
            />
            <div className="grid grid-cols-2 gap-3">
              <SliderInput
                label="Horizontal"
                value={value.rows.padding.x}
                onChange={(val) => updateNestedStyle('rows', { 
                  padding: { ...value.rows.padding, x: val }
                })}
                min={0}
                max={50}
                unit="px"
              />
              <SliderInput
                label="Vertical"
                value={value.rows.padding.y}
                onChange={(val) => updateNestedStyle('rows', { 
                  padding: { ...value.rows.padding, y: val }
                })}
                min={0}
                max={50}
                unit="px"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Alternating Colors" 
            icon={<Sparkles className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Enable Alternating</Label>
              <Switch
                checked={value.rows.alternateColors.enabled}
                onCheckedChange={(val) => updateNestedStyle('rows', { 
                  alternateColors: { ...value.rows.alternateColors, enabled: val }
                })}
              />
            </div>
            {value.rows.alternateColors.enabled && (
              <>
                <ColorPicker
                  label="Even Row Color"
                  value={value.rows.alternateColors.even}
                  onChange={(val) => updateNestedStyle('rows', { 
                    alternateColors: { ...value.rows.alternateColors, even: val }
                  })}
                />
                <ColorPicker
                  label="Odd Row Color"
                  value={value.rows.alternateColors.odd}
                  onChange={(val) => updateNestedStyle('rows', { 
                    alternateColors: { ...value.rows.alternateColors, odd: val }
                  })}
                />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection 
            title="Hover Effect" 
            icon={<Eye className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Enable Hover</Label>
              <Switch
                checked={value.rows.hover.enabled}
                onCheckedChange={(val) => updateNestedStyle('rows', { 
                  hover: { ...value.rows.hover, enabled: val }
                })}
              />
            </div>
            {value.rows.hover.enabled && (
              <>
                <ColorPicker
                  label="Hover Background"
                  value={value.rows.hover.backgroundColor}
                  onChange={(val) => updateNestedStyle('rows', { 
                    hover: { ...value.rows.hover, backgroundColor: val }
                  })}
                />
                <SliderInput
                  label="Transition Duration"
                  value={value.rows.hover.transition}
                  onChange={(val) => updateNestedStyle('rows', { 
                    hover: { ...value.rows.hover, transition: val }
                  })}
                  min={0}
                  max={1000}
                  step={50}
                  unit="ms"
                />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection 
            title="Row Border" 
            icon={<TableIcon className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Bottom Border</Label>
              <Switch
                checked={value.rows.borderBottom.enabled}
                onCheckedChange={(val) => updateNestedStyle('rows', { 
                  borderBottom: { ...value.rows.borderBottom, enabled: val }
                })}
              />
            </div>
            {value.rows.borderBottom.enabled && (
              <>
                <SliderInput
                  label="Border Width"
                  value={value.rows.borderBottom.width}
                  onChange={(val) => updateNestedStyle('rows', { 
                    borderBottom: { ...value.rows.borderBottom, width: val }
                  })}
                  min={0}
                  max={10}
                  unit="px"
                />
                <ColorPicker
                  label="Border Color"
                  value={value.rows.borderBottom.color}
                  onChange={(val) => updateNestedStyle('rows', { 
                    borderBottom: { ...value.rows.borderBottom, color: val }
                  })}
                />
                <div className="space-y-2">
                  <Label>Border Style</Label>
                  <Select
                    value={value.rows.borderBottom.style}
                    onValueChange={(val: any) => updateNestedStyle('rows', { 
                      borderBottom: { ...value.rows.borderBottom, style: val }
                    })}
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

        {/* ===== CELLS TAB ===== */}
        <TabsContent value="cells" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Cell Borders" 
            icon={<TableIcon className="h-4 w-4" />}
            defaultOpen={true}
          >
            <div className="flex items-center justify-between">
              <Label>Vertical Borders</Label>
              <Switch
                checked={value.cells.verticalBorder.enabled}
                onCheckedChange={(val) => updateNestedStyle('cells', { 
                  verticalBorder: { ...value.cells.verticalBorder, enabled: val }
                })}
              />
            </div>
            {value.cells.verticalBorder.enabled && (
              <>
                <SliderInput
                  label="Border Width"
                  value={value.cells.verticalBorder.width}
                  onChange={(val) => updateNestedStyle('cells', { 
                    verticalBorder: { ...value.cells.verticalBorder, width: val }
                  })}
                  min={0}
                  max={10}
                  unit="px"
                />
                <ColorPicker
                  label="Border Color"
                  value={value.cells.verticalBorder.color}
                  onChange={(val) => updateNestedStyle('cells', { 
                    verticalBorder: { ...value.cells.verticalBorder, color: val }
                  })}
                />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection 
            title="Display Mode" 
            icon={<Eye className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <div>
                <Label>Compact Mode</Label>
                <p className="text-xs text-muted-foreground mt-1">Reduces padding for denser display</p>
              </div>
              <Switch
                checked={value.cells.compact}
                onCheckedChange={(val) => updateNestedStyle('cells', { compact: val })}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Selection Style" 
            icon={<Sparkles className="h-4 w-4" />}
          >
            <div className="flex items-center justify-between">
              <Label>Enable Selection</Label>
              <Switch
                checked={value.selection.enabled}
                onCheckedChange={(val) => updateNestedStyle('selection', { enabled: val })}
              />
            </div>
            {value.selection.enabled && (
              <>
                <ColorPicker
                  label="Background Color"
                  value={value.selection.backgroundColor}
                  onChange={(val) => updateNestedStyle('selection', { backgroundColor: val })}
                />
                <ColorPicker
                  label="Border Color"
                  value={value.selection.borderColor}
                  onChange={(val) => updateNestedStyle('selection', { borderColor: val })}
                />
                <SliderInput
                  label="Border Width"
                  value={value.selection.borderWidth}
                  onChange={(val) => updateNestedStyle('selection', { borderWidth: val })}
                  min={0}
                  max={5}
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

