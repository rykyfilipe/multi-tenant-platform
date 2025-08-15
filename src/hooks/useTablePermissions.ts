/** @format */

import { useMemo } from "react";
import { useApp } from "@/contexts/AppContext";
import { Column, Table } from "@/types/database";
import { TablePermission, ColumnPermission } from "@/types/permissions";

export interface TablePermissions {
  canRead: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface ColumnPermissions {
  canRead: boolean;
  canEdit: boolean;
}

export interface UseTablePermissionsResult {
  tablePermissions: TablePermissions;
  columnPermissions: Map<number, ColumnPermissions>;
  hasAnyTableAccess: boolean;
  hasAnyColumnAccess: boolean;
  canReadColumn: (columnId: number) => boolean;
  canEditColumn: (columnId: number) => boolean;
  canReadTable: () => boolean;
  canEditTable: () => boolean;
  canDeleteTable: () => boolean;
  getVisibleColumns: (columns: Column[]) => Column[];
  getEditableColumns: (columns: Column[]) => Column[];
}

export const useTablePermissions = (
  tableId: number,
  tablePermissions: TablePermission[],
  columnPermissions: ColumnPermission[]
): UseTablePermissionsResult => {
  const { user } = useApp();

  const permissions = useMemo(() => {
    // Admin-ii au toate permisiunile
    if (user?.role === "ADMIN") {
      return {
        tablePermissions: {
          canRead: true,
          canEdit: true,
          canDelete: true,
        },
        columnPermissions: new Map<number, ColumnPermissions>(),
        hasAnyTableAccess: true,
        hasAnyColumnAccess: true,
      };
    }

    // Căutăm permisiunile pentru tabel
    const tablePermission = tablePermissions.find(tp => tp.tableId === tableId);
    
    // Căutăm permisiunile pentru coloane
    const tableColumnPermissions = columnPermissions.filter(cp => cp.tableId === tableId);
    
    const columnPermissionsMap = new Map<number, ColumnPermissions>();
    tableColumnPermissions.forEach(cp => {
      columnPermissionsMap.set(cp.columnId, {
        canRead: cp.canRead,
        canEdit: cp.canEdit,
      });
    });

    return {
      tablePermissions: {
        canRead: tablePermission?.canRead || false,
        canEdit: tablePermission?.canEdit || false,
        canDelete: tablePermission?.canDelete || false,
      },
      columnPermissions: columnPermissionsMap,
      hasAnyTableAccess: !!(tablePermission?.canRead || tablePermission?.canEdit || tablePermission?.canDelete),
      hasAnyColumnAccess: tableColumnPermissions.some(cp => cp.canRead || cp.canEdit),
    };
  }, [tableId, tablePermissions, columnPermissions, user?.role]);

  const canReadColumn = (columnId: number): boolean => {
    if (user?.role === "ADMIN") return true;
    return permissions.columnPermissions.get(columnId)?.canRead || false;
  };

  const canEditColumn = (columnId: number): boolean => {
    if (user?.role === "ADMIN") return true;
    return permissions.columnPermissions.get(columnId)?.canEdit || false;
  };

  const canReadTable = (): boolean => {
    if (user?.role === "ADMIN") return true;
    return permissions.tablePermissions.canRead;
  };

  const canEditTable = (): boolean => {
    if (user?.role === "ADMIN") return true;
    return permissions.tablePermissions.canEdit;
  };

  const canDeleteTable = (): boolean => {
    if (user?.role === "ADMIN") return true;
    return permissions.tablePermissions.canDelete;
  };

  const getVisibleColumns = (columns: Column[]): Column[] => {
    if (user?.role === "ADMIN") return columns;
    return columns.filter(col => canReadColumn(col.id));
  };

  const getEditableColumns = (columns: Column[]): Column[] => {
    if (user?.role === "ADMIN") return columns;
    return columns.filter(col => canEditColumn(col.id));
  };

  return {
    ...permissions,
    canReadColumn,
    canEditColumn,
    canReadTable,
    canEditTable,
    canDeleteTable,
    getVisibleColumns,
    getEditableColumns,
  };
}; 