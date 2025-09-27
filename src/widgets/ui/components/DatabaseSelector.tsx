"use client";

import React, { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Database, Table, Column } from "./types";
import { useDatabaseTables, useTableColumns } from "@/hooks/useDatabaseTables";
import { Loader2, Database as DatabaseIcon, Table as TableIcon } from "lucide-react";

interface DatabaseSelectorProps {
  tenantId: number;
  selectedDatabaseId?: number;
  selectedTableId?: number;
  onDatabaseChange: (databaseId: number) => void;
  onTableChange: (tableId: number) => void;
  onColumnsChange: (columns: Column[]) => void;
}

export const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  tenantId,
  selectedDatabaseId,
  selectedTableId,
  onDatabaseChange,
  onTableChange,
  onColumnsChange,
}) => {
  const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const { data: databases, isLoading: databasesLoading, error: databasesError } = useDatabaseTables(tenantId);
  
  const { data: columns, isLoading: columnsLoading } = useTableColumns(
    tenantId,
    selectedDatabaseId || 0,
    selectedTableId || 0
  );

  // Update selected database when databases load
  useEffect(() => {
    if (databases && selectedDatabaseId && !selectedDatabase) {
      const db = databases.find(d => d.id === selectedDatabaseId);
      if (db) {
        setSelectedDatabase(db);
      }
    }
  }, [databases, selectedDatabaseId, selectedDatabase]);

  // Update selected table when database changes
  useEffect(() => {
    if (selectedDatabase && selectedTableId && !selectedTable) {
      const table = selectedDatabase.tables.find(t => t.id === selectedTableId);
      if (table) {
        setSelectedTable(table);
      }
    }
  }, [selectedDatabase, selectedTableId, selectedTable]);

  // Update columns when they change
  useEffect(() => {
    if (columns) {
      onColumnsChange(columns);
    }
  }, [columns, onColumnsChange]);

  const handleDatabaseSelect = (databaseId: string) => {
    const db = databases?.find(d => d.id === parseInt(databaseId));
    if (db) {
      setSelectedDatabase(db);
      setSelectedTable(null);
      onDatabaseChange(db.id);
      // Don't call onTableChange with 0, let the parent handle table reset
    }
  };

  const handleTableSelect = (tableId: string) => {
    if (!selectedDatabase) return;
    
    const table = selectedDatabase.tables.find(t => t.id === parseInt(tableId));
    if (table) {
      setSelectedTable(table);
      onTableChange(table.id);
    }
  };

  if (databasesLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading databases...</span>
      </div>
    );
  }

  if (databasesError) {
    return (
      <div className="text-sm text-red-500">
        Error loading databases: {databasesError.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Database Selection */}
      <div>
        <Label className="text-xs font-medium uppercase tracking-wide">Database</Label>
        <Select
          value={selectedDatabaseId?.toString() || ""}
          onValueChange={handleDatabaseSelect}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a database">
              {selectedDatabase && (
                <div className="flex items-center space-x-2">
                  <DatabaseIcon className="h-4 w-4" />
                  <span>{selectedDatabase.name}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {databases?.map((database) => (
              database.id && database.id.toString() ? (
                <SelectItem key={database.id} value={database.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <DatabaseIcon className="h-4 w-4" />
                    <span>{database.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({database.tables.length} tables)
                    </span>
                  </div>
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table Selection */}
      {selectedDatabase && (
        <div>
          <Label className="text-xs font-medium uppercase tracking-wide">Table</Label>
          <Select
            value={selectedTableId?.toString() || ""}
            onValueChange={handleTableSelect}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select a table">
                {selectedTable && (
                  <div className="flex items-center space-x-2">
                    <TableIcon className="h-4 w-4" />
                    <span>{selectedTable.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {selectedDatabase.tables.map((table) => (
                table.id && table.id.toString() ? (
                  <SelectItem key={table.id} value={table.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <TableIcon className="h-4 w-4" />
                      <span>{table.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({table.columnsCount} columns, {table.rowsCount} rows)
                      </span>
                    </div>
                  </SelectItem>
                ) : null
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Columns Loading */}
      {selectedTableId && columnsLoading && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading columns...</span>
        </div>
      )}

      {/* Columns Info */}
      {columns && columns.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {columns.length} columns available: {columns.map(c => c.name).join(", ")}
        </div>
      )}
    </div>
  );
};
