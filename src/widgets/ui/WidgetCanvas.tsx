"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Responsive as ResponsiveGridLayout, type Layout, type Layouts } from "react-grid-layout";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { hasWidgetId } from "@/widgets/utils/pendingHelpers";
import { getWidgetDefinition } from "@/widgets/registry/widget-registry";
import { SavePendingButton } from "./components/SavePendingButton";
import { PendingChangesBadge } from "./components/PendingChangesBadge";
import { ConflictDialog } from "./components/ConflictDialog";
import { ManualMergeDialog } from "./components/ManualMergeDialog";
import { WidgetEditorSheet } from "./components/WidgetEditorSheet";
import { WidgetToolbar } from "./components/WidgetToolbar";
import { KeyboardShortcutsDialog } from "./components/KeyboardShortcutsDialog";
import { WidgetSearch } from "./components/WidgetSearch";
import { BulkOperations } from "./components/BulkOperations";
import { OptimisticUndoRedo } from "./components/OptimisticUndoRedo";
import { WidgetTemplates } from "./components/WidgetTemplates";
import { WidgetMarketplace } from "./components/WidgetMarketplace";
import { WidgetErrorBoundary } from "./components/WidgetErrorBoundary";
import { AccessibilityProvider } from "./components/AccessibilityProvider";
import { ResponsiveProvider } from "./components/ResponsiveProvider";
import { WidgetGridSkeleton, ToolbarSkeleton, SearchSkeleton } from "./components/WidgetSkeleton";
import { useKeyboardShortcuts } from "@/widgets/hooks/useKeyboardShortcuts";
import {
  WidgetEntity,
  WidgetConfig,
  DraftUpdateOperation,
  WidgetDraftEntity,
} from "../domain/entities";
import {
  useWidgetsApi,
} from "@/widgets/api/simple-client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WidgetType } from "@/generated/prisma";
import { DraftOperation } from "@/widgets/domain/entities";

interface WidgetCanvasProps {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  isEditMode?: boolean;
}

export const WidgetCanvas: React.FC<WidgetCanvasProps> = ({ tenantId, dashboardId, actorId, isEditMode = false }) => {
  const widgetsRecord = useWidgetsStore((state) => state.widgets);
  const draftsRecord = useWidgetsStore((state) => state.drafts);
  const setDrafts = useWidgetsStore((state) => state.setDrafts);
  const removeDraft = useWidgetsStore((state) => state.removeDraft);
  const widgetList = useMemo(() => {
    const widgets = Object.values(widgetsRecord);
    console.log('🎨 [DEBUG] Widget list updated:', {
      count: widgets.length,
      widgets: widgets.map(w => ({ id: w.id, type: w.type, title: w.title }))
    });
    return widgets;
  }, [widgetsRecord]);

  // Create responsive layouts for all breakpoints
  const layouts = useMemo(() => {
    const baseLayout = widgetList.map((widget) => ({
      i: widget.id.toString(),
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: 2,
      minH: 2,
    }));

    // Define responsive layouts for different screen sizes
    // Strategy: Max 2 columns on smaller screens, wrap to next row when needed
    return {
      xxl: baseLayout, // >=1600px: layout original (12 coloane)
      xl: baseLayout,  // >=1200px: layout original (10 coloane)
      lg: baseLayout.map((item, index) => ({
        ...item,
        w: item.w > 4 ? 8 : 4,           // mari = full width (8/8), mici = jumătate (4/8)
        x: item.w > 4 ? 0 : (index % 2) * 4, // 2 coloane
        y: Math.floor(index / 2) * (item.h || 2), // adăugat pentru a evita suprapuneri
      })),
      md: baseLayout.map((item, index) => ({
        ...item,
        w: item.w > 3 ? 6 : 3,           // mari = full width (6/6), mici = jumătate (3/6)
        x: item.w > 3 ? 0 : (index % 2) * 3,
        y: Math.floor(index / 2) * (item.h || 2),
      })),
      sm: baseLayout.map((item, index) => ({
        ...item,
        w: 4, // full width
        x: 0,
        y: index * (item.h || 2),
      })),
      xs: baseLayout.map((item, index) => ({
        ...item,
        w: 2, // full width pe ecran mic
        x: 0,
        y: index * (item.h || 2),
      })),
    };
  }, [widgetList]);

  const draftsList = useMemo(() => Object.values(draftsRecord), [draftsRecord]);
  const conflicts = useWidgetsStore((state) => state.conflicts);
  const activeConflict = useWidgetsStore((state) => state.activeConflict);
  const applyConflictResolution = useWidgetsStore((state) => state.applyConflictResolution);
  const completeManualMerge = useWidgetsStore((state) => state.completeManualMerge);
  const finalizeConflict = useWidgetsStore((state) => state.finalizeConflict);
  const getPending = useWidgetsStore((state) => state.getPending);
  const closeActiveConflict = useWidgetsStore((state) => state.closeActiveConflict);
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  const deleteLocal = useWidgetsStore((state) => state.deleteLocal);
  const createLocal = useWidgetsStore((state) => state.createLocal);
  const upsertWidget = useWidgetsStore((state) => state.upsertWidget);
  const clearPending = useWidgetsStore((state) => state.clearPending);

  const [editorWidgetId, setEditorWidgetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"canvas" | "drafts">("canvas");
  const [isLoading, setIsLoading] = useState(true);

  // New UI state
  const [selectedWidgets, setSelectedWidgets] = useState<Set<number>>(new Set());
  const [filteredWidgets, setFilteredWidgets] = useState<WidgetEntity[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  const api = useWidgetsApi(tenantId, dashboardId);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // CRITICAL: Clear widgets store BEFORE loading new dashboard widgets
        // This prevents showing stale widgets from previous dashboard
        console.log('[WidgetCanvas] Clearing store before loading dashboard:', dashboardId);
        clearPending();
        
        await Promise.all([
          api.loadWidgets(true),
          api.loadDrafts()
        ]);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (tenantId && dashboardId) {
      loadData();
    }
    
    // Cleanup when component unmounts or dashboard changes
    return () => {
      console.log('[WidgetCanvas] Cleaning up for dashboard:', dashboardId);
    };
  }, [tenantId, dashboardId, clearPending]);

  const handleSaveLocalAsDraft = async () => {
    const operations = getPending();
    if (!operations.length) return;
    await api.createDraft({
      actorId,
      type: WidgetType.CHART,
      config: { settings: {}, style: {}, data: {} },
      title: "Draft from pending",
      operations,
    });
    setActiveTab("drafts");
  };

  const handleServerResolution = async (
    widgetId: number,
    strategy: "keepLocal" | "acceptRemote" | "manual",
    mergedConfig?: WidgetConfig
  ) => {
    const res = await fetch(
      `/api/v1/tenants/${tenantId}/dashboards/${dashboardId}/widgets/resolve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": actorId.toString() },
        body: JSON.stringify({ widgetId, strategy, mergedConfig }),
      }
    );

    if (!res.ok) return;

    const data = await res.json();
    if (data?.widget) {
      finalizeConflict(widgetId, data.widget);
    } else {
      finalizeConflict(widgetId);
    }
  };

  const openEditor = (widgetId: number) => setEditorWidgetId(widgetId);
  const closeEditor = () => setEditorWidgetId(null);

  const handleDuplicate = (widget: WidgetEntity) => {
    const definition = getWidgetDefinition(widget.type);
    const nextPos = findNextPosition();
    createLocal({
      ...widget,
      id: Math.floor(Math.random() * 1000000) + 1000000,
      title: `${widget.title ?? "Widget"} Copy`,
      position: { ...widget.position, x: nextPos.x, y: nextPos.y },
      config: definition.schema.parse(widget.config),
      version: 1,
      schemaVersion: widget.schemaVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    });
  };

  const handleCreateDraft = async () => {
    await api.createDraft({
      actorId,
      type: WidgetType.CHART,
      config: { settings: {}, style: {}, data: {} },
      title: "New Draft",
    });
    setActiveTab("drafts");
  };

  const handleAddWidget = (type: WidgetType) => {
    try {
      console.log('🎯 [DEBUG] Adding widget locally:', type);
      const definition = getWidgetDefinition(type);
      const defaultConfig = definition.defaultConfig;
      
      // Find next available position
      const nextPos = findNextPosition();
      const newWidth = 8; // 8 out of 24 cols = 33% width on desktop
      const newHeight = 6; // Taller default height
      
      console.log('📍 [DEBUG] Next position:', { x: nextPos.x, y: nextPos.y, w: newWidth, h: newHeight });
      
      // Create widget locally with temporary ID
      const tempId = Date.now();
      const newWidget: WidgetEntity = {
        id: tempId,
        tenantId,
        dashboardId,
        type,
        title: `${type} Widget`,
        description: null,
        position: { x: nextPos.x, y: nextPos.y, w: newWidth, h: newHeight },
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

  // New UI functions
  const handleSelectWidget = (widgetId: number, selected: boolean) => {
    setSelectedWidgets(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(widgetId);
      } else {
        newSet.delete(widgetId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedWidgets(new Set(widgetList.map(w => w.id)));
  };

  const handleDeselectAll = () => {
    setSelectedWidgets(new Set());
  };

  const handleDeleteSelected = () => {
    // Create a copy of selected widgets to avoid mutation during iteration
    const widgetsToDelete = Array.from(selectedWidgets);

    // Batch the deletions to avoid race conditions
    try {
      widgetsToDelete.forEach(widgetId => {
        deleteLocal(widgetId);
      });

      // Clear selection after all deletions are processed
      setTimeout(() => {
        setSelectedWidgets(new Set());
      }, 0);
    } catch (error) {
      console.error('Failed to delete selected widgets:', error);
      // Still clear selection even if deletion fails
      setSelectedWidgets(new Set());
    }
  };

  const handleDuplicateSelected = () => {
    selectedWidgets.forEach((widgetId, index) => {
      const widget = widgetsRecord[widgetId];
      if (widget) {
        const nextPos = findNextPosition();
        const duplicatedWidget = {
          ...widget,
          id: Math.floor(Math.random() * 1000000) + 1000000,
          title: `${widget.title} (Copy)`,
          position: { ...widget.position, x: nextPos.x, y: nextPos.y },
        };
        createLocal(duplicatedWidget);
      }
    });
    setSelectedWidgets(new Set());
  };

  const handleMoveSelected = () => {
    // TODO: Implement move functionality
    console.log('Move selected widgets:', selectedWidgets);
  };

  const handleConfigureSelected = () => {
    // TODO: Implement bulk configuration
    console.log('Configure selected widgets:', selectedWidgets);
  };

  // Find next available position in grid
  const findNextPosition = () => {
    const widgets = useWidgetsStore.getState().widgets;
    const widgetsArray = Object.values(widgets).filter(w => w.dashboardId === dashboardId);
    
    if (widgetsArray.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find rightmost widget
    let maxX = 0;
    let maxXWidget = widgetsArray[0];
    
    widgetsArray.forEach(widget => {
      const rightEdge = (widget.position?.x || 0) + (widget.position?.w || 8);
      if (rightEdge > maxX) {
        maxX = rightEdge;
        maxXWidget = widget;
      }
    });

    // Place new widget to the right of the rightmost widget
    const newX = maxX;
    const newY = maxXWidget.position?.y || 0;
    
    // If exceeds grid width (24 columns), wrap to next row
    const GRID_COLS = 24;
    if (newX >= GRID_COLS) {
      // Find the max Y position and add new widget below
      const maxY = Math.max(...widgetsArray.map(w => (w.position?.y || 0) + (w.position?.h || 6)));
      return { x: 0, y: maxY };
    }
    
    return { x: newX, y: newY };
  };

  const handleTemplateSelect = (template: any) => {
    const nextPos = findNextPosition();
    const newWidget: WidgetEntity = {
      id: Math.floor(Math.random() * 1000000) + 1000000,
      tenantId,
      dashboardId,
      type: template.type,
      title: template.name,
      description: template.description,
      position: { x: nextPos.x, y: nextPos.y, w: 8, h: 6 }, // 33% width on desktop
      config: template.config,
      isVisible: true,
      sortOrder: 0,
      version: 1,
      schemaVersion: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    };
    createLocal(newWidget);
  };

  const handleMarketplaceInstall = (widget: any) => {
    handleTemplateSelect(widget);
  };

  const handleMarketplaceUninstall = (widgetId: string) => {
    console.log('Uninstall widget:', widgetId);
  };

  // Note: Restore state function removed - now using store's built-in undo/redo

  // Enhanced widget update function that triggers undo/redo history
  const handleWidgetUpdate = useCallback((widgetId: number, updates: Partial<WidgetEntity>) => {
    updateLocal(widgetId, updates);
    // The UndoRedo component will auto-save when widgets change due to the useEffect
  }, [updateLocal]);

  // Undo/Redo functions for keyboard shortcuts
  const undoRef = useRef<{ undo: () => void } | null>(null);
  const redoRef = useRef<{ redo: () => void } | null>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAddWidget: handleAddWidget,
    onSave: () => console.log('Save pending changes'),
    onUndo: () => undoRef.current?.undo(),
    onRedo: () => redoRef.current?.redo(),
    onDelete: handleDeleteSelected,
    onDuplicate: handleDuplicateSelected,
    onSelectAll: handleSelectAll,
    onEscape: handleDeselectAll,
    onSearch: () => setSearchFocused(true),
  });

  const handleApplyDraft = async (draftId: number) => {
    const response = await api.applyDraft(draftId, actorId);
    if (!response.conflicts || response.conflicts.length === 0) {
      removeDraft(draftId);
    }
  };

  const handleDeleteDraft = async (draftId: number) => {
    await api.deleteDraft(draftId, actorId);
    removeDraft(draftId);
  };

  const handleResolveDraftConflict = async (
    draft: WidgetDraftEntity,
    merge?: Partial<WidgetEntity>
  ) => {
    const targetMerge = merge ?? draft.conflictMeta?.suggestedMerge ?? {};
    if (!Object.keys(targetMerge).length) return;
    await api.resolveDraftConflict(draft.id, actorId, targetMerge);
  };

  const renderDraftRow = (draft: WidgetDraftEntity) => {
    const operations = draft.operations as DraftOperation[];
    const hasConflicts = draft.status === "CONFLICT" && draft.conflictMeta;
    const widgetSnapshot = draft.widgetSnapshot;

    return (
      <Card key={draft.id} className="border border-dashed p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-3 text-sm">
              <h4 className="font-semibold">Draft #{draft.id}</h4>
              <Badge variant={draft.status === "READY" ? "default" : "secondary"}>{draft.status}</Badge>
              {hasConflicts && <Badge variant="destructive">Needs merge</Badge>}
            </div>
            <div className="flex items-center flex-wrap gap-3 text-muted-foreground">
              <span>Type: {draft.type}</span>
              <span>Widget: {draft.widgetId ?? "(new)"}</span>
              <span>Version: {draft.version}</span>
              <span>Updated: {new Date(draft.updatedAt).toLocaleString()}</span>
            </div>
            {draft.note && <div>Note: {draft.note}</div>}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApplyDraft(draft.id)}
            >
              Apply
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolveDraftConflict(draft)}
              disabled={!hasConflicts}
            >
              Resolve
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDeleteDraft(draft.id)}>
              Delete
            </Button>
          </div>
        </div>

        {widgetSnapshot && (
          <div className="rounded bg-muted/40 p-3 text-xs">
            <div className="mb-1 font-semibold">Current Widget Snapshot</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>Title: {widgetSnapshot.title ?? "—"}</div>
              <div>Description: {widgetSnapshot.description ?? "—"}</div>
              <div>Version: {widgetSnapshot.version}</div>
              <div>Visible: {widgetSnapshot.isVisible ? "Yes" : "No"}</div>
            </div>
          </div>
        )}

        {hasConflicts && draft.conflictMeta && (
          <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-xs space-y-2">
            <div className="font-semibold text-destructive">Conflict Details</div>
            <div>Local version: {draft.conflictMeta.localVersion}</div>
            <div>Remote version: {draft.conflictMeta.remoteVersion}</div>
            <div className="grid gap-1">
              <span className="font-semibold">Suggested Merge:</span>
              <pre className="overflow-auto rounded bg-background p-2">
                {JSON.stringify(draft.conflictMeta.suggestedMerge ?? {}, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="text-xs space-y-2">
          <div className="font-semibold">Pending Operations ({operations?.length ?? 0}):</div>
          <ul className="list-disc list-inside space-y-1">
            {operations?.length
              ? operations.map((op) => (
                  <li key={op.id}>
                    <span className="font-medium capitalize">{op.kind}</span>
                    {hasWidgetId(op) ? ` • widget ${op.widgetId}` : ""}
                    {op.kind === "update" && op.patch && (
                      <pre className="mt-1 overflow-auto rounded bg-muted/30 p-2">
                        {JSON.stringify(op.patch, null, 2)}
                      </pre>
                    )}
                  </li>
                ))
              : [<li key="empty">No operations</li>]}
          </ul>
        </div>
      </Card>
    );
  };

  const filteredDrafts = useMemo(() => draftsList, [draftsList]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading widgets...</div>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "canvas" | "drafts")}
      className="space-y-4">
      <TabsList>
        <TabsTrigger value="canvas">Canvas</TabsTrigger>
        <TabsTrigger value="drafts">Drafts ({draftsList.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="canvas">
        <div className="space-y-4">
          {/* Enhanced Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <WidgetToolbar onAddWidget={handleAddWidget} />
              <WidgetTemplates onSelectTemplate={handleTemplateSelect} />
              <WidgetMarketplace 
                onInstallWidget={handleMarketplaceInstall}
                onUninstallWidget={handleMarketplaceUninstall}
              />
            </div>
            <div className="flex items-center gap-2">
              <KeyboardShortcutsDialog />
            </div>
          </div>

          {/* Search and Filter */}
          <WidgetSearch 
            widgets={widgetList}
            onFilteredWidgets={setFilteredWidgets}
            onSearchFocus={() => setSearchFocused(true)}
          />

          {/* Bulk Operations */}
          {selectedWidgets.size > 0 && (
            <BulkOperations
              selectedWidgets={selectedWidgets}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onDeleteSelected={handleDeleteSelected}
              onDuplicateSelected={handleDuplicateSelected}
              onMoveSelected={handleMoveSelected}
              onConfigureSelected={handleConfigureSelected}
              totalWidgets={widgetList.length}
            />
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <PendingChangesBadge />
              <OptimisticUndoRedo
                undoRef={undoRef}
                redoRef={redoRef}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSaveLocalAsDraft}>
                Save Pending to Draft
              </Button>
              <Button variant="outline" size="sm" onClick={handleCreateDraft}>
                New Empty Draft
              </Button>
              <SavePendingButton tenantId={tenantId} dashboardId={dashboardId} actorId={actorId} />
            </div>
          </div>
          <ConflictDialog
            conflicts={conflicts}
            onResolve={async (strategy, conflict) => {
              if (strategy === "manual") {
                applyConflictResolution(conflict, strategy);
              } else {
                await handleServerResolution(conflict.widgetId, strategy);
              }
            }}
          />
          <ManualMergeDialog
            conflict={activeConflict}
            localWidget={activeConflict ? widgetsRecord[activeConflict.widgetId] : undefined}
            onCancel={closeActiveConflict}
            onSubmit={async (mergedConfig) => {
              if (!activeConflict) return;

              const pending = getPending();
              const updateOperations = pending.filter(
                (operation): operation is DraftUpdateOperation =>
                  operation.kind === "update" &&
                  hasWidgetId(operation) &&
                  operation.widgetId === activeConflict.widgetId
              );
              const otherOperations = pending.filter(
                (operation) =>
                  !(
                    hasWidgetId(operation) &&
                    operation.widgetId === activeConflict.widgetId &&
                    operation.kind === "update"
                  )
              );
              const updatedOperations = [
                ...otherOperations,
                ...updateOperations.map((operation) => ({
                  ...operation,
                  patch: {
                    ...operation.patch,
                    config: mergedConfig,
                  },
                })),
              ];

              completeManualMerge(
                activeConflict,
                {
                  ...activeConflict.remoteWidget,
                  config: mergedConfig,
                  version: activeConflict.remoteVersion,
                },
                updatedOperations
              );

              await handleServerResolution(activeConflict.widgetId, "manual", mergedConfig);
            }}
          />
          {editorWidgetId !== null && widgetsRecord[editorWidgetId] && (
            <WidgetEditorSheet
              widgetId={editorWidgetId}
              tenantId={tenantId}
              onClose={closeEditor}
              onSave={(config, title) => {
                handleWidgetUpdate(editorWidgetId, { config: config as WidgetConfig, title });
                closeEditor();
              }}
            />
          )}
              {/* Widget Grid - Responsive */}
              <WidgetErrorBoundary>
                <div className="w-full mx-auto px-2 sm:px-4">
                  <ResponsiveGridLayout 
                    className="layout" 
                    layouts={layouts}
                    breakpoints={{ xxl: 1600, xl: 1200, lg: 996, md: 768, sm: 480, xs: 0 }}
                    cols={{ xxl: 12, xl: 10, lg: 8, md: 6, sm: 4, xs: 2 }}
                    rowHeight={30} 
                    margin={[16, 16]}
                    containerPadding={[8, 8]}
                    isDraggable={isEditMode}
                    isResizable={isEditMode}
                    compactType="vertical"
                    preventCollision={false}
                    onLayoutChange={(currentLayout, allLayouts) => {
                      // Only update positions in edit mode
                      if (!isEditMode) return;
                      
                      // Use setTimeout to ensure state updates are processed before layout changes
                      setTimeout(() => {
                        currentLayout.forEach((item) => {
                          const widgetId = Number(item.i);
                          // Only update if widget still exists in the store
                          if (widgetsRecord[widgetId]) {
                            handleWidgetUpdate(widgetId, {
                              position: { x: item.x, y: item.y, w: item.w, h: item.h },
                            });
                          }
                        });
                      }, 0);
                    }}
                  >
                    {(filteredWidgets.length > 0 ? filteredWidgets : widgetList).map((widget) => {
                      // CRITICAL FIX: Always get the latest widget from the store to ensure config changes are reflected
                      const currentWidget = widgetsRecord[widget.id];
                      
                      if (!currentWidget) {
                        console.warn(`⚠️ [WidgetCanvas] Widget ${widget.id} not found in current state, skipping render`);
                        return null;
                      }

                      const definition = getWidgetDefinition(currentWidget.type);
                      const Renderer = definition.renderer;
                      const isSelected = selectedWidgets.has(currentWidget.id);

                      return (
                        <div
                          key={currentWidget.id}
                          className={`transition-all ${
                            isSelected 
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                              : isEditMode 
                              ? 'ring-1 ring-border/30' 
                              : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectWidget(currentWidget.id, !isSelected);
                          }}
                        >
                          <Renderer
                            widget={currentWidget}
                            onEdit={() => openEditor(currentWidget.id)}
                            onDelete={() => deleteLocal(currentWidget.id)}
                            onDuplicate={() => handleDuplicate(currentWidget)}
                            isEditMode={isEditMode}
                          />
                        </div>
                      );
                    }).filter(Boolean)}
                  </ResponsiveGridLayout>
                </div>
              </WidgetErrorBoundary>
        </div>
      </TabsContent>
      <TabsContent value="drafts">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Drafts</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveLocalAsDraft}>
              Save Pending to Draft
            </Button>
            <Button size="sm" onClick={handleCreateDraft}>
              New Draft
            </Button>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {filteredDrafts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No drafts yet. Create one from pending changes or start a new one.</p>
          ) : (
            filteredDrafts.map(renderDraftRow)
          )}
        </div>
          </TabsContent>
        </Tabs>
  );
};
