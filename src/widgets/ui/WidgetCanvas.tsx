"use client";

import React, { useMemo, useState, useEffect } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { hasWidgetId } from "@/widgets/utils/pendingHelpers";
import { getWidgetDefinition } from "@/widgets/registry/widget-registry";
import { SavePendingButton } from "./components/SavePendingButton";
import { PendingChangesBadge } from "./components/PendingChangesBadge";
import { ConflictDialog } from "./components/ConflictDialog";
import { ManualMergeDialog } from "./components/ManualMergeDialog";
import { WidgetEditorSheet } from "./components/WidgetEditorSheet";
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
}

export const WidgetCanvas: React.FC<WidgetCanvasProps> = ({ tenantId, dashboardId, actorId }) => {
  const widgetsRecord = useWidgetsStore((state) => state.widgets);
  const draftsRecord = useWidgetsStore((state) => state.drafts);
  const setDrafts = useWidgetsStore((state) => state.setDrafts);
  const removeDraft = useWidgetsStore((state) => state.removeDraft);
  const widgetList = useMemo(() => Object.values(widgetsRecord), [widgetsRecord]);
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

  const [editorWidgetId, setEditorWidgetId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"canvas" | "drafts">("canvas");
  const [isLoading, setIsLoading] = useState(true);

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
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <PendingChangesBadge />
              <Button variant="outline" size="sm" onClick={handleSaveLocalAsDraft}>
                Save Pending to Draft
              </Button>
            </div>
            <div className="flex gap-2">
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
            {widgetList.map((widget) => {
              const definition = getWidgetDefinition(widget.kind);
              const Renderer = definition.renderer;

              return (
                <div key={widget.id} className="border border-dashed rounded">
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
