/**
 * Contextual Tooltip Component
 * Accessible tooltip with rich content support
 */

"use client";

import React, { useState } from "react";
import { Info, HelpCircle, Lightbulb, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContextualTooltipProps {
  content: React.ReactNode;
  title?: string;
  type?: 'info' | 'help' | 'tip' | 'warning';
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
  triggerClassName?: string;
  delayDuration?: number;
}

const iconMap = {
  info: Info,
  help: HelpCircle,
  tip: Lightbulb,
  warning: AlertCircle,
};

const colorMap = {
  info: 'text-blue-600 dark:text-blue-400',
  help: 'text-muted-foreground hover:text-foreground',
  tip: 'text-amber-600 dark:text-amber-400',
  warning: 'text-red-600 dark:text-red-400',
};

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
  content,
  title,
  type = 'help',
  side = 'top',
  align = 'center',
  className,
  triggerClassName,
  delayDuration = 200,
}) => {
  const Icon = iconMap[type];

  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center",
              "rounded-full p-1 transition-colors duration-200",
              "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2",
              "hover:bg-muted/50",
              colorMap[type],
              triggerClassName
            )}
            aria-label={typeof content === 'string' ? content : title || 'More information'}
          >
            <Icon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className={cn(
            "max-w-xs z-50",
            "bg-popover/95 backdrop-blur-sm",
            "border border-border shadow-lg",
            "animate-in fade-in-0 zoom-in-95",
            className
          )}
        >
          {title && (
            <div className="font-semibold text-sm mb-1 text-foreground">
              {title}
            </div>
          )}
          <div className="text-xs text-muted-foreground leading-relaxed">
            {content}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * Field Tooltip - Specifically for form fields
 */
interface FieldTooltipProps {
  label: string;
  description: string;
  example?: string;
  children: React.ReactNode;
}

export const FieldTooltip: React.FC<FieldTooltipProps> = ({
  label,
  description,
  example,
  children,
}) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        <ContextualTooltip
          title={label}
          content={
            <div className="space-y-2">
              <p>{description}</p>
              {example && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold mb-1">Example:</p>
                  <code className="text-xs bg-muted/50 px-2 py-1 rounded">
                    {example}
                  </code>
                </div>
              )}
            </div>
          }
        />
      </div>
      {children}
    </div>
  );
};

/**
 * Inline Help Text - For hints below form fields
 */
interface InlineHelpProps {
  children: React.ReactNode;
  type?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export const InlineHelp: React.FC<InlineHelpProps> = ({
  children,
  type = 'default',
  className,
}) => {
  const colorClasses = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-amber-600 dark:text-amber-400',
    error: 'text-red-600 dark:text-red-400',
  };

  return (
    <p className={cn(
      "text-xs mt-1.5 leading-relaxed",
      colorClasses[type],
      className
    )}>
      {children}
    </p>
  );
};

