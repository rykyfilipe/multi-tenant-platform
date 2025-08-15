/** @format */

import { Column } from "./database";

// types/permissions.ts
export interface TablePermission {
	id: number;
	userId: number;
	tableId: number;
	tenantId: number;
	canRead: boolean;
	canEdit: boolean;
	canDelete: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ColumnPermission {
	id: number;
	userId: number;
	tableId: number;
	tenantId: number;
	columnId: number;
	canRead: boolean;
	canEdit: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Permissions {
	tablePermissions: TablePermission[];
	columnsPermissions: ColumnPermission[];
}

export interface TableInfo {
	id: number;
	name: string;
	description?: string;
	columns?: Column[];
	database?: {
		id: number;
		name: string;
		tenantId: number;
		createdAt?: string;
		updatedAt?: string;
	};
	// Adăugăm câmpuri suplimentare care pot fi returnate de API
	createdAt?: string;
	updatedAt?: string;
	databaseId?: number;
}

export type PermissionVariant = "read" | "edit" | "delete" | "default";

export interface PermissionToggleProps {
	enabled: boolean;
	onChange: (value: boolean) => void;
	label: string;
	variant?: PermissionVariant;
}

export interface TablePermissionCardProps {
	table: TableInfo;
	tablePermission: TablePermission | undefined;
	columnPermissions: ColumnPermission[];
	onUpdateTablePermission: (
		tableId: number,
		field: keyof Pick<TablePermission, "canRead" | "canEdit" | "canDelete">,
		value: boolean,
	) => void;
	onUpdateColumnPermission: (
		tableId: number,
		columnId: number,
		field: keyof Pick<ColumnPermission, "canRead" | "canEdit">,
		value: boolean,
	) => void;
}
