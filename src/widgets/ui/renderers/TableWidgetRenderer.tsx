"use client";

import React, { useMemo, useState } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { PremiumWidgetContainer } from "../components/PremiumWidgetContainer";
import { TableWidgetProcessor } from "@/widgets/processors/TableWidgetProcessor";
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
  const style = config?.style || {};
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Table-specific premium styling
  const transparentBackground = style.transparentBackground || false;
  const showBorders = style.showBorders !== false;
  const showHeader = style.showHeader !== false;
  const showFooter = style.showFooter !== false;
  const stripedRows = style.stripedRows || false;
  const hoverEffect = style.hoverEffect !== false;
  const headerStyle = style.headerStyle || 'solid'; // solid, transparent, gradient
  const cellPadding = style.cellPadding || 'normal'; // compact, normal, comfortable
  const fontSize = style.fontSize || 'sm'; // xs, sm, base, lg
  const fontWeight = style.fontWeight || 'normal';
  const borderColor = style.borderColor || 'border';
  const headerBg = style.headerBg || 'muted';
  const headerTextColor = style.headerTextColor || 'foreground';
  const rowTextColor = style.rowTextColor || 'foreground';
  const alternateRowBg = style.alternateRowBg || 'muted/50';

  // Mock data for demonstration
  const mockData = useMemo(() => {
    return [
      {
        cells: [
          { column: { name: "region" }, value: "North" },
          { column: { name: "sales" }, value: 125000 },
          { column: { name: "profit" }, value: 25000 },
          { column: { name: "orders" }, value: 150 },
        ]
      },
      {
        cells: [
          { column: { name: "region" }, value: "South" },
          { column: { name: "sales" }, value: 98000 },
          { column: { name: "profit" }, value: 18000 },
          { column: { name: "orders" }, value: 120 },
        ]
      },
      {
        cells: [
          { column: { name: "region" }, value: "East" },
          { column: { name: "sales" }, value: 156000 },
          { column: { name: "profit" }, value: 32000 },
          { column: { name: "orders" }, value: 180 },
        ]
      },
      {
        cells: [
          { column: { name: "region" }, value: "West" },
          { column: { name: "sales" }, value: 89000 },
          { column: { name: "profit" }, value: 15000 },
          { column: { name: "orders" }, value: 110 },
        ]
      },
    ];
  }, []);

  // Process data using TableWidgetProcessor
  const processedData = useMemo(() => {
    if (!config.data?.columns || config.data.columns.length === 0) {
      return { data: [], summary: undefined, totalRows: 0 };
    }

    const tableConfig = {
      dataSource: {
        databaseId: config.data.databaseId || 0,
        tableId: config.data.tableId || "",
      },
      aggregation: config.settings?.aggregation || {
        enabled: false,
        columns: [],
        showSummaryRow: false,
        showGroupTotals: false,
      },
      filters: config.data.filters || [],
    };

    return TableWidgetProcessor.process(mockData, tableConfig);
  }, [config.data, config.settings?.aggregation, mockData]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortColumn) return processedData.data;
    
    return TableWidgetProcessor.applySorting(
      processedData.data,
      sortColumn,
      sortDirection
    );
  }, [processedData.data, sortColumn, sortDirection]);

  // Apply pagination
  const paginatedData = useMemo(() => {
    if (!config.settings?.pagination?.enabled) return sortedData;
    
    return TableWidgetProcessor.applyPagination(
      sortedData,
      currentPage,
      config.settings.pagination.pageSize || 50
    );
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

  if (!config.data?.columns || config.data.columns.length === 0) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <PremiumWidgetContainer style={style} className="h-full">
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

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <PremiumWidgetContainer 
        style={style} 
        className={cn(
          "h-full overflow-hidden",
          transparentBackground && "bg-transparent backdrop-blur-none"
        )}
      >
        <div className={cn(
          "h-full overflow-auto rounded-lg",
          transparentBackground ? "bg-transparent" : ""
        )}>
          <Table 
            className={cn(
              "w-full",
              getFontSizeClass(),
              getFontWeightClass(),
              !showBorders && "border-0"
            )}
          >
            {/* Header */}
            {showHeader && (
              <TableHeader 
                className={cn(
                  "sticky top-0 z-10",
                  headerStyle === 'transparent' && "bg-transparent backdrop-blur-sm",
                  headerStyle === 'solid' && `bg-${headerBg}`,
                  headerStyle === 'gradient' && "bg-gradient-to-r from-primary/10 to-primary/5"
                )}
              >
                <TableRow className={!showBorders ? "border-0" : ""}>
                  {config.settings?.showRowNumbers && (
                    <TableHead className={cn(
                      getCellPaddingClass(),
                      "w-12 text-center font-semibold",
                      `text-${headerTextColor}`
                    )}>
                      #
                    </TableHead>
                  )}
                  {visibleColumns.map((column: any) => (
                    <TableHead 
                      key={column.name}
                      className={cn(
                        getCellPaddingClass(),
                        "font-semibold",
                        `text-${headerTextColor}`,
                        column.sortable && config.settings?.sorting?.enabled 
                          ? "cursor-pointer select-none hover:bg-accent/50 transition-colors" 
                          : ""
                      )}
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
              {paginatedData.map((row: any, rowIndex: number) => (
                <TableRow 
                  key={rowIndex}
                  className={cn(
                    stripedRows && rowIndex % 2 === 1 ? `bg-${alternateRowBg}` : "",
                    hoverEffect ? "hover:bg-accent/30 transition-colors" : "",
                    !showBorders && "border-0",
                    transparentBackground && "bg-transparent"
                  )}
                >
                  {config.settings?.showRowNumbers && (
                    <TableCell 
                      className={cn(
                        getCellPaddingClass(),
                        "text-center text-muted-foreground"
                      )}
                    >
                      {(currentPage - 1) * (config.settings?.pagination?.pageSize || 50) + rowIndex + 1}
                    </TableCell>
                  )}
                  {visibleColumns.map((column: any) => (
                    <TableCell 
                      key={column.name}
                      className={cn(
                        getCellPaddingClass(),
                        `text-${rowTextColor}`
                      )}
                    >
                      {formatValue(row[column.name], column.format)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
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
