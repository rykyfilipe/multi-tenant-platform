"use client";

import React, { useState, useMemo } from "react";
import { z } from "zod";
import { tasksStyleSchema } from "@/widgets/schemas/tasks-v2";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Square, Flag, Type, Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type TasksStyle = z.infer<typeof tasksStyleSchema>;

interface TasksStyleEditorProps {
  value: TasksStyle;
  onChange: (value: TasksStyle) => void;
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
        <span className="text-sm text-muted-foreground">
          {value}{unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
};

export const TasksStyleEditor: React.FC<TasksStyleEditorProps> = ({ value, onChange }) => {
  // Create safe value with all nested objects initialized
  const safeValue: TasksStyle = useMemo(() => ({
    ...value,
    backgroundGradient: value.backgroundGradient || { enabled: false, from: "#FFFFFF", to: "#F3F4F6", direction: "to-br" },
    border: value.border || { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" },
    shadow: typeof value.shadow === 'object' ? value.shadow : { enabled: true, size: "md", color: "rgba(0, 0, 0, 0.1)" },
    padding: typeof value.padding === 'object' ? value.padding : { x: 24, y: 20 },
    taskCard: value.taskCard || {
      backgroundColor: "#FFFFFF",
      backgroundHover: "#F9FAFB",
      borderRadius: 8,
      border: { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" },
      shadow: { enabled: false, size: "sm" },
      padding: { x: 16, y: 12 },
      spacing: 12,
      completedStyle: { opacity: 0.6, backgroundColor: "#F9FAFB", strikethrough: true, blur: false },
      hover: { enabled: true, scale: 1.02, shadow: true, transition: 200 },
    },
    priority: value.priority || {
      showBadge: true,
      badgeStyle: "subtle",
      badgeRadius: 6,
      badgeSize: "sm",
      colors: {
        low: { background: "#E0F2FE", text: "#0369A1", border: "#0EA5E9" },
        medium: { background: "#FEF3C7", text: "#92400E", border: "#F59E0B" },
        high: { background: "#FED7AA", text: "#9A3412", border: "#F97316" },
        urgent: { background: "#FEE2E2", text: "#991B1B", border: "#EF4444" },
      },
      leftBorder: { enabled: true, width: 3 },
    },
    checkbox: value.checkbox || {
      size: 18,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: "#D1D5DB",
      checkedColor: "#10B981",
      checkedBackground: "#10B981",
    },
    typography: value.typography || {
      title: { fontSize: 16, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "500", color: "#111827", lineHeight: 1.5, letterSpacing: 0 },
      description: { fontSize: 13, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "400", color: "#6B7280", lineHeight: 1.4, maxLines: 2 },
      dueDate: { fontSize: 12, fontFamily: "Inter, system-ui, sans-serif", fontWeight: "400", color: "#9CA3AF", overdueColor: "#EF4444", todayColor: "#F59E0B" },
    },
    progressBar: value.progressBar || {
      enabled: true,
      height: 6,
      backgroundColor: "#E5E7EB",
      fillColor: "#10B981",
      borderRadius: 4,
      showPercentage: true,
      percentageFontSize: 11,
      percentageColor: "#6B7280",
      gradient: { enabled: false, from: "#10B981", to: "#059669" },
    },
    header: value.header || {
      backgroundColor: "transparent",
      borderBottom: { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)" },
      padding: { x: 0, y: 16 },
      title: { fontSize: 18, fontWeight: "600", color: "#111827" },
      stats: { show: true, fontSize: 13, color: "#6B7280" },
    },
    animation: value.animation || {
      enabled: true,
      duration: 300,
      easing: "easeOut",
      stagger: true,
      staggerDelay: 50,
    },
    interaction: value.interaction || {
      dragHandle: { show: true, color: "#D1D5DB", hoverColor: "#9CA3AF" },
      deleteButton: { show: true, color: "#EF4444", hoverColor: "#DC2626", size: 18 },
    },
    layout: value.layout || {
      maxWidth: 800,
      taskSpacing: 12,
      sectionSpacing: 24,
      compact: false,
    },
  }), [value]);

  const updateStyle = (updates: Partial<TasksStyle>) => {
    onChange({ ...value, ...updates });
  };

  const updateNested = <K extends keyof TasksStyle>(
    key: K,
    updates: Partial<TasksStyle[K]>
  ) => {
    onChange({
      ...value,
      [key]: { ...safeValue[key], ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="container" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="container" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Container
          </TabsTrigger>
          <TabsTrigger value="cards" className="text-xs">
            <Square className="h-3 w-3 mr-1" />
            Cards
          </TabsTrigger>
          <TabsTrigger value="priority" className="text-xs">
            <Flag className="h-3 w-3 mr-1" />
            Priority
          </TabsTrigger>
          <TabsTrigger value="typography" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Text
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Effects
          </TabsTrigger>
        </TabsList>

        {/* CONTAINER TAB */}
        <TabsContent value="container" className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <CollapsibleSection title="Background" icon={<Palette className="h-4 w-4" />} defaultOpen>
            <ColorPicker
              label="Background Color"
              value={safeValue.backgroundColor}
              onChange={(backgroundColor) => updateStyle({ backgroundColor })}
            />
            
            <SliderInput
              label="Opacity"
              value={safeValue.backgroundOpacity}
              onChange={(backgroundOpacity) => updateStyle({ backgroundOpacity })}
              min={0}
              max={1}
              step={0.1}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Background Gradient</Label>
                <Switch
                  checked={safeValue.backgroundGradient?.enabled}
                  onCheckedChange={(enabled) => updateNested('backgroundGradient', { enabled })}
                />
              </div>
              {safeValue.backgroundGradient?.enabled && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <ColorPicker
                    label="From"
                    value={safeValue.backgroundGradient.from}
                    onChange={(from) => updateNested('backgroundGradient', { from })}
                  />
                  <ColorPicker
                    label="To"
                    value={safeValue.backgroundGradient.to}
                    onChange={(to) => updateNested('backgroundGradient', { to })}
                  />
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      value={safeValue.backgroundGradient.direction}
                      onValueChange={(direction: any) => updateNested('backgroundGradient', { direction })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="to-t">Top</SelectItem>
                        <SelectItem value="to-tr">Top Right</SelectItem>
                        <SelectItem value="to-r">Right</SelectItem>
                        <SelectItem value="to-br">Bottom Right</SelectItem>
                        <SelectItem value="to-b">Bottom</SelectItem>
                        <SelectItem value="to-bl">Bottom Left</SelectItem>
                        <SelectItem value="to-l">Left</SelectItem>
                        <SelectItem value="to-tl">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Border" icon={<Square className="h-4 w-4" />}>
            <div className="flex items-center justify-between">
              <Label>Enable Border</Label>
              <Switch
                checked={safeValue.border?.enabled}
                onCheckedChange={(enabled) => updateNested('border', { enabled })}
              />
            </div>

            {safeValue.border?.enabled && (
              <>
                <SliderInput
                  label="Border Width"
                  value={safeValue.border.width}
                  onChange={(width) => updateNested('border', { width })}
                  min={0}
                  max={10}
                  unit="px"
                />
                <ColorPicker
                  label="Border Color"
                  value={safeValue.border.color}
                  onChange={(color) => updateNested('border', { color })}
                />
                <div className="space-y-2">
                  <Label>Border Style</Label>
                  <Select
                    value={safeValue.border.style}
                    onValueChange={(style: any) => updateNested('border', { style })}
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

            <SliderInput
              label="Border Radius"
              value={typeof safeValue.borderRadius === 'number' ? safeValue.borderRadius : 12}
              onChange={(borderRadius) => updateStyle({ borderRadius })}
              min={0}
              max={50}
              unit="px"
            />
          </CollapsibleSection>

          <CollapsibleSection title="Shadow" icon={<Sparkles className="h-4 w-4" />}>
            <div className="flex items-center justify-between">
              <Label>Enable Shadow</Label>
              <Switch
                checked={safeValue.shadow?.enabled}
                onCheckedChange={(enabled) => updateNested('shadow', { enabled })}
              />
            </div>

            {safeValue.shadow?.enabled && (
              <>
                <div className="space-y-2">
                  <Label>Shadow Size</Label>
                  <Select
                    value={safeValue.shadow.size}
                    onValueChange={(size: any) => updateNested('shadow', { size })}
                  >
                    <SelectTrigger>
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
                <ColorPicker
                  label="Shadow Color"
                  value={safeValue.shadow.color}
                  onChange={(color) => updateNested('shadow', { color })}
                />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Padding" icon={<Square className="h-4 w-4" />}>
            <SliderInput
              label="Horizontal Padding"
              value={safeValue.padding?.x || 24}
              onChange={(x) => updateNested('padding', { x })}
              min={0}
              max={100}
              unit="px"
            />
            <SliderInput
              label="Vertical Padding"
              value={safeValue.padding?.y || 20}
              onChange={(y) => updateNested('padding', { y })}
              min={0}
              max={100}
              unit="px"
            />
          </CollapsibleSection>
        </TabsContent>

        {/* CARDS TAB */}
        <TabsContent value="cards" className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <CollapsibleSection title="Task Card Styling" icon={<Square className="h-4 w-4" />} defaultOpen>
            <ColorPicker
              label="Background Color"
              value={safeValue.taskCard?.backgroundColor || "#FFFFFF"}
              onChange={(backgroundColor) => updateNested('taskCard', { backgroundColor })}
            />
            <ColorPicker
              label="Hover Background"
              value={safeValue.taskCard?.backgroundHover || "#F9FAFB"}
              onChange={(backgroundHover) => updateNested('taskCard', { backgroundHover })}
            />
            <SliderInput
              label="Border Radius"
              value={safeValue.taskCard?.borderRadius || 8}
              onChange={(borderRadius) => updateNested('taskCard', { borderRadius })}
              min={0}
              max={30}
              unit="px"
            />
            <SliderInput
              label="Card Spacing"
              value={safeValue.taskCard?.spacing || 12}
              onChange={(spacing) => updateNested('taskCard', { spacing })}
              min={0}
              max={30}
              unit="px"
            />
          </CollapsibleSection>

          <CollapsibleSection title="Card Border" icon={<Square className="h-4 w-4" />}>
            <div className="flex items-center justify-between">
              <Label>Enable Border</Label>
              <Switch
                checked={safeValue.taskCard?.border?.enabled}
                onCheckedChange={(enabled) => updateNested('taskCard', { 
                  border: { ...safeValue.taskCard.border, enabled } 
                })}
              />
            </div>
            {safeValue.taskCard?.border?.enabled && (
              <>
                <SliderInput
                  label="Width"
                  value={safeValue.taskCard.border.width}
                  onChange={(width) => updateNested('taskCard', {
                    border: { ...safeValue.taskCard.border, width }
                  })}
                  min={0}
                  max={5}
                  unit="px"
                />
                <ColorPicker
                  label="Color"
                  value={safeValue.taskCard.border.color}
                  onChange={(color) => updateNested('taskCard', {
                    border: { ...safeValue.taskCard.border, color }
                  })}
                />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Completed Tasks" icon={<Square className="h-4 w-4" />}>
            <SliderInput
              label="Opacity"
              value={safeValue.taskCard?.completedStyle?.opacity || 0.6}
              onChange={(opacity) => updateNested('taskCard', {
                completedStyle: { ...safeValue.taskCard.completedStyle, opacity }
              })}
              min={0}
              max={1}
              step={0.1}
            />
            <ColorPicker
              label="Background Color"
              value={safeValue.taskCard?.completedStyle?.backgroundColor || "#F9FAFB"}
              onChange={(backgroundColor) => updateNested('taskCard', {
                completedStyle: { ...safeValue.taskCard.completedStyle, backgroundColor }
              })}
            />
            <div className="flex items-center justify-between">
              <Label>Strikethrough</Label>
              <Switch
                checked={safeValue.taskCard?.completedStyle?.strikethrough}
                onCheckedChange={(strikethrough) => updateNested('taskCard', {
                  completedStyle: { ...safeValue.taskCard.completedStyle, strikethrough }
                })}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Hover Effects" icon={<Sparkles className="h-4 w-4" />}>
            <div className="flex items-center justify-between">
              <Label>Enable Hover</Label>
              <Switch
                checked={safeValue.taskCard?.hover?.enabled}
                onCheckedChange={(enabled) => updateNested('taskCard', {
                  hover: { ...safeValue.taskCard.hover, enabled }
                })}
              />
            </div>
            {safeValue.taskCard?.hover?.enabled && (
              <>
                <SliderInput
                  label="Scale"
                  value={safeValue.taskCard.hover.scale}
                  onChange={(scale) => updateNested('taskCard', {
                    hover: { ...safeValue.taskCard.hover, scale }
                  })}
                  min={1}
                  max={1.1}
                  step={0.01}
                />
                <SliderInput
                  label="Transition Duration"
                  value={safeValue.taskCard.hover.transition}
                  onChange={(transition) => updateNested('taskCard', {
                    hover: { ...safeValue.taskCard.hover, transition }
                  })}
                  min={0}
                  max={1000}
                  unit="ms"
                />
              </>
            )}
          </CollapsibleSection>
        </TabsContent>

        {/* PRIORITY TAB */}
        <TabsContent value="priority" className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <CollapsibleSection title="Priority Badge" icon={<Flag className="h-4 w-4" />} defaultOpen>
            <div className="flex items-center justify-between">
              <Label>Show Badge</Label>
              <Switch
                checked={safeValue.priority?.showBadge}
                onCheckedChange={(showBadge) => updateNested('priority', { showBadge })}
              />
            </div>
            {safeValue.priority?.showBadge && (
              <>
                <div className="space-y-2">
                  <Label>Badge Style</Label>
                  <Select
                    value={safeValue.priority.badgeStyle}
                    onValueChange={(badgeStyle: any) => updateNested('priority', { badgeStyle })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filled">Filled</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="subtle">Subtle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <SliderInput
                  label="Badge Radius"
                  value={safeValue.priority.badgeRadius}
                  onChange={(badgeRadius) => updateNested('priority', { badgeRadius })}
                  min={0}
                  max={20}
                  unit="px"
                />
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Priority Colors" icon={<Palette className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Low Priority</Label>
                <ColorPicker
                  label="Background"
                  value={safeValue.priority?.colors?.low?.background || "#E0F2FE"}
                  onChange={(background) => updateNested('priority', {
                    colors: { ...safeValue.priority.colors, low: { ...safeValue.priority.colors.low, background } }
                  })}
                />
                <ColorPicker
                  label="Text"
                  value={safeValue.priority?.colors?.low?.text || "#0369A1"}
                  onChange={(text) => updateNested('priority', {
                    colors: { ...safeValue.priority.colors, low: { ...safeValue.priority.colors.low, text } }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Medium Priority</Label>
                <ColorPicker
                  label="Background"
                  value={safeValue.priority?.colors?.medium?.background || "#FEF3C7"}
                  onChange={(background) => updateNested('priority', {
                    colors: { ...safeValue.priority.colors, medium: { ...safeValue.priority.colors.medium, background } }
                  })}
                />
                <ColorPicker
                  label="Text"
                  value={safeValue.priority?.colors?.medium?.text || "#92400E"}
                  onChange={(text) => updateNested('priority', {
                    colors: { ...safeValue.priority.colors, medium: { ...safeValue.priority.colors.medium, text } }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">High Priority</Label>
                <ColorPicker
                  label="Background"
                  value={safeValue.priority?.colors?.high?.background || "#FED7AA"}
                  onChange={(background) => updateNested('priority', {
                    colors: { ...safeValue.priority.colors, high: { ...safeValue.priority.colors.high, background } }
                  })}
                />
                <ColorPicker
                  label="Text"
                  value={safeValue.priority?.colors?.high?.text || "#9A3412"}
                  onChange={(text) => updateNested('priority', {
                    colors: { ...safeValue.priority.colors, high: { ...safeValue.priority.colors.high, text } }
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-medium">Urgent Priority</Label>
                <ColorPicker
                  label="Background"
                  value={safeValue.priority?.colors?.urgent?.background || "#FEE2E2"}
                  onChange={(background) => updateNested('priority', {
                    colors: { ...safeValue.priority.colors, urgent: { ...safeValue.priority.colors.urgent, background } }
                  })}
                />
                <ColorPicker
                  label="Text"
                  value={safeValue.priority?.colors?.urgent?.text || "#991B1B"}
                  onChange={(text) => updateNested('priority', {
                    colors: { ...safeValue.priority.colors, urgent: { ...safeValue.priority.colors.urgent, text } }
                  })}
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Checkbox" icon={<Square className="h-4 w-4" />}>
            <SliderInput
              label="Size"
              value={safeValue.checkbox?.size || 18}
              onChange={(size) => updateNested('checkbox', { size })}
              min={12}
              max={32}
              unit="px"
            />
            <SliderInput
              label="Border Radius"
              value={safeValue.checkbox?.borderRadius || 4}
              onChange={(borderRadius) => updateNested('checkbox', { borderRadius })}
              min={0}
              max={20}
              unit="px"
            />
            <ColorPicker
              label="Checked Color"
              value={safeValue.checkbox?.checkedColor || "#10B981"}
              onChange={(checkedColor) => updateNested('checkbox', { checkedColor })}
            />
          </CollapsibleSection>
        </TabsContent>

        {/* TYPOGRAPHY TAB */}
        <TabsContent value="typography" className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <CollapsibleSection title="Task Title" icon={<Type className="h-4 w-4" />} defaultOpen>
            <SliderInput
              label="Font Size"
              value={safeValue.typography?.title?.fontSize || 16}
              onChange={(fontSize) => updateNested('typography', {
                title: { ...safeValue.typography.title, fontSize }
              })}
              min={10}
              max={32}
              unit="px"
            />
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={safeValue.typography?.title?.fontWeight || "500"}
                onValueChange={(fontWeight: any) => updateNested('typography', {
                  title: { ...safeValue.typography.title, fontWeight }
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semi Bold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                  <SelectItem value="800">Extra Bold (800)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ColorPicker
              label="Color"
              value={safeValue.typography?.title?.color || "#111827"}
              onChange={(color) => updateNested('typography', {
                title: { ...safeValue.typography.title, color }
              })}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Description" icon={<Type className="h-4 w-4" />}>
            <SliderInput
              label="Font Size"
              value={safeValue.typography?.description?.fontSize || 13}
              onChange={(fontSize) => updateNested('typography', {
                description: { ...safeValue.typography.description, fontSize }
              })}
              min={10}
              max={24}
              unit="px"
            />
            <ColorPicker
              label="Color"
              value={safeValue.typography?.description?.color || "#6B7280"}
              onChange={(color) => updateNested('typography', {
                description: { ...safeValue.typography.description, color }
              })}
            />
            <SliderInput
              label="Max Lines"
              value={safeValue.typography?.description?.maxLines || 2}
              onChange={(maxLines) => updateNested('typography', {
                description: { ...safeValue.typography.description, maxLines }
              })}
              min={1}
              max={10}
            />
          </CollapsibleSection>

          <CollapsibleSection title="Due Date" icon={<Type className="h-4 w-4" />}>
            <SliderInput
              label="Font Size"
              value={safeValue.typography?.dueDate?.fontSize || 12}
              onChange={(fontSize) => updateNested('typography', {
                dueDate: { ...safeValue.typography.dueDate, fontSize }
              })}
              min={10}
              max={20}
              unit="px"
            />
            <ColorPicker
              label="Normal Color"
              value={safeValue.typography?.dueDate?.color || "#9CA3AF"}
              onChange={(color) => updateNested('typography', {
                dueDate: { ...safeValue.typography.dueDate, color }
              })}
            />
            <ColorPicker
              label="Overdue Color"
              value={safeValue.typography?.dueDate?.overdueColor || "#EF4444"}
              onChange={(overdueColor) => updateNested('typography', {
                dueDate: { ...safeValue.typography.dueDate, overdueColor }
              })}
            />
            <ColorPicker
              label="Today Color"
              value={safeValue.typography?.dueDate?.todayColor || "#F59E0B"}
              onChange={(todayColor) => updateNested('typography', {
                dueDate: { ...safeValue.typography.dueDate, todayColor }
              })}
            />
          </CollapsibleSection>
        </TabsContent>

        {/* EFFECTS TAB */}
        <TabsContent value="effects" className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          <CollapsibleSection title="Progress Bar" icon={<Sparkles className="h-4 w-4" />} defaultOpen>
            <div className="flex items-center justify-between">
              <Label>Enable Progress Bar</Label>
              <Switch
                checked={safeValue.progressBar?.enabled}
                onCheckedChange={(enabled) => updateNested('progressBar', { enabled })}
              />
            </div>
            {safeValue.progressBar?.enabled && (
              <>
                <SliderInput
                  label="Height"
                  value={safeValue.progressBar.height}
                  onChange={(height) => updateNested('progressBar', { height })}
                  min={2}
                  max={20}
                  unit="px"
                />
                <ColorPicker
                  label="Background Color"
                  value={safeValue.progressBar.backgroundColor}
                  onChange={(backgroundColor) => updateNested('progressBar', { backgroundColor })}
                />
                <ColorPicker
                  label="Fill Color"
                  value={safeValue.progressBar.fillColor}
                  onChange={(fillColor) => updateNested('progressBar', { fillColor })}
                />
                <div className="flex items-center justify-between">
                  <Label>Show Percentage</Label>
                  <Switch
                    checked={safeValue.progressBar.showPercentage}
                    onCheckedChange={(showPercentage) => updateNested('progressBar', { showPercentage })}
                  />
                </div>
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Animations" icon={<Sparkles className="h-4 w-4" />}>
            <div className="flex items-center justify-between">
              <Label>Enable Animations</Label>
              <Switch
                checked={safeValue.animation?.enabled}
                onCheckedChange={(enabled) => updateNested('animation', { enabled })}
              />
            </div>
            {safeValue.animation?.enabled && (
              <>
                <SliderInput
                  label="Duration"
                  value={safeValue.animation.duration}
                  onChange={(duration) => updateNested('animation', { duration })}
                  min={0}
                  max={2000}
                  unit="ms"
                />
                <div className="space-y-2">
                  <Label>Easing</Label>
                  <Select
                    value={safeValue.animation.easing}
                    onValueChange={(easing: any) => updateNested('animation', { easing })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="easeIn">Ease In</SelectItem>
                      <SelectItem value="easeOut">Ease Out</SelectItem>
                      <SelectItem value="easeInOut">Ease In Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Stagger Effect</Label>
                  <Switch
                    checked={safeValue.animation.stagger}
                    onCheckedChange={(stagger) => updateNested('animation', { stagger })}
                  />
                </div>
              </>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Layout" icon={<Square className="h-4 w-4" />}>
            <SliderInput
              label="Max Width"
              value={safeValue.layout?.maxWidth || 800}
              onChange={(maxWidth) => updateNested('layout', { maxWidth })}
              min={300}
              max={2000}
              unit="px"
            />
            <SliderInput
              label="Task Spacing"
              value={safeValue.layout?.taskSpacing || 12}
              onChange={(taskSpacing) => updateNested('layout', { taskSpacing })}
              min={0}
              max={40}
              unit="px"
            />
            <div className="flex items-center justify-between">
              <Label>Compact Mode</Label>
              <Switch
                checked={safeValue.layout?.compact}
                onCheckedChange={(compact) => updateNested('layout', { compact })}
              />
            </div>
          </CollapsibleSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};

