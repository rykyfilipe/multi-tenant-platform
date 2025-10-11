"use client";

import React, { useState } from "react";
import { z } from "zod";
import { weatherStyleSchema } from "@/widgets/schemas/weather-v2";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudSun, Type, Thermometer, CloudRain, Sparkles, ChevronDown, ChevronRight } from "lucide-react";

type WeatherStyle = z.infer<typeof weatherStyleSchema>;

interface WeatherStyleEditorProps {
  value: WeatherStyle;
  onChange: (value: WeatherStyle) => void;
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

export const WeatherStyleEditor: React.FC<WeatherStyleEditorProps> = ({ value, onChange }) => {
  const updateStyle = (updates: Partial<WeatherStyle>) => {
    onChange({ ...value, ...updates });
  };

  const updateNestedStyle = <K extends keyof WeatherStyle>(
    key: K,
    updates: Partial<WeatherStyle[K]>
  ) => {
    onChange({
      ...value,
      [key]: { ...(value[key] as any), ...updates },
    });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="container" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="container" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Container
          </TabsTrigger>
          <TabsTrigger value="main" className="text-xs">
            <Thermometer className="h-3 w-3 mr-1" />
            Main
          </TabsTrigger>
          <TabsTrigger value="details" className="text-xs">
            <CloudRain className="h-3 w-3 mr-1" />
            Details
          </TabsTrigger>
          <TabsTrigger value="forecast" className="text-xs">
            <CloudSun className="h-3 w-3 mr-1" />
            Forecast
          </TabsTrigger>
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
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Border & Shadow" 
            icon={<CloudSun className="h-4 w-4" />}
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
            title="Layout" 
            icon={<Type className="h-4 w-4" />}
          >
            <div className="space-y-2">
              <Label>Layout Style</Label>
              <Select
                value={value.layout}
                onValueChange={(val: any) => updateStyle({ layout: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="forecast-focused">Forecast Focused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleSection>
        </TabsContent>

        {/* ===== MAIN TAB ===== */}
        <TabsContent value="main" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Temperature" 
            icon={<Thermometer className="h-4 w-4" />}
            defaultOpen={true}
          >
            <SliderInput
              label="Font Size"
              value={value.temperature.fontSize}
              onChange={(val) => updateNestedStyle('temperature', { fontSize: val })}
              min={24}
              max={100}
              unit="px"
            />
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={value.temperature.fontWeight}
                onValueChange={(val: any) => updateNestedStyle('temperature', { fontWeight: val })}
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
              value={value.temperature.color}
              onChange={(val) => updateNestedStyle('temperature', { color: val })}
            />
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <Label>Gradient Text</Label>
                <Switch
                  checked={value.temperature.gradient.enabled}
                  onCheckedChange={(val) => updateNestedStyle('temperature', { 
                    gradient: { ...value.temperature.gradient, enabled: val }
                  })}
                />
              </div>
              {value.temperature.gradient.enabled && (
                <div className="space-y-3 pl-4">
                  <ColorPicker
                    label="From"
                    value={value.temperature.gradient.from}
                    onChange={(val) => updateNestedStyle('temperature', { 
                      gradient: { ...value.temperature.gradient, from: val }
                    })}
                  />
                  <ColorPicker
                    label="To"
                    value={value.temperature.gradient.to}
                    onChange={(val) => updateNestedStyle('temperature', { 
                      gradient: { ...value.temperature.gradient, to: val }
                    })}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <Label>Show Unit (°C/°F)</Label>
              <Switch
                checked={value.temperature.showUnit}
                onCheckedChange={(val) => updateNestedStyle('temperature', { showUnit: val })}
              />
            </div>
            {value.temperature.showUnit && (
              <SliderInput
                label="Unit Size"
                value={value.temperature.unitSize}
                onChange={(val) => updateNestedStyle('temperature', { unitSize: val })}
                min={12}
                max={48}
                unit="px"
              />
            )}
          </CollapsibleSection>

          <CollapsibleSection 
            title="Location & Condition" 
            icon={<Type className="h-4 w-4" />}
          >
            <SliderInput
              label="Location Font Size"
              value={value.location.fontSize}
              onChange={(val) => updateNestedStyle('location', { fontSize: val })}
              min={12}
              max={32}
              unit="px"
            />
            <ColorPicker
              label="Location Color"
              value={value.location.color}
              onChange={(val) => updateNestedStyle('location', { color: val })}
            />
            <div className="pt-4 border-t">
              <SliderInput
                label="Condition Font Size"
                value={value.condition.fontSize}
                onChange={(val) => updateNestedStyle('condition', { fontSize: val })}
                min={10}
                max={24}
                unit="px"
              />
              <ColorPicker
                label="Condition Color"
                value={value.condition.color}
                onChange={(val) => updateNestedStyle('condition', { color: val })}
              />
              <div className="space-y-2">
                <Label>Text Transform</Label>
                <Select
                  value={value.condition.textTransform}
                  onValueChange={(val: any) => updateNestedStyle('condition', { textTransform: val })}
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
            </div>
          </CollapsibleSection>

          <CollapsibleSection 
            title="Weather Icon" 
            icon={<CloudSun className="h-4 w-4" />}
          >
            <SliderInput
              label="Icon Size"
              value={value.icon.size}
              onChange={(val) => updateNestedStyle('icon', { size: val })}
              min={32}
              max={200}
              unit="px"
            />
            <ColorPicker
              label="Icon Color"
              value={value.icon.color}
              onChange={(val) => updateNestedStyle('icon', { color: val })}
            />
            <div className="space-y-2">
              <Label>Icon Style</Label>
              <Select
                value={value.icon.style}
                onValueChange={(val: any) => updateNestedStyle('icon', { style: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="filled">Filled</SelectItem>
                  <SelectItem value="outlined">Outlined</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {value.icon.style === "gradient" && (
              <div className="space-y-3 pl-4">
                <ColorPicker
                  label="Gradient From"
                  value={value.icon.gradient.from}
                  onChange={(val) => updateNestedStyle('icon', { 
                    gradient: { ...value.icon.gradient, from: val }
                  })}
                />
                <ColorPicker
                  label="Gradient To"
                  value={value.icon.gradient.to}
                  onChange={(val) => updateNestedStyle('icon', { 
                    gradient: { ...value.icon.gradient, to: val }
                  })}
                />
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t">
              <Label>Icon Animation</Label>
              <Switch
                checked={value.icon.animation}
                onCheckedChange={(val) => updateNestedStyle('icon', { animation: val })}
              />
            </div>
          </CollapsibleSection>
        </TabsContent>

        {/* ===== DETAILS TAB ===== */}
        <TabsContent value="details" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Details Typography" 
            icon={<Type className="h-4 w-4" />}
            defaultOpen={true}
          >
            <SliderInput
              label="Font Size"
              value={value.details.fontSize}
              onChange={(val) => updateNestedStyle('details', { fontSize: val })}
              min={10}
              max={20}
              unit="px"
            />
            <ColorPicker
              label="Text Color"
              value={value.details.color}
              onChange={(val) => updateNestedStyle('details', { color: val })}
            />
            <ColorPicker
              label="Label Color"
              value={value.details.labelColor}
              onChange={(val) => updateNestedStyle('details', { labelColor: val })}
            />
          </CollapsibleSection>

          <CollapsibleSection 
            title="Icons & Spacing" 
            icon={<CloudRain className="h-4 w-4" />}
          >
            <SliderInput
              label="Icon Size"
              value={value.details.iconSize}
              onChange={(val) => updateNestedStyle('details', { iconSize: val })}
              min={12}
              max={32}
              unit="px"
            />
            <ColorPicker
              label="Icon Color"
              value={value.details.iconColor}
              onChange={(val) => updateNestedStyle('details', { iconColor: val })}
            />
            <SliderInput
              label="Spacing"
              value={value.details.spacing}
              onChange={(val) => updateNestedStyle('details', { spacing: val })}
              min={4}
              max={24}
              unit="px"
            />
          </CollapsibleSection>
        </TabsContent>

        {/* ===== FORECAST TAB ===== */}
        <TabsContent value="forecast" className="space-y-4 mt-4">
          <CollapsibleSection 
            title="Forecast Cards" 
            icon={<CloudSun className="h-4 w-4" />}
            defaultOpen={true}
          >
            <ColorPicker
              label="Card Background"
              value={value.forecast.cardBackground}
              onChange={(val) => updateNestedStyle('forecast', { cardBackground: val })}
            />
            <SliderInput
              label="Card Border Radius"
              value={value.forecast.cardBorderRadius}
              onChange={(val) => updateNestedStyle('forecast', { cardBorderRadius: val })}
              min={0}
              max={30}
              unit="px"
            />
            <SliderInput
              label="Card Padding"
              value={value.forecast.cardPadding}
              onChange={(val) => updateNestedStyle('forecast', { cardPadding: val })}
              min={4}
              max={30}
              unit="px"
            />
            <SliderInput
              label="Font Size"
              value={value.forecast.fontSize}
              onChange={(val) => updateNestedStyle('forecast', { fontSize: val })}
              min={10}
              max={18}
              unit="px"
            />
            <ColorPicker
              label="Day Color"
              value={value.forecast.dayColor}
              onChange={(val) => updateNestedStyle('forecast', { dayColor: val })}
            />
            <ColorPicker
              label="Temperature Color"
              value={value.forecast.tempColor}
              onChange={(val) => updateNestedStyle('forecast', { tempColor: val })}
            />
            <SliderInput
              label="Icon Size"
              value={value.forecast.iconSize}
              onChange={(val) => updateNestedStyle('forecast', { iconSize: val })}
              min={20}
              max={80}
              unit="px"
            />
            <SliderInput
              label="Card Spacing"
              value={value.forecast.spacing}
              onChange={(val) => updateNestedStyle('forecast', { spacing: val })}
              min={4}
              max={24}
              unit="px"
            />
          </CollapsibleSection>
        </TabsContent>
      </Tabs>
    </div>
  );
};

