/**
 * Style Options Component
 * Reusable styling options for widget editors
 */

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ColorPicker } from '@/components/ui/color-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Type, Layout, Sparkles } from 'lucide-react';

interface StyleOptionsProps {
  style: any;
  onStyleChange: (key: string, value: any) => void;
  widgetType: 'table' | 'metric' | 'text' | 'chart' | 'tasks' | 'calendar' | 'weather' | 'clock' | 'filter' | 'image' | 'iframe' | 'map' | 'gauge' | 'progress' | 'list' | 'form' | 'button' | 'divider';
}

export default function StyleOptions({ style, onStyleChange, widgetType }: StyleOptionsProps) {
  const handleStyleChange = (key: string, value: any) => {
    onStyleChange(key, value);
  };

  const renderLayoutOptions = () => {
    const layouts = {
      table: [
        { value: 'default', label: 'Default', description: 'Clean table layout' },
        { value: 'minimal', label: 'Minimal', description: 'Minimal borders and spacing' },
        { value: 'bordered', label: 'Bordered', description: 'Strong borders and contrast' },
        { value: 'striped', label: 'Striped', description: 'Alternating row colors' },
        { value: 'dark', label: 'Dark', description: 'Dark theme with white text' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' }
      ],
      metric: [
        { value: 'card', label: 'Card', description: 'Card-based layout' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      text: [
        { value: 'card', label: 'Card', description: 'Card-based layout' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'quote', label: 'Quote', description: 'Quote-style formatting' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      chart: [
        { value: 'default', label: 'Default', description: 'Standard chart styling' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'dark', label: 'Dark', description: 'Dark theme with white text' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      tasks: [
        { value: 'default', label: 'Default', description: 'Standard task list' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'card', label: 'Card', description: 'Card-based layout' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' }
      ],
      calendar: [
        { value: 'default', label: 'Default', description: 'Standard calendar' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' }
      ],
      weather: [
        { value: 'card', label: 'Card', description: 'Card-based layout' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      clock: [
        { value: 'default', label: 'Default', description: 'Standard clock widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'digital', label: 'Digital', description: 'Digital display style' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' }
      ],
      filter: [
        { value: 'default', label: 'Default', description: 'Standard filter widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      image: [
        { value: 'default', label: 'Default', description: 'Standard image widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      iframe: [
        { value: 'default', label: 'Default', description: 'Standard iframe widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      map: [
        { value: 'default', label: 'Default', description: 'Standard map widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      gauge: [
        { value: 'default', label: 'Default', description: 'Standard gauge widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      progress: [
        { value: 'default', label: 'Default', description: 'Standard progress widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      list: [
        { value: 'default', label: 'Default', description: 'Standard list widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      form: [
        { value: 'default', label: 'Default', description: 'Standard form widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      button: [
        { value: 'default', label: 'Default', description: 'Standard button widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ],
      divider: [
        { value: 'default', label: 'Default', description: 'Standard divider widget' },
        { value: 'minimal', label: 'Minimal', description: 'Clean minimal design' },
        { value: 'bordered', label: 'Bordered', description: 'Bordered container' },
        { value: 'gradient', label: 'Gradient', description: 'Gradient background' },
        { value: 'glass', label: 'Glass', description: 'Glass morphism effect' },
        { value: 'neon', label: 'Neon', description: 'Neon glow effects' },
        { value: 'vintage', label: 'Vintage', description: 'Retro styling' },
        { value: 'cyber', label: 'Cyber', description: 'Futuristic design' },
        { value: 'luxury', label: 'Luxury', description: 'Premium styling' },
        { value: 'monochrome', label: 'Monochrome', description: 'Black and white only' },
        { value: 'elegant', label: 'Elegant', description: 'Sophisticated design' },
        { value: 'modern', label: 'Modern', description: 'Contemporary styling' }
      ]
    };

    return layouts[widgetType] || layouts.table;
  };

  const renderSizeOptions = () => {
    return [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
      { value: 'xl', label: 'Extra Large' }
    ];
  };

  const renderAlignmentOptions = () => {
    return [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' }
    ];
  };

  const renderBorderRadiusOptions = () => {
    return [
      { value: 'none', label: 'None' },
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' },
      { value: 'full', label: 'Full' }
    ];
  };

  const renderShadowOptions = () => {
    return [
      { value: 'none', label: 'None' },
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' }
    ];
  };

  const renderPaddingOptions = () => {
    return [
      { value: 'compact', label: 'Compact' },
      { value: 'comfortable', label: 'Comfortable' },
      { value: 'spacious', label: 'Spacious' }
    ];
  };

  const renderFontSizeOptions = () => {
    return [
      { value: 'small', label: 'Small' },
      { value: 'medium', label: 'Medium' },
      { value: 'large', label: 'Large' }
    ];
  };

  const renderBorderStyleOptions = () => {
    return [
      { value: 'none', label: 'None' },
      { value: 'thin', label: 'Thin' },
      { value: 'thick', label: 'Thick' },
      { value: 'dashed', label: 'Dashed' }
    ];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Style Options</span>
        </h3>
        <Separator />
      </div>

      {/* Layout Presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Layout className="h-4 w-4" />
            <span>Layout Presets</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {renderLayoutOptions().map((option) => (
              <div
                key={option.value}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  style?.layout === option.value
                    ? 'border-black bg-black/5'
                    : 'border-black/20 hover:border-black/40'
                }`}
                onClick={() => handleStyleChange('layout', option.value)}
              >
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-black/60 mt-1">{option.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Colors</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <ColorPicker
                value={style?.backgroundColor || '#ffffff'}
                onChange={(color) => handleStyleChange('backgroundColor', color)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <ColorPicker
                value={style?.textColor || '#000000'}
                onChange={(color) => handleStyleChange('textColor', color)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="borderColor">Border Color</Label>
              <ColorPicker
                value={style?.borderColor || '#000000'}
                onChange={(color) => handleStyleChange('borderColor', color)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="accentColor">Accent Color</Label>
              <ColorPicker
                value={style?.accentColor || '#000000'}
                onChange={(color) => handleStyleChange('accentColor', color)}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Type className="h-4 w-4" />
            <span>Layout Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select
              value={style?.size || 'medium'}
              onValueChange={(value) => handleStyleChange('size', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {renderSizeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alignment */}
          <div className="space-y-2">
            <Label htmlFor="alignment">Alignment</Label>
            <Select
              value={style?.alignment || 'left'}
              onValueChange={(value) => handleStyleChange('alignment', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                {renderAlignmentOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Border Radius */}
          <div className="space-y-2">
            <Label htmlFor="borderRadius">Border Radius</Label>
            <Select
              value={style?.borderRadius || 'medium'}
              onValueChange={(value) => handleStyleChange('borderRadius', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select border radius" />
              </SelectTrigger>
              <SelectContent>
                {renderBorderRadiusOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shadow */}
          <div className="space-y-2">
            <Label htmlFor="shadow">Shadow</Label>
            <Select
              value={style?.shadow || 'small'}
              onValueChange={(value) => handleStyleChange('shadow', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shadow" />
              </SelectTrigger>
              <SelectContent>
                {renderShadowOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Spacing & Effects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Spacing & Effects</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Padding */}
          <div className="space-y-2">
            <Label htmlFor="padding">Padding</Label>
            <Select
              value={style?.padding || 'comfortable'}
              onValueChange={(value) => handleStyleChange('padding', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select padding" />
              </SelectTrigger>
              <SelectContent>
                {renderPaddingOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Background Options */}
          <div className="space-y-4">
            <h4 className="text-md font-medium">Background</h4>
        
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backgroundOpacity">Background Opacity</Label>
                <Select
                  value={style?.backgroundOpacity || '100'}
                  onValueChange={(value) => handleStyleChange('backgroundOpacity', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select opacity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Transparent (0%)</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="90">90%</SelectItem>
                    <SelectItem value="100">Opaque (100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          
              <div className="space-y-2">
                <Label htmlFor="backgroundType">Background Type</Label>
                <Select
                  value={style?.backgroundType || 'solid'}
                  onValueChange={(value) => handleStyleChange('backgroundType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select background type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid Color</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="glass">Glass Effect</SelectItem>
                    <SelectItem value="blur">Blur Effect</SelectItem>
                    <SelectItem value="pattern">Pattern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Effects */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Advanced Effects</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="backgroundType">Background Type</Label>
            <Select
              value={style?.backgroundType || 'solid'}
              onValueChange={(value) => handleStyleChange('backgroundType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select background type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="glass">Glass Effect</SelectItem>
                <SelectItem value="blur">Blur Effect</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {style?.backgroundType === 'gradient' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gradientFrom">Gradient From</Label>
                  <ColorPicker
                    value={style?.gradientFrom || '#3b82f6'}
                    onChange={(color) => handleStyleChange('gradientFrom', color)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gradientTo">Gradient To</Label>
                  <ColorPicker
                    value={style?.gradientTo || '#8b5cf6'}
                    onChange={(color) => handleStyleChange('gradientTo', color)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="gradientDirection">Gradient Direction</Label>
                <Select
                  value={style?.gradientDirection || 'to-r'}
                  onValueChange={(value) => handleStyleChange('gradientDirection', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to-r">Left to Right</SelectItem>
                    <SelectItem value="to-l">Right to Left</SelectItem>
                    <SelectItem value="to-t">Bottom to Top</SelectItem>
                    <SelectItem value="to-b">Top to Bottom</SelectItem>
                    <SelectItem value="to-br">Top Left to Bottom Right</SelectItem>
                    <SelectItem value="to-bl">Top Right to Bottom Left</SelectItem>
                    <SelectItem value="to-tr">Bottom Left to Top Right</SelectItem>
                    <SelectItem value="to-tl">Bottom Right to Top Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Border Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Layout className="h-4 w-4" />
            <span>Borders</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="borderColor">Border Color</Label>
              <ColorPicker
                value={style?.borderColor || '#e5e7eb'}
                onChange={(color) => handleStyleChange('borderColor', color)}
              />
            </div>
          
            <div className="space-y-2">
              <Label htmlFor="borderWidth">Border Width</Label>
              <Select
                value={style?.borderWidth || '1'}
                onValueChange={(value) => handleStyleChange('borderWidth', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select width" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No Border</SelectItem>
                  <SelectItem value="1">Thin (1px)</SelectItem>
                  <SelectItem value="2">Medium (2px)</SelectItem>
                  <SelectItem value="4">Thick (4px)</SelectItem>
                  <SelectItem value="8">Extra Thick (8px)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="borderStyle">Border Style</Label>
              <Select
                value={style?.borderStyle || 'solid'}
                onValueChange={(value) => handleStyleChange('borderStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                  <SelectItem value="groove">Groove</SelectItem>
                  <SelectItem value="ridge">Ridge</SelectItem>
                  <SelectItem value="inset">Inset</SelectItem>
                  <SelectItem value="outset">Outset</SelectItem>
                </SelectContent>
              </Select>
            </div>
          
          <div className="space-y-2">
            <Label htmlFor="borderOpacity">Border Opacity</Label>
            <Select
              value={style?.borderOpacity || '100'}
              onValueChange={(value) => handleStyleChange('borderOpacity', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select opacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Transparent (0%)</SelectItem>
                <SelectItem value="25">25%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">Opaque (100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Padding & Spacing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Sparkles className="h-4 w-4" />
            <span>Padding & Spacing</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="padding">Padding</Label>
            <Select
              value={style?.padding || 'comfortable'}
              onValueChange={(value) => handleStyleChange('padding', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select padding" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Padding</SelectItem>
                <SelectItem value="compact">Compact (4px)</SelectItem>
                <SelectItem value="comfortable">Comfortable (8px)</SelectItem>
                <SelectItem value="spacious">Spacious (16px)</SelectItem>
                <SelectItem value="xl">Extra Large (24px)</SelectItem>
                <SelectItem value="2xl">2X Large (32px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="margin">Margin</Label>
            <Select
              value={style?.margin || 'none'}
              onValueChange={(value) => handleStyleChange('margin', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select margin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Margin</SelectItem>
                <SelectItem value="sm">Small (4px)</SelectItem>
                <SelectItem value="md">Medium (8px)</SelectItem>
                <SelectItem value="lg">Large (16px)</SelectItem>
                <SelectItem value="xl">Extra Large (24px)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gap">Internal Gap</Label>
          <Select
            value={style?.gap || 'sm'}
            onValueChange={(value) => handleStyleChange('gap', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Gap</SelectItem>
              <SelectItem value="xs">Extra Small (2px)</SelectItem>
              <SelectItem value="sm">Small (4px)</SelectItem>
              <SelectItem value="md">Medium (8px)</SelectItem>
              <SelectItem value="lg">Large (16px)</SelectItem>
              <SelectItem value="xl">Extra Large (24px)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>

      {/* Text Styling */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Text Styling</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="textColor">Text Color</Label>
            <Input
              type="color"
              value={style?.textColor || '#000000'}
              onChange={(e) => handleStyleChange('textColor', e.target.value)}
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="textOpacity">Text Opacity</Label>
            <Select
              value={style?.textOpacity || '100'}
              onValueChange={(value) => handleStyleChange('textOpacity', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select opacity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Transparent (0%)</SelectItem>
                <SelectItem value="25">25%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">Opaque (100%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fontWeight">Font Weight</Label>
            <Select
              value={style?.fontWeight || 'normal'}
              onValueChange={(value) => handleStyleChange('fontWeight', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select weight" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thin">Thin (100)</SelectItem>
                <SelectItem value="light">Light (300)</SelectItem>
                <SelectItem value="normal">Normal (400)</SelectItem>
                <SelectItem value="medium">Medium (500)</SelectItem>
                <SelectItem value="semibold">Semibold (600)</SelectItem>
                <SelectItem value="bold">Bold (700)</SelectItem>
                <SelectItem value="extrabold">Extra Bold (800)</SelectItem>
                <SelectItem value="black">Black (900)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="textAlign">Text Alignment</Label>
            <Select
              value={style?.textAlign || 'left'}
              onValueChange={(value) => handleStyleChange('textAlign', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="justify">Justify</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="textDecoration">Text Decoration</Label>
            <Select
              value={style?.textDecoration || 'none'}
              onValueChange={(value) => handleStyleChange('textDecoration', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decoration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="underline">Underline</SelectItem>
                <SelectItem value="overline">Overline</SelectItem>
                <SelectItem value="line-through">Line Through</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="textTransform">Text Transform</Label>
            <Select
              value={style?.textTransform || 'none'}
              onValueChange={(value) => handleStyleChange('textTransform', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="uppercase">Uppercase</SelectItem>
                <SelectItem value="lowercase">Lowercase</SelectItem>
                <SelectItem value="capitalize">Capitalize</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Accent Colors */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Accent Colors</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accentColor">Primary Accent</Label>
            <Input
              type="color"
              value={style?.accentColor || '#3b82f6'}
              onChange={(e) => handleStyleChange('accentColor', e.target.value)}
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <Input
              type="color"
              value={style?.secondaryColor || '#8b5cf6'}
              onChange={(e) => handleStyleChange('secondaryColor', e.target.value)}
              className="h-10"
            />
          </div>
        </div>
      </div>

      {/* Widget-specific options */}
      {widgetType === 'table' && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="text-md font-medium">Table Specific</h4>
            
            <div className="space-y-2">
              <Label htmlFor="headerStyle">Header Style</Label>
              <Select
                value={style?.headerStyle || 'default'}
                onValueChange={(value) => handleStyleChange('headerStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select header style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="colored">Colored</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fontSize">Font Size</Label>
              <Select
                value={style?.fontSize || 'medium'}
                onValueChange={(value) => handleStyleChange('fontSize', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font size" />
                </SelectTrigger>
                <SelectContent>
                  {renderFontSizeOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cellPadding">Cell Padding</Label>
              <Select
                value={style?.cellPadding || 'comfortable'}
                onValueChange={(value) => handleStyleChange('cellPadding', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select cell padding" />
                </SelectTrigger>
                <SelectContent>
                  {renderPaddingOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="borderStyle">Border Style</Label>
              <Select
                value={style?.borderStyle || 'thin'}
                onValueChange={(value) => handleStyleChange('borderStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select border style" />
                </SelectTrigger>
                <SelectContent>
                  {renderBorderStyleOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="rowHover"
                checked={style?.rowHover || false}
                onCheckedChange={(checked) => handleStyleChange('rowHover', checked)}
              />
              <Label htmlFor="rowHover">Row Hover Effect</Label>
            </div>
          </div>
        </>
      )}

      {widgetType === 'metric' && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="text-md font-medium">Metric Specific</h4>
            
            <div className="space-y-2">
              <Label htmlFor="valueStyle">Value Style</Label>
              <Select
                value={style?.valueStyle || 'default'}
                onValueChange={(value) => handleStyleChange('valueStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select value style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="outlined">Outlined</SelectItem>
                  <SelectItem value="gradient">Gradient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="titleStyle">Title Style</Label>
              <Select
                value={style?.titleStyle || 'default'}
                onValueChange={(value) => handleStyleChange('titleStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select title style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      {widgetType === 'text' && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="text-md font-medium">Text Specific</h4>
            
            <div className="space-y-2">
              <Label htmlFor="fontStyle">Font Style</Label>
              <Select
                value={style?.fontStyle || 'normal'}
                onValueChange={(value) => handleStyleChange('fontStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select font style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="bold-italic">Bold Italic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textTransform">Text Transform</Label>
              <Select
                value={style?.textTransform || 'none'}
                onValueChange={(value) => handleStyleChange('textTransform', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select text transform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                  <SelectItem value="lowercase">Lowercase</SelectItem>
                  <SelectItem value="capitalize">Capitalize</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lineHeight">Line Height</Label>
              <Select
                value={style?.lineHeight || 'normal'}
                onValueChange={(value) => handleStyleChange('lineHeight', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select line height" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                  <SelectItem value="loose">Loose</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="letterSpacing">Letter Spacing</Label>
              <Select
                value={style?.letterSpacing || 'normal'}
                onValueChange={(value) => handleStyleChange('letterSpacing', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select letter spacing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tight">Tight</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
