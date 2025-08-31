'use client';

import { useState, useEffect } from 'react';
import { Widget } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RightPanelEditorProps {
  widget: Widget;
  onWidgetUpdate: (widget: Widget) => void;
  onAutoSave: () => void;
}

export default function RightPanelEditor({ widget, onWidgetUpdate, onAutoSave }: RightPanelEditorProps) {
  const [localConfig, setLocalConfig] = useState(widget.config);

  useEffect(() => {
    setLocalConfig(widget.config);
  }, [widget.config]);

  const updateConfig = (updates: any) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    
    const updatedWidget = { ...widget, config: newConfig };
    onWidgetUpdate(updatedWidget);
    onAutoSave();
  };

  const renderTitleEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title-text">Text</Label>
        <Input
          id="title-text"
          value={(localConfig as any).text || ''}
          onChange={(e) => updateConfig({ text: e.target.value })}
          placeholder="Enter title text"
        />
      </div>
      
      <div>
        <Label htmlFor="title-font-size">Font Size</Label>
        <Slider
          id="title-font-size"
          value={[(localConfig as any).fontSize || 24]}
          onValueChange={([value]) => updateConfig({ fontSize: value })}
          min={12}
          max={72}
          step={1}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {(localConfig as any).fontSize || 24}px
        </div>
      </div>
      
      <div>
        <Label htmlFor="title-font-weight">Font Weight</Label>
        <Select
          value={(localConfig as any).fontWeight?.toString() || '600'}
          onValueChange={(value) => updateConfig({ fontWeight: parseInt(value) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="300">Light (300)</SelectItem>
            <SelectItem value="400">Normal (400)</SelectItem>
            <SelectItem value="600">Semi Bold (600)</SelectItem>
            <SelectItem value="700">Bold (700)</SelectItem>
            <SelectItem value="900">Black (900)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="title-color">Text Color</Label>
        <Input
          id="title-color"
          type="color"
          value={(localConfig as any).color || '#111827'}
          onChange={(e) => updateConfig({ color: e.target.value })}
          className="w-full h-10"
        />
      </div>
      
      <div>
        <Label htmlFor="title-alignment">Alignment</Label>
        <Select
          value={(localConfig as any).alignment || 'left'}
          onValueChange={(value) => updateConfig({ alignment: value })}
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
    </div>
  );

  const renderParagraphEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="paragraph-text">Text</Label>
        <textarea
          id="paragraph-text"
          value={(localConfig as any).text || ''}
          onChange={(e) => updateConfig({ text: e.target.value })}
          placeholder="Enter paragraph text"
          className="w-full min-h-[100px] p-2 border rounded-md resize-none"
        />
      </div>
      
      <div>
        <Label htmlFor="paragraph-font-size">Font Size</Label>
        <Slider
          id="paragraph-font-size"
          value={[(localConfig as any).fontSize || 14]}
          onValueChange={([value]) => updateConfig({ fontSize: value })}
          min={10}
          max={24}
          step={1}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {(localConfig as any).fontSize || 14}px
        </div>
      </div>
      
      <div>
        <Label htmlFor="paragraph-color">Text Color</Label>
        <Input
          id="paragraph-color"
          type="color"
          value={(localConfig as any).color || '#374151'}
          onChange={(e) => updateConfig({ color: e.target.value })}
          className="w-full h-10"
        />
      </div>
      
      <div>
        <Label htmlFor="paragraph-line-height">Line Height</Label>
        <Slider
          id="paragraph-line-height"
          value={[(localConfig as any).lineHeight || 1.6]}
          onValueChange={([value]) => updateConfig({ lineHeight: value })}
          min={1}
          max={3}
          step={0.1}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {(localConfig as any).lineHeight || 1.6}
        </div>
      </div>
    </div>
  );

  const renderListEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="list-type">List Type</Label>
        <Select
          value={(localConfig as any).listType || 'bullet'}
          onValueChange={(value) => updateConfig({ listType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bullet">Bullet List</SelectItem>
            <SelectItem value="numbered">Numbered List</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>List Items</Label>
        <div className="space-y-2">
          {((localConfig as any).items || ['Item 1', 'Item 2', 'Item 3']).map((item: string, index: number) => (
            <div key={index} className="flex gap-2">
              <Input
                value={item}
                onChange={(e) => {
                  const newItems = [...((localConfig as any).items || ['Item 1', 'Item 2', 'Item 3'])];
                  newItems[index] = e.target.value;
                  updateConfig({ items: newItems });
                }}
                placeholder={`Item ${index + 1}`}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newItems = ((localConfig as any).items || ['Item 1', 'Item 2', 'Item 3']).filter((_: any, i: number) => i !== index);
                  updateConfig({ items: newItems });
                }}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newItems = [...((localConfig as any).items || ['Item 1', 'Item 2', 'Item 3']), `Item ${((localConfig as any).items || []).length + 1}`];
              updateConfig({ items: newItems });
            }}
          >
            Add Item
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCommonEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="background-color">Background Color</Label>
        <Input
          id="background-color"
          type="color"
          value={(localConfig as any).backgroundColor || 'transparent'}
          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
          className="w-full h-10"
        />
      </div>
      
      <div>
        <Label htmlFor="padding">Padding</Label>
        <Slider
          id="padding"
          value={[(localConfig as any).padding || 8]}
          onValueChange={([value]) => updateConfig({ padding: value })}
          min={0}
          max={32}
          step={1}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground mt-1">
          {(localConfig as any).padding || 8}px
        </div>
      </div>
    </div>
  );

  const renderWidgetSpecificEditor = () => {
    switch (widget.type) {
      case 'title':
        return renderTitleEditor();
      case 'paragraph':
        return renderParagraphEditor();
      case 'list':
        return renderListEditor();
      default:
        return renderCommonEditor();
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">
          {widget.type} Widget
        </h3>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="style">Style</TabsTrigger>
        </TabsList>
        
        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Widget Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {renderWidgetSpecificEditor()}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="style" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Styling</CardTitle>
            </CardHeader>
            <CardContent>
              {renderCommonEditor()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
