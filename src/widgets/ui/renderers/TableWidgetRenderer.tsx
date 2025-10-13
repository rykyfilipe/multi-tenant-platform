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
import { ChevronUp, ChevronDown, Minus, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [searchQuery, setSearchQuery] = useState("");

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
  const showFooter = config.settings?.showFooter ?? true;
  const stripedRows = alternateColors.enabled;
  const hoverEffect = hoverConfig.enabled;
  const transparentBackground = backgroundColor === "transparent" || styleConfig?.backgroundOpacity === 0;
  
  // Old style properties (for backward compatibility with helper functions)
  const cellPadding = compactMode ? 'compact' : (styleConfig.padding === 'sm' ? 'compact' : 'comfortable');
  const fontSize = styleConfig.fontSize || 'sm';
  const fontWeight = styleConfig.fontWeight || 'normal';

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

    // Transform data from cells array format to flat object format
    const transformedData = rawData.data.map((row: any) => {
      // If row already has flat structure (no cells array), return as-is
      if (!row.cells || !Array.isArray(row.cells)) {
        return row;
      }

      // Transform cells array into flat object
      const flatRow: any = {
        id: row.id,
        tableId: row.tableId,
        createdAt: row.createdAt,
      };

      // Convert each cell to a key-value pair using column name
      row.cells.forEach((cell: any) => {
        const columnName = cell.column?.name || `column_${cell.columnId}`;
        flatRow[columnName] = cell.value;
      });

      return flatRow;
    });

    return { 
      data: transformedData,
      summary: undefined, 
      totalRows: rawData.pagination?.total || transformedData.length 
    };
  }, [widget.id, config.data, config.settings?.aggregation, rawData]);

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
  }, [widget.id, processedData.data, sortColumn, sortDirection]);

  // Get visible columns for search
  const visibleColumns = config.data?.columns?.filter((col: any) => col.visible !== false) || [];

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return sortedData;
    
    const query = searchQuery.toLowerCase();
    return sortedData.filter((row: any) => {
      // Search across all visible columns
      return visibleColumns.some((col: any) => {
        const value = row[col.name];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [widget.id, sortedData, searchQuery, visibleColumns]);

  // Apply pagination
  const paginatedData = useMemo(() => {
    if (!config.settings?.pagination?.enabled) return filteredData;
    
    const pageSize = config.settings.pagination.pageSize || 50;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return filteredData.slice(startIndex, endIndex);
  }, [widget.id, filteredData, currentPage, config.settings?.pagination]);

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

  // Show "No data available" when filters return no results
  if (!isLoading && processedData.data.length === 0 && filters.length > 0) {
    return (
      <BaseWidget
        title={widget.title}
        widgetType="TABLE"
        widgetId={widget.id}
        isEditMode={isEditMode}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
      >
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No data available</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        </div>
      </BaseWidget>
    );
  }

  // No columns configured
  if (!config.data?.columns || config.data.columns.length === 0) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <PremiumWidgetContainer 
          style={styleConfig} 
          className="h-full transition-all duration-300 hover:shadow-xl"
        >
          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
            <div className="space-y-2">
              <p className="text-lg font-semibold mb-2">No table columns configured</p>
              <p className="text-sm opacity-80">Configure columns in the editor to display data</p>
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
    borderBottom: headerBorderBottom?.enabled ? `${headerBorderBottom.width}px solid ${headerBorderBottom.color}` : undefined,
  };

  const headerCellStyle: React.CSSProperties = {
    color: headerTextColor,
    fontSize: `${headerFontSize}px`,
    fontFamily: headerFontFamily,
    fontWeight: headerFontWeight,
    textAlign: headerTextAlign,
    padding: `${headerPadding?.y || 12}px ${headerPadding?.x || 16}px`,
  };

  const bodyCellStyle: React.CSSProperties = {
    color: rowTextColor,
    fontSize: `${rowFontSize}px`,
    fontFamily: rowFontFamily,
    fontWeight: rowFontWeight,
    textAlign: rowTextAlign,
    padding: `${rowPadding?.y || 12}px ${rowPadding?.x || 16}px`,
    minHeight: `${rowMinHeight}px`,
    borderRight: verticalBorder?.enabled ? `${verticalBorder?.width || 1}px solid ${verticalBorder?.color || 'rgba(0,0,0,0.05)'}` : undefined,
  };

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <PremiumWidgetContainer 
        style={styleConfig} 
        className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl relative"
      >
        {/* Search Bar - Fixed Top */}
        <div className="px-4 py-3 border-b flex items-center gap-2 bg-card/50 backdrop-blur-sm">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search across all columns..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // Reset to first page on search
            }}
            onKeyDown={(e) => {
              // Ensure backspace and all other keys work properly
              e.stopPropagation();
            }}
            className="h-8 text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="h-6 w-6 p-0"
              aria-label="Clear search"
            >
              ✕
            </Button>
          )}
        </div>

        {/* Table Container - Scrollable with padding for fixed pagination */}
        <div 
          className="overflow-auto"
          style={{
            ...tableContainerStyle,
            height: showFooter && config.settings?.pagination?.enabled 
              ? 'calc(100% - 110px)' // Search bar (48px) + Pagination (62px)
              : 'calc(100% - 48px)', // Just search bar
            overflowX: 'auto', // Enable horizontal scroll for many columns
            overflowY: 'auto', // Enable vertical scroll for many rows
          }}
        >
          <Table className="w-full min-w-max">{/* min-w-max ensures table doesn't shrink below content width */}
            {/* Header */}
            {showHeader && (
              <TableHeader 
                className={headerSticky ? "sticky top-0 z-10" : ""}
                style={headerRowStyle}
              >
                <TableRow style={{ borderBottom: 'none' }}>
                  {config.settings?.showRowNumbers && (
                    <TableHead 
                      className="w-12 text-center sticky left-0 z-20 bg-inherit"
                      style={headerCellStyle}
                    >
                      #
                    </TableHead>
                  )}
                  {visibleColumns.map((column: any, index: number) => (
                    <TableHead 
                      key={column.name}
                      className={cn(
                        column.sortable && config.settings?.sorting?.enabled 
                          ? "cursor-pointer select-none hover:opacity-80 transition-opacity" 
                          : "",
                        "min-w-[150px] whitespace-nowrap" // Min width for responsive columns
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
                    ? (alternateColors?.odd || "#F9FAFB")
                    : (alternateColors?.even || "#FFFFFF"),
                  borderBottom: rowBorderBottom?.enabled 
                    ? `${rowBorderBottom?.width || 1}px ${rowBorderBottom?.style || 'solid'} ${rowBorderBottom?.color || 'rgba(0,0,0,0.05)'}` 
                    : undefined,
                  transition: hoverEffect ? `all ${hoverConfig?.transition || 150}ms` : undefined,
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
                        className="text-center sticky left-0 z-10 bg-inherit"
                        style={{...bodyCellStyle, color: rowTextColor, opacity: 0.7}}
                      >
                        {(currentPage - 1) * (config.settings?.pagination?.pageSize || 50) + rowIndex + 1}
                      </TableCell>
                    )}
                    {visibleColumns.map((column: any) => (
                      <TableCell 
                        key={column.name}
                        className="min-w-[150px]" // Min width for responsive cells
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
                    <TableCell className={cn(getCellPaddingClass(), "sticky left-0 z-10 bg-inherit")}>
                      Total
                    </TableCell>
                  )}
                  {visibleColumns.map((column: any) => (
                    <TableCell 
                      key={column.name}
                      className={cn(getCellPaddingClass(), "min-w-[150px]")}
                    >
                      {processedData?.summary?.[column.name] ? 
                        formatValue(
                          (processedData?.summary[column.name] as any)?.sum || (processedData?.summary[column.name] as any)?.avg || "-",
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

        {/* Pagination Controls - Absolute Fixed Bottom */}
        {showFooter && config.settings?.pagination?.enabled && (() => {
          const pageSize = config.settings.pagination.pageSize || 50;
          const totalFilteredRows = filteredData.length;
          const totalPages = Math.ceil(totalFilteredRows / pageSize);
          const startEntry = Math.min((currentPage - 1) * pageSize + 1, totalFilteredRows);
          const endEntry = Math.min(currentPage * pageSize, totalFilteredRows);
          
          return (
            <div className={cn(
              "absolute bottom-0 left-0 right-0 px-4 py-3 border-t text-sm flex justify-between items-center gap-4 bg-card/95 backdrop-blur-sm z-10",
              transparentBackground && "bg-transparent backdrop-blur-sm"
            )}>
              {/* Info Text */}
              <span className="text-muted-foreground whitespace-nowrap">
                Showing {startEntry} to {endEntry} of {totalFilteredRows} entries
                {searchQuery && totalFilteredRows < processedData.totalRows && (
                  <span className="text-xs ml-1">(filtered from {processedData.totalRows})</span>
                )}
              </span>

              {/* Pagination Buttons */}
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </PremiumWidgetContainer>
    </BaseWidget>
  );
};
