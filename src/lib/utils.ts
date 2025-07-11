/** @format */

import { Column, ColumnSchema } from "@/types/database";
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
// 			col.unique &&
// 			table.rows.some((row) => {
// 				const storedValue = row.data[col.name];
// 				switch (col.type) {
// 					case "number":
// 						return Number(storedValue) === Number(rowData);
// 					case "boolean":
// 						return (
// 							Boolean(storedValue) === (rowData === "true" || rowData === true)
// 						);
// 					case "date":
// 						return (
// 							new Date(storedValue).toISOString() ===
// 							new Date(rowData).toISOString()
// 						);
// 					default:
// 						return storedValue === rowData;
// 				}
// 			})
// 		) {
// 			showAlert(`Field '${col.name}' must be unique`, "error");
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
// 			col.defaultValue &&
// 			(rowData === undefined || rowData.toString().trim() === "")
// 		) {
// 			newRow[col.name] = col.defaultValue;
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
