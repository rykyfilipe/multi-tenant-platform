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
	isPublic: boolean;
	columns?: Column[];
	rows?: Row[];
	createdAt?: string;
	updatedAt?: string;
}

export interface Column {
	id: number;
	name: string;
	type: string;
	required: boolean;
	primary: boolean;
	tableId: number;
	referenceTableId?: number;
	customOptions?: string[]; // Opțiuni pentru tipul customArray
}

export interface Row {
	id: number;
	tableId: number;
	createdAt: string;
	cells?: Cell[];
}

export interface Cell {
	id: number;
	rowId: number;
	columnId: number;
	value: any;
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
	isPublic?: boolean;
	columns: CreateColumnRequest[];
}

export interface CreateColumnRequest {
	name: string;
	type: string;
	required?: boolean;
	primary?: boolean;
	referenceTableId?: number;
	customOptions?: string[]; // Opțiuni pentru tipul customArray
}
