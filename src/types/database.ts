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
	columns: {
		create: Array<{
			name: string;
			type: string;
			primary: boolean;
			autoIncrement: boolean;
			required: boolean;
			unique: boolean;
			defaultValue: string;
		}>;
	};
	rows: { create: Array<Record<string, any>> };
}

export interface ColumnSchema {
	name: string;
	type: string;
	required: boolean;
	default?: any;
}
