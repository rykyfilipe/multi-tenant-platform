'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import BaseWidget from './BaseWidget';

export interface TextConfig {
  title?: string;
  dataSource: {
    type: 'manual';
    content: string;
  };
  type: 'markdown' | 'html' | 'plain';
  options?: {
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    backgroundColor?: string;
    textColor?: string;
    padding?: 'sm' | 'md' | 'lg';
    showBorder?: boolean;
    borderRadius?: 'none' | 'sm' | 'md' | 'lg';
  };
}

export interface Widget {
  id: number;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: TextConfig;
}

interface TextWidgetProps {
  widget: Widget;
  isEditMode: boolean;
  onEdit: () => void;
  onDelete?: () => void;
}

// Simple markdown parser for basic formatting
const parseMarkdown = (text: string): string => {
  return text
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-2">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-2">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-1">$1</h3>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
    .replace(/`(.*?)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\n/gim, '<br>');
};

export function TextWidget({ widget, isEditMode, onEdit, onDelete }: TextWidgetProps) {
  const [error, setError] = useState<string | null>(null);

  const config = widget.config as TextConfig;
  const options = config.options || {};
  const content = config.dataSource?.content || '';

  useEffect(() => {
    // Validate content based on type
    if (config.type === 'html') {
      try {
        // Basic HTML validation - check for potentially dangerous tags
        const dangerousTags = ['script', 'iframe', 'object', 'embed', 'form'];
        const hasDangerousTags = dangerousTags.some(tag => 
          content.toLowerCase().includes(`<${tag}`)
        );
        
        if (hasDangerousTags) {
          setError('HTML contains potentially dangerous tags');
        } else {
          setError(null);
        }
      } catch (err) {
        setError('Invalid HTML content');
      }
    } else {
      setError(null);
    }
  }, [content, config.type]);

  const getFontSizeClass = () => {
    switch (options.fontSize) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      case '2xl': return 'text-2xl';
      default: return 'text-base';
    }
  };

  const getTextAlignClass = () => {
    switch (options.textAlign) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'justify': return 'text-justify';
      default: return 'text-left';
    }
  };

  const getPaddingClass = () => {
    switch (options.padding) {
      case 'sm': return 'p-2';
      case 'lg': return 'p-6';
      default: return 'p-4';
    }
  };

  const getBorderRadiusClass = () => {
    switch (options.borderRadius) {
      case 'none': return 'rounded-none';
      case 'sm': return 'rounded-sm';
      case 'lg': return 'rounded-lg';
      default: return 'rounded-md';
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      );
    }

    const baseClasses = `${getFontSizeClass()} ${getTextAlignClass()} ${getPaddingClass()}`;
    const style = {
      backgroundColor: options.backgroundColor,
      color: options.textColor,
    };

    switch (config.type) {
      case 'html':
        return (
          <div 
            className={baseClasses}
            style={style}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        );
      
      case 'markdown':
        return (
          <div 
            className={baseClasses}
            style={style}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
          />
        );
      
      default: // plain
        return (
          <div 
            className={`${baseClasses} whitespace-pre-wrap`}
            style={style}
          >
            {content}
          </div>
        );
    }
  };

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onEdit={onEdit}
      onDelete={onDelete}
      isLoading={false}
      error={error}
      onRefresh={undefined}
      showRefresh={false}
    >
      <div 
        className={`${getBorderRadiusClass()} ${
          options.showBorder !== false ? 'border border-gray-200' : ''
        }`}
        style={{
          backgroundColor: options.backgroundColor,
        }}
      >
        {renderContent()}
      </div>
    </BaseWidget>
  );
}

export default TextWidget;
