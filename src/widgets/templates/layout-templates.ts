import { Breakpoint, BreakpointPosition } from '@/widgets/domain/entities';

/**
 * Layout Slot - Defines a single widget position in the layout
 */
export interface LayoutSlot {
  /** Slot identifier */
  id: string;
  /** Position for each breakpoint */
  positions: Record<Breakpoint, BreakpointPosition>;
}

/**
 * Dashboard Layout Template
 * Defines positions for widgets across all breakpoints
 */
export interface DashboardLayoutTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'metrics' | 'analytics' | 'executive' | 'operational' | 'custom';
  preview?: string; // SVG or image URL for preview
  /** Array of slots - widgets will be mapped to these slots in order */
  slots: LayoutSlot[];
  /** Recommended number of widgets for this layout */
  recommendedWidgetCount: number;
  /** Minimum widgets needed */
  minWidgets?: number;
  /** Maximum widgets supported */
  maxWidgets?: number;
}

/**
 * PRE-DEFINED LAYOUT TEMPLATES
 */
export const DASHBOARD_LAYOUT_TEMPLATES: DashboardLayoutTemplate[] = [
  // ==================== METRICS FOCUSED ====================
  {
    id: 'metrics-top-charts-below',
    name: '📊 Metrics + Charts',
    description: '5 small KPI metrics on top, 2 large charts below',
    icon: '📊',
    category: 'metrics',
    recommendedWidgetCount: 7,
    minWidgets: 3,
    maxWidgets: 10,
    slots: [
      // TOP ROW: 5 small KPI widgets
      {
        id: 'kpi-1',
        positions: {
          xxl: { x: 0, y: 0, w: 4, h: 4 },
          xl: { x: 0, y: 0, w: 4, h: 4 },
          lg: { x: 0, y: 0, w: 6, h: 4 },
          md: { x: 0, y: 0, w: 8, h: 4 },
          sm: { x: 0, y: 0, w: 12, h: 4 },
          xs: { x: 0, y: 0, w: 24, h: 4 },
        },
      },
      {
        id: 'kpi-2',
        positions: {
          xxl: { x: 4, y: 0, w: 4, h: 4 },
          xl: { x: 4, y: 0, w: 4, h: 4 },
          lg: { x: 6, y: 0, w: 6, h: 4 },
          md: { x: 8, y: 0, w: 8, h: 4 },
          sm: { x: 12, y: 0, w: 12, h: 4 },
          xs: { x: 0, y: 4, w: 24, h: 4 },
        },
      },
      {
        id: 'kpi-3',
        positions: {
          xxl: { x: 8, y: 0, w: 4, h: 4 },
          xl: { x: 8, y: 0, w: 4, h: 4 },
          lg: { x: 12, y: 0, w: 6, h: 4 },
          md: { x: 16, y: 0, w: 8, h: 4 },
          sm: { x: 0, y: 4, w: 12, h: 4 },
          xs: { x: 0, y: 8, w: 24, h: 4 },
        },
      },
      {
        id: 'kpi-4',
        positions: {
          xxl: { x: 12, y: 0, w: 4, h: 4 },
          xl: { x: 12, y: 0, w: 4, h: 4 },
          lg: { x: 18, y: 0, w: 6, h: 4 },
          md: { x: 0, y: 4, w: 8, h: 4 },
          sm: { x: 12, y: 4, w: 12, h: 4 },
          xs: { x: 0, y: 12, w: 24, h: 4 },
        },
      },
      {
        id: 'kpi-5',
        positions: {
          xxl: { x: 16, y: 0, w: 4, h: 4 },
          xl: { x: 16, y: 0, w: 4, h: 4 },
          lg: { x: 0, y: 4, w: 6, h: 4 },
          md: { x: 8, y: 4, w: 8, h: 4 },
          sm: { x: 0, y: 8, w: 12, h: 4 },
          xs: { x: 0, y: 16, w: 24, h: 4 },
        },
      },
      // SECOND ROW: 2 large chart widgets
      {
        id: 'chart-1',
        positions: {
          xxl: { x: 0, y: 4, w: 12, h: 8 },
          xl: { x: 0, y: 4, w: 12, h: 8 },
          lg: { x: 6, y: 4, w: 18, h: 8 },
          md: { x: 0, y: 8, w: 24, h: 8 },
          sm: { x: 0, y: 12, w: 24, h: 8 },
          xs: { x: 0, y: 20, w: 24, h: 10 },
        },
      },
      {
        id: 'chart-2',
        positions: {
          xxl: { x: 12, y: 4, w: 12, h: 8 },
          xl: { x: 12, y: 4, w: 12, h: 8 },
          lg: { x: 0, y: 12, w: 24, h: 8 },
          md: { x: 0, y: 16, w: 24, h: 8 },
          sm: { x: 0, y: 20, w: 24, h: 8 },
          xs: { x: 0, y: 30, w: 24, h: 10 },
        },
      },
      // Additional slots for extra widgets (if user has more than 7)
      {
        id: 'extra-1',
        positions: {
          xxl: { x: 0, y: 12, w: 8, h: 6 },
          xl: { x: 0, y: 12, w: 8, h: 6 },
          lg: { x: 0, y: 20, w: 12, h: 6 },
          md: { x: 0, y: 24, w: 12, h: 6 },
          sm: { x: 0, y: 28, w: 24, h: 6 },
          xs: { x: 0, y: 40, w: 24, h: 6 },
        },
      },
      {
        id: 'extra-2',
        positions: {
          xxl: { x: 8, y: 12, w: 8, h: 6 },
          xl: { x: 8, y: 12, w: 8, h: 6 },
          lg: { x: 12, y: 20, w: 12, h: 6 },
          md: { x: 12, y: 24, w: 12, h: 6 },
          sm: { x: 0, y: 34, w: 24, h: 6 },
          xs: { x: 0, y: 46, w: 24, h: 6 },
        },
      },
      {
        id: 'extra-3',
        positions: {
          xxl: { x: 16, y: 12, w: 8, h: 6 },
          xl: { x: 16, y: 12, w: 8, h: 6 },
          lg: { x: 0, y: 26, w: 12, h: 6 },
          md: { x: 0, y: 30, w: 12, h: 6 },
          sm: { x: 0, y: 40, w: 24, h: 6 },
          xs: { x: 0, y: 52, w: 24, h: 6 },
        },
      },
    ],
  },

  // ==================== EXECUTIVE DASHBOARD ====================
  {
    id: 'executive-view',
    name: '👔 Executive View',
    description: '3 large KPIs on top, 1 main chart, 2 side charts',
    icon: '👔',
    category: 'executive',
    recommendedWidgetCount: 6,
    minWidgets: 3,
    maxWidgets: 8,
    slots: [
      // TOP: 3 large KPIs
      {
        id: 'main-kpi-1',
        positions: {
          xxl: { x: 0, y: 0, w: 8, h: 5 },
          xl: { x: 0, y: 0, w: 8, h: 5 },
          lg: { x: 0, y: 0, w: 8, h: 5 },
          md: { x: 0, y: 0, w: 8, h: 5 },
          sm: { x: 0, y: 0, w: 24, h: 5 },
          xs: { x: 0, y: 0, w: 24, h: 5 },
        },
      },
      {
        id: 'main-kpi-2',
        positions: {
          xxl: { x: 8, y: 0, w: 8, h: 5 },
          xl: { x: 8, y: 0, w: 8, h: 5 },
          lg: { x: 8, y: 0, w: 8, h: 5 },
          md: { x: 8, y: 0, w: 8, h: 5 },
          sm: { x: 0, y: 5, w: 24, h: 5 },
          xs: { x: 0, y: 5, w: 24, h: 5 },
        },
      },
      {
        id: 'main-kpi-3',
        positions: {
          xxl: { x: 16, y: 0, w: 8, h: 5 },
          xl: { x: 16, y: 0, w: 8, h: 5 },
          lg: { x: 16, y: 0, w: 8, h: 5 },
          md: { x: 16, y: 0, w: 8, h: 5 },
          sm: { x: 0, y: 10, w: 24, h: 5 },
          xs: { x: 0, y: 10, w: 24, h: 5 },
        },
      },
      // MIDDLE: 1 large main chart
      {
        id: 'main-chart',
        positions: {
          xxl: { x: 0, y: 5, w: 16, h: 10 },
          xl: { x: 0, y: 5, w: 16, h: 10 },
          lg: { x: 0, y: 5, w: 16, h: 10 },
          md: { x: 0, y: 5, w: 24, h: 10 },
          sm: { x: 0, y: 15, w: 24, h: 10 },
          xs: { x: 0, y: 15, w: 24, h: 10 },
        },
      },
      // RIGHT SIDE: 2 smaller charts
      {
        id: 'side-chart-1',
        positions: {
          xxl: { x: 16, y: 5, w: 8, h: 5 },
          xl: { x: 16, y: 5, w: 8, h: 5 },
          lg: { x: 16, y: 5, w: 8, h: 5 },
          md: { x: 0, y: 15, w: 12, h: 6 },
          sm: { x: 0, y: 25, w: 24, h: 6 },
          xs: { x: 0, y: 25, w: 24, h: 6 },
        },
      },
      {
        id: 'side-chart-2',
        positions: {
          xxl: { x: 16, y: 10, w: 8, h: 5 },
          xl: { x: 16, y: 10, w: 8, h: 5 },
          lg: { x: 16, y: 10, w: 8, h: 5 },
          md: { x: 12, y: 15, w: 12, h: 6 },
          sm: { x: 0, y: 31, w: 24, h: 6 },
          xs: { x: 0, y: 31, w: 24, h: 6 },
        },
      },
      // Extra slots
      {
        id: 'extra-1',
        positions: {
          xxl: { x: 0, y: 15, w: 12, h: 6 },
          xl: { x: 0, y: 15, w: 12, h: 6 },
          lg: { x: 0, y: 15, w: 12, h: 6 },
          md: { x: 0, y: 21, w: 12, h: 6 },
          sm: { x: 0, y: 37, w: 24, h: 6 },
          xs: { x: 0, y: 37, w: 24, h: 6 },
        },
      },
      {
        id: 'extra-2',
        positions: {
          xxl: { x: 12, y: 15, w: 12, h: 6 },
          xl: { x: 12, y: 15, w: 12, h: 6 },
          lg: { x: 12, y: 15, w: 12, h: 6 },
          md: { x: 12, y: 21, w: 12, h: 6 },
          sm: { x: 0, y: 43, w: 24, h: 6 },
          xs: { x: 0, y: 43, w: 24, h: 6 },
        },
      },
    ],
  },

  // ==================== ANALYTICS GRID ====================
  {
    id: 'analytics-grid',
    name: '📈 Analytics Grid',
    description: '4 equal-sized charts in a balanced grid layout',
    icon: '📈',
    category: 'analytics',
    recommendedWidgetCount: 4,
    minWidgets: 2,
    maxWidgets: 8,
    slots: [
      // 2x2 Grid of equal charts
      {
        id: 'grid-1',
        positions: {
          xxl: { x: 0, y: 0, w: 12, h: 8 },
          xl: { x: 0, y: 0, w: 12, h: 8 },
          lg: { x: 0, y: 0, w: 12, h: 8 },
          md: { x: 0, y: 0, w: 12, h: 8 },
          sm: { x: 0, y: 0, w: 24, h: 8 },
          xs: { x: 0, y: 0, w: 24, h: 8 },
        },
      },
      {
        id: 'grid-2',
        positions: {
          xxl: { x: 12, y: 0, w: 12, h: 8 },
          xl: { x: 12, y: 0, w: 12, h: 8 },
          lg: { x: 12, y: 0, w: 12, h: 8 },
          md: { x: 12, y: 0, w: 12, h: 8 },
          sm: { x: 0, y: 8, w: 24, h: 8 },
          xs: { x: 0, y: 8, w: 24, h: 8 },
        },
      },
      {
        id: 'grid-3',
        positions: {
          xxl: { x: 0, y: 8, w: 12, h: 8 },
          xl: { x: 0, y: 8, w: 12, h: 8 },
          lg: { x: 0, y: 8, w: 12, h: 8 },
          md: { x: 0, y: 8, w: 12, h: 8 },
          sm: { x: 0, y: 16, w: 24, h: 8 },
          xs: { x: 0, y: 16, w: 24, h: 8 },
        },
      },
      {
        id: 'grid-4',
        positions: {
          xxl: { x: 12, y: 8, w: 12, h: 8 },
          xl: { x: 12, y: 8, w: 12, h: 8 },
          lg: { x: 12, y: 8, w: 12, h: 8 },
          md: { x: 12, y: 8, w: 12, h: 8 },
          sm: { x: 0, y: 24, w: 24, h: 8 },
          xs: { x: 0, y: 24, w: 24, h: 8 },
        },
      },
      // Extra slots for more widgets
      {
        id: 'grid-5',
        positions: {
          xxl: { x: 0, y: 16, w: 12, h: 8 },
          xl: { x: 0, y: 16, w: 12, h: 8 },
          lg: { x: 0, y: 16, w: 12, h: 8 },
          md: { x: 0, y: 16, w: 12, h: 8 },
          sm: { x: 0, y: 32, w: 24, h: 8 },
          xs: { x: 0, y: 32, w: 24, h: 8 },
        },
      },
      {
        id: 'grid-6',
        positions: {
          xxl: { x: 12, y: 16, w: 12, h: 8 },
          xl: { x: 12, y: 16, w: 12, h: 8 },
          lg: { x: 12, y: 16, w: 12, h: 8 },
          md: { x: 12, y: 16, w: 12, h: 8 },
          sm: { x: 0, y: 40, w: 24, h: 8 },
          xs: { x: 0, y: 40, w: 24, h: 8 },
        },
      },
      {
        id: 'grid-7',
        positions: {
          xxl: { x: 0, y: 24, w: 12, h: 8 },
          xl: { x: 0, y: 24, w: 12, h: 8 },
          lg: { x: 0, y: 24, w: 12, h: 8 },
          md: { x: 0, y: 24, w: 12, h: 8 },
          sm: { x: 0, y: 48, w: 24, h: 8 },
          xs: { x: 0, y: 48, w: 24, h: 8 },
        },
      },
      {
        id: 'grid-8',
        positions: {
          xxl: { x: 12, y: 24, w: 12, h: 8 },
          xl: { x: 12, y: 24, w: 12, h: 8 },
          lg: { x: 12, y: 24, w: 12, h: 8 },
          md: { x: 12, y: 24, w: 12, h: 8 },
          sm: { x: 0, y: 56, w: 24, h: 8 },
          xs: { x: 0, y: 56, w: 24, h: 8 },
        },
      },
    ],
  },

  // ==================== OPERATIONAL DASHBOARD ====================
  {
    id: 'operational-dashboard',
    name: '⚙️ Operational',
    description: '1 large table, 4 KPIs on side, 2 charts below',
    icon: '⚙️',
    category: 'operational',
    recommendedWidgetCount: 7,
    minWidgets: 3,
    maxWidgets: 10,
    slots: [
      // LEFT: Large table
      {
        id: 'main-table',
        positions: {
          xxl: { x: 0, y: 0, w: 16, h: 12 },
          xl: { x: 0, y: 0, w: 16, h: 12 },
          lg: { x: 0, y: 0, w: 16, h: 12 },
          md: { x: 0, y: 0, w: 24, h: 12 },
          sm: { x: 0, y: 0, w: 24, h: 12 },
          xs: { x: 0, y: 0, w: 24, h: 12 },
        },
      },
      // RIGHT: 4 small KPIs
      {
        id: 'side-kpi-1',
        positions: {
          xxl: { x: 16, y: 0, w: 8, h: 3 },
          xl: { x: 16, y: 0, w: 8, h: 3 },
          lg: { x: 16, y: 0, w: 8, h: 3 },
          md: { x: 0, y: 12, w: 6, h: 4 },
          sm: { x: 0, y: 12, w: 12, h: 4 },
          xs: { x: 0, y: 12, w: 24, h: 4 },
        },
      },
      {
        id: 'side-kpi-2',
        positions: {
          xxl: { x: 16, y: 3, w: 8, h: 3 },
          xl: { x: 16, y: 3, w: 8, h: 3 },
          lg: { x: 16, y: 3, w: 8, h: 3 },
          md: { x: 6, y: 12, w: 6, h: 4 },
          sm: { x: 12, y: 12, w: 12, h: 4 },
          xs: { x: 0, y: 16, w: 24, h: 4 },
        },
      },
      {
        id: 'side-kpi-3',
        positions: {
          xxl: { x: 16, y: 6, w: 8, h: 3 },
          xl: { x: 16, y: 6, w: 8, h: 3 },
          lg: { x: 16, y: 6, w: 8, h: 3 },
          md: { x: 12, y: 12, w: 6, h: 4 },
          sm: { x: 0, y: 16, w: 12, h: 4 },
          xs: { x: 0, y: 20, w: 24, h: 4 },
        },
      },
      {
        id: 'side-kpi-4',
        positions: {
          xxl: { x: 16, y: 9, w: 8, h: 3 },
          xl: { x: 16, y: 9, w: 8, h: 3 },
          lg: { x: 16, y: 9, w: 8, h: 3 },
          md: { x: 18, y: 12, w: 6, h: 4 },
          sm: { x: 12, y: 16, w: 12, h: 4 },
          xs: { x: 0, y: 24, w: 24, h: 4 },
        },
      },
      // BOTTOM: 2 charts
      {
        id: 'bottom-chart-1',
        positions: {
          xxl: { x: 0, y: 12, w: 12, h: 8 },
          xl: { x: 0, y: 12, w: 12, h: 8 },
          lg: { x: 0, y: 12, w: 12, h: 8 },
          md: { x: 0, y: 16, w: 12, h: 8 },
          sm: { x: 0, y: 20, w: 24, h: 8 },
          xs: { x: 0, y: 28, w: 24, h: 8 },
        },
      },
      {
        id: 'bottom-chart-2',
        positions: {
          xxl: { x: 12, y: 12, w: 12, h: 8 },
          xl: { x: 12, y: 12, w: 12, h: 8 },
          lg: { x: 12, y: 12, w: 12, h: 8 },
          md: { x: 12, y: 16, w: 12, h: 8 },
          sm: { x: 0, y: 28, w: 24, h: 8 },
          xs: { x: 0, y: 36, w: 24, h: 8 },
        },
      },
      // Extra slots
      {
        id: 'extra-1',
        positions: {
          xxl: { x: 0, y: 20, w: 8, h: 6 },
          xl: { x: 0, y: 20, w: 8, h: 6 },
          lg: { x: 0, y: 20, w: 8, h: 6 },
          md: { x: 0, y: 24, w: 8, h: 6 },
          sm: { x: 0, y: 36, w: 12, h: 6 },
          xs: { x: 0, y: 44, w: 24, h: 6 },
        },
      },
      {
        id: 'extra-2',
        positions: {
          xxl: { x: 8, y: 20, w: 8, h: 6 },
          xl: { x: 8, y: 20, w: 8, h: 6 },
          lg: { x: 8, y: 20, w: 8, h: 6 },
          md: { x: 8, y: 24, w: 8, h: 6 },
          sm: { x: 12, y: 36, w: 12, h: 6 },
          xs: { x: 0, y: 50, w: 24, h: 6 },
        },
      },
      {
        id: 'extra-3',
        positions: {
          xxl: { x: 16, y: 20, w: 8, h: 6 },
          xl: { x: 16, y: 20, w: 8, h: 6 },
          lg: { x: 16, y: 20, w: 8, h: 6 },
          md: { x: 16, y: 24, w: 8, h: 6 },
          sm: { x: 0, y: 42, w: 24, h: 6 },
          xs: { x: 0, y: 56, w: 24, h: 6 },
        },
      },
    ],
  },

  // ==================== SINGLE FOCUS ====================
  {
    id: 'single-focus',
    name: '🎯 Single Focus',
    description: 'One large widget taking most space, small widgets on side',
    icon: '🎯',
    category: 'custom',
    recommendedWidgetCount: 4,
    minWidgets: 1,
    maxWidgets: 6,
    slots: [
      // MAIN: Large focus widget
      {
        id: 'focus-main',
        positions: {
          xxl: { x: 0, y: 0, w: 18, h: 16 },
          xl: { x: 0, y: 0, w: 18, h: 16 },
          lg: { x: 0, y: 0, w: 18, h: 16 },
          md: { x: 0, y: 0, w: 24, h: 14 },
          sm: { x: 0, y: 0, w: 24, h: 12 },
          xs: { x: 0, y: 0, w: 24, h: 12 },
        },
      },
      // SIDE: Small supporting widgets
      {
        id: 'side-1',
        positions: {
          xxl: { x: 18, y: 0, w: 6, h: 5 },
          xl: { x: 18, y: 0, w: 6, h: 5 },
          lg: { x: 18, y: 0, w: 6, h: 5 },
          md: { x: 0, y: 14, w: 8, h: 5 },
          sm: { x: 0, y: 12, w: 12, h: 5 },
          xs: { x: 0, y: 12, w: 24, h: 5 },
        },
      },
      {
        id: 'side-2',
        positions: {
          xxl: { x: 18, y: 5, w: 6, h: 5 },
          xl: { x: 18, y: 5, w: 6, h: 5 },
          lg: { x: 18, y: 5, w: 6, h: 5 },
          md: { x: 8, y: 14, w: 8, h: 5 },
          sm: { x: 12, y: 12, w: 12, h: 5 },
          xs: { x: 0, y: 17, w: 24, h: 5 },
        },
      },
      {
        id: 'side-3',
        positions: {
          xxl: { x: 18, y: 10, w: 6, h: 6 },
          xl: { x: 18, y: 10, w: 6, h: 6 },
          lg: { x: 18, y: 10, w: 6, h: 6 },
          md: { x: 16, y: 14, w: 8, h: 5 },
          sm: { x: 0, y: 17, w: 12, h: 5 },
          xs: { x: 0, y: 22, w: 24, h: 5 },
        },
      },
      // Extra slots
      {
        id: 'extra-1',
        positions: {
          xxl: { x: 0, y: 16, w: 12, h: 6 },
          xl: { x: 0, y: 16, w: 12, h: 6 },
          lg: { x: 0, y: 16, w: 12, h: 6 },
          md: { x: 0, y: 19, w: 12, h: 6 },
          sm: { x: 12, y: 17, w: 12, h: 5 },
          xs: { x: 0, y: 27, w: 24, h: 6 },
        },
      },
      {
        id: 'extra-2',
        positions: {
          xxl: { x: 12, y: 16, w: 12, h: 6 },
          xl: { x: 12, y: 16, w: 12, h: 6 },
          lg: { x: 12, y: 16, w: 12, h: 6 },
          md: { x: 12, y: 19, w: 12, h: 6 },
          sm: { x: 0, y: 22, w: 24, h: 5 },
          xs: { x: 0, y: 33, w: 24, h: 6 },
        },
      },
    ],
  },
];

/**
 * Get layout template by ID
 */
export function getLayoutTemplateById(id: string): DashboardLayoutTemplate | undefined {
  return DASHBOARD_LAYOUT_TEMPLATES.find(t => t.id === id);
}

/**
 * Get layout templates by category
 */
export function getLayoutTemplatesByCategory(category: DashboardLayoutTemplate['category']): DashboardLayoutTemplate[] {
  return DASHBOARD_LAYOUT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get all layout categories
 */
export function getLayoutCategories(): Array<{ id: DashboardLayoutTemplate['category']; name: string; icon: string }> {
  return [
    { id: 'metrics', name: 'Metrics', icon: '📊' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'executive', name: 'Executive', icon: '👔' },
    { id: 'operational', name: 'Operational', icon: '⚙️' },
    { id: 'custom', name: 'Custom', icon: '🎨' },
  ];
}

