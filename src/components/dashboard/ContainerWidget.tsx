'use client';

import { useState } from 'react';
import { Plus, Minus, Layout, Move, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BaseWidget from './BaseWidget';
import { WidgetProps, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { WidgetDataProvider } from './WidgetDataProvider';
import { getMinimalistStyles } from './design/MinimalistDesignSystem';

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
  children?: any[];
}

interface ContainerWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
}

export default function ContainerWidget({ 
  widget, 
  isEditMode, 
  onEdit, 
  onDelete,
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
                  Container
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 h-6 w-6"
              >
                {isExpanded ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </Button>
            </div>

            {/* Container Content */}
            {isExpanded && (
              <div className="flex-1">
                <div 
                  style={containerStyle}
                  className="transition-all duration-200"
                >
                  {/* Placeholder content */}
                  <div className="flex items-center justify-center h-full min-h-[120px] text-center">
                    <div className="space-y-2">
                      <Layout className="h-8 w-8 mx-auto text-gray-400" />
                      <p className={`${getMinimalistStyles.mutedStyle()} text-xs sm:text-sm`}>
                        Container ready for widgets
                      </p>
                      <p className={`${getMinimalistStyles.mutedStyle()} text-xs`}>
                        Layout: {options.layout} • Columns: {options.columns}
                      </p>
                    </div>
                  </div>
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
