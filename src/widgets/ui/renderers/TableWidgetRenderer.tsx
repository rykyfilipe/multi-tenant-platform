"use client";

import React, { useMemo, useState } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { TableWidgetProcessor } from "@/widgets/processors/TableWidgetProcessor";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TableWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const TableWidgetRenderer: React.FC<TableWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const config = widget.config as any;
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

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
    
    switch (format) {
      case "currency":
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(Number(value));
      case "percentage":
        return `${Number(value).toFixed(1)}%`;
      case "number":
        return new Intl.NumberFormat("en-US").format(Number(value));
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

  if (!config.data?.columns || config.data.columns.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No table columns configured</p>
            <p className="text-sm">Configure columns to display data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="h-full"
      style={{
        backgroundColor: config.style?.backgroundColor || "#FFFFFF",
        color: config.style?.textColor || "#000000",
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          {widget.title || "Data Table"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <Table 
            className={cn(
              "w-full",
              config.style?.stripedRows ? "[&_tbody_tr:nth-child(even)]:bg-gray-50" : "",
              config.style?.hoverEffects ? "[&_tbody_tr:hover]:bg-gray-100" : ""
            )}
          >
            {/* Header */}
            {config.settings?.showColumnHeaders !== false && (
              <TableHeader 
                style={{
                  backgroundColor: config.style?.headerBackgroundColor || "#F9FAFB",
                  color: config.style?.headerTextColor || "#374151",
                }}
              >
                <TableRow>
                  {config.settings?.showRowNumbers && (
                    <TableHead className="w-12">#</TableHead>
                  )}
                  {visibleColumns.map((column: any) => (
                    <TableHead 
                      key={column.name}
                      className={cn(
                        column.sortable && config.settings?.sorting?.enabled 
                          ? "cursor-pointer select-none hover:bg-gray-200" 
                          : "",
                        config.style?.headerFontSize === "xs" ? "text-xs" : "",
                        config.style?.headerFontSize === "sm" ? "text-sm" : "",
                        config.style?.headerFontSize === "base" ? "text-base" : "",
                        config.style?.headerFontSize === "lg" ? "text-lg" : "",
                        config.style?.headerFontSize === "xl" ? "text-xl" : "",
                        config.style?.headerFontWeight === "light" ? "font-light" : "",
                        config.style?.headerFontWeight === "normal" ? "font-normal" : "",
                        config.style?.headerFontWeight === "medium" ? "font-medium" : "",
                        config.style?.headerFontWeight === "semibold" ? "font-semibold" : "",
                        config.style?.headerFontWeight === "bold" ? "font-bold" : ""
                      )}
                      onClick={() => handleSort(column.name)}
                      style={{
                        minWidth: config.style?.columnMinWidth || 100,
                        maxWidth: config.style?.columnMaxWidth || 300,
                      }}
                    >
                      {column.label || column.name}
                      {sortColumn === column.name && (
                        <span className="ml-1">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
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
                    config.style?.alternateRowColors && rowIndex % 2 === 1 ? "bg-gray-50" : "",
                    config.style?.hoverEffects ? "hover:bg-gray-100" : ""
                  )}
                  style={{
                    backgroundColor: config.style?.alternateRowColors && rowIndex % 2 === 1 
                      ? config.style?.oddRowColor 
                      : config.style?.evenRowColor,
                  }}
                >
                  {config.settings?.showRowNumbers && (
                    <TableCell 
                      className={cn(
                        "text-center",
                        config.style?.fontSize === "xs" ? "text-xs" : "",
                        config.style?.fontSize === "sm" ? "text-sm" : "",
                        config.style?.fontSize === "base" ? "text-base" : "",
                        config.style?.fontSize === "lg" ? "text-lg" : "",
                        config.style?.fontSize === "xl" ? "text-xl" : ""
                      )}
                    >
                      {(currentPage - 1) * (config.settings?.pagination?.pageSize || 50) + rowIndex + 1}
                    </TableCell>
                  )}
                  {visibleColumns.map((column: any) => (
                    <TableCell 
                      key={column.name}
                      className={cn(
                        config.style?.fontSize === "xs" ? "text-xs" : "",
                        config.style?.fontSize === "sm" ? "text-sm" : "",
                        config.style?.fontSize === "base" ? "text-base" : "",
                        config.style?.fontSize === "lg" ? "text-lg" : "",
                        config.style?.fontSize === "xl" ? "text-xl" : "",
                        config.style?.fontWeight === "light" ? "font-light" : "",
                        config.style?.fontWeight === "normal" ? "font-normal" : "",
                        config.style?.fontWeight === "medium" ? "font-medium" : "",
                        config.style?.fontWeight === "semibold" ? "font-semibold" : "",
                        config.style?.fontWeight === "bold" ? "font-bold" : ""
                      )}
                      style={{
                        minWidth: config.style?.columnMinWidth || 100,
                        maxWidth: config.style?.columnMaxWidth || 300,
                      }}
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
                  className="border-t-2"
                  style={{
                    backgroundColor: config.style?.summaryRowStyle?.backgroundColor || "#F3F4F6",
                    color: config.style?.summaryRowStyle?.textColor || "#374151",
                  }}
                >
                  {config.settings?.showRowNumbers && (
                    <TableCell className="font-semibold">Total</TableCell>
                  )}
                  {visibleColumns.map((column: any) => (
                    <TableCell 
                      key={column.name}
                      className={cn(
                        "font-semibold",
                        config.style?.summaryRowStyle?.fontWeight === "normal" ? "font-normal" : "",
                        config.style?.summaryRowStyle?.fontWeight === "medium" ? "font-medium" : "",
                        config.style?.summaryRowStyle?.fontWeight === "semibold" ? "font-semibold" : "",
                        config.style?.summaryRowStyle?.fontWeight === "bold" ? "font-bold" : ""
                      )}
                    >
                      {processedData.summary[column.name] ? 
                        formatValue(
                          processedData.summary[column.name].sum || processedData.summary[column.name].avg || "-",
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
        {config.settings?.pagination?.enabled && (
          <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-600">
            Showing {Math.min((currentPage - 1) * (config.settings.pagination.pageSize || 50) + 1, processedData.totalRows)} to{" "}
            {Math.min(currentPage * (config.settings.pagination.pageSize || 50), processedData.totalRows)} of{" "}
            {processedData.totalRows} entries
          </div>
        )}
      </CardContent>
    </Card>
  );
};
