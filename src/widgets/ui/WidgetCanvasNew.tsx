"use client";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Responsive as ResponsiveGridLayout, type Layout, type Layouts } from "react-grid-layout";
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
import { WidgetEntity, WidgetConfig, Breakpoint } from "@/widgets/domain/entities";
import { WidgetErrorBoundary } from "./components/WidgetErrorBoundary";
import { WidgetEditorSheet } from "./components/WidgetEditorSheet";
import { HydrationBoundary } from "./components/HydrationBoundary";
import { TemplateSelector } from "./components/TemplateSelector";
import { LayoutTemplateSelector } from "./components/LayoutTemplateSelector";
import { getTemplateById, type WidgetTemplate } from "@/widgets/templates/widget-templates";
import { type DashboardLayoutTemplate } from "@/widgets/templates/layout-templates";
import { applyLayoutTemplate } from "@/widgets/utils/applyLayoutTemplate";
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

  // Undo function - optimistic, no reloading (like discard)
  const handleUndo = useCallback(() => {
    console.log('⏪ [UNDO] Undoing last change');
    
    // Set flag to prevent onLayoutChange cascade
    isUndoRedoInProgress.current = true;
    
    const success = undoLastChange(); // No widgetId needed - global stack
    
    if (success) {
      // NO setLayoutKey! Let React detect changes automatically via widgetsRecord
      // Only the modified widget will have a new reference, others are preserved
      
      // Reset flag after a brief delay (after GridLayout processes the change)
      setTimeout(() => {
        isUndoRedoInProgress.current = false;
        console.log('⏪ [UNDO] Reset undo/redo flag');
      }, 50);
      
      toast({
        title: "⏪ Undo successful",
        description: "Last change has been undone.",
        variant: "default",
      });
    } else {
      isUndoRedoInProgress.current = false;
      toast({
        title: "Nothing to undo",
        description: "No changes in history.",
        variant: "default",
      });
    }
  }, [undoLastChange, toast]);

  // Redo function - optimistic, no reloading (like discard)
  const handleRedo = useCallback(() => {
    console.log('⏩ [REDO] Redoing last change');
    
    // Set flag to prevent onLayoutChange cascade
    isUndoRedoInProgress.current = true;
    
    const success = redoLastChange(); // No widgetId needed - global stack
    
    if (success) {
      // NO setLayoutKey! Let React detect changes automatically via widgetsRecord
      // Only the modified widget will have a new reference, others are preserved
      
      // Reset flag after a brief delay (after GridLayout processes the change)
      setTimeout(() => {
        isUndoRedoInProgress.current = false;
        console.log('⏩ [REDO] Reset undo/redo flag');
      }, 50);
      
      toast({
        title: "⏩ Redo successful",
        description: "Last change has been redone.",
        variant: "default",
      });
    } else {
      isUndoRedoInProgress.current = false;
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
    // NO setLayoutKey! GridLayout will see changes automatically via layouts prop
    
    toast({
      title: "All changes discarded",
      description: "Widgets restored to original state.",
      variant: "default",
    });
  }, [discardAllChanges, toast]);


  // State declarations
  const [editorWidgetId, setEditorWidgetId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWidgets, setSelectedWidgets] = useState<Set<number>>(new Set());
  const [containerWidth, setContainerWidth] = useState(1200);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);
  const [layoutKey, setLayoutKey] = useState(0); // Key to force GridLayout re-render
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('xxl');
  const [currentCols, setCurrentCols] = useState<number>(24);
  
  // Cache widget references to prevent unnecessary re-renders
  const widgetCacheRef = useRef<Map<number, WidgetEntity>>(new Map());
  const previousWidgetListRef = useRef<WidgetEntity[]>([]);
  
  // Flag to prevent onLayoutChange during undo/redo
  const isUndoRedoInProgress = useRef(false);
  
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
    console.log('🔄 [WIDGET LIST] useMemo triggered - checking if widgets changed');
    
    const filtered = Object.values(widgetsRecord).filter((widget) => 
      widget && // Ensure widget exists
      widget.id && // Ensure widget has valid ID
      typeof widget.id === 'number' && // Ensure ID is a number
      !isNaN(widget.id) && // Ensure ID is not NaN
      widget.tenantId === tenantId && 
      widget.dashboardId === dashboardId && 
      widget.isVisible
    );
    
    // Get previous list reference
    const previousList = previousWidgetListRef.current;
    
    // CRITICAL FIX: Check if we can reuse the previous array entirely
    // This prevents creating new references for unchanged widgets
    if (previousList.length === filtered.length) {
      // Check if all widgets are the same by comparing with cache
      let allSame = true;
      const changedWidgetIds: number[] = [];
      
      for (let i = 0; i < filtered.length; i++) {
        const widget = filtered[i];
        const cached = widgetCacheRef.current.get(widget.id);
        
        // If widget reference changed, mark it
        if (cached !== widget) {
          allSame = false;
          changedWidgetIds.push(widget.id);
          // Update cache for changed widget
          widgetCacheRef.current.set(widget.id, widget);
        }
      }
      
      if (allSame) {
        // No widgets changed - return previous array reference
        console.log(`✅ [WIDGET LIST] No changes detected - returning previous array reference`);
        return previousList;
      } else {
        // Some widgets changed - update only those widgets in the array
        console.log(`♻️ [WIDGET LIST] ${changedWidgetIds.length} widget(s) changed:`, changedWidgetIds);
        
        // Create new array only with updated references
        const newList = previousList.map((prevWidget) => {
          if (changedWidgetIds.includes(prevWidget.id)) {
            // Find updated widget from filtered list
            const updatedWidget = filtered.find(w => w.id === prevWidget.id);
            console.log(`♻️ [CACHE] Widget ${prevWidget.id} changed (v${updatedWidget?.version}) - NEW reference detected`);
            return updatedWidget || prevWidget;
          }
          // Reuse previous reference for unchanged widgets
          console.log(`✅ [CACHE] Widget ${prevWidget.id} unchanged (reference match)`);
          return prevWidget;
        });
        
        previousWidgetListRef.current = newList;
        return newList;
      }
    }
    
    // Length changed - new/removed widgets - rebuild list
    console.log(`🔄 [WIDGET LIST] Length changed (${previousList.length} -> ${filtered.length}) - rebuilding list`);
    
    let changedCount = 0;
    let unchangedCount = 0;
    
    // Use cached reference if widget object reference unchanged (for React.memo optimization)
    const cachedList = filtered.map(widget => {
      const cached = widgetCacheRef.current.get(widget.id);
      
      // OPTIMIZED: Check object reference equality - if same object, reuse cache
      // This works because Zustand creates new objects only for modified widgets
      if (cached === widget) {
        // Widget unchanged - reuse cached reference for React.memo
        unchangedCount++;
        console.log(`✅ [CACHE] Widget ${widget.id} unchanged (reference match)`);
        return cached;
      }
      
      // Content changed or new widget - update cache and return new reference
      changedCount++;
      console.log(`♻️ [CACHE] Widget ${widget.id} changed (v${widget.version}) - NEW reference detected`);
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
    
    console.log(`🎯 [DEBUG] WidgetList: ${cachedList.length} widgets (${changedCount} changed, ${unchangedCount} unchanged) - NEW ARRAY`);
    previousWidgetListRef.current = cachedList;
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

  // No migration needed - positions are already in the correct format

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



  // Create responsive layouts - each breakpoint uses its saved layout
  // Create layouts object - SAME layout for ALL breakpoints (responsive scaling without layout changes)
  const layouts: Layouts = useMemo(() => {
    console.log(`📐 [RESPONSIVE SCALING] Creating uniform layout for ${widgetList.length} widgets`);
    
    // Create single layout from widget positions
    const baseLayout: Layout[] = widgetList
      .filter(widget => 
        widget && 
        widget.id && 
        typeof widget.id === 'number' && 
        !isNaN(widget.id)
      )
      .map((widget) => {
        const x = Number.isFinite(widget.position.x) ? widget.position.x : 0;
        const y = Number.isFinite(widget.position.y) ? widget.position.y : 0;
        const w = Number.isFinite(widget.position.w) ? widget.position.w : 8;
        const h = Number.isFinite(widget.position.h) ? widget.position.h : 6;
        
        return {
          i: widget.id.toString(),
          x,
          y,
          w,
          h,
          minW: 1,
          minH: 2,
        };
      })
      .filter(Boolean) as Layout[];
    
    // Return SAME layout for ALL breakpoints - grid scales but layout stays the same
    console.log(`📐 [RESPONSIVE SCALING] Using identical layout for all breakpoints (${baseLayout.length} widgets)`);
    
    return {
      xxl: baseLayout,  // Desktop - same layout
      xl: baseLayout,   // Desktop - same layout
      lg: baseLayout,   // Desktop - same layout
      md: baseLayout,   // Tablet - same layout
      sm: baseLayout,   // Mobile - same layout
      xs: baseLayout,   // Small mobile - same layout
    };
  }, [widgetList]);

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
    if (newX >= 24) {
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

  // Apply layout template to existing widgets
  const handleApplyLayout = useCallback((template: DashboardLayoutTemplate) => {
    try {
      console.log('🎨 [LAYOUT] Applying layout template:', template.name);
      
      // Apply template to existing widgets
      const updatedWidgets = applyLayoutTemplate(widgetList, template);
      
      // Update each widget in the store
      updatedWidgets.forEach((widget) => {
        updateLocal(widget.id, {
          position: widget.position,
        });
      });
      
      // NO setLayoutKey! GridLayout will see position changes automatically via layouts prop
      
      toast({
        title: "Layout applied!",
        description: `${template.name} has been applied to your ${updatedWidgets.length} widget${updatedWidgets.length !== 1 ? 's' : ''} across all screen sizes.`,
        variant: "success",
        duration: 5000,
      });
    } catch (error) {
      console.error("Failed to apply layout template:", error);
      toast({
        title: "Failed to apply layout",
        description: "An error occurred while applying the layout template.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [widgetList, updateLocal, toast]);

  const handleAddWidget = (type: WidgetType) => {
    try {
      console.log('🎯 [DEBUG] Adding widget locally:', type);
      const definition = getWidgetDefinition(type);
      const defaultConfig = definition.defaultConfig;

      // Default widget size: 8 columns (33% of 24)
      const widgets = Object.values(widgetsRecord);
      const newWidth = 8; 
      const newHeight = 6;
      
      // Function to check if position is available (no collision with existing widgets)
      const isPositionAvailable = (x: number, y: number, w: number, h: number): boolean => {
        // Check if within bounds (24 columns grid)
        if (x < 0 || y < 0 || x + w > 24) {
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
      let foundPosition = { x: 0, y: 0 }; // Default: top-left
      let found = false;
      
      // Scan grid from top to bottom, left to right (24 columns)
      for (let y = 0; y < 100 && !found; y++) { // Max 100 rows
        for (let x = 0; x <= 24 - newWidth && !found; x++) {
          if (isPositionAvailable(x, y, newWidth, newHeight)) {
            foundPosition = { x, y };
            found = true;
            console.log('📍 [DEBUG] Found available position:', foundPosition);
          }
        }
      }
      
      if (!found) {
        // If no position found, place at bottom
        const maxY = Math.max(0, ...widgets.map(w => (w.position?.y || 0) + (w.position?.h || 6)));
        foundPosition = { x: 0, y: maxY };
        console.warn('⚠️ [DEBUG] No available position found, placing at bottom:', foundPosition);
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

      console.log('🆕 [DEBUG] Creating local widget:', {
        ...newWidget,
        gridColumns: 24,
        defaultWidth: newWidth
      });

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
        {/* Grid Info Badge - Shows current grid configuration */}
        {isEditMode && (
          <div className="fixed top-4 right-4 z-40">
            <Badge variant="outline" className="bg-background/90 backdrop-blur-sm">
              📐 {currentCols} cols ({currentBreakpoint}) · {containerWidth}px
            </Badge>
          </div>
        )}
        
        {/* Floating Toolbar - Only in Edit Mode */}
        {isEditMode && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-background/90 backdrop-blur-xl border border-border/30 rounded-2xl shadow-2xl px-4 py-2">
            <div className="flex items-center space-x-2">
              {/* Template Selector - Add new widgets */}
              <TemplateSelector onSelectTemplate={handleAddFromTemplate} />
              
              {/* Layout Template Selector - Rearrange existing widgets */}
              <LayoutTemplateSelector 
                onSelectLayout={handleApplyLayout}
                currentWidgetCount={widgetList.length}
              />
              
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
                
                {/* Breakpoint Indicator */}
                <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-md border border-border/50">
                  <span className="text-[10px] text-muted-foreground font-medium">Editing:</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "h-5 px-2 text-[10px] font-mono uppercase",
                      currentBreakpoint === 'xxl' && "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
                      currentBreakpoint === 'xl' && "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
                      currentBreakpoint === 'lg' && "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
                      currentBreakpoint === 'md' && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
                      currentBreakpoint === 'sm' && "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
                      currentBreakpoint === 'xs' && "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                    )}
                    title={`Current breakpoint: ${currentBreakpoint} (${currentCols} cols)`}
                  >
                    {currentBreakpoint}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{currentCols}c</span>
                </div>
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
          
          /* Mobile responsive adjustments - Smart scaling */
          @media (max-width: 640px) {
            .react-grid-item {
              min-height: 150px;
            }
            .react-grid-layout {
              min-height: auto;
            }
          }
          
          /* Very small screens - Stack vertically */
          @media (max-width: 480px) {
            .react-grid-item {
              min-height: 200px;
            }
          }
          
          /* Tablet adjustments - Maintain grid */
          @media (min-width: 641px) and (max-width: 1024px) {
            .react-grid-item {
              min-height: 180px;
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
          <ResponsiveGridLayout 
            key={layoutKey}
            className="layout" 
            layouts={layouts}
            breakpoints={{ xxl: 1600, xl: 1200, lg: 996, md: 768, sm: 480, xs: 0 }}
            cols={{ xxl: 24, xl: 24, lg: 24, md: 24, sm: 24, xs: 24 }}
            width={containerWidth}
            rowHeight={30} 
            isDraggable={isEditMode}
            isResizable={isEditMode}
            isBounded={false}
            compactType={null}
            preventCollision={false}
            useCSSTransforms={true}
            margin={[10, 10]}
            containerPadding={isFullscreen ? [5, 5] : [10, 10]}
            resizeHandles={['s', 'w', 'e', 'n', 'sw', 'nw', 'se', 'ne']}
            draggableHandle=".widget-header"
            onLayoutChange={(currentLayout: Layout[], allLayouts: Layouts) => {
              if (!isEditMode) return;
              
              // PREVENT cascade during undo/redo
              if (isUndoRedoInProgress.current) {
                console.log('⚡ [LAYOUT] Skipping onLayoutChange - undo/redo in progress');
                return;
              }
              
              console.log(`🎯 [LAYOUT] Layout changed - updating all widgets`, currentLayout);
              
              // Update widget positions directly (same for all breakpoints)
              currentLayout.forEach((item) => {
                const widgetId = Number(item.i);
                const widget = widgetsRecord[widgetId];
                if (!widget) return;
                
                // Only update if position actually changed
                const hasChanged = 
                  widget.position.x !== item.x ||
                  widget.position.y !== item.y ||
                  widget.position.w !== item.w ||
                  widget.position.h !== item.h;
                
                if (hasChanged) {
                  console.log(`📱 [LAYOUT] Updating widget ${widgetId}:`, {
                    old: widget.position,
                    new: { x: item.x, y: item.y, w: item.w, h: item.h },
                  });
                  
                  updateLocal(widgetId, {
                    position: {
                      x: item.x,
                      y: item.y,
                      w: item.w,
                      h: item.h,
                    },
                  });
                }
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
          </ResponsiveGridLayout>
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
