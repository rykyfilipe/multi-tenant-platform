"use client";

import React, { useMemo } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { useTableRows } from "@/hooks/useDatabaseTables";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { WidgetLoadingState, WidgetErrorState, WidgetEmptyState } from "../components/WidgetStates";
import { PremiumWidgetContainer } from "../components/PremiumWidgetContainer";
import { getPremiumTheme } from "@/widgets/styles/premiumThemes";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TableWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

// ============================================================================
// DATA PROCESSING PIPELINE FOR TABLE - TYPES & INTERFACES
// ============================================================================

/**
 * Normalized row format
 */
interface NormalizedRow {
  id?: number;
  [columnName: string]: any;
}

/**
 * Grouped table data
 */
interface GroupedTableData {
  groupKey: string;
  rows: NormalizedRow[];
  summary?: Record<string, number>; // Aggregated values for the group
}

/**
 * Column statistics for footer
 */
interface ColumnStatistics {
  [columnId: string]: {
    sum?: number;
    avg?: number;
    count?: number;
    min?: number;
    max?: number;
  };
}

/**
 * Table pipeline configuration
 */
interface TablePipelineConfig {
  selectedColumns: Array<{
    id: string;
    label: string;
    format: string;
    showStatistics?: boolean;
    statisticFunction?: string;
  }>;
  processingMode: 'raw' | 'grouped';
  groupByColumn?: string;
  showGroupSummary: boolean;
  showFooterStatistics: boolean;
}

// ============================================================================
// STEP 1: SELECT DATASET - Normalize raw API data
// ============================================================================

function selectDataset(rawData: any[]): NormalizedRow[] {
  console.log('📋 [TABLE STEP 1: SELECT] Normalizing raw data...');
  
  if (!rawData || !Array.isArray(rawData)) {
    return [];
  }

  const normalized = rawData.map((row) => {
    const normalizedRow: NormalizedRow = { id: row.id };

    if (row.cells && Array.isArray(row.cells)) {
      row.cells.forEach((cell: any) => {
        if (cell.column && cell.column.name) {
          normalizedRow[cell.column.name] = cell.value;
        }
      });
    }

    return normalizedRow;
  });

  console.log(`✅ [TABLE STEP 1: SELECT] Normalized ${normalized.length} rows`);
  return normalized;
}

// ============================================================================
// STEP 2: WHERE FILTERS - Applied at API level
// ============================================================================

// WHERE filters are applied at the API level via the useTableRows hook

// ============================================================================
// STEP 3: GROUPING - Group rows by column
// ============================================================================

function groupData(data: NormalizedRow[], groupByColumn: string): GroupedTableData[] {
  console.log(`🔢 [TABLE STEP 3: GROUP BY] Grouping by: ${groupByColumn}`);
  
  const grouped: Record<string, NormalizedRow[]> = {};

  data.forEach(row => {
    const groupKey = row[groupByColumn] !== undefined && row[groupByColumn] !== null
      ? String(row[groupByColumn])
      : '__NULL__';
    
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(row);
  });

  const groupedData = Object.entries(grouped).map(([groupKey, rows]) => ({
    groupKey: groupKey === '__NULL__' ? 'N/A' : groupKey,
    rows
  }));

  console.log(`✅ [TABLE STEP 3: GROUP BY] Created ${groupedData.length} groups`);
  return groupedData;
}

// ============================================================================
// STEP 4: CALCULATE STATISTICS - For columns and groups
// ============================================================================

function extractNumericValues(rows: NormalizedRow[], columnId: string): number[] {
  return rows
    .map(row => {
      const value = row[columnId];
      if (value === null || value === undefined) return null;
      const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
      return isNaN(numericValue) ? null : numericValue;
    })
    .filter((val): val is number => val !== null);
}

function calculateColumnStatistics(
  rows: NormalizedRow[],
  columns: Array<{ id: string; showStatistics?: boolean; statisticFunction?: string; }>
): ColumnStatistics {
  console.log('📊 [TABLE STEP 4: STATISTICS] Calculating column statistics...');
  
  const statistics: ColumnStatistics = {};

  columns.forEach(column => {
    if (!column.showStatistics) return;

    const values = extractNumericValues(rows, column.id);
    if (!values.length) return;

    statistics[column.id] = {};
    const func = column.statisticFunction || 'sum';

    switch (func) {
      case 'sum':
        statistics[column.id].sum = values.reduce((acc, val) => acc + val, 0);
        break;
      case 'avg':
        statistics[column.id].avg = values.reduce((acc, val) => acc + val, 0) / values.length;
        break;
      case 'count':
        statistics[column.id].count = values.length;
        break;
      case 'min':
        statistics[column.id].min = Math.min(...values);
        break;
      case 'max':
        statistics[column.id].max = Math.max(...values);
        break;
    }
  });

  console.log(`✅ [TABLE STEP 4: STATISTICS] Calculated stats for ${Object.keys(statistics).length} columns`);
  return statistics;
}

// ============================================================================
// STEP 5: SORT - Already handled by API
// ============================================================================

// Sorting is applied at the API level via sortBy and sortOrder parameters

// ============================================================================
// PIPELINE ORCHESTRATOR
// ============================================================================

function executeTablePipeline(
  rawData: any[],
  config: TablePipelineConfig
): {
  rows: NormalizedRow[];
  groupedRows?: GroupedTableData[];
  statistics?: ColumnStatistics;
} {
  console.log('🚀 [TABLE PIPELINE START] =====================================');
  
  // STEP 1: SELECT - Normalize data
  const normalized = selectDataset(rawData);
  if (!normalized.length) {
    console.log('❌ [TABLE PIPELINE END] No data');
    return { rows: [] };
  }

  // STEP 2: WHERE - Already applied at API
  console.log('✅ [TABLE STEP 2: WHERE] Filters applied at API level');

  // STEP 3: GROUP BY (if enabled)
  let groupedRows: GroupedTableData[] | undefined;
  if (config.processingMode === 'grouped' && config.groupByColumn) {
    groupedRows = groupData(normalized, config.groupByColumn);
    
    // Calculate summary for each group if needed
    if (config.showGroupSummary) {
      groupedRows.forEach(group => {
        const stats = calculateColumnStatistics(group.rows, config.selectedColumns);
        group.summary = {};
        Object.entries(stats).forEach(([colId, stat]) => {
          const func = config.selectedColumns.find(c => c.id === colId)?.statisticFunction || 'sum';
          group.summary![colId] = stat[func as keyof typeof stat] || 0;
        });
      });
    }
  }

  // STEP 4: STATISTICS (if enabled)
  let statistics: ColumnStatistics | undefined;
  if (config.showFooterStatistics) {
    statistics = calculateColumnStatistics(normalized, config.selectedColumns);
  }

  // STEP 5: SORT - Already handled at API level

  console.log('✅ [TABLE PIPELINE END] =====================================');
  
  return { rows: normalized, groupedRows, statistics };
}

// ============================================================================
// VALUE FORMATTING
// ============================================================================

function formatCellValue(value: any, format: string): React.ReactNode {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  
  switch (format) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value;
    case 'currency':
      return typeof value === 'number' 
        ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : value;
    case 'percentage':
      return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value;
    case 'date':
      return value instanceof Date 
        ? value.toLocaleDateString() 
        : new Date(value).toLocaleDateString();
    case 'badge':
      return (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {String(value)}
        </Badge>
      );
    case 'link':
      return (
        <a 
          href={String(value)} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline text-xs"
        >
          {String(value)}
        </a>
      );
    default:
      return String(value);
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TableWidgetRenderer: React.FC<TableWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false
}) => {
  // Extract configuration
  const config = widget.config as any;
  const columns = config?.settings?.columns || [];
  const databaseId = config?.data?.databaseId;
  const tableId = config?.data?.tableId;
  const filters = config?.data?.filters || [];
  const sort = config?.data?.sort || [];
  const pageSize = config?.settings?.pageSize || 25;
  const density = config?.style?.density || "comfortable";
  const showRowBorders = config?.style?.showRowBorders || false;
  const zebraStripes = config?.style?.zebraStripes || true;
  const stickyHeader = config?.settings?.stickyHeader !== false;
  const refreshSettings = config?.refresh || { enabled: false, interval: 30000 };
  
  // Processing configuration
  const processingMode = config?.settings?.processingMode || "raw";
  const groupByColumn = config?.settings?.groupByColumn;
  const showGroupSummary = config?.settings?.showGroupSummary || false;
  const showFooterStatistics = config?.settings?.showFooterStatistics || false;

  // Fetch data from API (WHERE filters and SORT applied here)
  const validFilters = filters.filter((f: any) => f.column && f.operator && f.value !== undefined);
  const filterString = validFilters.map((f: any) => `${f.column}${f.operator}${f.value}`).join(',');
  
  const { data: rawData, isLoading, error, refetch } = useTableRows(
    widget.tenantId,
    databaseId || 0,
    Number(tableId) || 0,
    {
      pageSize,
      filters: filterString,
      sortBy: sort[0]?.column || 'id',
      sortOrder: sort[0]?.direction || 'asc'
    }
  );

  // Auto-refresh
  useAutoRefresh({
    enabled: refreshSettings.enabled,
    interval: refreshSettings.interval,
    onRefresh: refetch
  });

  // Process data through pipeline
  const { rows, groupedRows, statistics } = useMemo(() => {
    if (!rawData?.data?.length) {
      return { rows: [], groupedRows: undefined, statistics: undefined };
    }

    const pipelineConfig: TablePipelineConfig = {
      selectedColumns: columns,
      processingMode,
      groupByColumn,
      showGroupSummary,
      showFooterStatistics,
    };

    return executeTablePipeline(rawData.data, pipelineConfig);
  }, [rawData, columns, processingMode, groupByColumn, showGroupSummary, showFooterStatistics]);

  // Get premium theme
  const styleConfig = config?.style || {};
  const theme = getPremiumTheme(styleConfig.theme || 'platinum');
  
  // Get cell padding based on density
  const getCellPadding = () => {
    const paddingMap = {
      compact: 'px-2 py-1.5',
      expanded: 'px-5 py-4',
      comfortable: 'px-4 py-2.5',
    };
    return paddingMap[density as keyof typeof paddingMap] || 'px-4 py-2.5';
  };

  // Get text size based on configuration
  const getTextSize = () => {
    const fontSizeMap = {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
    };
    return fontSizeMap[styleConfig.fontSize as keyof typeof fontSizeMap] || 'text-xs';
  };
  
  // Get font weight
  const getFontWeight = () => {
    const fontWeightMap = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };
    return fontWeightMap[styleConfig.fontWeight as keyof typeof fontWeightMap] || 'font-normal';
  };

  // Loading state
  if (isLoading) {
    return <WidgetLoadingState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      variant="table"
    />;
  }

  // Error state
  if (error) {
    return <WidgetErrorState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      error={error}
      title="Error loading table data"
    />;
  }

  // No data state
  if (!rows.length && !groupedRows?.length) {
    return <WidgetEmptyState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      title="No data available"
      message="Configure data source and columns"
    />;
  }

  const cellPadding = getCellPadding();
  const textSize = getTextSize();
  const fontWeight = getFontWeight();
  
  // Colors from theme
  const textColor = styleConfig.textColor || theme.colors.foreground;
  const headerBgColor = styleConfig.headerBgColor || theme.colors.muted;
  const headerTextColor = styleConfig.headerTextColor || theme.colors.foreground;
  const borderColor = styleConfig.borderColor || theme.colors.border;
  const hoverColor = styleConfig.hoverColor || theme.colors.hover;
  
  // Header style
  const getHeaderStyle = () => {
    switch (styleConfig.headerStyle) {
      case 'gradient':
        return {
          background: theme.gradients.subtle,
          fontWeight: theme.typography.fontWeight.bold,
        };
      case 'accent':
        return {
          backgroundColor: theme.colors.accent,
          color: theme.colors.background,
          fontWeight: theme.typography.fontWeight.semibold,
        };
      case 'bold':
        return {
          backgroundColor: headerBgColor,
          fontWeight: theme.typography.fontWeight.bold,
        };
      default:
        return {
          backgroundColor: headerBgColor,
          fontWeight: theme.typography.fontWeight.semibold,
        };
    }
  };

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <PremiumWidgetContainer style={styleConfig} className="h-full w-full overflow-hidden">
        <div className="h-full overflow-auto">
          <table 
            className={cn('w-full', textSize, fontWeight)}
            style={{ 
              fontFamily: styleConfig.fontFamily || theme.typography.fontFamily,
              color: textColor 
            }}
          >
            {/* Table Header - Premium Design */}
            <thead 
              className={cn(
                stickyHeader && 'sticky top-0 z-10',
                'backdrop-blur-sm'
              )}
              style={{
                ...getHeaderStyle(),
                borderBottom: `${styleConfig.headerBorderWidth || 2}px solid ${borderColor}`,
                boxShadow: stickyHeader ? theme.shadows.subtle : 'none'
              }}
            >
              <tr>
                {columns.map((column: any) => (
                  <th
                    key={column.id}
                    className={cn(
                      'text-left uppercase tracking-wider text-xs',
                      cellPadding,
                      showRowBorders && 'border-r last:border-r-0'
                    )}
                    style={{ 
                      width: column.width ? `${column.width}px` : 'auto',
                      color: headerTextColor,
                      borderColor: borderColor
                    }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body - Grouped or Regular */}
            <tbody>
              {groupedRows && groupedRows.length > 0 ? (
                // Grouped display - Premium
                groupedRows.map((group) => (
                  <React.Fragment key={group.groupKey}>
                    {/* Group Header - Premium */}
                    <tr 
                      className="font-semibold"
                      style={{
                        backgroundColor: theme.colors.muted,
                        borderTop: `2px solid ${borderColor}`,
                      }}
                    >
                      <td colSpan={columns.length} className={cellPadding}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm uppercase tracking-wide" style={{ color: textColor }}>
                            {group.groupKey}
                          </span>
                          <Badge 
                            variant="outline" 
                            className="text-xs font-normal"
                            style={{ borderColor: borderColor }}
                          >
                            {group.rows.length} rows
                          </Badge>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Group Rows - Premium */}
                    {group.rows.map((row: NormalizedRow, rowIndex: number) => (
                      <tr
                        key={row.id || rowIndex}
                        className={cn(
                          'transition-all duration-150',
                          styleConfig.rowHoverEffect === 'lift' && 'hover:translate-x-1',
                          styleConfig.rowHoverEffect === 'glow' && 'hover:shadow-md'
                        )}
                        style={{
                          backgroundColor: zebraStripes && rowIndex % 2 === 1
                            ? `${theme.colors.muted}${Math.floor((styleConfig.zebraOpacity || 0.05) * 255).toString(16).padStart(2, '0')}`
                            : 'transparent',
                          cursor: 'default'
                        }}
                        onMouseEnter={(e) => {
                          if (styleConfig.rowHoverEffect !== 'none') {
                            e.currentTarget.style.backgroundColor = hoverColor;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = zebraStripes && rowIndex % 2 === 1
                            ? `${theme.colors.muted}${Math.floor((styleConfig.zebraOpacity || 0.05) * 255).toString(16).padStart(2, '0')}`
                            : 'transparent';
                        }}
                      >
                        {columns.map((column: any) => (
                          <td
                            key={column.id}
                            className={cn(
                              cellPadding,
                              showRowBorders && 'border-r last:border-r-0'
                            )}
                            style={{ borderColor: borderColor }}
                          >
                            {formatCellValue(row[column.id], column.format)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    
                    {/* Group Summary - Premium */}
                    {showGroupSummary && group.summary && (
                      <tr 
                        className="font-semibold"
                        style={{
                          backgroundColor: `${theme.colors.accent}10`,
                          borderBottom: `1px solid ${borderColor}`
                        }}
                      >
                        {columns.map((column: any, colIndex: number) => (
                          <td key={column.id} className={cn(cellPadding, 'text-xs')}>
                            {group.summary && group.summary[column.id] !== undefined ? (
                              <span style={{ color: theme.colors.accent }}>
                                {formatCellValue(group.summary[column.id], column.format)}
                              </span>
                            ) : (
                              colIndex === 0 ? <span className="opacity-60">Subtotal</span> : ''
                            )}
                          </td>
                        ))}
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                // Regular display - Premium
                rows.map((row: NormalizedRow, rowIndex: number) => (
                  <tr
                    key={row.id || rowIndex}
                    className={cn(
                      'transition-all duration-150',
                      styleConfig.rowHoverEffect === 'lift' && 'hover:translate-x-1',
                      styleConfig.rowHoverEffect === 'glow' && 'hover:shadow-md'
                    )}
                    style={{
                      backgroundColor: zebraStripes && rowIndex % 2 === 1
                        ? `${theme.colors.muted}${Math.floor((styleConfig.zebraOpacity || 0.05) * 255).toString(16).padStart(2, '0')}`
                        : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (styleConfig.rowHoverEffect !== 'none') {
                        e.currentTarget.style.backgroundColor = hoverColor;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = zebraStripes && rowIndex % 2 === 1
                        ? `${theme.colors.muted}${Math.floor((styleConfig.zebraOpacity || 0.05) * 255).toString(16).padStart(2, '0')}`
                        : 'transparent';
                    }}
                  >
                    {columns.map((column: any) => (
                      <td
                        key={column.id}
                        className={cn(
                          cellPadding,
                          showRowBorders && 'border-r last:border-r-0'
                        )}
                        style={{ borderColor: borderColor }}
                      >
                        {formatCellValue(row[column.id], column.format)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>

            {/* Table Footer - Statistics - Premium */}
            {showFooterStatistics && statistics && Object.keys(statistics).length > 0 && (
              <tfoot 
                className={cn(
                  'sticky bottom-0 z-10 backdrop-blur-md font-bold',
                  styleConfig.glassEffect && 'bg-opacity-90'
                )}
                style={{
                  backgroundColor: headerBgColor,
                  borderTop: `${styleConfig.headerBorderWidth || 2}px solid ${borderColor}`,
                  boxShadow: theme.shadows.medium
                }}
              >
                <tr>
                  {columns.map((column: any, index: number) => {
                    const stat = statistics[column.id];
                    const func = column.statisticFunction || 'sum';
                    
                    return (
                      <td 
                        key={column.id} 
                        className={cn(
                          cellPadding, 
                          'text-xs',
                          showRowBorders && 'border-r last:border-r-0'
                        )}
                        style={{ borderColor: borderColor }}
                      >
                        {stat && stat[func as keyof typeof stat] !== undefined ? (
                          <div className="flex flex-col gap-0.5">
                            <span 
                              className="font-bold tabular-nums"
                              style={{ color: theme.colors.accent }}
                            >
                              {formatCellValue(stat[func as keyof typeof stat], column.format)}
                            </span>
                            <span 
                              className="text-[10px] uppercase tracking-wider opacity-60"
                              style={{ color: textColor }}
                            >
                              {func}
                            </span>
                          </div>
                        ) : (
                          index === 0 ? (
                            <span className="uppercase tracking-wide opacity-75" style={{ color: textColor }}>
                              Total
                            </span>
                          ) : ''
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </PremiumWidgetContainer>
    </BaseWidget>
  );
};
