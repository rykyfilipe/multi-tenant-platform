/** @format */

export interface Database {
	id: number;
	name: string;
	tenantId: number;
	createdAt: string;
	updatedAt: string;
	tables?: Table[];
}

export interface Table {
	id: number;
	name: string;
	databaseId: number;
	description: string;
	isPredefined?: boolean;
	predefinedType?: string;
	isProtected?: boolean;
	protectedType?: string;
	columns?: Column[];
	rows?: Row[];
	columnsCount?: number; // For display purposes
	rowsCount?: number; // For display purposes
	createdAt?: string;
	updatedAt?: string;
}

export interface Column {
	id: number;
	name: string;
	type: string;
	semanticType?: string; // What this column represents (product_name, product_price, etc.)
	required: boolean;
	primary: boolean;
	tableId: number;
	referenceTableId?: number;
	isPredefined?: boolean;
	isLocked?: boolean;
	customOptions?: string[]; // Opțiuni pentru tipul customArray
	order: number; // Ordinea coloanei în tabel
	createdAt?: string;
	updatedAt?: string;
}

export interface Row {
	id: number | string; // Support both number and string for optimistic rows
	tableId: number;
	createdAt: string;
	cells?: Cell[];
	isOptimistic?: boolean; // Flag to identify optimistic rows
	isLocalOnly?: boolean; // Flag to identify local-only rows (not saved to server)
	isPending?: boolean; // Flag to show it's pending save
}

export interface Cell {
	id: number | string; // Support both number and string for local cells
	rowId: number | string; // Support both number and string for local cells
	columnId: number;
	value: any;
	column?: Column | null; // Optional column reference for local cells
}

export interface CellSchema {
	columnId: number;
	value?: any;
}

export interface CreateDatabaseRequest {
	name: string;
}

export interface CreateTableRequest {
	name: string;
	description: string;
	columns: CreateColumnRequest[];
}

export interface CreateColumnRequest {
	name: string;
	type: string;
	semanticType?: string; // What this column represents (product_name, product_price, etc.)
	required?: boolean;
	primary?: boolean;
	referenceTableId?: number;
	customOptions?: string[]; // Opțiuni pentru tipul customArray
	order?: number;
}
