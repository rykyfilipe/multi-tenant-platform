"use client";

import { useState, useEffect } from "react";

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
  const [data, setData] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/tenants/${tenantId}/databases?includePredefined=true`);
        if (!response.ok) {
          throw new Error("Failed to fetch databases");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tenantId]);

  return { data, isLoading, error };
};

// Hook pentru a obține coloanele unei tabele
export const useTableColumns = (tenantId: number, databaseId: number, tableId: number) => {
  const [data, setData] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !databaseId || !tableId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/columns`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch columns");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tenantId, databaseId, tableId]);

  return { data, isLoading, error };
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
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!tenantId || !databaseId || !tableId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (options?.page) queryParams.set("page", options.page.toString());
      if (options?.pageSize) queryParams.set("pageSize", options.pageSize.toString());
      if (options?.search) queryParams.set("search", options.search);
      if (options?.filters) queryParams.set("filters", options.filters);
      if (options?.sortBy) queryParams.set("sortBy", options.sortBy);
      if (options?.sortOrder) queryParams.set("sortOrder", options.sortOrder);

      const url = `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows?${queryParams}`;
      
      console.log('🌐 useTableRows - API Request:', {
        url,
        tenantId,
        databaseId,
        tableId,
        options,
        queryParams: queryParams.toString()
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch rows: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      
      console.log('📊 useTableRows - API Response:', {
        status: response.status,
        dataLength: result?.data?.length || 0,
        totalRows: result?.pagination?.total || 0,
        result
      });
      
      setData(result);
    } catch (err) {
      console.error('❌ useTableRows - Error:', err);
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tenantId, databaseId, tableId, options?.page, options?.pageSize, options?.search, options?.filters, options?.sortBy, options?.sortOrder]);

  return { data, isLoading, error, refetch: fetchData };
};

// Hook pentru a obține datele procesate pentru widget-uri
export const useWidgetData = (
  tenantId: number,
  databaseId: number,
  tableId: number,
  columnMappings: Record<string, string>,
  filters: Array<{ column: string; operator: string; value: any }> = []
) => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !databaseId || !tableId || Object.keys(columnMappings).length === 0) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows?pageSize=1000`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch widget data");
        }
        const result = await response.json();
        
        // Procesează datele conform mapping-ului
        const processedData = result.data?.map((row: any) => {
          const processedRow: any = {};
          Object.entries(columnMappings).forEach(([widgetField, dbColumn]) => {
            if (dbColumn && row[dbColumn] !== undefined) {
              processedRow[widgetField] = row[dbColumn];
            }
          });
          return processedRow;
        }) || [];
        
        setData(processedData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tenantId, databaseId, tableId, columnMappings, filters]);

  return { data, isLoading, error };
};
