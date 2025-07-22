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
