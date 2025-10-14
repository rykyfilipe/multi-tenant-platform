"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { cn } from "@/lib/utils";
import { Type } from "lucide-react";

interface TextWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

const TextWidgetRendererComponent: React.FC<TextWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode = false
}) => {
  const config = widget.config as any;
  const settings = config?.settings || {};
  const styleConfig = config?.style || {};
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(settings.content || "Click to edit...");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract settings
  const content = settings.content || "Click to edit...";
  const bold = settings.bold || false;
  const italic = settings.italic || false;
  const underline = settings.underline || false;
  const alignment = settings.alignment || "left";
  const fontSize = settings.fontSize || "normal";
  
  // Extract style
  const textColor = styleConfig.textColor || "#000000";
  const backgroundColor = styleConfig.backgroundColor || "transparent";
  const backgroundOpacity = styleConfig.backgroundOpacity ?? 1;
  const padding = styleConfig.padding || { top: 16, right: 16, bottom: 16, left: 16 };
  const borderRadius = styleConfig.borderRadius ?? 8;
  const border = styleConfig.border || { enabled: false, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" };
  const shadow = styleConfig.shadow || { enabled: false, size: "md" };
  const fontFamily = styleConfig.fontFamily || "Inter, system-ui, sans-serif";
  const lineHeight = styleConfig.lineHeight ?? 1.5;
  const letterSpacing = styleConfig.letterSpacing ?? 0;

  // Font size mapping
  const getFontSize = (): string => {
    if (typeof fontSize === 'number') {
      return `${fontSize}px`;
    }
    switch (fontSize) {
      case 'small': return '14px';
      case 'normal': return '16px';
      case 'large': return '24px';
      case 'xlarge': return '32px';
      default: return '16px';
    }
  };

  // Shadow class mapping
  const getShadowClass = (): string => {
    if (!shadow.enabled) return '';
    switch (shadow.size) {
      case 'sm': return 'shadow-sm';
      case 'md': return 'shadow-md';
      case 'lg': return 'shadow-lg';
      case 'xl': return 'shadow-xl';
      default: return 'shadow-md';
    }
  };

  // Handle inline editing
  const handleStartEdit = () => {
    if (isEditMode) {
      setIsEditing(true);
      setEditContent(content);
    }
  };

  const handleSave = () => {
    // Update widget config with new content
    updateLocal(widget.id, {
      config: {
        ...config,
        settings: {
          ...settings,
          content: editContent
        }
      }
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  // Auto-focus and select all when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  const textStyle: React.CSSProperties = {
    fontSize: getFontSize(),
    fontWeight: bold ? '700' : '400',
    fontStyle: italic ? 'italic' : 'normal',
    textDecoration: underline ? 'underline' : 'none',
    textAlign: alignment as any,
    color: textColor,
    fontFamily,
    lineHeight,
    letterSpacing: `${letterSpacing}px`,
    paddingTop: `${padding.top}px`,
    paddingRight: `${padding.right}px`,
    paddingBottom: `${padding.bottom}px`,
    paddingLeft: `${padding.left}px`,
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: backgroundColor === 'transparent' ? 'transparent' : backgroundColor,
    opacity: backgroundOpacity,
    borderRadius: `${borderRadius}px`,
    border: border.enabled ? `${border.width}px ${border.style} ${border.color}` : 'none',
  };

  return (
    <BaseWidget 
      title={widget.title} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "h-full w-full relative",
          getShadowClass()
        )}
        style={containerStyle}
      >
        {isEditing ? (
          // Edit mode - textarea
          <div className="h-full w-full relative">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="h-full w-full resize-none bg-transparent border-none outline-none focus:ring-0"
              style={textStyle}
              placeholder="Type your text here..."
            />
            <div className="absolute bottom-2 right-2 flex gap-2 text-xs text-muted-foreground">
              <span>Esc to cancel</span>
              <span>⌘+Enter to save</span>
            </div>
          </div>
        ) : (
          // View mode - display text
          <div
            onClick={handleStartEdit}
            className={cn(
              "h-full w-full whitespace-pre-wrap break-words",
              isEditMode && "cursor-text hover:bg-primary/5 transition-colors"
            )}
            style={textStyle}
          >
            {content || (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Type className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Click to edit text</p>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </BaseWidget>
  );
};

// OPTIMISTIC RENDERING: Only re-render when content or style changes
export const TextWidgetRenderer = React.memo(
  TextWidgetRendererComponent,
  (prevProps, nextProps) => {
    const prevConfig = prevProps.widget.config as any;
    const nextConfig = nextProps.widget.config as any;
    
    if (prevProps.widget.id !== nextProps.widget.id) {
      console.log('🔄 [TextWidget] Re-render: widget ID changed');
      return false;
    }
    
    // Settings changed (content, formatting)
    if (JSON.stringify(prevConfig?.settings) !== JSON.stringify(nextConfig?.settings)) {
      console.log('🔄 [TextWidget] Re-render: settings changed');
      return false;
    }
    
    // Style changed
    if (JSON.stringify(prevConfig?.style) !== JSON.stringify(nextConfig?.style)) {
      console.log('✨ [TextWidget] Style changed - optimistic');
      return false;
    }
    
    if (prevProps.isEditMode !== nextProps.isEditMode) {
      console.log('🔄 [TextWidget] Re-render: edit mode changed');
      return false;
    }
    
    console.log('⚡ [TextWidget] Props equal - SKIP re-render');
    return true;
  }
);

