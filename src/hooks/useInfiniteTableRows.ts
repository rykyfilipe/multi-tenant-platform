/** @format */

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";

interface TableRow {
  id: number;
  cells?: any[];
  [key: string]: any;
}

interface UseInfiniteTableRowsResult {
  data: Array<{ value: string; label: string; row: any }>;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  search: (searchTerm: string) => void;
  reset: () => void;
}

const PAGE_SIZE = 50; // Load 50 items at a time

export const useInfiniteTableRows = (
  databaseId: number | null | undefined,
  tableId: number | string | null | undefined,
  tableName: string | null | undefined
): UseInfiniteTableRowsResult => {
  const { tenant, token } = useApp();
  
  const [data, setData] = useState<Array<{ value: string; label: string; row: any }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Process rows to display format
  const processRowsToOptions = useCallback((
    rowsData: any[]
  ): Array<{ value: string; label: string; row: any }> => {
    return rowsData.map((row) => {
      if (!row || !row.id) {
        return null;
      }

      // Try to find a meaningful display field
      let displayValue = `ID: ${row.id}`;
      
      if (row.cells && Array.isArray(row.cells)) {
        // Look for name, title, or description fields
        const nameCell = row.cells.find((c: any) => {
          const columnName = c?.column?.name?.toLowerCase() || "";
          return columnName.includes("name") || 
                 columnName.includes("title") || 
                 columnName.includes("description") ||
                 columnName.includes("product");
        });

        if (nameCell?.value) {
          displayValue = String(nameCell.value);
        } else {
          // Show first few non-null cell values
          const visibleCells = row.cells
            .filter((c: any) => c?.value != null && c.value !== "")
            .slice(0, 3)
            .map((c: any) => {
              const val = String(c.value);
              return val.length > 20 ? val.substring(0, 20) + "..." : val;
            });
          
          if (visibleCells.length > 0) {
            displayValue = visibleCells.join(" • ");
          }
        }
      }

      return {
        value: String(row.id),
        label: displayValue,
        row: row
      };
    }).filter(Boolean) as Array<{ value: string; label: string; row: any }>;
  }, []);

  // Fetch data with pagination and search
  const fetchData = useCallback(async (
    currentPage: number,
    search: string = "",
    append: boolean = false
  ) => {
    if (!tenant?.id || !databaseId || !tableId || !token) {
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

      const url = `/api/tenants/${tenant.id}/databases/${databaseId}/tables/${tableId}/rows?${params.toString()}`;

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

      const processedData = processRowsToOptions(rowsData);

      setData((prevData) => {
        if (append) {
          // Append new data, avoiding duplicates
          const existingIds = new Set(prevData.map(item => item.value));
          const newItems = processedData.filter(item => !existingIds.has(item.value));
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
      console.error("Error fetching table rows:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch table rows");
      if (!append) {
        setData([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, databaseId, tableId, token, processRowsToOptions]);

  // Initial load
  useEffect(() => {
    if (databaseId && tableId) {
      setData([]);
      setPage(1);
      setHasMore(true);
      fetchData(1, searchTerm, false);
    }
  }, [databaseId, tableId, searchTerm]);

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
    if (databaseId && tableId) {
      fetchData(1, "", false);
    }
  }, [databaseId, tableId, fetchData]);

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

