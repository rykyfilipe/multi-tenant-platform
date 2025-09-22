/**
 * Refactored Widget System Types
 * Fully scalable, clean, and type-safe widget system
 */

export type WidgetId = number | `temp-${string}`;

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DataSourceTableRef {
  type: "table";
  tableId: number;
  columns: string[];
  filters?: any[];
  groupBy?: string | null;
  aggregation?: string | null;
}

export interface DataSourceManual {
  type: "manual";
  rows: any[];
}

export type DataSource = DataSourceTableRef | DataSourceManual;

// Base widget interface with common fields
export interface WidgetBase {
  id: WidgetId;
  dashboardId: number;
  type: WidgetType;
  title?: string | null;
  position: Position;
  dataSource: DataSource;
  isVisible: boolean;
  order: number;
  version: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  updatedBy?: number;
}

// Widget type definitions
export type WidgetType = 
  | 'line' | 'bar' | 'pie' | 'area' | 'scatter'
  | 'table' | 'metric' | 'text' | 'image'
  | 'calendar' | 'tasks' | 'clock' | 'weather'
  | 'gauge' | 'funnel' | 'heatmap' | 'treemap';

// Widget type specific configurations
export interface LineChartConfig {
  xAxis: string;
  yAxis: string;
  series?: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  curveType?: 'linear' | 'monotone' | 'step';
}

export interface BarChartConfig {
  xAxis: string;
  yAxis: string;
  series?: string[];
  colors?: string[];
  showLegend?: boolean;
  orientation?: 'vertical' | 'horizontal';
  stacked?: boolean;
}

export interface PieChartConfig {
  labelColumn: string;
  valueColumn: string;
  colors?: string[];
  showLegend?: boolean;
  showPercentage?: boolean;
  innerRadius?: number;
}

export interface TableConfig {
  columns: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  showSearch?: boolean;
  showPagination?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  style?: {
    theme?: 'default' | 'minimal' | 'bordered' | 'striped' | 'dark';
    headerStyle?: 'default' | 'bold' | 'colored' | 'gradient';
    rowHover?: boolean;
    cellPadding?: 'compact' | 'comfortable' | 'spacious';
    fontSize?: 'small' | 'medium' | 'large';
    borderStyle?: 'none' | 'thin' | 'thick' | 'dashed';
    headerBackground?: string;
    headerTextColor?: string;
    rowBackground?: string;
    alternateRowColor?: string;
    borderColor?: string;
  };
}

export interface MetricConfig {
  valueColumn: string;
  title?: string;
  subtitle?: string;
  label?: string;
  prefix?: string;
  suffix?: string;
  color?: string;
  format?: 'number' | 'currency' | 'percentage' | 'duration';
  comparisonColumn?: string;
  showTrend?: boolean;
  style?: {
    layout?: 'card' | 'minimal' | 'bordered' | 'gradient' | 'glass';
    size?: 'small' | 'medium' | 'large' | 'xl';
    alignment?: 'left' | 'center' | 'right';
    valueStyle?: 'default' | 'bold' | 'outlined' | 'gradient';
    titleStyle?: 'default' | 'bold' | 'italic' | 'uppercase';
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    borderColor?: string;
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    shadow?: 'none' | 'small' | 'medium' | 'large';
    padding?: 'compact' | 'comfortable' | 'spacious';
  };
}

export interface TextConfig {
  content: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  style?: {
    layout?: 'card' | 'minimal' | 'bordered' | 'gradient' | 'glass' | 'quote';
    size?: 'small' | 'medium' | 'large' | 'xl';
    fontStyle?: 'normal' | 'italic' | 'bold' | 'bold-italic';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    lineHeight?: 'tight' | 'normal' | 'relaxed' | 'loose';
    letterSpacing?: 'tight' | 'normal' | 'wide';
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
    shadow?: 'none' | 'small' | 'medium' | 'large';
    padding?: 'compact' | 'comfortable' | 'spacious';
    alignment?: 'left' | 'center' | 'right';
  };
}

export interface CalendarConfig {
  dateColumn: string;
  titleColumn?: string;
  descriptionColumn?: string;
  colorColumn?: string;
  showWeekends?: boolean;
  defaultView?: 'month' | 'week' | 'day';
}

export interface ClockConfig {
  title?: string;
  timezone?: string;
  format?: '12h' | '24h';
  showDate?: boolean;
  showSeconds?: boolean;
  showTimezone?: boolean;
  clockType?: 'digital' | 'analog' | 'flip' | 'binary' | 'world' | 'stopwatch' | 'timer' | 'countdown';
  style?: {
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    fontFamily?: 'mono' | 'sans' | 'serif';
    color?: string;
    backgroundColor?: string;
    theme?: 'light' | 'dark' | 'neon' | 'vintage' | 'minimal' | 'glass';
    size?: 'small' | 'medium' | 'large' | 'xl';
    layout?: 'vertical' | 'horizontal' | 'compact';
  };
}

export interface TasksConfig {
  titleColumn: string;
  statusColumn: string;
  priorityColumn?: string;
  assigneeColumn?: string;
  dueDateColumn?: string;
  statusOptions?: string[];
  priorityOptions?: string[];
  showCompleted?: boolean;
  showPriority?: boolean;
  showAssignee?: boolean;
}

export interface ClockConfig {
  title?: string;
  timezone?: string;
  format?: '12h' | '24h';
  showDate?: boolean;
  showSeconds?: boolean;
  showTimezone?: boolean;
  clockType?: 'digital' | 'analog' | 'flip' | 'binary' | 'world' | 'stopwatch' | 'timer' | 'countdown';
  style?: {
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    fontFamily?: 'mono' | 'sans' | 'serif';
    color?: string;
    backgroundColor?: string;
    theme?: 'light' | 'dark' | 'neon' | 'vintage' | 'minimal' | 'glass';
    size?: 'small' | 'medium' | 'large' | 'xl';
    layout?: 'vertical' | 'horizontal' | 'compact';
  };
}

export interface WeatherConfig {
  location?: string;
  units?: 'metric' | 'imperial';
  showForecast?: boolean;
  forecastDays?: number;
}

export type WidgetTypeSpecificConfig = 
  | LineChartConfig
  | BarChartConfig
  | PieChartConfig
  | TableConfig
  | MetricConfig
  | TextConfig
  | CalendarConfig
  | TasksConfig
  | ClockConfig
  | WeatherConfig;

// Complete widget entity
export interface WidgetEntity extends WidgetBase {
  config: WidgetTypeSpecificConfig;
}

// Widget editor props interface
export interface WidgetEditorProps<T extends WidgetTypeSpecificConfig = WidgetTypeSpecificConfig> {
  widget: Partial<WidgetEntity>;
  onSave: (widget: Partial<WidgetEntity>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

// Data mapping function types
export type DataMapper<T = any> = (rawData: any[], config: WidgetTypeSpecificConfig) => T;

export interface MappedData {
  type: WidgetType;
  data: any;
  metadata?: {
    totalRows?: number;
    filteredRows?: number;
    lastUpdated?: string;
    [key: string]: any;
  };
}

// Widget registry types
export interface WidgetEditorComponent<T extends WidgetTypeSpecificConfig = WidgetTypeSpecificConfig> {
  component: React.ComponentType<WidgetEditorProps<T>>;
  type: WidgetType;
}

export interface WidgetMapper {
  mapper: DataMapper;
  type: WidgetType;
}

// Pending operations (unchanged from original)
export type PendingOp =
  | { op: "create"; widget: WidgetEntity }
  | { op: "update"; id: WidgetId; changes: Partial<WidgetEntity>; baseVersion: number }
  | { op: "delete"; id: WidgetId; baseVersion?: number };

export interface BatchOperationResult {
  op: PendingOp;
  status: 'ok' | 'conflict' | 'error';
  widget?: WidgetEntity;
  serverWidget?: WidgetEntity;
  id?: WidgetId;
  error?: string;
}

export interface BatchResponse {
  success: boolean;
  results: BatchOperationResult[];
  conflicts?: BatchOperationResult[];
  idMapping?: Record<string, number>;
  reason?: string;
  error?: string;
  summary?: {
    total: number;
    successful: number;
    failed: number;
    conflicts: number;
  };
}

// Error handling types
export interface WidgetError {
  type: 'mapping' | 'rendering' | 'editor' | 'data';
  message: string;
  widgetId: WidgetId;
  widgetType: WidgetType;
  timestamp: string;
  details?: any;
}
