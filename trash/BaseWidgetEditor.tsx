import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { X, Save, RotateCcw } from 'lucide-react';

export interface BaseWidgetEditorProps {
  widget: {
    id: number;
    title?: string | null;
    type: string;
    config?: any;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: any) => void;
  onRevert?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function BaseWidgetEditor({
  widget,
  isOpen,
  onClose,
  onSave,
  onRevert,
  children,
  className = ""
}: BaseWidgetEditorProps) {
  if (!isOpen) return null;

  const handleSave = () => {
    // This will be overridden by specific widget editors
    onSave(widget.config || {});
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">
              Edit {widget.type} Widget
            </CardTitle>
            <div className="flex items-center space-x-2">
              {onRevert && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRevert}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Revert
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="data" className="mt-4">
              {children}
            </TabsContent>
            
            <TabsContent value="style" className="mt-4">
              <div className="text-center text-muted-foreground py-8">
                <p>Style options will be implemented per widget type</p>
              </div>
            </TabsContent>
            
            <TabsContent value="layout" className="mt-4">
              <div className="text-center text-muted-foreground py-8">
                <p>Layout options will be implemented per widget type</p>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="mt-4">
              <div className="text-center text-muted-foreground py-8">
                <p>Settings options will be implemented per widget type</p>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
