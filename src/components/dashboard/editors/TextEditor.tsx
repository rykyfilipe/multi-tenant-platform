import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WidgetEditorProps, TextConfig, WidgetEntity } from '@/types/widget';
import StyleOptions from './StyleOptions';

interface TextEditorProps extends WidgetEditorProps {
  widget: Partial<WidgetEntity> & { config?: TextConfig };
}

export default function TextEditor({ widget, onSave, onCancel, isOpen }: TextEditorProps) {
  const [config, setConfig] = useState<TextConfig>({
    content: '',
    fontSize: 14,
    fontFamily: 'inherit',
    color: '#000000',
    backgroundColor: 'transparent',
    textAlign: 'left',
    fontWeight: 'normal',
    style: {
      layout: 'card',
      size: 'medium',
      fontStyle: 'normal',
      textTransform: 'none',
      lineHeight: 'normal',
      letterSpacing: 'normal',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      borderColor: '#e5e7eb',
      borderRadius: 'medium',
      shadow: 'small',
      padding: 'comfortable',
      alignment: 'left'
    },
    ...widget.config
  });

  const handleSave = () => {
    onSave({
      ...widget,
      config,
      type: 'text'
    });
  };

  const handleConfigChange = (key: keyof TextConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleStyleChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      style: {
        ...prev.style,
        [key]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Text Widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              value={config.content}
              onChange={(e) => handleConfigChange('content', e.target.value)}
              placeholder="Enter text content"
              rows={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                type="number"
                value={config.fontSize}
                onChange={(e) => handleConfigChange('fontSize', parseInt(e.target.value))}
                min="8"
                max="72"
              />
            </div>

            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select value={config.fontFamily} onValueChange={(value) => handleConfigChange('fontFamily', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inherit">Default</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="color">Text Color</Label>
              <input
                type="color"
                value={config.color}
                onChange={(e) => handleConfigChange('color', e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>

            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <input
                type="color"
                value={config.backgroundColor}
                onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                className="w-full h-10 rounded border"
              />
            </div>

            <div>
              <Label htmlFor="textAlign">Text Align</Label>
              <Select value={config.textAlign} onValueChange={(value: any) => handleConfigChange('textAlign', value)}>
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

            <div>
              <Label htmlFor="fontWeight">Font Weight</Label>
              <Select value={config.fontWeight} onValueChange={(value: any) => handleConfigChange('fontWeight', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">Preview:</div>
            <div
              style={{
                fontSize: config.fontSize,
                fontFamily: config.fontFamily,
                color: config.color,
                backgroundColor: config.backgroundColor,
                textAlign: config.textAlign,
                fontWeight: config.fontWeight,
                padding: '8px',
                borderRadius: '4px',
                minHeight: '60px'
              }}
            >
              {config.content || 'Enter text content above'}
            </div>
          </div>
        </div>

        {/* Style Options */}
        <div className="space-y-4">
          <StyleOptions
            style={config.style || {}}
            onStyleChange={handleStyleChange}
            widgetType="text"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}