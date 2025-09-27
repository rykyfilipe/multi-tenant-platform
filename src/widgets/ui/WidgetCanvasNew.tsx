"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { getWidgetDefinition } from "@/widgets/registry/widget-registry";
import { useDraftOperations } from "@/widgets/api/simple-draft-client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  const removeDraft = useWidgetsStore((state) => state.removeDraft);

  const { applyDraft, deleteDraft } = useDraftOperations(tenantId, dashboardId);
  const { toast } = useToast();

  const [editorWidgetId, setEditorWidgetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<number>>(new Set());
  const [containerWidth, setContainerWidth] = useState(1200);

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

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      // Use the parent container instead of .layout which might not exist yet
      const container = document.querySelector('.h-full.w-full.p-6');
      if (container) {
        setContainerWidth(container.clientWidth - 48); // Subtract padding (24px * 2)
      } else {
        // Fallback to window width
        setContainerWidth(window.innerWidth - 100);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    // Also update after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(updateWidth, 100);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timeoutId);
    };
  }, []);

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
      
      toast({
        title: "Widget added!",
        description: `${kind} widget has been added to your dashboard.`,
        variant: "success",
        duration: 4000,
      });
    } catch (error) {
      console.error("Failed to add widget locally:", error);
      toast({
        title: "Failed to add widget",
        description: "An error occurred while adding the widget.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleApplyDraft = async (draftId: number) => {
    try {
      console.log('🔄 [DEBUG] Applying draft:', draftId);
      
      toast({
        title: "Applying draft...",
        description: "Your draft changes are being applied.",
        variant: "info",
        duration: 3000,
      });
      
      const response = await applyDraft(draftId, actorId);
      
      if (response.conflicts.length === 0) {
        toast({
          title: "Draft applied successfully!",
          description: "Your changes have been saved.",
          variant: "success",
          duration: 4000,
        });
      } else {
        toast({
          title: "Draft has conflicts",
          description: "Please resolve conflicts before applying.",
          variant: "warning",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Failed to apply draft:", error);
      toast({
        title: "Failed to apply draft",
        description: error instanceof Error ? error.message : "An error occurred while applying the draft.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleDeleteDraft = async (draftId: number) => {
    try {
      console.log('🗑️ [DEBUG] Deleting draft:', draftId);
      
      toast({
        title: "Deleting draft...",
        description: "The draft is being removed.",
        variant: "info",
        duration: 3000,
      });
      
      await deleteDraft(draftId, actorId);
      
      toast({
        title: "Draft deleted successfully!",
        description: "The draft has been removed.",
        variant: "success",
        duration: 4000,
      });
    } catch (error) {
      console.error("Failed to delete draft:", error);
      toast({
        title: "Failed to delete draft",
        description: error instanceof Error ? error.message : "An error occurred while deleting the draft.",
        variant: "destructive",
        duration: 5000,
      });
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
                      toast({
                        title: "Opening editor...",
                        description: "Widget editor is opening.",
                        variant: "info",
                        duration: 2000,
                      });
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
                    const count = selectedWidgets.size;
                    selectedWidgets.forEach(widgetId => {
                      const widget = widgetList.find(w => w.id === widgetId);
                      if (widget) {
                        const duplicated = { ...widget, id: Date.now() + Math.random() };
                        createLocal(duplicated);
                      }
                    });
                    handleDeselectAll();
                    
                    toast({
                      title: "Widgets duplicated!",
                      description: `${count} widget${count > 1 ? 's' : ''} ${count > 1 ? 'have' : 'has'} been duplicated.`,
                      variant: "success",
                      duration: 4000,
                    });
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
                    const count = selectedWidgets.size;
                    selectedWidgets.forEach(widgetId => {
                      deleteLocal(widgetId);
                    });
                    handleDeselectAll();
                    
                    toast({
                      title: "Widgets deleted!",
                      description: `${count} widget${count > 1 ? 's' : ''} ${count > 1 ? 'have' : 'has'} been deleted.`,
                      variant: "success",
                      duration: 4000,
                    });
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
          .react-grid-layout {
            width: 100% !important;
            height: 100% !important;
            min-height: 100vh;
          }
          .react-grid-item {
            transition: all 200ms ease;
            transition-property: left, top, width, height;
            min-width: 200px;
            min-height: 120px;
            max-width: none;
            max-height: none;
          }
          .react-grid-item.cssTransforms {
            transition-property: transform, width, height;
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
            width: 15px;
            cursor: e-resize;
            background: linear-gradient(to left, rgba(59, 130, 246, 0.3) 0%, transparent 100%);
          }
          
          .react-grid-item > .react-resizable-handle-w {
            top: 0;
            left: 0;
            bottom: 0;
            width: 15px;
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
            rowHeight={30} 
            width={containerWidth || 1200}
            isDraggable={isEditMode}
            isResizable={isEditMode}
            allowOverlap={false}
            compactType={null}
            preventCollision={false}
            useCSSTransforms={true}
            margin={[10, 10]}
            containerPadding={[10, 10]}
            resizeHandles={['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w']}
            draggableHandle=".widget-header"
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
                isDraft?: boolean;
                onApplyDraft?: () => void;
                onDeleteDraft?: () => void;
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
                    isDraft={draftsRecord[widget.id] !== undefined}
                    onApplyDraft={isEditMode && draftsRecord[widget.id] ? () => handleApplyDraft(draftsRecord[widget.id].id) : undefined}
                    onDeleteDraft={isEditMode && draftsRecord[widget.id] ? () => handleDeleteDraft(draftsRecord[widget.id].id) : undefined}
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
          tenantId={tenantId}
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
