'use client';

import { Widget } from '@/types/dashboard';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface WidgetRendererProps {
  widget: Widget;
  isSelected: boolean;
  onDelete: () => void;
}

export default function WidgetRenderer({ widget, isSelected, onDelete }: WidgetRendererProps) {
  const renderWidget = () => {
    switch (widget.type) {
      case 'title':
        return (
          <div 
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              fontSize: (widget.config as any).fontSize || 24,
              fontWeight: (widget.config as any).fontWeight || 600,
              color: (widget.config as any).color || '#111827',
              textAlign: (widget.config as any).alignment || 'left',
              backgroundColor: (widget.config as any).backgroundColor || 'transparent',
              padding: (widget.config as any).padding || 8,
            }}
          >
            {(widget.config as any).text || 'Title'}
          </div>
        );
      
      case 'paragraph':
        return (
          <div 
            className="w-full h-full p-2 overflow-auto"
            style={{
              fontSize: (widget.config as any).fontSize || 14,
              color: (widget.config as any).color || '#374151',
              lineHeight: (widget.config as any).lineHeight || 1.6,
              textAlign: (widget.config as any).alignment || 'left',
              backgroundColor: (widget.config as any).backgroundColor || 'transparent',
              padding: (widget.config as any).padding || 8,
            }}
          >
            {(widget.config as any).text || 'Enter your text here...'}
          </div>
        );
      
      case 'list':
        return (
          <div 
            className="w-full h-full p-2 overflow-auto"
            style={{
              fontSize: (widget.config as any).fontSize || 14,
              color: (widget.config as any).color || '#374151',
              backgroundColor: (widget.config as any).backgroundColor || 'transparent',
              padding: (widget.config as any).padding || 8,
            }}
          >
            {((widget.config as any).items || ['Item 1', 'Item 2', 'Item 3']).map((item: any, index: number) => (
              <div key={index} className="mb-1">
                {(widget.config as any).listType === 'numbered' ? `${index + 1}. ` : '• '}
                {item}
              </div>
            ))}
          </div>
        );
      
      case 'table':
        return (
          <div 
            className="w-full h-full p-2 overflow-auto"
            style={{
              backgroundColor: (widget.config as any).backgroundColor || 'transparent',
              padding: (widget.config as any).padding || 8,
            }}
          >
            <div className="text-sm font-medium mb-2">Table Widget</div>
            <div className="text-xs text-muted-foreground">
              {(widget.config as any).tableName ? `Connected to: ${(widget.config as any).tableName}` : 'No table connected'}
            </div>
          </div>
        );
      
      case 'chart':
        return (
          <div 
            className="w-full h-full p-2 overflow-auto"
            style={{
              backgroundColor: (widget.config as any).backgroundColor || 'transparent',
              padding: (widget.config as any).padding || 8,
            }}
          >
            <div className="text-sm font-medium mb-2">Chart Widget</div>
            <div className="text-xs text-muted-foreground">
              {(widget.config as any).tableName ? `Connected to: ${(widget.config as any).tableName}` : 'No table connected'}
            </div>
            <div className="text-xs text-muted-foreground">
              Type: {(widget.config as any).chartType || 'bar'}
            </div>
          </div>
        );
      
      case 'container':
        return (
          <div 
            className="w-full h-full border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: (widget.config as any).background || '#ffffff',
              borderWidth: (widget.config as any).border?.width || 1,
              borderColor: (widget.config as any).border?.color || '#e5e7eb',
              borderRadius: (widget.config as any).border?.radius || 8,
              padding: (widget.config as any).padding || 12,
              margin: (widget.config as any).margin || 0,
            }}
          >
            <div className="text-center text-muted-foreground">
              <div className="text-lg font-medium">Container</div>
              <div className="text-sm">
                {(widget.config as any).children?.length || 0} child widgets
              </div>
            </div>
          </div>
        );
      
      case 'progress':
        return (
          <div 
            className="w-full h-full p-2 flex flex-col justify-center"
            style={{
              backgroundColor: (widget.config as any).backgroundColor || 'transparent',
              padding: (widget.config as any).padding || 8,
            }}
          >
            <div className="text-sm font-medium mb-2 text-center">
              {(widget.config as any).label || 'Progress'}
            </div>
            <div className="w-full bg-muted rounded-full h-2 mb-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((widget.config as any).value / (widget.config as any).max) * 100}%`,
                  backgroundColor: (widget.config as any).color || '#3b82f6',
                }}
              />
            </div>
            {(widget.config as any).showPercentage && (
              <div className="text-xs text-center text-muted-foreground">
                {Math.round(((widget.config as any).value / (widget.config as any).max) * 100)}%
              </div>
            )}
          </div>
        );
      
      case 'calendar':
        return (
          <div 
            className="w-full h-full p-2 overflow-auto"
            style={{
              backgroundColor: widget.config.backgroundColor || 'transparent',
              padding: widget.config.padding || 8,
            }}
          >
            <div className="text-sm font-medium mb-2">Calendar Widget</div>
            <div className="text-xs text-muted-foreground">
              Calendar functionality coming soon
            </div>
          </div>
        );
      
      case 'tasks':
        return (
          <div 
            className="w-full h-full p-2 overflow-auto"
            style={{
              backgroundColor: widget.config.backgroundColor || 'transparent',
              padding: widget.config.padding || 8,
            }}
          >
            <div className="text-sm font-medium mb-2">Tasks Widget</div>
            <div className="text-xs text-muted-foreground">
              Task management coming soon
            </div>
          </div>
        );
      
      case 'image':
        return (
          <div 
            className="w-full h-full p-2 overflow-auto"
            style={{
              backgroundColor: widget.config.backgroundColor || 'transparent',
              padding: widget.config.padding || 8,
            }}
          >
            <div className="text-sm font-medium mb-2">Image Widget</div>
            <div className="text-xs text-muted-foreground">
              {(widget.config as any).src ? 'Image loaded' : 'No image selected'}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="w-full h-full p-2 flex items-center justify-center text-muted-foreground">
            Unknown widget type: {widget.type}
          </div>
        );
    }
  };

  return (
    <div className="relative w-full h-full bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      {/* Delete button - only show when selected */}
      {isSelected && (
        <Button
          variant="destructive"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
      
      {/* Widget content */}
      {renderWidget()}
    </div>
  );
}
