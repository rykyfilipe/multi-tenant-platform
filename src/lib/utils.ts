/** @format */

import { Column, CreateColumnRequest, Table } from "@/types/database";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function colExists(columns: Column[], col: CreateColumnRequest) {
	return columns.find((c) => c.name === col.name);
}

export function formatFileSize(bytes?: number): string {
	if (!bytes) return "0 B";
	
	const sizes = ["B", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	
	if (i === 0) return `${bytes} ${sizes[i]}`;
	return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatNumber(num?: number): string {
	if (!num) return "0";
	return new Intl.NumberFormat().format(num);
}
