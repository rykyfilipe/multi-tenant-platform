/** @format */

export interface User {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	role: Role;
	password: string;
}

export enum Role {
	VIEWER = "VIEWER",
	EDITOR = "EDITOR",
}

export interface UserSchema {
	firstName: string;
	lastName: string;
	email: string;
	role: Role;
	password: string;
}

export interface TablePermission {
	id: number;
	userId: number;
	tableId: number;
	tenantId: number;

	canRead: boolean;
	canEdit: boolean;
	canDelete: boolean;

	createdAt: Date;
	updatedAt: Date;
}
export interface ColumnPermission {
	id: number;
	userId: number;
	tableId: number;
	tenantId: number;

	columnName: string;

	canRead: boolean;
	canEdit: boolean;

	createdAt: Date;
	updatedAt: Date;
}

export interface Permissions {
	tablePermissions: TablePermission[] | [];
	columnsPermissions: ColumnPermission[] | [];
}
