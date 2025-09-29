"use client";

import React, { useMemo, useCallback } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { useTableRows } from "@/hooks/useDatabaseTables";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface TableWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

export const TableWidgetRenderer: React.FC<TableWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false
}) => {
  // Extract table configuration from widget config
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
  const refreshSettings = config?.refresh || { enabled: false, interval: 30000 };

  // Fetch real data from API
  const validFilters = filters.filter((f: any) => f.column && f.operator && f.value !== undefined);
  const filterString = validFilters.map((f: any) => `${f.column}${f.operator}${f.value}`).join(',');
  
  console.log('🔍 TableWidgetRenderer - Data construction:', {
    tenantId: widget.tenantId,
    databaseId,
    tableId: Number(tableId),
    filters,
    validFilters,
    filterString,
    pageSize,
    sortBy: sort[0]?.column || 'id',
    sortOrder: sort[0]?.direction || 'asc',
    columns
  });

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

  console.log('📡 TableWidgetRenderer - API Response:', {
    rawData,
    isLoading,
    error,
    hasData: !!rawData?.data,
    dataLength: rawData?.data?.length || 0
  });

  // Auto-refresh functionality
  useAutoRefresh({
    enabled: refreshSettings.enabled,
    interval: refreshSettings.interval,
    onRefresh: refetch
  });

  // Process data to show only selected columns
  const processedData = useMemo(() => {
    if (!rawData?.data || !columns.length) {
      return [];
    }

    return rawData.data.map((row: any) => {
      const processedRow: any = { id: row.id };
      
      // Convert cells array to object for easier access
      const rowData: any = {};
      if (row.cells && Array.isArray(row.cells)) {
        row.cells.forEach((cell: any) => {
          if (cell.column && cell.column.name) {
            rowData[cell.column.name] = cell.value;
          }
        });
      }
      
      columns.forEach((col: any) => {
        if (rowData[col.id] !== undefined) {
          processedRow[col.id] = rowData[col.id];
        }
      });
      return processedRow;
    });
  }, [rawData, columns]);

  // Format cell value based on column type
  const formatCellValue = (value: any, format: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'currency':
        return typeof value === 'number' ? `$${value.toLocaleString()}` : value;
      case 'percentage':
        return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : value;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'badge':
        return (
          <Badge variant={value ? "default" : "secondary"} className="text-xs">
            {String(value)}
          </Badge>
        );
      case 'link':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
            {String(value)}
          </a>
        );
      default:
        return String(value);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <div className="h-full w-full p-4">
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </BaseWidget>
    );
  }

  // Error state
  if (error) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <div className="h-full w-full p-4">
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-red-500">
              <p className="text-sm">Error loading table data</p>
              <p className="text-xs text-muted-foreground mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </BaseWidget>
    );
  }

  // No data state
  if (!processedData.length) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <div className="h-full w-full p-4">
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-sm">No data available</p>
              <p className="text-xs mt-1">Select a table and configure columns to display data</p>
            </div>
          </div>
        </div>
      </BaseWidget>
    );
  }

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="h-full w-full overflow-hidden">
        <div className="h-full overflow-auto">
          <table className={`w-full ${density === 'compact' ? 'text-xs' : density === 'expanded' ? 'text-sm' : 'text-xs'} ${zebraStripes ? 'even:bg-muted/30' : ''}`}>
            <thead className="sticky top-0 bg-background border-b">
              <tr>
                {columns.map((column: any) => (
                  <th
                    key={column.id}
                    className={`text-left font-medium text-muted-foreground px-3 py-2 ${showRowBorders ? 'border-r border-border' : ''}`}
                  >
                    {column.label || column.id}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.map((row: any, index: number) => (
                <tr
                  key={row.id || index}
                  className={`hover:bg-muted/20 transition-colors ${showRowBorders ? 'border-b border-border' : ''}`}
                >
                  {columns.map((column: any) => (
                    <td
                      key={column.id}
                      className={`px-3 py-2 ${showRowBorders ? 'border-r border-border' : ''} ${density === 'compact' ? 'py-1' : density === 'expanded' ? 'py-3' : 'py-2'}`}
                    >
                      {formatCellValue(row[column.id], column.format)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </BaseWidget>
  );
};
