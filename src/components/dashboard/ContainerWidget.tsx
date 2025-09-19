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
}

export default function ContainerWidget({ 
  widget, 
  isEditMode, 
  onEdit, 
  onDelete,
  onAddWidget,
  onEditWidget,
  onDeleteWidget,
  tenantId, 
  databaseId 
}: ContainerWidgetProps) {
  const config = (widget.config || {}) as ContainerWidgetConfig;
  const options = {
    layout: config.layout || 'grid',
    columns: config.columns || 2,
    gap: config.gap || 16,
    padding: config.padding || 16,
    backgroundColor: config.backgroundColor || '#f8fafc',
    borderColor: config.borderColor || '#e2e8f0',
    borderRadius: config.borderRadius || 8,
    showBorder: config.showBorder !== false,
    showBackground: config.showBackground !== false,
    ...config
  };

  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);

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

  const containerStyle = {
    display: options.layout === 'flex' ? 'flex' : 'grid',
    gridTemplateColumns: options.layout === 'grid' ? `repeat(${options.columns}, 1fr)` : undefined,
    gap: `${options.gap}px`,
    padding: `${options.padding}px`,
    backgroundColor: options.showBackground ? options.backgroundColor : 'transparent',
    border: options.showBorder ? `1px solid ${options.borderColor}` : 'none',
    borderRadius: `${options.borderRadius}px`,
    minHeight: '200px',
    width: '100%',
  };

  return (
    <WidgetDataProvider widget={widget}>
      {({ data, isLoading, error, refetch }) => (
        <BaseWidget
          widget={widget}
          isEditMode={isEditMode}
          onEdit={onEdit}
          onDelete={onDelete}
          isLoading={isLoading}
          error={error}
          onRefresh={refetch}
          showRefresh={false}
        >
          <div className="space-y-3 sm:space-y-4 flex flex-col h-full">
            {/* Container Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="h-4 w-4 text-gray-500" />
                <span className={`${getMinimalistStyles.titleStyle('sm')} text-gray-700`}>
                  {config.title || 'Container'}
                </span>
                {config.children && config.children.length > 0 && (
                  <span className={`${getMinimalistStyles.mutedStyle()} text-xs`}>
                    ({config.children.length} widgets)
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {isEditMode && (
                  <DropdownMenu open={showAddMenu} onOpenChange={setShowAddMenu}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-6 w-6"
                        title="Add Widget"
                      >
                        <Plus className="h-3 w-3" />
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
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 h-6 w-6"
                >
                  {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {/* Container Content */}
            {isExpanded && (
              <div className="flex-1">
                <div 
                  style={containerStyle}
                  className="transition-all duration-200"
                >
                  {/* Render child widgets */}
                  {config.children && config.children.length > 0 ? (
                    config.children.map((childWidget, index) => (
                      <div key={childWidget.id || index} className="relative group">
                        {/* Widget placeholder - in a real implementation, you'd render the actual widget */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4 h-full min-h-[100px] flex flex-col">
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
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            <p className="text-xs">Widget Preview</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Empty state */
                    <div className="flex items-center justify-center h-full min-h-[120px] text-center">
                      <div className="space-y-2">
                        <Layout className="h-8 w-8 mx-auto text-gray-400" />
                        <p className={`${getMinimalistStyles.mutedStyle()} text-xs sm:text-sm`}>
                          {isEditMode ? 'Click + to add widgets' : 'No widgets in container'}
                        </p>
                        <p className={`${getMinimalistStyles.mutedStyle()} text-xs`}>
                          Layout: {options.layout} • Columns: {options.columns}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Container Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-medium text-gray-600">Layout</div>
                <div className="text-gray-900 capitalize">{options.layout}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-medium text-gray-600">Columns</div>
                <div className="text-gray-900">{options.columns}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-medium text-gray-600">Gap</div>
                <div className="text-gray-900">{options.gap}px</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-medium text-gray-600">Padding</div>
                <div className="text-gray-900">{options.padding}px</div>
              </div>
            </div>
          </div>
        </BaseWidget>
      )}
    </WidgetDataProvider>
  );
}
