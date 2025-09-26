"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
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
import { UndoRedo } from "./components/UndoRedo";
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
import { WidgetKind } from "@/generated/prisma";
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
      widgets: widgets.map(w => ({ id: w.id, kind: w.kind, title: w.title }))
    });
    return widgets;
  }, [widgetsRecord]);
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

    loadData();
  }, [tenantId, dashboardId]);

  const layout: Layout[] = widgetList.map((widget) => ({
    i: widget.id.toString(),
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
  }));

  const handleSaveLocalAsDraft = async () => {
    const operations = getPending();
    if (!operations.length) return;
    await api.createDraft({
      actorId,
      kind: WidgetKind.CUSTOM,
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
    const definition = getWidgetDefinition(widget.kind);
    createLocal({
      ...widget,
      id: Date.now(),
      title: `${widget.title ?? "Widget"} Copy`,
      position: { ...widget.position, x: widget.position.x + 1 },
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
      kind: WidgetKind.CUSTOM,
      config: { settings: {}, style: {}, data: {} },
      title: "New Draft",
    });
    setActiveTab("drafts");
  };

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
    selectedWidgets.forEach(widgetId => deleteLocal(widgetId));
    setSelectedWidgets(new Set());
  };

  const handleDuplicateSelected = () => {
    selectedWidgets.forEach(widgetId => {
      const widget = widgetsRecord[widgetId];
      if (widget) {
        const duplicatedWidget = {
          ...widget,
          id: Date.now() + Math.random(),
          title: `${widget.title} (Copy)`,
          position: { ...widget.position, x: widget.position.x + 1 },
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

  const handleTemplateSelect = (template: any) => {
    const newWidget: WidgetEntity = {
      id: Date.now(),
      tenantId,
      dashboardId,
      kind: template.kind,
      title: template.name,
      description: template.description,
      position: { x: 0, y: 0, w: 4, h: 4 },
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

  // Restore state function for undo/redo
  const handleRestoreState = useCallback((restoredWidgets: Record<number, WidgetEntity>) => {
    // Update the store with restored widgets
    Object.values(restoredWidgets).forEach(widget => {
      upsertWidget(widget);
    });
    
    // Remove widgets that are not in the restored state
    const restoredIds = new Set(Object.keys(restoredWidgets).map(Number));
    Object.keys(widgetsRecord).forEach(id => {
      if (!restoredIds.has(Number(id))) {
        deleteLocal(Number(id));
      }
    });
  }, [upsertWidget, deleteLocal, widgetsRecord]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onAddWidget: handleAddWidget,
    onSave: () => console.log('Save pending changes'),
    onUndo: () => console.log('Undo'),
    onRedo: () => console.log('Redo'),
    onDelete: handleDeleteSelected,
    onDuplicate: handleDuplicateSelected,
    onSelectAll: handleSelectAll,
    onEscape: handleDeselectAll,
    onSearch: () => setSearchFocused(true),
  });

  const handleApplyDraft = async (draftId: number) => {
    const response = await api.applyDraft(draftId, actorId);
    if (response.conflicts.length === 0) {
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
              <span>Kind: {draft.kind}</span>
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
              <UndoRedo 
                widgets={widgetsRecord}
                onRestoreState={handleRestoreState}
                onAction={(action) => console.log('Action:', action)}
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
              widget={widgetsRecord[editorWidgetId]}
              onClose={closeEditor}
              onSave={(config, title) => {
                updateLocal(editorWidgetId, { config: config as WidgetConfig, title });
                closeEditor();
              }}
            />
          )}
              {/* Widget Grid */}
              <WidgetErrorBoundary>
                <GridLayout className="layout" layout={layout} cols={12} rowHeight={30} width={1200}
                  onLayoutChange={(newLayout) => {
                    newLayout.forEach((item) => {
                      const widgetId = Number(item.i);
                      updateLocal(widgetId, {
                        position: { x: item.x, y: item.y, w: item.w, h: item.h },
                      });
                    });
                  }}
                >
                  {(filteredWidgets.length > 0 ? filteredWidgets : widgetList).map((widget) => {
                    const definition = getWidgetDefinition(widget.kind);
                    const Renderer = definition.renderer;
                    const isSelected = selectedWidgets.has(widget.id);

                    return (
                      <div 
                        key={widget.id} 
                        className={`border border-dashed rounded transition-all ${
                          isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectWidget(widget.id, !isSelected);
                        }}
                      >
                        <Renderer
                          widget={widget}
                          onEdit={() => openEditor(widget.id)}
                          onDelete={() => deleteLocal(widget.id)}
                          onDuplicate={() => handleDuplicate(widget)}
                        />
                      </div>
                    );
                  })}
                </GridLayout>
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
