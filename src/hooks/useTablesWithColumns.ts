"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";

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

export interface TableWithColumns {
  id: number;
  name: string;
  description?: string;
  databaseId: number;
  databaseName: string;
  columnsCount: number;
  rowsCount: number;
  columns: Column[];
}

export const useTablesWithColumns = (tenantId: number) => {
  const { token } = useApp();
  const [data, setData] = useState<TableWithColumns[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tenantId || !token) return;

    const fetchTablesWithColumns = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Step 1: Fetch all databases and tables
        const dbResponse = await fetch(
          `/api/tenants/${tenantId}/databases?includePredefined=true`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (!dbResponse.ok) {
          throw new Error("Failed to fetch databases");
        }
        
        const databases = await dbResponse.json();
        
        // Step 2: Fetch columns for each table
        const tablesWithColumns: TableWithColumns[] = [];
        
        for (const db of databases) {
          for (const table of db.tables) {
            try {
              const colResponse = await fetch(
                `/api/tenants/${tenantId}/databases/${db.id}/tables/${table.id}/columns`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              
              if (colResponse.ok) {
                const columns = await colResponse.json();
                tablesWithColumns.push({
                  ...table,
                  databaseId: db.id,
                  databaseName: db.name,
                  columns: columns || []
                });
              } else {
                // If columns fetch fails, add table without columns
                tablesWithColumns.push({
                  ...table,
                  databaseId: db.id,
                  databaseName: db.name,
                  columns: []
                });
              }
            } catch (err) {
              console.error(`Error fetching columns for table ${table.id}:`, err);
              // Add table without columns
              tablesWithColumns.push({
                ...table,
                databaseId: db.id,
                databaseName: db.name,
                columns: []
              });
            }
          }
        }
        
        setData(tablesWithColumns);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTablesWithColumns();
  }, [tenantId, token]);

  return { data, isLoading, error };
};

