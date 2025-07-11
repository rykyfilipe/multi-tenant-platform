/** @format */

export interface Column {
	id: number;
	name: string;
	type: string;
	required: boolean;
	primary: boolean;
	autoIncrement: boolean;
	tableId: number;
}

export interface Cell {
	id: number;
	rowId: number;
	columnId: number;
	value: any;
}

export interface Row {
	id: number;
	tableId: number;
	createdAt: string;
	cells: Cell[];
}

export interface Table {
	id: number;
	name: string;
	databaseId: number;
	columns: Column[];
	rows: Row[];
}

export interface ColumnSchema {
	name: string;
	type: "string" | "number" | "boolean" | "date";
	required?: boolean | undefined;
	primary?: boolean | undefined;
	autoIncrement?: boolean | undefined;
}
