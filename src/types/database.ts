/** @format */

export type FieldType = "string" | "boolean" | "date" | string[];

export interface Column {
	id: number;
	name: string;
	type: string;
	required: boolean;
	primary: boolean;
	autoIncrement: boolean;
	tableId: number;

	referenceTableId?: number | null;
	referenceTable?: Table[] | null;
}

export interface RowReference {
	referencedTableId: number;
	referencedRowId: number;
}

export interface Cell {
	id: number;
	rowId: number;
	columnId: number;
	value: string | number | boolean | Date | RowReference;
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
	description: string;
	columns: Column[];
	rows: Row[];
	isPublic: boolean;
}

export interface ColumnSchema {
	name: string;
	type: "string" | "number" | "boolean" | "date" | "reference";
	required?: boolean;
	primary?: boolean;
	autoIncrement?: boolean;

	// doar dacă type === "reference"
	referenceTableId?: number;
}

export interface FieldMeta {
	key: keyof ColumnSchema;
	type: FieldType;
	required: boolean;
	label: string;
	placeholder?: string;
}

export interface RowSchema {
	createdAt: string;
	cells: CellSchema[];
}

export interface CellSchema {
	columnId: number;
	value: string | number | boolean | Date | RowReference;
}
