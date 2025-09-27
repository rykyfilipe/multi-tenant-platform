"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export interface Database {
  id: number;
  name: string;
  tenantId: number;
  tables: Table[];
  createdAt: string;
}

export interface Table {
  id: number;
  name: string;
  description?: string;
  databaseId: number;
  columnsCount: number;
  rowsCount: number;
}

export interface Column {
  id: number;
  name: string;
  type: "string" | "text" | "boolean" | "number" | "date" | "reference" | "customArray";
  description?: string;
  semanticType?: string;
  required: boolean;
  primary: boolean;
  unique: boolean;
  autoIncrement: boolean;
  referenceTableId?: number;
  customOptions?: string[];
  defaultValue?: string;
  order: number;
  tableId: number;
}

export interface TableRow {
  id: number;
  [key: string]: any;
}

// Hook pentru a obține toate bazele de date și tabelele
export const useDatabaseTables = (tenantId: number) => {
  return useQuery({
    queryKey: ["databases", tenantId],
    queryFn: async (): Promise<Database[]> => {
      const response = await fetch(`/api/tenants/${tenantId}/databases`);
      if (!response.ok) {
        throw new Error("Failed to fetch databases");
      }
      return response.json();
    },
    enabled: !!tenantId,
  });
};

// Hook pentru a obține coloanele unei tabele
export const useTableColumns = (tenantId: number, databaseId: number, tableId: number) => {
  return useQuery({
    queryKey: ["columns", tenantId, databaseId, tableId],
    queryFn: async (): Promise<Column[]> => {
      const response = await fetch(
        `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/columns`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch columns");
      }
      return response.json();
    },
    enabled: !!(tenantId && databaseId && tableId),
  });
};

// Hook pentru a obține rândurile unei tabele
export const useTableRows = (
  tenantId: number,
  databaseId: number,
  tableId: number,
  options?: {
    page?: number;
    pageSize?: number;
    search?: string;
    filters?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) => {
  const queryParams = new URLSearchParams();
  if (options?.page) queryParams.set("page", options.page.toString());
  if (options?.pageSize) queryParams.set("pageSize", options.pageSize.toString());
  if (options?.search) queryParams.set("search", options.search);
  if (options?.filters) queryParams.set("filters", options.filters);
  if (options?.sortBy) queryParams.set("sortBy", options.sortBy);
  if (options?.sortOrder) queryParams.set("sortOrder", options.sortOrder);

  return useQuery({
    queryKey: ["rows", tenantId, databaseId, tableId, options],
    queryFn: async () => {
      const response = await fetch(
        `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows?${queryParams}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch rows");
      }
      return response.json();
    },
    enabled: !!(tenantId && databaseId && tableId),
  });
};

// Hook pentru a obține datele procesate pentru widget-uri
export const useWidgetData = (
  tenantId: number,
  databaseId: number,
  tableId: number,
  columnMappings: Record<string, string>,
  filters: Array<{ column: string; operator: string; value: any }> = []
) => {
  return useQuery({
    queryKey: ["widgetData", tenantId, databaseId, tableId, columnMappings, filters],
    queryFn: async () => {
      const response = await fetch(
        `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows?pageSize=1000`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch widget data");
      }
      const data = await response.json();
      
      // Procesează datele conform mapping-ului
      const processedData = data.data?.map((row: any) => {
        const processedRow: any = {};
        Object.entries(columnMappings).forEach(([widgetField, dbColumn]) => {
          if (dbColumn && row[dbColumn] !== undefined) {
            processedRow[widgetField] = row[dbColumn];
          }
        });
        return processedRow;
      }) || [];
      
      return processedData;
    },
    enabled: !!(tenantId && databaseId && tableId && Object.keys(columnMappings).length > 0),
  });
};
