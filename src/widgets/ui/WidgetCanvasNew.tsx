"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import GridLayout, { type Layout } from "react-grid-layout";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { getWidgetDefinition } from "@/widgets/registry/widget-registry";
import { useWidgetsApi } from "@/widgets/api/simple-client";
// import { useAutoSave } from "@/widgets/hooks/useAutoSave"; // Removed auto-save
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WidgetType } from "@/generated/prisma";
import { WidgetEntity, WidgetConfig } from "@/widgets/domain/entities";
import { WidgetErrorBoundary } from "./components/WidgetErrorBoundary";
import { WidgetEditorSheet } from "./components/WidgetEditorSheet";
import { HydrationBoundary } from "./components/HydrationBoundary";
import { TemplateSelector } from "./components/TemplateSelector";
import { getTemplateById, type WidgetTemplate } from "@/widgets/templates/widget-templates";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Table, 
  Target, 
  Clock, 
  CloudSun, 
  CheckSquare,
  Type,
  StickyNote,
  Settings, 
  Save, 
  Undo2, 
  Redo2,
  Edit3,
  Copy,
  Trash2,
  X,
  ArrowUpDown
} from "lucide-react";

interface WidgetCanvasNewProps {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  isEditMode?: boolean;
  isFullscreen?: boolean;
}

export const WidgetCanvasNew: React.FC<WidgetCanvasNewProps> = ({ 
  tenantId, 
  dashboardId, 
  actorId, 
  isEditMode = false,
  isFullscreen = false
}) => {
  const widgetsRecord = useWidgetsStore((state) => state.widgets);
  const pendingOperations = useWidgetsStore((state) => state.getPending());
  const clearPending = useWidgetsStore((state) => state.clearPending);
  const clearPendingOperations = useWidgetsStore((state) => state.clearPendingOperations);
  const discardAllChanges = useWidgetsStore((state) => state.discardAllChanges);
  const cleanupOldIds = useWidgetsStore((state) => state.cleanupOldIds);
  const updateLocal = useWidgetsStore((state) => state.updateLocal);
  const deleteLocal = useWidgetsStore((state) => state.deleteLocal);
  const createLocal = useWidgetsStore((state) => state.createLocal);
  const upsertWidget = useWidgetsStore((state) => state.upsertWidget);
  
  // Get global history state
  const changeHistory = useWidgetsStore((state) => state.changeHistory);
  const redoHistory = useWidgetsStore((state) => state.redoHistory);

  const api = useWidgetsApi(tenantId, dashboardId);
  
  // Undo/Redo functionality from store
  const undoLastChange = useWidgetsStore((state) => state.undoLastChange);
  const redoLastChange = useWidgetsStore((state) => state.redoLastChange);
  const discardChanges = useWidgetsStore((state) => state.discardChanges);
  const { toast } = useToast();

  // Save pending changes function
  const handleSavePending = useCallback(async () => {
    try {
      console.log('💾 [SAVE] Saving pending operations:', pendingOperations);
      const response = await api.savePending({ actorId, operations: pendingOperations });
      console.log('✅ [SAVE] savePending result:', response);
      
      if (response?.conflicts?.length ?? 0 > 0) {
        toast({
          title: "Conflicts detected",
          description: "Please review and resolve conflicts before saving.",
          variant: "destructive",
        });
      } else {
        // SUCCESS - Clear pending operations AND undo/redo history (keep modified widgets!)
        console.log('💾 [SAVE] Save successful - clearing pending operations and undo/redo history');
        
        // clearPendingOperations: keeps widgets as-is, clears operations + history
        clearPendingOperations();
        
        console.log('🧹 [SAVE] Undo/Redo history cleared - fresh state (widgets preserved)');
        
        toast({
          title: "Changes saved successfully!",
          description: `${pendingOperations.length} operations saved. Undo/Redo history cleared.`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("❌ [SAVE] Failed to save pending changes:", error);
      toast({
        title: "Save failed",
        description: "Failed to save pending changes. Please try again.",
        variant: "destructive",
      });
    }
  }, [api, actorId, pendingOperations, toast, clearPendingOperations]);

  // Undo function - now global, no need for widgetId
  const handleUndo = useCallback(() => {
    console.log('⏪ [UNDO] Setting internal update flag');
    isInternalUpdate.current = true; // Prevent cascade updates
    
    const success = undoLastChange(); // No widgetId needed - global stack
    
    if (success) {
      setLayoutKey(prev => prev + 1); // Force GridLayout to re-render
      
      // Reset flag after layout updates
      setTimeout(() => {
        isInternalUpdate.current = false;
        console.log('⏪ [UNDO] Cleared internal update flag');
      }, 100);
      
      toast({
        title: "⏪ Undo successful",
        description: "Last change has been undone.",
        variant: "default",
      });
    } else {
      isInternalUpdate.current = false;
      toast({
        title: "Nothing to undo",
        description: "No changes in history.",
        variant: "default",
      });
    }
  }, [undoLastChange, toast]);

  // Redo function - now global, no need for widgetId
  const handleRedo = useCallback(() => {
    console.log('⏩ [REDO] Setting internal update flag');
    isInternalUpdate.current = true; // Prevent cascade updates
    
    const success = redoLastChange(); // No widgetId needed - global stack
    
    if (success) {
      setLayoutKey(prev => prev + 1); // Force GridLayout to re-render
      
      // Reset flag after layout updates
      setTimeout(() => {
        isInternalUpdate.current = false;
        console.log('⏩ [REDO] Cleared internal update flag');
      }, 100);
      
      toast({
        title: "⏩ Redo successful",
        description: "Last change has been redone.",
        variant: "default",
      });
    } else {
      isInternalUpdate.current = false;
      toast({
        title: "Nothing to redo",
        description: "No changes to redo.",
        variant: "default",
      });
    }
  }, [redoLastChange, toast]);

  // Discard all changes function
  const handleDiscard = useCallback(() => {
    console.log('[handleDiscard] Discarding all pending changes');
    
    // Use discardAllChanges instead of clearPending to keep local widgets
    discardAllChanges();
    setLayoutKey(prev => prev + 1); // Force GridLayout to re-render
    
    toast({
      title: "All changes discarded",
      description: "Widgets restored to original state.",
      variant: "default",
    });
  }, [discardAllChanges, toast]);

  // Find next available position in grid
  const findNextPosition = useCallback(() => {
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
  }, [dashboardId]);

  // Duplicate widget function
  const handleDuplicateWidget = useCallback((widget: WidgetEntity) => {
    const nextPos = findNextPosition();
    const newWidget: WidgetEntity = {
      ...widget,
      id: Math.floor(Date.now() + Math.random() * 1000000), // Generate new integer ID
      title: `${widget.title} (Copy)`,
      position: {
        ...widget.position,
        x: nextPos.x,
        y: nextPos.y,
      },
      version: 1,
      schemaVersion: widget.schemaVersion,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    };
    
    createLocal(newWidget);
    toast({
      title: "Widget duplicated",
      description: `${widget.title} has been duplicated.`,
      variant: "default",
    });
  }, [createLocal, actorId, toast, findNextPosition]);

  // State declarations
  const [editorWidgetId, setEditorWidgetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<number>>(new Set());
  const [containerWidth, setContainerWidth] = useState(1200);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);
  const [layoutKey, setLayoutKey] = useState(0); // Key to force GridLayout re-render
  const isInternalUpdate = useRef(false); // Flag to prevent cascade updates from undo/redo
  
  // Cache widget references to prevent unnecessary re-renders
  const widgetCacheRef = useRef<Map<number, WidgetEntity>>(new Map());
  
  // Ref to grid container for width calculation
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Handle exit confirmation dialog
  const handleExitConfirm = useCallback(() => {
    console.log('[handleExitConfirm] Confirming exit and clearing all changes');
    clearPending(); // Clear all pending changes
    setShowExitDialog(false);
    if (pendingExitAction) {
      pendingExitAction();
      setPendingExitAction(null);
    }
  }, [clearPending, pendingExitAction]);

  const handleExitCancel = useCallback(() => {
    console.log('[handleExitCancel] Canceling exit');
    setShowExitDialog(false);
    setPendingExitAction(null);
  }, []);

  // OPTIMISTIC: Cache widget references - return SAME object if content unchanged
  const widgetList = useMemo(() => {
    const filtered = Object.values(widgetsRecord).filter((widget) => 
      widget && // Ensure widget exists
      widget.id && // Ensure widget has valid ID
      typeof widget.id === 'number' && // Ensure ID is a number
      !isNaN(widget.id) && // Ensure ID is not NaN
      widget.tenantId === tenantId && 
      widget.dashboardId === dashboardId && 
      widget.isVisible
    );
    
    // Use cached reference if widget content unchanged (for React.memo optimization)
    const cachedList = filtered.map(widget => {
      const cached = widgetCacheRef.current.get(widget.id);
      
      // Fast equality check: version + updatedAt (instead of deep JSON comparison)
      if (cached && 
          cached.version === widget.version && 
          cached.updatedAt?.getTime() === widget.updatedAt?.getTime()) {
        // Widget unchanged - reuse cached reference for React.memo
        return cached;
      }
      
      // Content changed or new widget - update cache and return new reference
      console.log(`♻️ [CACHE] Updating cache for widget ${widget.id} (v${widget.version})`);
      widgetCacheRef.current.set(widget.id, widget);
      return widget;
    });
    
    // Clean up cache for removed widgets
    const currentIds = new Set(filtered.map(w => w.id));
    for (const cachedId of Array.from(widgetCacheRef.current.keys())) {
      if (!currentIds.has(cachedId)) {
        widgetCacheRef.current.delete(cachedId);
      }
    }
    
    console.log('🎯 [DEBUG] WidgetList:', cachedList.length, 'widgets');
    return cachedList;
  }, [widgetsRecord, tenantId, dashboardId]);


  // Load widgets on component mount and when dashboard changes
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    const loadInitialWidgets = async () => {
      try {
        console.log('🔄 [WidgetCanvasNew] Loading widgets for dashboard:', dashboardId);
        setIsInitialLoad(true);
        
        // CRITICAL: Clear widgets store BEFORE loading new dashboard widgets
        // This prevents showing stale widgets from previous dashboard
        console.log('[WidgetCanvasNew] Clearing store before loading new dashboard');
        clearPending(); // Clear widgets and pending operations
        
        await api.loadWidgets(true); // Load with config
        console.log('✅ [WidgetCanvasNew] Widgets loaded successfully');
      } catch (error) {
        console.error('❌ [WidgetCanvasNew] Failed to load widgets:', error);
        toast({
          title: "Failed to load widgets",
          description: "Could not load dashboard widgets. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (tenantId && dashboardId) {
      loadInitialWidgets();
    }
    
    // Cleanup when component unmounts or dashboard changes
    return () => {
      console.log('[WidgetCanvasNew] Cleaning up for dashboard:', dashboardId);
    };
  }, [tenantId, dashboardId, api, clearPending]); // Added clearPending to deps

  // Cleanup old IDs on component mount
  useEffect(() => {
    cleanupOldIds();
  }, [cleanupOldIds]);

  // Update container width on resize - use full available width
  useEffect(() => {
    const updateWidth = () => {
      // First try to use the ref (most accurate)
      if (gridContainerRef.current) {
        // Fullscreen: no padding (p-0), Normal: p-6 (24px * 2 = 48px)
        const paddingOffset = isFullscreen ? 0 : 48;
        const width = gridContainerRef.current.clientWidth - paddingOffset;
        console.log('📐 [WIDTH] Using ref - Container:', gridContainerRef.current.clientWidth, 'Grid:', width, 'Fullscreen:', isFullscreen);
        setContainerWidth(width);
        return;
      }
      
      // Fallback: Try multiple selectors to find the container
      const container = document.querySelector('.h-full.w-full') 
                     || document.querySelector('main') 
                     || document.body;
      
      if (container) {
        const paddingOffset = isFullscreen ? 0 : 48;
        const width = container.clientWidth - paddingOffset;
        console.log('📐 [WIDTH] Using selector - Container:', container.clientWidth, 'Grid:', width);
        setContainerWidth(width);
      } else {
        // Last resort: full window width
        const fallbackWidth = window.innerWidth - (isFullscreen ? 0 : 100);
        console.log('📐 [WIDTH] Using fallback width:', fallbackWidth);
        setContainerWidth(fallbackWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    
    // Update after DOM is ready and after a second delay for any layout shifts
    const timeoutId1 = setTimeout(updateWidth, 100);
    const timeoutId2 = setTimeout(updateWidth, 500);
    
    return () => {
      window.removeEventListener('resize', updateWidth);
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [isFullscreen]); // Re-run when fullscreen mode changes

  // Handle page exit with confirmation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are pending changes
      if (pendingOperations.length > 0) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      // Check if there are pending changes when navigating back/forward
      if (pendingOperations.length > 0) {
        e.preventDefault();
        setShowExitDialog(true);
        setPendingExitAction(() => () => {
          window.history.back();
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pendingOperations]);

  // Create single layout - NO responsive scaling, use real dimensions
  const layout: Layout[] = useMemo(() => {
    return widgetList
      .filter(widget => 
        widget && // Ensure widget exists
        widget.id && // Ensure widget has valid ID
        typeof widget.id === 'number' && // Ensure ID is a number
        !isNaN(widget.id) && // Ensure ID is not NaN
        widgetsRecord[widget.id] // Double-check widget still exists in record
      )
      .map((widget) => {
        const x = Number.isFinite(widget.position.x) ? widget.position.x : 0;
        const y = Number.isFinite(widget.position.y) ? widget.position.y : 0;
        const w = Number.isFinite(widget.position.w) ? widget.position.w : 8;
        const h = Number.isFinite(widget.position.h) ? widget.position.h : 6;
        
        const widgetId = widget.id;
        if (!widgetId || typeof widgetId !== 'number' || isNaN(widgetId)) {
          console.error('[Layout] Invalid widget ID:', widgetId, 'for widget:', widget);
          return null;
        }
        
        return {
          i: widgetId.toString(),
          x,
          y,
          w,
          h,
          minW: 2,
          minH: 2,
        };
      })
      .filter(item => item !== null) as Layout[];
  }, [widgetList, widgetsRecord]);

  const closeEditor = () => setEditorWidgetId(null);

  // Compact layout function
  const compactLayout = useCallback(() => {
    const widgets = Object.values(widgetsRecord);
    if (widgets.length === 0) return;

    // Filter out widgets with invalid positions and sort by current Y position
    const validWidgets = widgets.filter(widget => 
      Number.isFinite(widget.position.y) && Number.isFinite(widget.position.h)
    );
    const sortedWidgets = [...validWidgets].sort((a, b) => a.position.y - b.position.y);
    
    // Compact widgets vertically
    let currentY = 0;
    sortedWidgets.forEach((widget) => {
      const currentPosition = {
        x: Number.isFinite(widget.position.x) ? widget.position.x : 0,
        y: currentY,
        w: Number.isFinite(widget.position.w) ? widget.position.w : 4,
        h: Number.isFinite(widget.position.h) ? widget.position.h : 4,
      };
      
      updateLocal(widget.id, {
        position: currentPosition,
      });
      currentY += currentPosition.h + 1; // Add 1 for margin
    });
    
    console.log('🎯 [DEBUG] Layout compacted');
  }, [widgetsRecord, updateLocal]);

  // Add widget from template
  const handleAddFromTemplate = useCallback((template: WidgetTemplate) => {
    try {
      console.log('✨ [TEMPLATE] Adding widget from template:', template.name);
      
      const nextPos = findNextPosition();
      const tempId = Math.floor(Math.random() * 1000000) + 1000000;
      
      const newWidget: WidgetEntity = {
        id: tempId,
        tenantId,
        dashboardId,
        type: template.widgetType,
        title: template.name,
        description: template.description,
        position: { x: nextPos.x, y: nextPos.y, w: 8, h: 6 },
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

      console.log('✨ [TEMPLATE] Creating widget from template:', newWidget);
      createLocal(newWidget);

      toast({
        title: "Template applied!",
        description: `${template.name} has been added to your dashboard.`,
        variant: "success",
        duration: 4000,
      });
    } catch (error) {
      console.error("Failed to add widget from template:", error);
      toast({
        title: "Failed to add template",
        description: "An error occurred while adding the template.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [tenantId, dashboardId, actorId, createLocal, toast, findNextPosition]);

  const handleAddWidget = (type: WidgetType) => {
    try {
      console.log('🎯 [DEBUG] Adding widget locally:', type);
      const definition = getWidgetDefinition(type);
      const defaultConfig = definition.defaultConfig;

      // Find first available position starting from top-left
      const widgets = Object.values(widgetsRecord);
      // Fixed widget size
      const newWidth = 8; // 33% of 24 columns
      const newHeight = 6;
      const cols = 24; // Fixed 24 columns
      
      // Function to check if position is available (no collision with existing widgets)
      const isPositionAvailable = (x: number, y: number, w: number, h: number): boolean => {
        // Check if within bounds
        if (x < 0 || y < 0 || x + w > cols) {
          return false;
        }
        
        // Check collision with existing widgets
        for (const widget of widgets) {
          const pos = widget.position;
          if (!pos) continue;
          
          // Check if rectangles overlap
          const overlap = !(
            x + w <= pos.x || // New widget is completely to the left
            x >= pos.x + pos.w || // New widget is completely to the right
            y + h <= pos.y || // New widget is completely above
            y >= pos.y + pos.h // New widget is completely below
          );
          
          if (overlap) {
            return false; // Collision detected
          }
        }
        
        return true; // No collision, position is available
      };
      
      // Find first available position (scan left-to-right, top-to-bottom)
      let foundPosition = { x: cols - newWidth, y: 0 }; // Default: top-right
      let found = false;
      
      // Scan grid from top to bottom, left to right
      for (let y = 0; y < 100 && !found; y++) { // Max 100 rows
        for (let x = 0; x <= cols - newWidth && !found; x++) {
          if (isPositionAvailable(x, y, newWidth, newHeight)) {
            foundPosition = { x, y };
            found = true;
            console.log('📍 [DEBUG] Found available position:', foundPosition);
          }
        }
      }
      
      if (!found) {
        console.warn('⚠️ [DEBUG] No available position found, using default top-right');
      }

      // Create widget locally with temporary ID (compatible with INT4)
      const tempId = Math.floor(Math.random() * 1000000) + 1000000; // 7-digit random ID
      const newWidget: WidgetEntity = {
        id: tempId,
        tenantId,
        dashboardId,
        type,
        title: `${type} Widget`,
        description: null,
        position: { x: foundPosition.x, y: foundPosition.y, w: newWidth, h: newHeight },
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
        description: `${type} widget has been added to your dashboard.`,
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


  const handleSelectWidget = (widgetId: number) => {
    console.log('🎯 [SELECT] Selecting widget:', widgetId);
    setSelectedWidgets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(widgetId)) {
        console.log('🎯 [SELECT] Widget already selected, deselecting:', widgetId);
        newSet.delete(widgetId);
      } else {
        console.log('🎯 [SELECT] Adding widget to selection:', widgetId);
        newSet.add(widgetId);
      }
      console.log('🎯 [SELECT] New selection set:', Array.from(newSet));
      return newSet;
    });
  };

  const handleDeselectAll = () => {
    console.log('🎯 [SELECT] Deselecting all widgets');
    setSelectedWidgets(new Set());
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    // Only close editor if clicking on the canvas itself, not on widgets
    if (e.target === e.currentTarget) {
      setEditorWidgetId(null);
      handleDeselectAll();
    }
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

  // Clean up selectedWidgets and editorWidgetId when widgets are deleted
  useEffect(() => {
    // Remove deleted widgets from selection
    const currentWidgetIds = new Set(widgetList.map(w => w.id));
    const updatedSelection = new Set(
      Array.from(selectedWidgets).filter(id => currentWidgetIds.has(id))
    );
    
    if (updatedSelection.size !== selectedWidgets.size) {
      setSelectedWidgets(updatedSelection);
    }
    
    // Close editor if the widget was deleted
    if (editorWidgetId && !currentWidgetIds.has(editorWidgetId)) {
      setEditorWidgetId(null);
    }
  }, [widgetList, selectedWidgets, editorWidgetId]);

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
    <HydrationBoundary fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading widgets...</div>
        </div>
      </div>
    }>
      <div className="h-full w-full relative">
        {/* Floating Toolbar - Only in Edit Mode */}
        {isEditMode && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-background/90 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl px-4 py-2">
            <div className="flex items-center space-x-2">
              {/* Template Selector - FIRST! */}
              <TemplateSelector onSelectTemplate={handleAddFromTemplate} />
              
              {/* Separator */}
              <div className="w-px h-6 bg-border/30 mx-2" />
              
              {/* Widget Types */}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetType.CHART)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Chart Widget"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetType.TABLE)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Table Widget"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetType.KPI)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add KPI Widget"
                >
                  <Target className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetType.CLOCK)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Clock Widget"
                >
                  <Clock className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetType.WEATHER)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Weather Widget"
                >
                  <CloudSun className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetType.TASKS)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Tasks Widget"
                >
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetType.TEXT)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Text Widget"
                >
                  <Type className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddWidget(WidgetType.NOTES)}
                  className="h-8 w-8 p-0 hover:bg-primary/10"
                  title="Add Notes Widget"
                >
                  <StickyNote className="h-4 w-4" />
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
                        const duplicated = { ...widget, id: Math.floor(Math.random() * 1000000) + 1000000 };
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
                    const widgetsToDelete = Array.from(selectedWidgets);
                    
                    // Close editor if the widget being deleted is currently open
                    if (editorWidgetId && selectedWidgets.has(editorWidgetId)) {
                      setEditorWidgetId(null);
                    }
                    
                    // Delete widgets
                    widgetsToDelete.forEach(widgetId => {
                      deleteLocal(widgetId);
                    });
                    
                    // Clear selection
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
                  onClick={handleSavePending}
                  disabled={pendingOperations.length === 0}
                  className="h-8 px-3 text-xs hover:bg-primary/10 disabled:opacity-50"
                  title="Save Pending Changes"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save
                  {pendingOperations.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 text-xs flex items-center justify-center">
                      {pendingOperations.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  disabled={changeHistory.length === 0}
                  className="h-8 px-3 text-xs hover:bg-primary/10 disabled:opacity-50"
                  title={changeHistory.length > 0 ? `Undo: ${changeHistory[0].description}` : 'Nothing to undo'}
                >
                  <Undo2 className="h-3 w-3 mr-1" />
                  Undo
                  {changeHistory.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {changeHistory.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  disabled={redoHistory.length === 0}
                  className="h-8 px-3 text-xs hover:bg-primary/10 disabled:opacity-50"
                  title={redoHistory.length > 0 ? `Redo: ${redoHistory[0].description}` : 'Nothing to redo'}
                >
                  <Redo2 className="h-3 w-3 mr-1" />
                  Redo
                  {redoHistory.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                      {redoHistory.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDiscard}
                  disabled={pendingOperations.length === 0}
                  className="h-8 px-3 text-xs hover:bg-destructive/10 disabled:opacity-50 text-destructive hover:text-destructive"
                  title="Discard All Changes"
                >
                  <X className="h-3 w-3 mr-1" />
                  Discard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={compactLayout}
                  className="h-8 px-3 text-xs hover:bg-primary/10"
                  title="Compact Layout"
                >
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  Pack
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Area */}
      <div 
        ref={gridContainerRef}
        className={cn(
          "h-full w-full overflow-y-auto",
          isFullscreen ? "p-0 pb-20" : "p-6 pb-24"
        )}
        onClick={handleCanvasClick}
      >
        <style jsx global>{`
          .react-grid-layout {
            width: 100% !important;
            height: auto !important;
            min-height: 100% !important;
            position: relative;
          }
          .react-grid-item {
            transition: all 200ms ease;
            transition-property: left, top, width, height;
            min-width: 0;
            min-height: 120px;
            max-width: 100%;
            max-height: none;
          }
          
          /* Mobile responsive adjustments */
          @media (max-width: 640px) {
            .react-grid-item {
              width: 100% !important;
              min-width: 0;
              min-height: 150px;
            }
            .react-grid-layout {
              min-height: auto;
            }
            /* On mobile, override grid positioning to stack vertically */
            .react-grid-item {
              position: relative !important;
              transform: none !important;
              left: 0 !important;
              margin-bottom: 10px;
            }
          }
          
          /* Tablet adjustments */
          @media (min-width: 641px) and (max-width: 768px) {
            .react-grid-item {
              max-width: 100%;
            }
          }
          .react-grid-item.cssTransforms {
            transition-property: transform, width, height;
          }
          
          /* Resize handles - visible and functional */
          .react-grid-item > .react-resizable-handle {
            position: absolute;
            z-index: 10;
          }
          
          /* Bottom-right resize handle (SE) - Only resize handle */
          .react-grid-item > .react-resizable-handle-se {
            bottom: 0;
            right: 0;
            width: 24px;
            height: 24px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 0%, transparent 30%, rgba(59, 130, 246, 0.6) 30%, rgba(59, 130, 246, 0.8) 50%, transparent 70%);
            border-radius: 0 0 8px 0;
            opacity: 0.7;
            transition: opacity 0.2s ease;
          }
          
          .react-grid-item:hover > .react-resizable-handle-se {
            opacity: 1;
          }
          
          /* Custom drag cursors for widgets */
          .react-grid-item .widget-header {
            cursor: grab !important;
          }
          
          .react-grid-item .widget-header:active {
            cursor: grabbing !important;
          }
          
          .react-grid-item .widget-content {
            cursor: grab !important;
          }
          
          .react-grid-item .widget-content:active {
            cursor: grabbing !important;
          }
          
          /* Hide handles when not resizable */
          .react-grid-item.react-resizable-hide > .react-resizable-handle {
            display: none;
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
            key={layoutKey}
            className="layout" 
            layout={layout}
            cols={24}
            width={containerWidth}
            rowHeight={30} 
            isDraggable={isEditMode}
            isResizable={isEditMode}
            isBounded={false}
            compactType="vertical"
            preventCollision={false}
            useCSSTransforms={true}
            margin={[10, 10]}
            containerPadding={isFullscreen ? [5, 5] : [10, 10]}
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
            draggableHandle=".widget-header"
            onLayoutChange={(currentLayout: Layout[]) => {
              if (!isEditMode) return;
              
              // PREVENT cascade updates from undo/redo
              if (isInternalUpdate.current) {
                console.log('⚡ [LAYOUT] Skipping onLayoutChange - internal update (undo/redo)');
                return;
              }
              
              console.log('🎯 [DEBUG] Layout changed:', currentLayout);
              currentLayout.forEach((item) => {
                const widgetId = Number(item.i);
                updateLocal(widgetId, {
                  position: { x: item.x, y: item.y, w: item.w, h: item.h },
                });
              });
            }}
            onResize={(layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
              if (!isEditMode) return;
              if (isInternalUpdate.current) return; // Skip during undo/redo
              
              console.log('🎯 [DEBUG] Widget resized:', { oldItem, newItem });
              const widgetId = Number(newItem.i);
              updateLocal(widgetId, {
                position: { x: newItem.x, y: newItem.y, w: newItem.w, h: newItem.h },
              });
            }}
            onResizeStop={(layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => {
              if (!isEditMode) return;
              if (isInternalUpdate.current) return; // Skip during undo/redo
              
              console.log('🎯 [DEBUG] Resize stopped:', { oldItem, newItem });
              const widgetId = Number(newItem.i);
              updateLocal(widgetId, {
                position: { x: newItem.x, y: newItem.y, w: newItem.w, h: newItem.h },
              });
            }}
          >
            {widgetList
              .filter(widget => 
                widget && // Ensure widget exists
                widget.id && // Ensure widget has valid ID
                typeof widget.id === 'number' && // Ensure ID is a number
                !isNaN(widget.id) && // Ensure ID is not NaN
                widgetsRecord[widget.id] // Ensure widget still exists in record
              )
              .map((widget) => {
                // CRITICAL FIX: Always get the latest widget from the store to ensure config changes are reflected
                const currentWidget = widgetsRecord[widget.id];
                
                if (!currentWidget) {
                  console.warn(`⚠️ [WidgetCanvasNew] Widget ${widget.id} not found in current state, skipping render`);
                  return null;
                }
                
                const definition = getWidgetDefinition(currentWidget.type);
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
                const isSelected = selectedWidgets.has(currentWidget.id);

                return (
                  <div 
                    key={currentWidget.id}
                    className={cn(
                      "h-full w-full transition-all relative",
                      isEditMode && isSelected && "ring-2 ring-primary/80 ring-offset-2 shadow-lg"
                    )}
                  >
                    {/* Drag handle - invisible small area at top */}
                    {isEditMode && (
                      <div className="widget-header absolute top-0 left-0 right-0 h-8 z-[15] cursor-move" />
                    )}
                    
                    {/* Click overlay for selection - NOT a drag handle */}
                    {isEditMode && (
                      <div 
                        className="absolute inset-0 z-[1]"
                        onClick={(e) => {
                          console.log('🖱️✅ [DEBUG] Widget clicked:', currentWidget.id);
                          e.stopPropagation();
                          if (e.ctrlKey || e.metaKey) {
                            handleSelectWidget(currentWidget.id);
                          } else {
                            handleDeselectAll();
                            handleSelectWidget(currentWidget.id);
                          }
                        }}
                        onDoubleClick={(e) => {
                          console.log('🖱️🖱️ [DEBUG] Widget double-clicked:', currentWidget.id);
                          e.stopPropagation();
                          setEditorWidgetId(currentWidget.id);
                        }}
                      />
                    )}
                    
                    {/* Edit button when selected */}
                    {isEditMode && isSelected && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditorWidgetId(currentWidget.id);
                        }}
                        className="absolute top-2 right-2 z-[30] h-7 w-7 p-0 shadow-lg"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Renderer
                      widget={currentWidget}
                      onEdit={undefined}
                      onDelete={undefined}
                      onDuplicate={isEditMode ? () => handleDuplicateWidget(currentWidget) : undefined}
                      isEditMode={isEditMode}
                    />
                  </div>
                );
              }).filter(Boolean)}
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

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your dashboard. If you leave now, all changes will be lost.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleExitCancel}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExitConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Leave & Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </HydrationBoundary>
  );
  
};
