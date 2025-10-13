"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Undo2, Redo2, History, RotateCcw, MoreHorizontal } from "lucide-react";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";

interface OptimisticUndoRedoProps {
  undoRef?: React.MutableRefObject<{ undo: () => void } | null>;
  redoRef?: React.MutableRefObject<{ redo: () => void } | null>;
}

/**
 * Optimistic Undo/Redo component that uses the store's built-in per-widget history
 * No need to deep clone entire widget state - uses existing history mechanism
 */
export const OptimisticUndoRedo: React.FC<OptimisticUndoRedoProps> = ({
  undoRef,
  redoRef,
}) => {
  const lastModifiedWidgetId = useWidgetsStore((state) => state.lastModifiedWidgetId);
  const history = useWidgetsStore((state) => state.history);
  const redoHistory = useWidgetsStore((state) => state.redoHistory);
  const undoLastChange = useWidgetsStore((state) => state.undoLastChange);
  const redoLastChange = useWidgetsStore((state) => state.redoLastChange);
  const discardAllChanges = useWidgetsStore((state) => state.discardAllChanges);
  const dirtyWidgetIds = useWidgetsStore((state) => state.dirtyWidgetIds);

  // Global undo - undo the last modified widget
  const undo = useCallback(() => {
    if (lastModifiedWidgetId && history[lastModifiedWidgetId]?.length > 0) {
      const success = undoLastChange(lastModifiedWidgetId);
      if (success) {
        console.log(`[UndoRedo] ⏪ Undid change for widget ${lastModifiedWidgetId}`);
      }
    } else {
      console.log('[UndoRedo] ⏪ Nothing to undo');
    }
  }, [lastModifiedWidgetId, history, undoLastChange]);

  // Global redo - redo the last modified widget
  const redo = useCallback(() => {
    if (lastModifiedWidgetId && redoHistory[lastModifiedWidgetId]?.length > 0) {
      const success = redoLastChange(lastModifiedWidgetId);
      if (success) {
        console.log(`[UndoRedo] ⏩ Redid change for widget ${lastModifiedWidgetId}`);
      }
    } else {
      console.log('[UndoRedo] ⏩ Nothing to redo');
    }
  }, [lastModifiedWidgetId, redoHistory, redoLastChange]);

  // Discard all changes - restore all widgets to original state
  const discard = useCallback(() => {
    if (dirtyWidgetIds.size > 0) {
      console.log(`[UndoRedo] 🗑️ Discarding all changes for ${dirtyWidgetIds.size} widgets`);
      discardAllChanges();
    }
  }, [dirtyWidgetIds, discardAllChanges]);

  // Set refs for keyboard shortcuts
  useEffect(() => {
    if (undoRef) {
      undoRef.current = { undo };
    }
    if (redoRef) {
      redoRef.current = { redo };
    }
  }, [undo, redo, undoRef, redoRef]);

  // Calculate totals
  const totalHistoryItems = Object.values(history).reduce((sum, h) => sum + h.length, 0);
  const totalRedoItems = Object.values(redoHistory).reduce((sum, h) => sum + h.length, 0);
  
  const canUndo = lastModifiedWidgetId ? (history[lastModifiedWidgetId]?.length || 0) > 0 : false;
  const canRedo = lastModifiedWidgetId ? (redoHistory[lastModifiedWidgetId]?.length || 0) > 0 : false;
  const canDiscard = dirtyWidgetIds.size > 0;

  // Get history info for current widget
  const currentHistoryCount = lastModifiedWidgetId ? (history[lastModifiedWidgetId]?.length || 0) : 0;
  const currentRedoCount = lastModifiedWidgetId ? (redoHistory[lastModifiedWidgetId]?.length || 0) : 0;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={undo}
        disabled={!canUndo}
        className="gap-1"
        title={canUndo ? `Undo last change (Widget ${lastModifiedWidgetId})` : 'Nothing to undo'}
      >
        <Undo2 className="h-4 w-4" />
        Undo
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={redo}
        disabled={!canRedo}
        className="gap-1"
        title={canRedo ? `Redo last change (Widget ${lastModifiedWidgetId})` : 'Nothing to redo'}
      >
        <Redo2 className="h-4 w-4" />
        Redo
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!canDiscard && totalHistoryItems === 0}
            className="gap-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem 
            onClick={discard}
            disabled={!canDiscard}
            className="text-destructive focus:text-destructive"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Discard All Changes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs">
            <History className="h-4 w-4 mr-2" />
            <div className="flex flex-col gap-0.5">
              <span>Current Widget: {lastModifiedWidgetId || 'None'}</span>
              <span className="text-muted-foreground">
                Undo: {currentHistoryCount} | Redo: {currentRedoCount}
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            Total History: {totalHistoryItems} items
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-xs text-muted-foreground">
            Modified Widgets: {dirtyWidgetIds.size}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {(totalHistoryItems > 0 || dirtyWidgetIds.size > 0) && (
        <div className="flex items-center gap-1">
          {totalHistoryItems > 0 && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <History className="h-3 w-3" />
              {totalHistoryItems}
            </Badge>
          )}
          {dirtyWidgetIds.size > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              {dirtyWidgetIds.size} unsaved
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

