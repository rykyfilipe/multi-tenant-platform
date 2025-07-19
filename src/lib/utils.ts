/** @format */

import { Column, ColumnSchema, Table } from "@/types/database";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function colExists(columns: Column[], col: ColumnSchema) {
	return columns.find((c) => c.name === col.name);
}

// export function validateAndTransform(
// 	table: Table,
// 	newRow: Record<string, any>,
// 	rowId: any,
// 	setRowId: any,
// 	showAlert: any,
// ) {
// 	for (const col of table.columns) {
// 		const rowData = newRow[col.name];

// 		if (
// 			col.required &&
// 			(!rowData || rowData.toString().trim() === "" || rowData === undefined)
// 		) {
// 			showAlert(`Field ${col.name}' is required`, "error");
// 			return false;
// 		}

// 		if (
// 			col.autoIncrement &&
// 			(rowData === undefined || rowData.toString().trim() === "" || rowData < 0)
// 		) {
// 			newRow[col.name] = rowId;
// 			setRowId(rowId + 1);
// 		}

// 		if (!rowData || rowData.toString().trim() === "") {
// 			continue;
// 		}

// 		if (col.type === "number" && isNaN(Number(rowData))) {
// 			showAlert(`Field '${col.name}' must be a number`, "error");
// 			return false;
// 		}

// 		if (
// 			col.type === "boolean" &&
// 			!["true", "false"].includes(rowData.toString().toLowerCase())
// 		) {
// 			showAlert(`Field '${col.name}' must be true or false`, "error");
// 			return false;
// 		}

// 		if (col.type === "date" && isNaN(Date.parse(rowData))) {
// 			showAlert(`Field '${col.name}' must be a valid date`, "error");
// 			return false;
// 		}
// 	}

// 	return true;
// }
