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

interface StyleOptionsProps {
  style: any;
  onStyleChange: (key: string, value: any) => void;
  widgetType: 'table' | 'metric' | 'text' | 'chart' | 'tasks' | 'calendar' | 'weather' | 'clock';
}

export default function StyleOptions({ style, onStyleChange, widgetType }: StyleOptionsProps) {
  const handleStyleChange = (key: string, value: any) => {
    onStyleChange(key, value);
  };

  const renderLayoutOptions = () => {
    const layouts = {
      table: [
        { value: 'default', label: 'Default' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'striped', label: 'Striped' },
        { value: 'dark', label: 'Dark' }
      ],
      metric: [
        { value: 'card', label: 'Card' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'gradient', label: 'Gradient' },
        { value: 'glass', label: 'Glass' }
      ],
      text: [
        { value: 'card', label: 'Card' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'gradient', label: 'Gradient' },
        { value: 'glass', label: 'Glass' },
        { value: 'quote', label: 'Quote' }
      ],
      chart: [
        { value: 'default', label: 'Default' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'gradient', label: 'Gradient' },
        { value: 'dark', label: 'Dark' }
      ],
      tasks: [
        { value: 'default', label: 'Default' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'card', label: 'Card' }
      ],
      calendar: [
        { value: 'default', label: 'Default' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'modern', label: 'Modern' }
      ],
      weather: [
        { value: 'card', label: 'Card' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'gradient', label: 'Gradient' }
      ],
      clock: [
        { value: 'default', label: 'Default' },
        { value: 'minimal', label: 'Minimal' },
        { value: 'bordered', label: 'Bordered' },
        { value: 'digital', label: 'Digital' }
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
        <h3 className="text-lg font-semibold mb-4">Style Options</h3>
        <Separator />
      </div>

      {/* Layout */}
      <div className="space-y-2">
        <Label htmlFor="layout">Layout Style</Label>
        <Select
          value={style?.layout || 'default'}
          onValueChange={(value) => handleStyleChange('layout', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            {renderLayoutOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

      {/* Colors */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Colors</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="backgroundColor">Background Color</Label>
            <Input
              type="color"
              value={style?.backgroundColor || '#ffffff'}
              onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
              className="h-10"
            />
          </div>
          
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
            <Label htmlFor="borderColor">Border Color</Label>
            <Input
              type="color"
              value={style?.borderColor || '#e5e7eb'}
              onChange={(e) => handleStyleChange('borderColor', e.target.value)}
              className="h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accentColor">Accent Color</Label>
            <Input
              type="color"
              value={style?.accentColor || '#3b82f6'}
              onChange={(e) => handleStyleChange('accentColor', e.target.value)}
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
