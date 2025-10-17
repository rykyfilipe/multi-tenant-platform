import { WidgetAuditOperation, WidgetDraftStatus, WidgetType } from "@/generated/prisma";

// Single breakpoint position
export interface BreakpointPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Responsive layouts per breakpoint
export interface ResponsiveLayouts {
  xxl?: BreakpointPosition;
  xl?: BreakpointPosition;
  lg?: BreakpointPosition;
  md?: BreakpointPosition;
  sm?: BreakpointPosition;
  xs?: BreakpointPosition;
}

// Main position interface with backwards compatibility
export interface WidgetPosition {
  // Legacy/default position (backwards compatible)
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  
  // NEW: Per-breakpoint layouts (optional for backwards compatibility)
  layouts?: ResponsiveLayouts;
}

export type Breakpoint = 'xxl' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';

export interface WidgetConfig<TSettings = unknown, TStyle = unknown, TData = unknown> {
  settings: TSettings;
  style?: TStyle;
  data?: TData;
  refresh?: {
    enabled: boolean;
    interval: number;
    lastRefresh?: Date;
  };
  metadata?: Record<string, unknown>;
}

export interface WidgetEntity<TConfig extends WidgetConfig = WidgetConfig> {
  id: number;
  tenantId: number;
  dashboardId: number;
  type: WidgetType;
  title: string | null;
  description: string | null;
  position: WidgetPosition;
  config: TConfig;
  isVisible: boolean;
  sortOrder: number;
  version: number;
  schemaVersion: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: number;
  updatedBy: number;
}

export interface WidgetDraftEntity<TConfig extends WidgetConfig = WidgetConfig> {
  id: number;
  tenantId: number;
  dashboardId: number;
  widgetId: number | null;
  type: WidgetType;
  title: string | null;
  description: string | null;
  position: WidgetPosition | null;
  config: TConfig;
  version: number;
  schemaVersion: number;
  status: WidgetDraftStatus;
  operations: DraftOperation<TConfig>[];
  conflictMeta: ConflictMetadata<TConfig> | null;
  widgetSnapshot: WidgetEntity<TConfig> | null;
  note: string | null;
  createdBy: number;
  updatedBy: number;
  createdAt: Date;
  updatedAt: Date;
  appliedAt: Date | null;
}

export interface DraftCreateOperation<TConfig extends WidgetConfig = WidgetConfig> {
  id: string;
  kind: "create";
  widget: Omit<WidgetEntity<TConfig>, "id" | "version" | "createdAt" | "updatedAt">;
}

export interface DraftUpdateOperation<TConfig extends WidgetConfig = WidgetConfig> {
  id: string;
  kind: "update";
  widgetId: number;
  expectedVersion?: number;
  patch: Partial<Omit<WidgetEntity<TConfig>, "id" | "tenantId" | "dashboardId" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">>;
}

export interface DraftDeleteOperation {
  id: string;
  kind: "delete";
  widgetId: number;
  expectedVersion?: number;
}

export type DraftOperation<TConfig extends WidgetConfig = WidgetConfig> =
  | DraftCreateOperation<TConfig>
  | DraftUpdateOperation<TConfig>
  | DraftDeleteOperation;

export interface ConflictMetadata<TConfig extends WidgetConfig = WidgetConfig> {
  widgetId: number;
  localVersion: number;
  remoteVersion: number;
  remoteWidget: WidgetEntity<TConfig>;
  suggestedMerge?: Partial<WidgetEntity<TConfig>>;
  diff?: {
    before?: Partial<WidgetEntity<TConfig>>;
    after?: Partial<WidgetEntity<TConfig>>;
    patch?: Partial<WidgetEntity<TConfig>>;
  };
}

export interface WidgetAuditEntity {
  id: number;
  tenantId: number;
  dashboardId: number;
  widgetId: number | null;
  draftId: number | null;
  actorId: number | null;
  operation: WidgetAuditOperation;
  diff: Record<string, unknown>;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface WidgetAuditInput {
  tenantId: number;
  dashboardId: number;
  widgetId?: number | null;
  draftId?: number | null;
  actorId?: number | null;
  operation: WidgetAuditOperation;
  diff: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
}


