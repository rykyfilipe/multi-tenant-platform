"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { getWidgetDefinition } from "@/widgets/registry/widget-registry";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WidgetKind } from "@/generated/prisma";
import { WidgetEntity, WidgetConfig, WidgetDraftEntity } from "@/widgets/domain/entities";
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
  const draftsRecord = useWidgetsStore((state) => state.drafts);
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  const deleteLocal = useWidgetsStore((state) => state.deleteLocal);
  const createLocal = useWidgetsStore((state) => state.createLocal);

  const [editorWidgetId, setEditorWidgetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"canvas" | "drafts">("canvas");

  const widgetList = useMemo(() => {
    const filtered = Object.values(widgetsRecord).filter((widget) => 
      widget.tenantId === tenantId && 
      widget.dashboardId === dashboardId && 
      widget.isVisible
    );
    console.log('🎯 [DEBUG] WidgetList:', filtered);
    return filtered;
  }, [widgetsRecord, tenantId, dashboardId]);

  const draftsList = useMemo(() => Object.values(draftsRecord), [draftsRecord]);

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
      console.log('📍 [DEBUG] Next position:', { x: 0, y: maxY, w: 6, h: 8 });

      // Create widget locally with temporary ID
      const tempId = Date.now();
      const newWidget: WidgetEntity = {
        id: tempId,
        tenantId,
        dashboardId,
        kind,
        title: `${kind} Widget`,
        description: null,
        position: { x: 0, y: maxY, w: 6, h: 8 },
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
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "canvas" | "drafts")} className="h-full w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="canvas">Canvas</TabsTrigger>
        <TabsTrigger value="drafts">Drafts ({draftsList.length})</TabsTrigger>
      </TabsList>
      
      <TabsContent value="canvas" className="h-full w-full relative mt-0">
        {/* Floating Toolbar - Only in Edit Mode */}
        {isEditMode && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
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
                  title="Edit Selected Widget (select exactly 1 widget)"
                >
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit {selectedWidgets.size === 1 ? '' : `(${selectedWidgets.size})`}
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
                  Duplicate {selectedWidgets.size > 0 ? `(${selectedWidgets.size})` : ''}
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
                  Delete {selectedWidgets.size > 0 ? `(${selectedWidgets.size})` : ''}
                </Button>
              </div>

              {/* Separator */}
              <div className="w-px h-6 bg-border/30 mx-2" />

              {/* Selection Actions */}
              <div className="flex items-center space-x-1">
                {selectedWidgets.size > 0 && (
                  <div className="text-xs text-muted-foreground px-2">
                    {selectedWidgets.size} selected
                  </div>
                )}
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
        <style jsx global>{`
          .react-grid-item {
            transition: all 200ms ease;
            transition-property: left, top;
          }
          .react-grid-item.cssTransforms {
            transition-property: transform;
          }
          
          /* Resize handles - visible and functional */
          .react-grid-item > .react-resizable-handle {
            position: absolute;
            z-index: 10;
          }
          
          /* Bottom-right resize handle (SE) */
          .react-grid-item > .react-resizable-handle-se {
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 0%, transparent 40%, rgba(59, 130, 246, 0.3) 40%, rgba(59, 130, 246, 0.3) 50%, transparent 50%);
          }
          
          /* Bottom-left resize handle (SW) */
          .react-grid-item > .react-resizable-handle-sw {
            bottom: 0;
            left: 0;
            width: 20px;
            height: 20px;
            cursor: sw-resize;
            background: linear-gradient(225deg, transparent 0%, transparent 40%, rgba(59, 130, 246, 0.3) 40%, rgba(59, 130, 246, 0.3) 50%, transparent 50%);
          }
          
          /* Top-right resize handle (NE) */
          .react-grid-item > .react-resizable-handle-ne {
            top: 0;
            right: 0;
            width: 20px;
            height: 20px;
            cursor: ne-resize;
            background: linear-gradient(45deg, transparent 0%, transparent 40%, rgba(59, 130, 246, 0.3) 40%, rgba(59, 130, 246, 0.3) 50%, transparent 50%);
          }
          
          /* Top-left resize handle (NW) */
          .react-grid-item > .react-resizable-handle-nw {
            top: 0;
            left: 0;
            width: 20px;
            height: 20px;
            cursor: nw-resize;
            background: linear-gradient(315deg, transparent 0%, transparent 40%, rgba(59, 130, 246, 0.3) 40%, rgba(59, 130, 246, 0.3) 50%, transparent 50%);
          }
          
          /* Edge resize handles */
          .react-grid-item > .react-resizable-handle-n {
            top: 0;
            left: 0;
            right: 0;
            height: 10px;
            cursor: n-resize;
            background: linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 0%, transparent 100%);
          }
          
          .react-grid-item > .react-resizable-handle-s {
            bottom: 0;
            left: 0;
            right: 0;
            height: 10px;
            cursor: s-resize;
            background: linear-gradient(to top, rgba(59, 130, 246, 0.3) 0%, transparent 100%);
          }
          
          .react-grid-item > .react-resizable-handle-e {
            top: 0;
            right: 0;
            bottom: 0;
            width: 10px;
            cursor: e-resize;
            background: linear-gradient(to left, rgba(59, 130, 246, 0.3) 0%, transparent 100%);
          }
          
          .react-grid-item > .react-resizable-handle-w {
            top: 0;
            left: 0;
            bottom: 0;
            width: 10px;
            cursor: w-resize;
            background: linear-gradient(to right, rgba(59, 130, 246, 0.3) 0%, transparent 100%);
          }
          
          /* Hide handles when not resizable */
          .react-grid-item.react-resizable-hide > .react-resizable-handle {
            display: none;
          }
          
          /* Show handles on hover */
          .react-grid-item:hover > .react-resizable-handle {
            opacity: 1;
          }
          
          .react-grid-item > .react-resizable-handle {
            opacity: 0.7;
            transition: opacity 200ms ease;
          }
          
          /* Dragging states */
          .react-grid-item.react-draggable-dragging {
            transition: none;
            z-index: 3;
            will-change: transform;
          }
          
          .react-grid-item.react-grid-placeholder {
            background: rgb(59, 130, 246) !important;
            opacity: 0.2;
            transition-duration: 100ms;
            z-index: 2;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            -o-user-select: none;
            user-select: none;
          }
        `}</style>
        <WidgetErrorBoundary>
          <GridLayout 
            className="layout h-full" 
            layout={layout} 
            cols={24} 
            rowHeight={20} 
            width={1200}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            allowOverlap={false}
            compactType={null}
            preventCollision={false}
            useCSSTransforms={true}
            margin={[10, 10]}
            containerPadding={[10, 10]}
            resizeHandles={['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w']}
            onLayoutChange={(newLayout) => {
              if (!isEditMode) return;
              console.log('🎯 [DEBUG] Layout changed:', newLayout);
              newLayout.forEach((item) => {
                const widgetId = Number(item.i);
                updateLocal(widgetId, {
                  position: { x: item.x, y: item.y, w: item.w, h: item.h },
                });
              });
            }}
            onResize={(layout, oldItem, newItem, placeholder, e, element) => {
              if (!isEditMode) return;
              console.log('🎯 [DEBUG] Resize event:', { oldItem, newItem });
            }}
            onResizeStop={(layout, oldItem, newItem, placeholder, e, element) => {
              if (!isEditMode) return;
              console.log('🎯 [DEBUG] Resize stopped:', { oldItem, newItem });
              const widgetId = Number(newItem.i);
              updateLocal(widgetId, {
                position: { x: newItem.x, y: newItem.y, w: newItem.w, h: newItem.h },
              });
            }}
          >
            {widgetList.map((widget) => {
              const definition = getWidgetDefinition(widget.kind);
              const Renderer = definition.renderer as React.ComponentType<{
                widget: WidgetEntity;
                onEdit?: () => void;
                onDelete?: () => void;
                onDuplicate?: () => void;
                isEditMode?: boolean;
              }>;
              const isSelected = selectedWidgets.has(widget.id);

              return (
                  <div 
                    key={widget.id} 
                    className={`border border-dashed rounded transition-all cursor-pointer ${
                      isEditMode 
                        ? (isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300 hover:border-gray-400')
                        : 'border-transparent'
                    }`}
                    onClick={(e) => {
                      if (!isEditMode) return;
                      
                      e.stopPropagation();
                      if (e.ctrlKey || e.metaKey) {
                        // Multi-select: add to selection
                        handleSelectWidget(widget.id);
                      } else {
                        // Single select: clear others and select this one
                        handleDeselectAll();
                        handleSelectWidget(widget.id);
                      }
                    }}
                  >
                  <Renderer
                    widget={widget}
                    onEdit={undefined}
                    onDelete={undefined}
                    onDuplicate={undefined}
                    isEditMode={isEditMode}
                  />
                </div>
              );
            })}
          </GridLayout>
        </WidgetErrorBoundary>
      </div>
      </TabsContent>

      <TabsContent value="drafts" className="h-full w-full mt-0">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Drafts</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Save Pending to Draft
              </Button>
              <Button size="sm">
                New Draft
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {draftsList.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">No drafts yet</div>
                <p className="text-sm text-muted-foreground">
                  Create drafts to save your work in progress
                </p>
              </div>
            ) : (
              draftsList.map((draft) => (
                <div key={draft.id} className="border border-dashed rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-3 text-sm">
                        <h4 className="font-semibold">Draft #{draft.id}</h4>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {draft.status}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-3 text-muted-foreground">
                        <span>Kind: {draft.kind}</span>
                        <span>Widget: {draft.widgetId ?? "(new)"}</span>
                        <span>Version: {draft.version}</span>
                        <span>Updated: {new Date(draft.updatedAt).toLocaleString()}</span>
                      </div>
                      {draft.note && <div>Note: {draft.note}</div>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Apply
                      </Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </TabsContent>

      {/* Widget Editor - Only in Edit Mode */}
      {isEditMode && editorWidgetId && (
        <WidgetEditorSheet
          widgetId={editorWidgetId}
          tenantId={tenantId}
          onClose={closeEditor}
          onSave={(config, title) => {
            updateLocal(editorWidgetId, { config: config as WidgetConfig, title });
            closeEditor();
          }}
        />
      )}
    </Tabs>
    
  );
  
};
