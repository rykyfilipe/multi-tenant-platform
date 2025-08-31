export interface Dashboard {
  id: string;
  name: string;
  userId: number;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Widget {
  id: string;
  dashboardId: string;
  parentId?: string;
  type: WidgetType;
  config: WidgetConfig;
  position: WidgetPosition;
  orderIndex: number;
  children?: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

export type WidgetType = 
  | 'container'
  | 'title'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'chart'
  | 'calendar'
  | 'tasks'
  | 'image'
  | 'progress';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface BaseWidgetConfig {
  id: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: number;
  margin?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface TitleWidgetConfig extends BaseWidgetConfig {
  text: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  alignment: 'left' | 'center' | 'right';
  fontFamily?: string;
}

export interface ParagraphWidgetConfig extends BaseWidgetConfig {
  text: string;
  fontSize: number;
  color: string;
  lineHeight: number;
  alignment: 'left' | 'center' | 'right';
  fontFamily?: string;
}

export interface ListWidgetConfig extends BaseWidgetConfig {
  items: string[];
  listType: 'bullet' | 'numbered';
  fontSize: number;
  color: string;
  spacing: number;
}

export interface TableWidgetConfig extends BaseWidgetConfig {
  tableName: string;
  columns: string[];
  pageSize: number;
  showHeader: boolean;
  showPagination: boolean;
  sortable: boolean;
  filterable: boolean;
}

export interface ChartWidgetConfig extends BaseWidgetConfig {
  tableName: string;
  x: string;
  y: string;
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  aggregate: 'sum' | 'avg' | 'count' | 'min' | 'max';
  colorScheme: string[];
  showLegend: boolean;
  showGrid: boolean;
}

export interface CalendarWidgetConfig extends BaseWidgetConfig {
  showToday: boolean;
  showWeekNumbers: boolean;
  firstDayOfWeek: number;
  highlightToday: boolean;
  theme: 'light' | 'dark';
}

export interface TasksWidgetConfig extends BaseWidgetConfig {
  tasks: TaskItem[];
  showCompleted: boolean;
  allowAdd: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
}

export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

export interface ImageWidgetConfig extends BaseWidgetConfig {
  src: string;
  alt: string;
  fit: 'cover' | 'contain' | 'fill' | 'none';
  objectPosition: string;
  showCaption: boolean;
  caption?: string;
}

export interface ProgressWidgetConfig extends BaseWidgetConfig {
  value: number;
  max: number;
  label: string;
  showPercentage: boolean;
  color: string;
  size: 'sm' | 'md' | 'lg';
  variant: 'default' | 'success' | 'warning' | 'error';
}

export interface ContainerWidgetConfig extends BaseWidgetConfig {
  background: string;
  border: {
    width: number;
    color: string;
    radius: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
  padding: number;
  margin: number;
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: string[]; // widget IDs
}

export type WidgetConfig = 
  | TitleWidgetConfig
  | ParagraphWidgetConfig
  | ListWidgetConfig
  | TableWidgetConfig
  | ChartWidgetConfig
  | CalendarWidgetConfig
  | TasksWidgetConfig
  | ImageWidgetConfig
  | ProgressWidgetConfig
  | ContainerWidgetConfig;

export interface DashboardLayout {
  dashboard: Dashboard;
  widgets: Widget[];
}

export interface WidgetUpdate {
  id: string;
  config?: Partial<WidgetConfig>;
  position?: Partial<WidgetPosition>;
  parentId?: string;
  orderIndex?: number;
}

export interface BatchWidgetUpdate {
  updates: WidgetUpdate[];
}

export interface CustomTable {
  id: number;
  name: string;
  description: string;
  columns: CustomTableColumn[];
}

export interface CustomTableColumn {
  id: number;
  name: string;
  type: string;
  required: boolean;
  primary: boolean;
  semanticType?: string;
}
