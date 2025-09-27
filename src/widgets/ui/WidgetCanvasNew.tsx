"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { getWidgetDefinition } from "@/widgets/registry/widget-registry";
import { Button } from "@/components/ui/button";
import { WidgetKind } from "@/generated/prisma";
import { WidgetEntity, WidgetConfig } from "@/widgets/domain/entities";
import { WidgetErrorBoundary } from "./components/WidgetErrorBoundary";
import { WidgetEditorSheet } from "./components/WidgetEditorSheet";
import { 
  BarChart3, 
  Table, 
  Target, 
  Clock, 
  CloudSun, 
  Settings, 
  Save, 
  Undo2, 
  Redo2,
  Edit3,
  Copy,
  Trash2,
  CheckSquare,
  X
} from "lucide-react";

interface WidgetCanvasNewProps {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  isEditMode?: boolean;
}

export const WidgetCanvasNew: React.FC<WidgetCanvasNewProps> = ({ 
  tenantId, 
  dashboardId, 
  actorId, 
  isEditMode = false 
}) => {
  const widgetsRecord = useWidgetsStore((state) => state.widgets);
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  const deleteLocal = useWidgetsStore((state) => state.deleteLocal);
  const createLocal = useWidgetsStore((state) => state.createLocal);

  const [editorWidgetId, setEditorWidgetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<number>>(new Set());

  const widgetList = useMemo(() => {
    const filtered = Object.values(widgetsRecord).filter((widget) => 
      widget.tenantId === tenantId && 
      widget.dashboardId === dashboardId && 
      widget.isVisible
    );
    console.log('🎯 [DEBUG] WidgetList:', filtered);
    return filtered;
  }, [widgetsRecord, tenantId, dashboardId]);

  const layout: Layout[] = useMemo(() => {
    const layoutItems = widgetList.map((widget) => ({
      i: widget.id.toString(),
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
    }));
    console.log('🎯 [DEBUG] Layout:', layoutItems);
    return layoutItems;
  }, [widgetList]);

  const closeEditor = () => setEditorWidgetId(null);

  const handleAddWidget = (kind: WidgetKind) => {
    try {
      console.log('🎯 [DEBUG] Adding widget locally:', kind);
      const definition = getWidgetDefinition(kind);
      const defaultConfig = definition.defaultConfig;

      // Find next available position
      const maxY = Math.max(...widgetList.map(w => w.position.y + w.position.h), 0);
      console.log('📍 [DEBUG] Next position:', { x: 0, y: maxY, w: 4, h: 4 });

      // Create widget locally with temporary ID
      const tempId = Date.now();
      const newWidget: WidgetEntity = {
        id: tempId,
        tenantId,
        dashboardId,
        kind,
        title: `${kind} Widget`,
        description: null,
        position: { x: 0, y: maxY, w: 4, h: 4 },
        config: defaultConfig,
        isVisible: true,
        sortOrder: 0,
        version: 1,
        schemaVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: actorId,
        updatedBy: actorId,
      };

      console.log('🆕 [DEBUG] Creating local widget:', newWidget);

      // Add to local state
      createLocal(newWidget);

      console.log('✅ [DEBUG] Widget added to local state');
    } catch (error) {
      console.error("Failed to add widget locally:", error);
    }
  };

  const handleSelectWidget = (widgetId: number) => {
    setSelectedWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        newSet.delete(widgetId);
      } else {
        newSet.add(widgetId);
      }
      return newSet;
    });
  };

  const handleDeselectAll = () => {
    setSelectedWidgets(new Set());
  };

  const handleSelectAll = () => {
    const allWidgetIds = new Set(widgetList.map(widget => widget.id));
    setSelectedWidgets(allWidgetIds);
  };

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading widgets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {/* Floating Toolbar - Only in Edit Mode */}
      {isEditMode && (
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-background/90 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl px-4 py-2">
            <div className="flex items-center space-x-2">
              {/* Widget Types */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetKind.CHART)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Chart Widget"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetKind.TABLE)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Table Widget"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetKind.KPI)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add KPI Widget"
                >
                  <Target className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetKind.CLOCK)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Clock Widget"
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetKind.WEATHER)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Weather Widget"
                >
                  <CloudSun className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetKind.CUSTOM)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Custom Widget"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-border/30 mx-2" />

              {/* Widget Actions */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Edit selected widget
                    const selectedId = Array.from(selectedWidgets)[0];
                    if (selectedId) {
                      setEditorWidgetId(selectedId);
                    }
                  }}
                  disabled={selectedWidgets.size !== 1}
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  title="Edit Selected Widget"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Duplicate selected widgets
                    selectedWidgets.forEach(widgetId => {
                      const widget = widgetList.find(w => w.id === widgetId);
                      if (widget) {
                        const duplicated = { ...widget, id: Date.now() + Math.random() };
                        createLocal(duplicated);
                      }
                    });
                    handleDeselectAll();
                  }}
                  disabled={selectedWidgets.size === 0}
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  title="Duplicate Selected Widgets"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Delete selected widgets
                    selectedWidgets.forEach(widgetId => {
                      deleteLocal(widgetId);
                    });
                    handleDeselectAll();
                  }}
                  disabled={selectedWidgets.size === 0}
                  className="h-8 px-3 text-xs hover:bg-destructive/10 text-destructive hover:text-destructive"
                  title="Delete Selected Widgets"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-border/30 mx-2" />

              {/* Selection Actions */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  title="Select All Widgets"
                >
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={selectedWidgets.size === 0}
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  title="Deselect All"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-border/30 mx-2" />

              {/* Save Actions */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('Save Pending Changes')}
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  title="Save Pending Changes"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('Undo')}
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  title="Undo"
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  Undo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => console.log('Redo')}
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  title="Redo"
                >
                  <Redo2 className="h-3 w-3 mr-1" />
                  Redo
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Area */}
      <div className="h-full w-full p-6">
        <WidgetErrorBoundary>
          <GridLayout 
            className="layout h-full" 
            layout={layout} 
            cols={12} 
            rowHeight={30} 
            width={1200}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            onLayoutChange={(newLayout) => {
              if (!isEditMode) return;
              newLayout.forEach((item) => {
                const widgetId = Number(item.i);
                updateLocal(widgetId, {
                  position: { x: item.x, y: item.y, w: item.w, h: item.h },
                });
              });
            }}
          >
            {widgetList.map((widget) => {
              const definition = getWidgetDefinition(widget.kind);
              const Renderer = definition.renderer;
              const isSelected = selectedWidgets.has(widget.id);

              return (
                  <div 
                    key={widget.id} 
                    className={`border border-dashed rounded transition-all ${
                      isEditMode 
                        ? (isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300 hover:border-gray-400')
                        : 'border-transparent'
                    }`}
                    onClick={(e) => {
                      if (!isEditMode) return;
                      
                      // Check if click was on a button (don't select widget if so)
                      const target = e.target as HTMLElement;
                      if (target.tagName === 'BUTTON' || target.closest('button')) {
                        return;
                      }
                      
                      e.stopPropagation();
                      if (e.ctrlKey || e.metaKey) {
                        handleSelectWidget(widget.id);
                      } else {
                        handleDeselectAll();
                        handleSelectWidget(widget.id);
                      }
                    }}
                  >
                  <Renderer
                    widget={widget}
                    onEdit={isEditMode ? () => setEditorWidgetId(widget.id) : undefined}
                    onDelete={isEditMode ? () => deleteLocal(widget.id) : undefined}
                    onDuplicate={isEditMode ? () => {
                      const duplicated = { ...widget, id: Date.now() + Math.random() };
                      createLocal(duplicated);
                    } : undefined}
                    isEditMode={isEditMode}
                  />
                </div>
              );
            })}
          </GridLayout>
        </WidgetErrorBoundary>
      </div>

      {/* Widget Editor - Only in Edit Mode */}
      {isEditMode && editorWidgetId && (
        <WidgetEditorSheet
          widgetId={editorWidgetId}
          onClose={closeEditor}
          onSave={(config, title) => {
            updateLocal(editorWidgetId, { config: config as WidgetConfig, title });
            closeEditor();
          }}
        />
      )}
    </div>
  );
};
