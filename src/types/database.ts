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
	isModuleTable?: boolean; // Flag to identify module tables
	moduleType?: string; // Type of module (e.g., 'billing')
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
	description?: string; // Column description
	required: boolean;
	unique?: boolean; // Unique constraint
	tableId: number;
	referenceTableId?: number;
	isPredefined?: boolean;
	isLocked?: boolean;
	isModuleColumn?: boolean; // Flag to identify module columns
	customOptions?: string[]; // Opțiuni pentru tipul customArray
	defaultValue?: string; // Default value for the column
	order: number; // Ordinea coloanei în tabel
	// New useful properties
	indexed?: boolean; // Database index for faster queries
	searchable?: boolean; // Include in global search
	hidden?: boolean; // Hide from default views
	readOnly?: boolean; // Prevent editing in UI
	validation?: string; // Custom validation rules (regex or expression)
	placeholder?: string; // UI placeholder text
	helpText?: string; // Help tooltip text
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
	description?: string; // Column description
	required?: boolean;
	primary?: boolean;
	unique?: boolean; // Unique constraint
	referenceTableId?: number;
	customOptions?: string[]; // Opțiuni pentru tipul customArray
	defaultValue?: string; // Default value for the column
	order?: number;
}
