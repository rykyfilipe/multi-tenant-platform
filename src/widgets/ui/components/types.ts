export interface Database {
  id: number;
  name: string;
  tenantId: number;
  tables: Table[];
  createdAt: string;
}

export interface Table {
  id: number;
  name: string;
  description?: string;
  databaseId: number;
  columnsCount: number;
  rowsCount: number;
}

export interface Column {
  id: number;
  name: string;
  type: "string" | "text" | "boolean" | "number" | "date" | "reference" | "customArray";
  description?: string;
  semanticType?: string;
  required: boolean;
  primary: boolean;
  unique: boolean;
  autoIncrement: boolean;
  referenceTableId?: number;
  customOptions?: string[];
  defaultValue?: string;
  order: number;
  tableId: number;
}

export interface TableRow {
  id: number;
  [key: string]: any;
}
