'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface Widget {
  id: number;
  type: string;
  title: string | null;
  position: { x: number; y: number; width: number; height: number };
  config: any;
  isVisible: boolean;
  order: number;
}

interface Dashboard {
  id: number;
  name: string;
  description: string | null;
  mode: 'view' | 'edit';
  isPublic: boolean;
  isDefault: boolean;
  widgets: Widget[];
  _count: { widgets: number };
}

interface PendingChange {
  type: 'create' | 'update' | 'delete';
  widgetId?: number;
  data?: Partial<Widget>;
}

interface DashboardState {
  // State
  dashboards: Dashboard[];
  selectedDashboard: Dashboard | null;
  isEditMode: boolean;
  pendingChanges: PendingChange[];
  isLoading: boolean;
  isSaving: boolean;
  
  // Actions
  setDashboards: (dashboards: Dashboard[]) => void;
  setSelectedDashboard: (dashboard: Dashboard | null) => void;
  setIsEditMode: (isEditMode: boolean) => void;
  addPendingChange: (change: PendingChange) => void;
  removePendingChange: (widgetId: number, type: 'update' | 'delete') => void;
  clearPendingChanges: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  
  // Widget actions
  addWidget: (widget: Widget) => void;
  updateWidget: (widgetId: number, updates: Partial<Widget>) => void;
  removeWidget: (widgetId: number) => void;
  
  // Dashboard actions
  addDashboard: (dashboard: Dashboard) => void;
  updateDashboard: (dashboardId: number, updates: Partial<Dashboard>) => void;
  removeDashboard: (dashboardId: number) => void;
}

export const useDashboardStore = create<DashboardState>()(
  devtools(
    (set, get) => ({
      // Initial state
      dashboards: [],
      selectedDashboard: null,
      isEditMode: false,
      pendingChanges: [],
      isLoading: false,
      isSaving: false,

      // Basic setters
      setDashboards: (dashboards) => set({ dashboards }),
      setSelectedDashboard: (selectedDashboard) => set({ selectedDashboard }),
      setIsEditMode: (isEditMode) => set({ isEditMode }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setIsSaving: (isSaving) => set({ isSaving }),

      // Pending changes management
      addPendingChange: (change) => set((state) => ({
        pendingChanges: [...state.pendingChanges, change]
      })),

      removePendingChange: (widgetId, type) => set((state) => ({
        pendingChanges: state.pendingChanges.filter(
          change => !(change.widgetId === widgetId && change.type === type)
        )
      })),

      clearPendingChanges: () => set({ pendingChanges: [] }),

      // Widget actions
      addWidget: (widget) => set((state) => {
        if (!state.selectedDashboard) return state;
        
        return {
          selectedDashboard: {
            ...state.selectedDashboard,
            widgets: [...state.selectedDashboard.widgets, widget],
            _count: {
              ...state.selectedDashboard._count,
              widgets: state.selectedDashboard._count.widgets + 1
            }
          }
        };
      }),

      updateWidget: (widgetId, updates) => set((state) => {
        if (!state.selectedDashboard) return state;
        
        return {
          selectedDashboard: {
            ...state.selectedDashboard,
            widgets: state.selectedDashboard.widgets.map(widget =>
              widget.id === widgetId ? { ...widget, ...updates } : widget
            )
          }
        };
      }),

      removeWidget: (widgetId) => set((state) => {
        if (!state.selectedDashboard) return state;
        
        return {
          selectedDashboard: {
            ...state.selectedDashboard,
            widgets: state.selectedDashboard.widgets.filter(widget => widget.id !== widgetId),
            _count: {
              ...state.selectedDashboard._count,
              widgets: Math.max(0, state.selectedDashboard._count.widgets - 1)
            }
          }
        };
      }),

      // Dashboard actions
      addDashboard: (dashboard) => set((state) => ({
        dashboards: [...state.dashboards, dashboard]
      })),

      updateDashboard: (dashboardId, updates) => set((state) => ({
        dashboards: state.dashboards.map(dashboard =>
          dashboard.id === dashboardId ? { ...dashboard, ...updates } : dashboard
        ),
        selectedDashboard: state.selectedDashboard?.id === dashboardId
          ? { ...state.selectedDashboard, ...updates }
          : state.selectedDashboard
      })),

      removeDashboard: (dashboardId) => set((state) => ({
        dashboards: state.dashboards.filter(dashboard => dashboard.id !== dashboardId),
        selectedDashboard: state.selectedDashboard?.id === dashboardId
          ? null
          : state.selectedDashboard
      }))
    }),
    {
      name: 'dashboard-store',
    }
  )
);

// Selectors for better performance
export const useDashboardSelectors = () => {
  const dashboards = useDashboardStore(state => state.dashboards);
  const selectedDashboard = useDashboardStore(state => state.selectedDashboard);
  const isEditMode = useDashboardStore(state => state.isEditMode);
  const pendingChanges = useDashboardStore(state => state.pendingChanges);
  const isLoading = useDashboardStore(state => state.isLoading);
  const isSaving = useDashboardStore(state => state.isSaving);

  return {
    dashboards,
    selectedDashboard,
    isEditMode,
    pendingChanges,
    isLoading,
    isSaving,
  };
};

// Actions selector
export const useDashboardActions = () => {
  const setDashboards = useDashboardStore(state => state.setDashboards);
  const setSelectedDashboard = useDashboardStore(state => state.setSelectedDashboard);
  const setIsEditMode = useDashboardStore(state => state.setIsEditMode);
  const addPendingChange = useDashboardStore(state => state.addPendingChange);
  const removePendingChange = useDashboardStore(state => state.removePendingChange);
  const clearPendingChanges = useDashboardStore(state => state.clearPendingChanges);
  const setIsLoading = useDashboardStore(state => state.setIsLoading);
  const setIsSaving = useDashboardStore(state => state.setIsSaving);
  const addWidget = useDashboardStore(state => state.addWidget);
  const updateWidget = useDashboardStore(state => state.updateWidget);
  const removeWidget = useDashboardStore(state => state.removeWidget);
  const addDashboard = useDashboardStore(state => state.addDashboard);
  const updateDashboard = useDashboardStore(state => state.updateDashboard);
  const removeDashboard = useDashboardStore(state => state.removeDashboard);

  return {
    setDashboards,
    setSelectedDashboard,
    setIsEditMode,
    addPendingChange,
    removePendingChange,
    clearPendingChanges,
    setIsLoading,
    setIsSaving,
    addWidget,
    updateWidget,
    removeWidget,
    addDashboard,
    updateDashboard,
    removeDashboard,
  };
};
