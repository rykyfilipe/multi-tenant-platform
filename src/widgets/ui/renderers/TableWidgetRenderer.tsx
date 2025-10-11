"use client";

import React, { useMemo, useState } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { PremiumWidgetContainer } from "../components/PremiumWidgetContainer";
import { useTableRows } from "@/hooks/useDatabaseTables";
import { WidgetLoadingState, WidgetErrorState } from "../components/WidgetStates";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, Minus } from "lucide-react";

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
  isEditMode = false,
}) => {
  const config = widget.config as any;
  const styleConfig = config?.style || {};
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // NEW ADVANCED TABLE STYLING
  const backgroundColor = styleConfig.backgroundColor || "#FFFFFF";
  const borderRadius = styleConfig.borderRadius ?? 8;
  const borderConfig = styleConfig.border || {};
  const showBorders = borderConfig.enabled ?? true;
  const borderWidth = borderConfig.width ?? 1;
  const borderColor = borderConfig.color || "rgba(0, 0, 0, 0.1)";
  const borderStyle = borderConfig.style || "solid";
  
  // Header styling
  const headerConfig = styleConfig.header || {};
  const headerBg = headerConfig.backgroundColor || "#F9FAFB";
  const headerTextColor = headerConfig.textColor || "#111827";
  const headerFontSize = headerConfig.fontSize ?? 14;
  const headerFontFamily = headerConfig.fontFamily || "Inter, system-ui, sans-serif";
  const headerFontWeight = headerConfig.fontWeight || "600";
  const headerTextAlign = headerConfig.textAlign || "left";
  const headerPadding = headerConfig.padding || { x: 16, y: 12 };
  const headerBorderBottom = headerConfig.borderBottom || { enabled: true, width: 2, color: "rgba(0, 0, 0, 0.1)" };
  const headerSticky = headerConfig.sticky ?? true;
  
  // Row styling
  const rowsConfig = styleConfig.rows || {};
  const rowFontSize = rowsConfig.fontSize ?? 14;
  const rowFontFamily = rowsConfig.fontFamily || "Inter, system-ui, sans-serif";
  const rowFontWeight = rowsConfig.fontWeight || "400";
  const rowTextColor = rowsConfig.textColor || "#374151";
  const rowTextAlign = rowsConfig.textAlign || "left";
  const rowPadding = rowsConfig.padding || { x: 16, y: 12 };
  const rowMinHeight = rowsConfig.minHeight ?? 48;
  const alternateColors = rowsConfig.alternateColors || { enabled: true, even: "#FFFFFF", odd: "#F9FAFB" };
  const hoverConfig = rowsConfig.hover || { enabled: true, backgroundColor: "#F3F4F6", transition: 150 };
  const rowBorderBottom = rowsConfig.borderBottom || { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.05)", style: "solid" };
  
  // Cells styling
  const cellsConfig = styleConfig.cells || {};
  const verticalBorder = cellsConfig.verticalBorder || { enabled: false, width: 1, color: "rgba(0, 0, 0, 0.05)" };
  const compactMode = cellsConfig.compact || false;
  
  // Backward compatibility
  const showHeader = config.settings?.showColumnHeaders ?? true;
  const stripedRows = alternateColors.enabled;
  const hoverEffect = hoverConfig.enabled;

  // Fetch real data from API
  const databaseId = config?.data?.databaseId;
  const tableId = config?.data?.tableId;
  const filters = config?.data?.filters || [];
  
  const validFilters = filters.filter((f: any) => f.column && f.operator && f.value !== undefined);
  const filterString = validFilters.map((f: any) => `${f.column}${f.operator}${f.value}`).join(',');
  
  const { data: rawData, isLoading, error } = useTableRows(
    widget.tenantId,
    databaseId || 0,
    Number(tableId) || 0,
    {
      pageSize: 1000,
      filters: filterString
    }
  );

  // Process data - convert raw data to table format
  const processedData = useMemo(() => {
    if (!config.data?.columns || config.data.columns.length === 0) {
      return { data: [], summary: undefined, totalRows: 0 };
    }

    if (!rawData?.data || rawData.data.length === 0) {
      return { data: [], summary: undefined, totalRows: 0 };
    }

    // Raw data is already in the format we need (array of objects with column names as keys)
    // Just return it with proper structure
    return { 
      data: rawData.data,
      summary: undefined, 
      totalRows: rawData.pagination?.total || rawData.data.length 
    };
  }, [config.data, config.settings?.aggregation, rawData]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return processedData.data;
    
    const sorted = [...processedData.data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortDirection === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
      }
    });
    
    return sorted;
  }, [processedData.data, sortColumn, sortDirection]);

  // Apply pagination
  const paginatedData = useMemo(() => {
    if (!config.settings?.pagination?.enabled) return sortedData;
    
    const pageSize = config.settings.pagination.pageSize || 50;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, config.settings?.pagination]);

  const formatValue = (value: any, format: string): string => {
    if (value === null || value === undefined) return "-";
    
    const numericValue = Number(value);
    const isInteger = Number.isInteger(numericValue);
    
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(numericValue);
      case "percentage":
        return `${numericValue.toFixed(1)}%`;
      case "number":
        if (isInteger) {
          return numericValue.toString();
        }
        return new Intl.NumberFormat("en-US").format(numericValue);
      case "date":
        return new Date(value).toLocaleDateString();
      case "boolean":
        return value ? "Yes" : "No";
      default:
        return String(value);
    }
  };

  const handleSort = (columnName: string) => {
    if (!config.settings?.sorting?.enabled) return;
    
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnName);
      setSortDirection("asc");
    }
  };

  const visibleColumns = config.data?.columns?.filter((col: any) => col.visible !== false) || [];

  const getCellPaddingClass = () => {
    switch (cellPadding) {
      case 'compact': return 'px-2 py-1';
      case 'comfortable': return 'px-6 py-4';
      default: return 'px-4 py-2';
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'xs': return 'text-xs';
      case 'sm': return 'text-sm';
      case 'base': return 'text-base';
      case 'lg': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const getFontWeightClass = () => {
    switch (fontWeight) {
      case 'light': return 'font-light';
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return 'font-normal';
    }
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

  // No columns configured
  if (!config.data?.columns || config.data.columns.length === 0) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <PremiumWidgetContainer style={styleConfig} className="h-full">
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div>
              <p className="text-lg font-medium mb-2">No table columns configured</p>
              <p className="text-sm">Configure columns in the editor to display data</p>
            </div>
          </div>
        </PremiumWidgetContainer>
      </BaseWidget>
    );
  }

  // Generate inline styles for advanced customization
  const tableContainerStyle: React.CSSProperties = {
    backgroundColor: backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: showBorders ? `${borderWidth}px ${borderStyle} ${borderColor}` : 'none',
  };

  const headerRowStyle: React.CSSProperties = {
    backgroundColor: headerBg,
    borderBottom: headerBorderBottom.enabled ? `${headerBorderBottom.width}px solid ${headerBorderBottom.color}` : undefined,
  };

  const headerCellStyle: React.CSSProperties = {
    color: headerTextColor,
    fontSize: `${headerFontSize}px`,
    fontFamily: headerFontFamily,
    fontWeight: headerFontWeight,
    textAlign: headerTextAlign,
    padding: `${headerPadding.y}px ${headerPadding.x}px`,
  };

  const bodyCellStyle: React.CSSProperties = {
    color: rowTextColor,
    fontSize: `${rowFontSize}px`,
    fontFamily: rowFontFamily,
    fontWeight: rowFontWeight,
    textAlign: rowTextAlign,
    padding: `${rowPadding.y}px ${rowPadding.x}px`,
    minHeight: `${rowMinHeight}px`,
    borderRight: verticalBorder.enabled ? `${verticalBorder.width}px solid ${verticalBorder.color}` : undefined,
  };

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <PremiumWidgetContainer 
        style={styleConfig} 
        className="h-full overflow-hidden"
      >
        <div 
          className="h-full overflow-auto"
          style={tableContainerStyle}
        >
          <Table className="w-full">
            {/* Header */}
            {showHeader && (
              <TableHeader 
                className={headerSticky ? "sticky top-0 z-10" : ""}
                style={headerRowStyle}
              >
                <TableRow style={{ borderBottom: 'none' }}>
                  {config.settings?.showRowNumbers && (
                    <TableHead 
                      className="w-12 text-center"
                      style={headerCellStyle}
                    >
                      #
                    </TableHead>
                  )}
                  {visibleColumns.map((column: any) => (
                    <TableHead 
                      key={column.name}
                      className={cn(
                        column.sortable && config.settings?.sorting?.enabled 
                          ? "cursor-pointer select-none hover:opacity-80 transition-opacity" 
                          : ""
                      )}
                      style={headerCellStyle}
                      onClick={() => column.sortable && handleSort(column.name)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label || column.name}
                        {column.sortable && sortColumn === column.name && (
                          sortDirection === "asc" 
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            )}

            {/* Body */}
            <TableBody>
              {paginatedData.map((row: any, rowIndex: number) => {
                const rowStyle: React.CSSProperties = {
                  backgroundColor: stripedRows && rowIndex % 2 === 1 
                    ? alternateColors.odd 
                    : alternateColors.even,
                  borderBottom: rowBorderBottom.enabled 
                    ? `${rowBorderBottom.width}px ${rowBorderBottom.style} ${rowBorderBottom.color}` 
                    : undefined,
                  transition: hoverEffect ? `all ${hoverConfig.transition}ms` : undefined,
                };

                return (
                  <TableRow 
                    key={rowIndex}
                    style={rowStyle}
                    className={hoverEffect ? "hover:opacity-90" : ""}
                    onMouseEnter={(e) => {
                      if (hoverEffect) {
                        e.currentTarget.style.backgroundColor = hoverConfig?.backgroundColor || "#F3F4F6";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (hoverEffect) {
                        e.currentTarget.style.backgroundColor = stripedRows && rowIndex % 2 === 1 
                          ? (alternateColors?.odd || "#F9FAFB")
                          : (alternateColors?.even || "#FFFFFF");
                      }
                    }}
                  >
                    {config.settings?.showRowNumbers && (
                      <TableCell 
                        className="text-center"
                        style={{...bodyCellStyle, color: rowTextColor, opacity: 0.7}}
                      >
                        {(currentPage - 1) * (config.settings?.pagination?.pageSize || 50) + rowIndex + 1}
                      </TableCell>
                    )}
                    {visibleColumns.map((column: any) => (
                      <TableCell 
                        key={column.name}
                        style={bodyCellStyle}
                      >
                        {formatValue(row[column.name], column.format)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>

            {/* Summary Row */}
            {config.settings?.aggregation?.showSummaryRow && processedData.summary && (
              <TableBody>
                <TableRow 
                  className={cn(
                    "border-t-2 font-semibold bg-muted/80",
                    !showBorders && "border-t-0"
                  )}
                >
                  {config.settings?.showRowNumbers && (
                    <TableCell className={getCellPaddingClass()}>
                      Total
                    </TableCell>
                  )}
                  {visibleColumns.map((column: any) => (
                    <TableCell 
                      key={column.name}
                      className={getCellPaddingClass()}
                    >
                      {processedData?.summary?.[column.name] ? 
                        formatValue(
                          processedData?.summary[column.name].sum || processedData?.summary[column.name].avg || "-",
                          column.format
                        ) : "-"
                      }
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>

        {/* Pagination Info */}
        {showFooter && config.settings?.pagination?.enabled && (
          <div className={cn(
            "px-4 py-3 border-t text-sm text-muted-foreground flex justify-between items-center",
            transparentBackground && "bg-transparent backdrop-blur-sm"
          )}>
            <span>
              Showing {Math.min((currentPage - 1) * (config.settings.pagination.pageSize || 50) + 1, processedData.totalRows)} to{" "}
              {Math.min(currentPage * (config.settings.pagination.pageSize || 50), processedData.totalRows)} of{" "}
              {processedData.totalRows} entries
            </span>
          </div>
        )}
      </PremiumWidgetContainer>
    </BaseWidget>
  );
};
