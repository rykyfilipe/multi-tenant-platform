/** @format */

export interface Column {
	name: string;
	type: string;
	primary: boolean;
	autoIncrement: boolean;
	required: boolean;
	unique: boolean;
	defaultValue: string;
}

export interface Table {
	id: string;
	name: string;
	columns: Column[];
	rows: Record<string, any>[];
}

export interface ColumnSchema {
	name: string;
	type: string;
	required: boolean;
	default?: any;
}
