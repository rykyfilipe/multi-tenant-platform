import { useEffect, useRef, useCallback } from 'react';
import { useWidgetsStore } from '@/widgets/store/useWidgetsStore';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AppContext';

interface UseTasksAutoSaveOptions {
  tenantId: number;
  dashboardId: number;
  actorId: number;
  widgetId: number;
  debounceMs?: number;
  enabled?: boolean;
}

export function useTasksAutoSave({
  tenantId,
  dashboardId,
  actorId,
  widgetId,
  debounceMs = 1000, // 1 second debounce for tasks
  enabled = true,
}: UseTasksAutoSaveOptions) {
  const widgets = useWidgetsStore((state) => state.widgets);
  const { token } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastWidgetConfigRef = useRef<any>(null);
  const { toast } = useToast();

  const savePending = useCallback(async () => {
    if (!enabled || !token) {
      return;
    }

    const currentWidget = widgets[widgetId];
    if (!currentWidget) {
      return;
    }

    // Check if widget config has changed
    const currentConfig = currentWidget.config;
    if (JSON.stringify(currentConfig) === JSON.stringify(lastWidgetConfigRef.current)) {
      return; // No changes to save
    }

    try {
      console.log('[TasksAutoSave] Auto-saving tasks widget config via PATCH API');
      
      const response = await fetch(`/api/dashboards/${dashboardId}/widgets/${widgetId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          config: currentConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`PATCH failed: ${response.statusText}`);
      }

      const updatedWidget = await response.json();
      console.log('[TasksAutoSave] Auto-save successful');
      
      // Update last saved config reference
      lastWidgetConfigRef.current = currentConfig;
      
      // Show success toast (silent - no notification for better UX)
      // toast({
      //   title: "Tasks saved",
      //   description: "Your task changes have been saved.",
      //   variant: "default",
      // });
    } catch (error) {
      console.error('[TasksAutoSave] Auto-save failed:', error);
      
      // Show error toast
      toast({
        title: "Save failed",
        description: "Could not save task changes. Please try again.",
        variant: "destructive",
      });
    }
  }, [token, dashboardId, widgetId, widgets, enabled, toast]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const currentWidget = widgets[widgetId];
    if (!currentWidget) {
      return;
    }

    const currentConfig = currentWidget.config;

    // Check if widget config has changed
    const configChanged = 
      JSON.stringify(currentConfig) !== JSON.stringify(lastWidgetConfigRef.current);

    if (configChanged) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(() => {
        savePending();
      }, debounceMs);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [widgets, widgetId, savePending, debounceMs, enabled]);

  return {
    savePending,
  };
}
