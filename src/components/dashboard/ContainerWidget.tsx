'use client';

import React, { useState } from 'react';
import { Plus, Minus, Layout, Move, RotateCcw, BarChart3, Database, TrendingUp, FileText, CheckSquare, Clock, Calendar, Cloud, Edit3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import BaseWidget from './BaseWidget';
import { WidgetProps, BaseWidget as BaseWidgetType, WidgetType } from '@/types/widgets';
import { WidgetDataProvider } from './WidgetDataProvider';
import { getMinimalistStyles } from './design/MinimalistDesignSystem';
import { WidgetFactory } from './WidgetFactory';
import { WidgetRegistry } from './WidgetRegistry';

export interface ContainerWidgetConfig {
  title?: string;
  description?: string;
  layout?: 'grid' | 'flex' | 'stack';
  columns?: number;
  gap?: number;
  padding?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: number;
  showBorder?: boolean;
  showBackground?: boolean;
  children?: BaseWidgetType[];
}

interface ContainerWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
  onAddWidget?: (type: WidgetType, parentId?: string) => void;
  onEditWidget?: (widgetId: string) => void;
  onDeleteWidget?: (widgetId: string) => void;
  onConfigChange?: (config: ContainerWidgetConfig) => void;
  tenantId?: number;
  databaseId?: number;
}

export default function ContainerWidget({ 
  widget, 
  isEditMode, 
  onEdit, 
  onDelete,
  onAddWidget,
  onEditWidget,
  onDeleteWidget,
  onConfigChange,
  tenantId, 
  databaseId 
}: ContainerWidgetProps) {
  const config = (widget.config || {}) as ContainerWidgetConfig;
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Simple options - clean container
  const options = {
    layout: config.layout || 'grid',
    columns: config.columns || 2,
    gap: config.gap || 16,
    padding: config.padding || 16,
  };

  // Widget types available for adding
  const widgetTypes: { type: WidgetType; label: string; icon: any }[] = [
    { type: 'chart', label: 'Chart', icon: BarChart3 },
    { type: 'table', label: 'Table', icon: Database },
    { type: 'metric', label: 'KPI', icon: TrendingUp },
    { type: 'text', label: 'Text', icon: FileText },
    { type: 'tasks', label: 'Tasks', icon: CheckSquare },
    { type: 'clock', label: 'Clock', icon: Clock },
    { type: 'calendar', label: 'Calendar', icon: Calendar },
    { type: 'weather', label: 'Weather', icon: Cloud },
  ];

  const handleAddWidget = (type: WidgetType) => {
    if (onAddWidget) {
      onAddWidget(type, widget.id);
    }
    setShowAddMenu(false);
  };

  // Responsive container style
  const containerStyle = {
    display: options.layout === 'flex' ? 'flex' : 'grid',
    gridTemplateColumns: options.layout === 'grid' ? `repeat(${options.columns}, 1fr)` : undefined,
    gap: `${options.gap}px`,
    padding: `${options.padding}px`,
    width: '100%',
    height: '100%',
    minHeight: '200px', // Ensure minimum height
  };

  // Responsive grid classes
  const getResponsiveGridClasses = () => {
    if (options.layout === 'flex') {
      return 'flex flex-col sm:flex-row flex-wrap';
    }
    
    // Responsive grid columns
    const baseColumns = Math.min(options.columns, 2); // Max 2 on mobile
    const smColumns = Math.min(options.columns, 3); // Max 3 on small screens
    const mdColumns = Math.min(options.columns, 4); // Max 4 on medium screens
    const lgColumns = options.columns; // Full columns on large screens
    
    return `grid grid-cols-${baseColumns} sm:grid-cols-${smColumns} md:grid-cols-${mdColumns} lg:grid-cols-${lgColumns}`;
  };

  return (
    <div className="w-full h-full relative">
      {/* Responsive container with grid/flex layout */}
      <div
        style={containerStyle}
        className={`w-full h-full ${getResponsiveGridClasses()}`}
      >
        {/* Render child widgets - real widgets with live preview */}
        {config.children && config.children.length > 0 ? (
          config.children.map((childWidget, index) => {
            const WidgetComponent = WidgetRegistry.getComponent(childWidget.type as WidgetType);
            
            return (
              <div key={childWidget.id || index} className="relative group w-full h-full min-h-[200px] sm:min-h-[250px] md:min-h-[300px]">
                {/* Real widget rendering */}
                <div className="w-full h-full flex flex-col">
                  {WidgetComponent ? (
                    <WidgetComponent
                      widget={childWidget}
                      isEditMode={isEditMode}
                      onEdit={() => onEditWidget?.(childWidget.id)}
                      onDelete={() => onDeleteWidget?.(childWidget.id)}
                      onConfigChange={(newConfig) => {
                        // Update child widget config and trigger parent update
                        const updatedChildren = config.children?.map(child => 
                          child.id === childWidget.id 
                            ? { ...child, config: newConfig }
                            : child
                        ) || [];
                        
                        const updatedConfig = {
                          ...config,
                          children: updatedChildren
                        };
                        
                        onConfigChange?.(updatedConfig);
                      }}
                      tenantId={tenantId}
                      databaseId={databaseId}
                    />
                  ) : (
                    /* Fallback for unknown widget types */
                    <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {widgetTypes.find(w => w.type === childWidget.type)?.icon &&
                              React.createElement(widgetTypes.find(w => w.type === childWidget.type)!.icon, {
                                className: "h-4 w-4 text-gray-500"
                              })
                            }
                            <span className="text-sm font-medium text-gray-700">
                              {WidgetFactory.getTypeDisplayName(childWidget.type as WidgetType)}
                            </span>
                          </div>
                          {isEditMode && (
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditWidget?.(childWidget.id)}
                                className="p-1 h-6 w-6"
                                title="Edit Widget"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteWidget?.(childWidget.id)}
                                className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                                title="Delete Widget"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                          <p className="text-xs">Unknown Widget Type</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty state - simple */
          <div className="flex items-center justify-center h-full min-h-[120px] text-center">
            <div className="space-y-2">
              <Layout className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-sm text-gray-500">
                {isEditMode ? 'Click + to add widgets' : 'No widgets in container'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add widget button - only in edit mode, floating */}
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu open={showAddMenu} onOpenChange={setShowAddMenu}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-8 w-8 bg-white border border-gray-200 shadow-sm hover:bg-gray-50"
                title="Add Widget"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {widgetTypes.map(({ type, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleAddWidget(type)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
