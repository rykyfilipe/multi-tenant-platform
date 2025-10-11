"use client";

import React, { useState } from "react";
import { z } from "zod";
import { clockStyleSchema } from "@/widgets/schemas/clock-v2";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Type, Watch, Sparkles, ChevronDown, ChevronRight } from "lucide-react";

type ClockStyle = z.infer<typeof clockStyleSchema>;

interface ClockStyleEditorProps {
  value: ClockStyle;
  onChange: (value: ClockStyle) => void;
  clockType: "digital" | "analog";
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

export const ClockStyleEditor: React.FC<ClockStyleEditorProps> = ({ value, onChange, clockType }) => {
  const updateStyle = (updates: Partial<ClockStyle>) => {
    onChange({ ...value, ...updates });
  };

  const updateNestedStyle = <K extends keyof ClockStyle>(
    key: K,
    updates: Partial<ClockStyle[K]>
  ) => {
    onChange({
      ...value,
      [key]: { ...(value[key] as any), ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="container" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
          <TabsTrigger value="container" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Container
          </TabsTrigger>
          <TabsTrigger value="display" className="text-xs">
            <Type className="h-3 w-3 mr-1" />
            Display
          </TabsTrigger>
          {clockType === "analog" && (
            <TabsTrigger value="analog" className="text-xs">
              <Watch className="h-3 w-3 mr-1" />
              Analog
            </TabsTrigger>
          )}
        </TabsList>

        {/* ===== CONTAINER TAB ===== */}
        <TabsContent value="container" className="space-y-4 mt-4">
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
                  checked={value.backgroundGradient.enabled}
                  onCheckedChange={(val) => updateNestedStyle('backgroundGradient', { enabled: val })}
                />
              </div>
              {value.backgroundGradient.enabled && (
                <div className="space-y-3 pl-4">
                  <ColorPicker
                    label="From"
                    value={value.backgroundGradient.from}
                    onChange={(val) => updateNestedStyle('backgroundGradient', { from: val })}
                  />
                  <ColorPicker
                    label="To"
                    value={value.backgroundGradient.to}
                    onChange={(val) => updateNestedStyle('backgroundGradient', { to: val })}
                  />
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select
                      value={value.backgroundGradient.direction}
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
            icon={<Clock className="h-4 w-4" />}
          >
            <SliderInput
              label="Border Radius"
              value={value.borderRadius}
              onChange={(val) => updateStyle({ borderRadius: val })}
              min={0}
              max={50}
              unit="px"
            />
            <div className="flex items-center justify-between">
              <Label>Show Border</Label>
              <Switch
                checked={value.border.enabled}
                onCheckedChange={(val) => updateNestedStyle('border', { enabled: val })}
              />
            </div>
            {value.border.enabled && (
              <>
                <SliderInput
                  label="Border Width"
                  value={value.border.width}
                  onChange={(val) => updateNestedStyle('border', { width: val })}
                  min={0}
                  max={10}
                  unit="px"
                />
                <ColorPicker
                  label="Border Color"
                  value={value.border.color}
                  onChange={(val) => updateNestedStyle('border', { color: val })}
                />
              </>
            )}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label>Show Shadow</Label>
                <Switch
                  checked={value.shadow.enabled}
                  onCheckedChange={(val) => updateNestedStyle('shadow', { enabled: val })}
                />
              </div>
              {value.shadow.enabled && (
                <div className="space-y-2">
                  <Label>Shadow Size</Label>
                  <Select
                    value={value.shadow.size}
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
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Padding & Alignment" 
            icon={<Sparkles className="h-4 w-4" />}
          >
            <div className="grid grid-cols-2 gap-3">
              <SliderInput
                label="Horizontal"
                value={value.padding.x}
                onChange={(val) => updateNestedStyle('padding', { x: val })}
                min={0}
                max={100}
                unit="px"
              />
              <SliderInput
                label="Vertical"
                value={value.padding.y}
                onChange={(val) => updateNestedStyle('padding', { y: val })}
                min={0}
                max={100}
                unit="px"
              />
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select
                value={value.alignment}
                onValueChange={(val: any) => updateStyle({ alignment: val })}
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
        </TabsContent>

        {/* ===== DISPLAY TAB ===== */}
        <TabsContent value="display" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Time Display" 
            icon={<Clock className="h-4 w-4" />}
            defaultOpen={true}
          >
            <SliderInput
              label="Font Size"
              value={value.time.fontSize}
              onChange={(val) => updateNestedStyle('time', { fontSize: val })}
              min={24}
              max={120}
              unit="px"
            />
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={value.time.fontWeight}
                onValueChange={(val: any) => updateNestedStyle('time', { fontWeight: val })}
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
            <ColorPicker
              label="Text Color"
              value={value.time.color}
              onChange={(val) => updateNestedStyle('time', { color: val })}
            />
            <SliderInput
              label="Letter Spacing"
              value={value.time.letterSpacing}
              onChange={(val) => updateNestedStyle('time', { letterSpacing: val })}
              min={-5}
              max={10}
              unit="px"
            />
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label>Gradient Text</Label>
                <Switch
                  checked={value.time.gradient.enabled}
                  onCheckedChange={(val) => updateNestedStyle('time', { 
                    gradient: { ...value.time.gradient, enabled: val }
                  })}
                />
              </div>
              {value.time.gradient.enabled && (
                <div className="space-y-3 pl-4">
                  <ColorPicker
                    label="From"
                    value={value.time.gradient.from}
                    onChange={(val) => updateNestedStyle('time', { 
                      gradient: { ...value.time.gradient, from: val }
                    })}
                  />
                  <ColorPicker
                    label="To"
                    value={value.time.gradient.to}
                    onChange={(val) => updateNestedStyle('time', { 
                      gradient: { ...value.time.gradient, to: val }
                    })}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <Label>Blinking Separator (:)</Label>
              <Switch
                checked={value.time.showSeparatorBlink}
                onCheckedChange={(val) => updateNestedStyle('time', { showSeparatorBlink: val })}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Date Display" 
            icon={<Type className="h-4 w-4" />}
          >
            <SliderInput
              label="Font Size"
              value={value.date.fontSize}
              onChange={(val) => updateNestedStyle('date', { fontSize: val })}
              min={10}
              max={32}
              unit="px"
            />
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={value.date.fontWeight}
                onValueChange={(val: any) => updateNestedStyle('date', { fontWeight: val })}
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
              value={value.date.color}
              onChange={(val) => updateNestedStyle('date', { color: val })}
            />
            <div className="space-y-2">
              <Label>Text Transform</Label>
              <Select
                value={value.date.textTransform}
                onValueChange={(val: any) => updateNestedStyle('date', { textTransform: val })}
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
              label="Margin Top"
              value={value.date.marginTop}
              onChange={(val) => updateNestedStyle('date', { marginTop: val })}
              min={0}
              max={50}
              unit="px"
            />
          </CollapsibleSection>

          <CollapsibleSection 
            title="Seconds Display" 
            icon={<Clock className="h-4 w-4" />}
          >
            <SliderInput
              label="Font Size"
              value={value.seconds.fontSize}
              onChange={(val) => updateNestedStyle('seconds', { fontSize: val })}
              min={12}
              max={48}
              unit="px"
            />
            <ColorPicker
              label="Text Color"
              value={value.seconds.color}
              onChange={(val) => updateNestedStyle('seconds', { color: val })}
            />
            <SliderInput
              label="Opacity"
              value={value.seconds.opacity}
              onChange={(val) => updateNestedStyle('seconds', { opacity: val })}
              min={0}
              max={1}
              step={0.1}
            />
          </CollapsibleSection>
        </TabsContent>

        {/* ===== ANALOG TAB ===== */}
        {clockType === "analog" && (
          <TabsContent value="analog" className="space-y-4 mt-4">
            <CollapsibleSection 
              title="Clock Face" 
              icon={<Watch className="h-4 w-4" />}
              defaultOpen={true}
            >
              <ColorPicker
                label="Face Color"
                value={value.analog.faceColor}
                onChange={(val) => updateNestedStyle('analog', { faceColor: val })}
              />
              <SliderInput
                label="Border Width"
                value={value.analog.borderWidth}
                onChange={(val) => updateNestedStyle('analog', { borderWidth: val })}
                min={0}
                max={20}
                unit="px"
              />
              <ColorPicker
                label="Border Color"
                value={value.analog.borderColor}
                onChange={(val) => updateNestedStyle('analog', { borderColor: val })}
              />
              <div className="flex items-center justify-between pt-4 border-t">
                <Label>Show Numbers</Label>
                <Switch
                  checked={value.analog.showNumbers}
                  onCheckedChange={(val) => updateNestedStyle('analog', { showNumbers: val })}
                />
              </div>
              {value.analog.showNumbers && (
                <>
                  <ColorPicker
                    label="Numbers Color"
                    value={value.analog.numbersColor}
                    onChange={(val) => updateNestedStyle('analog', { numbersColor: val })}
                  />
                  <SliderInput
                    label="Numbers Size"
                    value={value.analog.numbersSize}
                    onChange={(val) => updateNestedStyle('analog', { numbersSize: val })}
                    min={8}
                    max={32}
                    unit="px"
                  />
                </>
              )}
            </CollapsibleSection>

            <CollapsibleSection 
              title="Hour Hand" 
              icon={<Clock className="h-4 w-4" />}
            >
              <ColorPicker
                label="Color"
                value={value.analog.hourHand.color}
                onChange={(val) => updateNestedStyle('analog', { 
                  hourHand: { ...value.analog.hourHand, color: val }
                })}
              />
              <SliderInput
                label="Width"
                value={value.analog.hourHand.width}
                onChange={(val) => updateNestedStyle('analog', { 
                  hourHand: { ...value.analog.hourHand, width: val }
                })}
                min={1}
                max={20}
                unit="px"
              />
              <SliderInput
                label="Length"
                value={value.analog.hourHand.length}
                onChange={(val) => updateNestedStyle('analog', { 
                  hourHand: { ...value.analog.hourHand, length: val }
                })}
                min={20}
                max={100}
                unit="%"
                description="Percentage of clock radius"
              />
            </CollapsibleSection>

            <CollapsibleSection 
              title="Minute Hand" 
              icon={<Clock className="h-4 w-4" />}
            >
              <ColorPicker
                label="Color"
                value={value.analog.minuteHand.color}
                onChange={(val) => updateNestedStyle('analog', { 
                  minuteHand: { ...value.analog.minuteHand, color: val }
                })}
              />
              <SliderInput
                label="Width"
                value={value.analog.minuteHand.width}
                onChange={(val) => updateNestedStyle('analog', { 
                  minuteHand: { ...value.analog.minuteHand, width: val }
                })}
                min={1}
                max={15}
                unit="px"
              />
              <SliderInput
                label="Length"
                value={value.analog.minuteHand.length}
                onChange={(val) => updateNestedStyle('analog', { 
                  minuteHand: { ...value.analog.minuteHand, length: val }
                })}
                min={30}
                max={100}
                unit="%"
              />
            </CollapsibleSection>

            <CollapsibleSection 
              title="Second Hand" 
              icon={<Clock className="h-4 w-4" />}
            >
              <ColorPicker
                label="Color"
                value={value.analog.secondHand.color}
                onChange={(val) => updateNestedStyle('analog', { 
                  secondHand: { ...value.analog.secondHand, color: val }
                })}
              />
              <SliderInput
                label="Width"
                value={value.analog.secondHand.width}
                onChange={(val) => updateNestedStyle('analog', { 
                  secondHand: { ...value.analog.secondHand, width: val }
                })}
                min={1}
                max={10}
                unit="px"
              />
              <SliderInput
                label="Length"
                value={value.analog.secondHand.length}
                onChange={(val) => updateNestedStyle('analog', { 
                  secondHand: { ...value.analog.secondHand, length: val }
                })}
                min={30}
                max={100}
                unit="%"
              />
            </CollapsibleSection>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

