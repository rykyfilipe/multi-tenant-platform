"use client";

import React, { useState, useEffect, useRef } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Code, Play, AlertTriangle, ExternalLink } from "lucide-react";

interface CustomWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

export const CustomWidgetRenderer: React.FC<CustomWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode = false
}) => {
  const [executionResult, setExecutionResult] = useState<string>("");
  const [executionError, setExecutionError] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const config = widget.config as any;
  const settings = config?.settings || {};
  const style = config?.style || {};

  const title = settings.title || "Custom Widget";
  const description = settings.description || "";
  const customCode = settings.customCode || "";
  const contentType = settings.contentType || "text";
  const showBorder = settings.showBorder !== false;
  const enableScrolling = settings.enableScrolling !== false;
  const maxHeight = settings.maxHeight || 300;
  const sandboxMode = settings.sandboxMode !== false;
  const allowExternalResources = settings.allowExternalResources || false;

  // Execute JavaScript code safely
  const executeJavaScript = async () => {
    if (contentType !== 'javascript' || !customCode.trim()) return;

    setIsExecuting(true);
    setExecutionError("");
    setExecutionResult("");

    try {
      // Create a safe execution environment
      const executeCode = new Function('console', 'setResult', 'setError', `
        try {
          ${customCode}
        } catch (error) {
          setError(error.message);
        }
      `);

      executeCode(
        {
          log: (...args: any[]) => console.log(...args),
          error: (...args: any[]) => console.error(...args),
          warn: (...args: any[]) => console.warn(...args)
        },
        (result: string) => setExecutionResult(result),
        (error: string) => setExecutionError(error)
      );
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // Auto-execute JavaScript on content change
  useEffect(() => {
    if (contentType === 'javascript' && customCode.trim()) {
      executeJavaScript();
    }
  }, [customCode, contentType]);

  const renderContent = () => {
    switch (contentType) {
      case 'html':
        return (
          <div
            className="w-full h-full"
            style={{
              maxHeight: enableScrolling ? `${maxHeight}px` : 'none',
              overflow: enableScrolling ? 'auto' : 'visible'
            }}
            dangerouslySetInnerHTML={{ __html: customCode }}
          />
        );

      case 'markdown':
        // For markdown, we'd need a markdown renderer
        // For now, display as plain text
        return (
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm">{customCode}</pre>
          </div>
        );

      case 'json':
        try {
          const parsed = JSON.parse(customCode);
          return (
            <ScrollArea className="h-full">
              <pre className="text-xs p-2 bg-muted rounded">
                {JSON.stringify(parsed, null, 2)}
              </pre>
            </ScrollArea>
          );
        } catch {
          return (
            <Alert className="m-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>Invalid JSON format</AlertDescription>
            </Alert>
          );
        }

      case 'javascript':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="text-sm font-medium">JavaScript Widget</span>
                <Badge variant="secondary">Live</Badge>
              </div>
              <Button
                onClick={executeJavaScript}
                disabled={isExecuting}
                size="sm"
                variant="outline"
              >
                <Play className="w-3 h-3 mr-1" />
                {isExecuting ? 'Running...' : 'Run'}
              </Button>
            </div>

            {executionError && (
              <Alert className="text-xs">
                <AlertTriangle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  {executionError}
                </AlertDescription>
              </Alert>
            )}

            {executionResult && (
              <div className="p-2 bg-muted rounded text-xs">
                <strong>Output:</strong> {executionResult}
              </div>
            )}

            <ScrollArea className="h-32">
              <pre className="text-xs p-2 bg-muted rounded whitespace-pre-wrap">
                {customCode}
              </pre>
            </ScrollArea>
          </div>
        );

      default:
        return (
          <div className="text-center space-y-2">
            <div className="text-lg font-medium">{title}</div>
            {description && (
              <div className="text-sm text-muted-foreground">{description}</div>
            )}
            <div className="text-xs text-muted-foreground/70">
              Content: {customCode || "No content"}
            </div>
          </div>
        );
    }
  };

  const containerStyle = {
    maxHeight: enableScrolling ? `${maxHeight}px` : 'none',
    border: showBorder ? '1px solid var(--border)' : 'none',
    borderRadius: showBorder ? '8px' : '0',
    backgroundColor: style.backgroundColor || 'transparent',
    color: style.textColor || 'inherit',
  };

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="h-full flex flex-col">
        {enableScrolling ? (
          <ScrollArea className="flex-1" style={{ maxHeight: `${maxHeight}px` }}>
            <div className="p-4" style={containerStyle}>
              {renderContent()}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 p-4" style={containerStyle}>
            {renderContent()}
          </div>
        )}

        <div className="text-xs text-muted-foreground/50 p-2 border-t">
          Widget ID: {widget.id} | Type: {contentType}
          {allowExternalResources && (
            <span className="ml-2 text-orange-500">
              <ExternalLink className="w-3 h-3 inline mr-1" />
              External resources enabled
            </span>
          )}
        </div>
      </div>
    </BaseWidget>
  );
};
