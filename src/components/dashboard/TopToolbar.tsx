'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Type, 
  FileText, 
  List, 
  Table, 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  Image, 
  Gauge,
  Square
} from 'lucide-react';

interface TopToolbarProps {
  onAddWidget: (widgetType: string, position: { x: number; y: number }) => void;
}

const widgetTypes = [
  { type: 'title', icon: Type, label: 'Title', description: 'Heading text' },
  { type: 'paragraph', icon: FileText, label: 'Text', description: 'Body text' },
  { type: 'list', icon: List, label: 'List', description: 'Bullet or numbered list' },
  { type: 'table', icon: Table, label: 'Table', description: 'Data table' },
  { type: 'chart', icon: BarChart3, label: 'Chart', description: 'Data visualization' },
  { type: 'calendar', icon: Calendar, label: 'Calendar', description: 'Calendar widget' },
  { type: 'tasks', icon: CheckSquare, label: 'Tasks', description: 'Task management' },
  { type: 'image', icon: Image, label: 'Image', description: 'Image display' },
  { type: 'progress', icon: Gauge, label: 'Progress', description: 'Progress indicator' },
  { type: 'container', icon: Square, label: 'Container', description: 'Widget container' },
];

export default function TopToolbar({ onAddWidget }: TopToolbarProps) {
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, widgetType: string) => {
    setIsDragging(widgetType);
    e.dataTransfer.setData('text/plain', widgetType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setIsDragging(null);
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const widgetType = e.dataTransfer.getData('text/plain');
    
    if (widgetType) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / 50); // Grid cell size
      const y = Math.floor((e.clientY - rect.top) / 50);
      
      onAddWidget(widgetType, { x, y });
    }
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="border-b bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2">
          Widgets:
        </span>
        
        {widgetTypes.map((widget) => {
          const IconComponent = widget.icon;
          const isCurrentlyDragging = isDragging === widget.type;
          
          return (
            <div key={widget.type} className="relative group">
              <Button
                variant="outline"
                size="sm"
                className={`
                  h-12 w-12 p-0 flex flex-col items-center justify-center gap-1
                  ${isCurrentlyDragging ? 'ring-2 ring-primary ring-offset-2' : ''}
                  hover:bg-primary/10 transition-all duration-200
                `}
                draggable
                onDragStart={(e) => handleDragStart(e, widget.type)}
                onDragEnd={handleDragEnd}
                title={`${widget.label}: ${widget.description}`}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-xs font-medium">{widget.label}</span>
              </Button>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {widget.description}
              </div>
            </div>
          );
        })}
        
        <Separator orientation="vertical" className="h-8 mx-2" />
        
        <div className="text-xs text-muted-foreground">
          <p>Drag widgets to the canvas below</p>
        </div>
      </div>
      
      {/* Drop zone indicator */}
      <div 
        className="mt-4 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg text-center"
        onDrop={handleCanvasDrop}
        onDragOver={handleCanvasDragOver}
      >
        <p className="text-sm text-muted-foreground">
          Drop widgets here to add them to your dashboard
        </p>
      </div>
    </div>
  );
}
