/**
 * Centralized Widget Types and Interfaces
 * Single source of truth for all widget-related types
 */

import { ColumnType, FilterOperator, FilterValue } from './filtering-enhanced';

// Base Widget Types
export type WidgetType = 'chart' | 'table' | 'metric' | 'text' | 'tasks' | 'clock' | 'calendar' | 'weather';
export type ChartType = 'line' | 'bar' | 'pie';

// Position and Layout
export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Data Source Configuration
export interface DataSource {
  type: 'table' | 'manual';
  tableId?: number | null;
  columns?: string[];
  columnX?: string | null;
  columnY?: string | null;
  column?: string | null;
  filters?: FilterConfig[];
  content?: string; // For text widgets
  [key: string]: any;
}

// Filter Configuration - compatible with existing FilterConfig
export interface FilterConfig {
  id: string;
  column: string;
  columnId: number;
  columnName: string;
  columnType: ColumnType;
  operator: FilterOperator;
  value: FilterValue | null | undefined;
  secondValue?: FilterValue | null | undefined;
  type?: string;
}

// Widget Configuration
export interface WidgetConfig {
  dataSource?: DataSource;
  options?: Record<string, any>;
  chartType?: ChartType;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  pageSize?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  showExport?: boolean;
  showColumnSelector?: boolean;
  format?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  showChange?: boolean;
  showTrend?: boolean;
  fontSize?: string;
  textAlign?: string;
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  showBorder?: boolean;
  borderRadius?: string;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc';
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  [key: string]: any;
}

// Widget Style Configuration
export interface WidgetStyleConfig {
  // Background styling
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  backgroundPattern?: 'none' | 'dots' | 'grid' | 'lines' | 'diagonal' | 'waves';
  backgroundOpacity?: number;
  
  // Border styling
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'groove' | 'ridge' | 'inset' | 'outset';
  borderPosition?: 'all' | 'top' | 'bottom' | 'left' | 'right' | 'horizontal' | 'vertical';
  
  // Shadow styling
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'inner' | 'outline';
  shadowColor?: string;
  shadowBlur?: number;
  shadowSpread?: number;
  
  // Padding and spacing
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  margin?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  // Typography
  titleColor?: string;
  titleSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  titleWeight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold' | 'black';
  titleAlign?: 'left' | 'center' | 'right' | 'justify';
  titleTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  titleDecoration?: 'none' | 'underline' | 'overline' | 'line-through';
  
  // Content styling
  contentColor?: string;
  contentSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  contentWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  contentAlign?: 'left' | 'center' | 'right' | 'justify';
  
  // Animation and effects
  animation?: 'none' | 'fade' | 'slide' | 'bounce' | 'pulse' | 'spin' | 'ping' | 'wiggle';
  hoverEffect?: 'none' | 'lift' | 'glow' | 'scale' | 'rotate' | 'tilt' | 'shimmer' | 'gradient';
  transition?: 'none' | 'fast' | 'normal' | 'slow' | 'custom';
  
  // Layout and positioning
  height?: 'auto' | 'fit' | 'full' | 'min' | 'max' | 'screen';
  width?: 'auto' | 'fit' | 'full' | 'min' | 'max' | 'screen';
  minHeight?: string;
  maxHeight?: string;
  minWidth?: string;
  maxWidth?: string;
  overflow?: 'visible' | 'hidden' | 'scroll' | 'auto' | 'clip';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  
  // Responsive design
  responsive?: {
    mobile?: Partial<WidgetStyleConfig>;
    tablet?: Partial<WidgetStyleConfig>;
    desktop?: Partial<WidgetStyleConfig>;
    large?: Partial<WidgetStyleConfig>;
  };
  
  // Grid and flexbox
  display?: 'block' | 'inline' | 'flex' | 'grid' | 'inline-flex' | 'inline-grid';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  alignItems?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridGap?: string;
  
  // Visual effects
  backdropBlur?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  backdropSaturate?: number;
  filter?: 'none' | 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'hue-rotate' | 'invert' | 'saturate' | 'sepia';
  opacity?: number;
  transform?: string;
  
  // Custom CSS
  customCSS?: string;
  customClasses?: string[];
}

// Widget Presets
export type WidgetPreset = 'modern' | 'glass' | 'dark' | 'gradient' | 'card' | 'compact' | 'luxury';

// Base Widget Interface
export interface BaseWidget {
  id: number | string;
  type: WidgetType;
  title: string | null;
  position: Position;
  config: WidgetConfig;
  isVisible: boolean;
  order: number;
  style?: WidgetStyleConfig;
}

// Widget Props Interface
export interface WidgetProps {
  widget: BaseWidget;
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onStyleEdit?: () => void;
  onRefresh?: () => void;
  showRefresh?: boolean;
  tenantId?: number;
  databaseId?: number;
  className?: string;
  style?: WidgetStyleConfig;
  preset?: WidgetPreset;
  data?: any[];
  isLoading?: boolean;
  error?: string | null;
}

// Chart Data Point
export interface ChartDataPoint {
  [key: string]: any;
  x?: string | number;
  y?: string | number;
  value?: number;
  name?: string;
  label?: string;
}

// Widget Editor Props
export interface WidgetEditorProps {
  widget: BaseWidget;
  onClose: () => void;
  onSave: (widget: BaseWidget) => void;
  tenantId: number;
  databaseId: number;
}

// Pending Change Interface
export interface PendingChange {
  type: 'create' | 'update' | 'delete';
  widgetId?: number | string;
  data?: Partial<BaseWidget> | null;
  originalData?: Partial<BaseWidget>;
}

// Widget Data Hook Return Type
export interface WidgetDataHookReturn {
  data: any[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Widget Registry Component Type
export type WidgetComponent = React.ComponentType<WidgetProps>;

// Widget Factory Options
export interface WidgetFactoryOptions {
  position?: Partial<Position>;
  config?: Partial<WidgetConfig>;
  style?: Partial<WidgetStyleConfig>;
  title?: string;
  isVisible?: boolean;
  order?: number;
}
