/** @format */

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";

interface ReferenceDataItem {
  id: number;
  value: string;
  label: string;
  displayValue: string;
  rowData: any;
}

interface UseInfiniteReferenceDataResult {
  data: ReferenceDataItem[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  search: (searchTerm: string) => void;
  reset: () => void;
}

const PAGE_SIZE = 50; // Load 50 items at a time

export const useInfiniteReferenceData = (
  tableId: number | null | undefined,
  columns?: any[]
): UseInfiniteReferenceDataResult => {
  const { tenant, token } = useApp();
  const { selectedDatabase } = useDatabase();
  
  const [data, setData] = useState<ReferenceDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Process rows to reference data format
  const processRowsToReferenceData = useCallback((
    rowsData: any[],
    tableColumns?: any[]
  ): ReferenceDataItem[] => {
    const options: ReferenceDataItem[] = [];

    rowsData.forEach((row) => {
      if (row && row.id && row.cells && Array.isArray(row.cells)) {
        const displayParts: string[] = [];
        let addedColumns = 0;
        const maxColumns = 5;
        const rowData: any = {};

        // Process columns for display
        (tableColumns || columns || []).forEach((column: any) => {
          if (!column || !column.id || addedColumns >= maxColumns) return;

          const cell = row.cells?.find(
            (c: any) => c && c.columnId === column.id
          );
          
          if (cell?.value != null && cell.value.toString().trim() !== "") {
            let formattedValue = cell.value.toString().trim();
            rowData[column.name] = cell.value;

            if (formattedValue.length > 30) {
              formattedValue = formattedValue.substring(0, 30) + "...";
            }

            if (column.type === "date") {
              try {
                formattedValue = new Date(formattedValue).toLocaleDateString("ro-RO");
              } catch {
                // fallback to raw value
              }
            } else if (column.type === "boolean") {
              formattedValue = formattedValue === "true" ? "✓" : "✗";
            }

            displayParts.push(formattedValue);
            addedColumns++;
          }
        });

        const displayValue = displayParts.length
          ? displayParts.join(" • ")
          : `Row #${row.id}`;

        options.push({
          id: typeof row.id === "string" ? parseInt(row.id) : row.id,
          value: String(row.id),
          label: displayValue,
          displayValue,
          rowData,
        });
      }
    });

    return options;
  }, [columns]);

  // Fetch data with pagination and search
  const fetchData = useCallback(async (
    currentPage: number,
    search: string = "",
    append: boolean = false
  ) => {
    if (!tenant?.id || !selectedDatabase?.id || !token || !tableId) {
      return;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      // Build URL with pagination and search
      const params = new URLSearchParams({
        pageSize: PAGE_SIZE.toString(),
        page: currentPage.toString(),
        includeCells: "true",
      });

      if (search) {
        params.append("search", search);
      }

      const url = `/api/tenants/${tenant.id}/databases/${selectedDatabase.id}/tables/${tableId}/rows?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch rows: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Extract rows from response
      let rowsData: any[] = [];
      if (Array.isArray(responseData)) {
        rowsData = responseData;
      } else if (responseData && typeof responseData === "object") {
        if (Array.isArray(responseData.data)) {
          rowsData = responseData.data;
        } else if (Array.isArray(responseData.rows)) {
          rowsData = responseData.rows;
        }
      }

      const processedData = processRowsToReferenceData(rowsData);

      setData((prevData) => {
        if (append) {
          // Append new data, avoiding duplicates
          const existingIds = new Set(prevData.map(item => item.id));
          const newItems = processedData.filter(item => !existingIds.has(item.id));
          return [...prevData, ...newItems];
        } else {
          return processedData;
        }
      });

      // Check if there's more data
      const hasMoreData = rowsData.length === PAGE_SIZE;
      setHasMore(hasMoreData);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      console.error("Error fetching reference data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch reference data");
      if (!append) {
        setData([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, selectedDatabase?.id, token, tableId, processRowsToReferenceData]);

  // Initial load
  useEffect(() => {
    if (tableId) {
      setData([]);
      setPage(1);
      setHasMore(true);
      fetchData(1, searchTerm, false);
    }
  }, [tableId, searchTerm]);

  // Load more data
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, searchTerm, true);
    }
  }, [page, searchTerm, isLoading, hasMore, fetchData]);

  // Search functionality
  const search = useCallback((term: string) => {
    setSearchTerm(term);
    setPage(1);
    setData([]);
    setHasMore(true);
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    setSearchTerm("");
    setPage(1);
    setData([]);
    setHasMore(true);
    if (tableId) {
      fetchData(1, "", false);
    }
  }, [tableId, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    hasMore,
    loadMore,
    search,
    reset,
  };
};

