"use client";

import React, { useState, useCallback, useEffect } from "react";
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
import { WidgetEntity } from "@/widgets/domain/entities";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";

interface HistoryState {
  widgets: Record<number, WidgetEntity>;
  timestamp: number;
  action: string;
}

interface UndoRedoProps {
  widgets: Record<number, WidgetEntity>;
  onRestoreState: (widgets: Record<number, WidgetEntity>) => void;
  onAction: (action: string) => void;
  undoRef?: React.MutableRefObject<{ undo: () => void } | null>;
  redoRef?: React.MutableRefObject<{ redo: () => void } | null>;
}

export const UndoRedo: React.FC<UndoRedoProps> = ({
  widgets,
  onRestoreState,
  onAction,
  undoRef,
  redoRef,
}) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  const clearPending = useWidgetsStore((state) => state.clearPending);

  // Save state to history
  const saveToHistory = useCallback((action: string) => {
    if (isUndoRedo) return;
    
    const newState: HistoryState = {
      widgets: JSON.parse(JSON.stringify(widgets)),
      timestamp: Date.now(),
      action,
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      // Keep only last 50 states
      return newHistory.slice(-50);
    });
    setCurrentIndex(prev => Math.min(prev + 1, 49));
  }, [widgets, currentIndex, isUndoRedo]);

  // Undo
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setIsUndoRedo(true);
      const prevState = history[currentIndex - 1];
      onRestoreState(prevState.widgets);
      setCurrentIndex(prev => prev - 1);
      onAction(`Undo: ${prevState.action}`);
      setTimeout(() => setIsUndoRedo(false), 100);
    }
  }, [currentIndex, history, onRestoreState, onAction]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setIsUndoRedo(true);
      const nextState = history[currentIndex + 1];
      onRestoreState(nextState.widgets);
      setCurrentIndex(prev => prev + 1);
      onAction(`Redo: ${nextState.action}`);
      setTimeout(() => setIsUndoRedo(false), 100);
    }
  }, [currentIndex, history, onRestoreState, onAction]);

  // Discard all changes
  const discard = useCallback(() => {
    if (history.length > 0) {
      setIsUndoRedo(true);
      const originalState = history[0];
      onRestoreState(originalState.widgets);
      setCurrentIndex(0);
      clearPending();
      onAction("Discard all changes");
      setTimeout(() => setIsUndoRedo(false), 100);
    }
  }, [history, onRestoreState, clearPending, onAction]);

  // Auto-save to history when widgets change
  useEffect(() => {
    if (!isUndoRedo && Object.keys(widgets).length > 0) {
      saveToHistory("Auto-save");
    }
  }, [widgets, saveToHistory, isUndoRedo]);

  // Set refs for keyboard shortcuts
  useEffect(() => {
    if (undoRef) {
      undoRef.current = { undo };
    }
    if (redoRef) {
      redoRef.current = { redo };
    }
  }, [undo, redo, undoRef, redoRef]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;
  const canDiscard = history.length > 1;

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={undo}
        disabled={!canUndo}
        className="gap-1"
        title={canUndo ? `Undo: ${history[currentIndex - 1]?.action || ''}` : 'Nothing to undo'}
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
        title={canRedo ? `Redo: ${history[currentIndex + 1]?.action || ''}` : 'Nothing to redo'}
      >
        <Redo2 className="h-4 w-4" />
        Redo
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={!canDiscard}
            className="gap-1"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={discard}
            disabled={!canDiscard}
            className="text-destructive focus:text-destructive"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Discard All Changes
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <History className="h-4 w-4 mr-2" />
            History: {currentIndex + 1}/{history.length}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {history.length > 0 && (
        <Badge variant="secondary" className="gap-1">
          <History className="h-3 w-3" />
          {currentIndex + 1}/{history.length}
        </Badge>
      )}
    </div>
  );
};

// Hook for easy integration
export const useUndoRedo = (widgets: Record<number, WidgetEntity>) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const saveState = useCallback((action: string) => {
    const newState: HistoryState = {
      widgets: JSON.parse(JSON.stringify(widgets)),
      timestamp: Date.now(),
      action,
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      return newHistory.slice(-50);
    });
    setCurrentIndex(prev => Math.min(prev + 1, 49));
  }, [widgets, currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const prevState = history[currentIndex - 1];
      setCurrentIndex(prev => prev - 1);
      return prevState.widgets;
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const nextState = history[currentIndex + 1];
      setCurrentIndex(prev => prev + 1);
      return nextState.widgets;
    }
    return null;
  }, [currentIndex, history]);

  return {
    saveState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    historyLength: history.length,
    currentIndex: currentIndex + 1,
  };
};
