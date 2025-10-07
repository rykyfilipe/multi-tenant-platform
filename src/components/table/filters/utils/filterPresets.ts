/** @format */

import { FilterConfig } from "@/types/filtering";

export interface FilterPreset {
	id: string;
	name: string;
	description?: string;
	filters: FilterConfig[];
	globalSearch: string;
	createdAt: Date;
	updatedAt: Date;
	isShared: boolean;
	icon?: string;
	color?: string;
}

export interface FilterHistory {
	id: string;
	description: string;
	filters: FilterConfig[];
	globalSearch: string;
	timestamp: Date;
	resultCount: number;
}

const PRESETS_STORAGE_KEY = "table_filter_presets";
const HISTORY_STORAGE_KEY = "table_filter_history";
const MAX_HISTORY_ITEMS = 10;

/**
 * Get all saved presets for a table
 */
export function getPresets(tableId: string): FilterPreset[] {
	try {
		const stored = localStorage.getItem(`${PRESETS_STORAGE_KEY}_${tableId}`);
		if (!stored) return [];
		
		const presets = JSON.parse(stored);
		// Convert date strings back to Date objects
		return presets.map((p: any) => ({
			...p,
			createdAt: new Date(p.createdAt),
			updatedAt: new Date(p.updatedAt),
		}));
	} catch (error) {
		console.error("Failed to load presets:", error);
		return [];
	}
}

/**
 * Save a new preset
 */
export function savePreset(
	tableId: string,
	name: string,
	filters: FilterConfig[],
	globalSearch: string,
	options?: Partial<FilterPreset>,
): FilterPreset {
	const preset: FilterPreset = {
		id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		name,
		filters,
		globalSearch,
		createdAt: new Date(),
		updatedAt: new Date(),
		isShared: false,
		...options,
	};

	const presets = getPresets(tableId);
	presets.push(preset);
	
	localStorage.setItem(`${PRESETS_STORAGE_KEY}_${tableId}`, JSON.stringify(presets));
	
	return preset;
}

/**
 * Update an existing preset
 */
export function updatePreset(
	tableId: string,
	presetId: string,
	updates: Partial<FilterPreset>,
): FilterPreset | null {
	const presets = getPresets(tableId);
	const index = presets.findIndex((p) => p.id === presetId);
	
	if (index === -1) return null;
	
	presets[index] = {
		...presets[index],
		...updates,
		updatedAt: new Date(),
	};
	
	localStorage.setItem(`${PRESETS_STORAGE_KEY}_${tableId}`, JSON.stringify(presets));
	
	return presets[index];
}

/**
 * Delete a preset
 */
export function deletePreset(tableId: string, presetId: string): boolean {
	const presets = getPresets(tableId);
	const filtered = presets.filter((p) => p.id !== presetId);
	
	if (filtered.length === presets.length) return false;
	
	localStorage.setItem(`${PRESETS_STORAGE_KEY}_${tableId}`, JSON.stringify(filtered));
	
	return true;
}

/**
 * Get filter history
 */
export function getFilterHistory(tableId: string): FilterHistory[] {
	try {
		const stored = localStorage.getItem(`${HISTORY_STORAGE_KEY}_${tableId}`);
		if (!stored) return [];
		
		const history = JSON.parse(stored);
		// Convert date strings back to Date objects
		return history.map((h: any) => ({
			...h,
			timestamp: new Date(h.timestamp),
		}));
	} catch (error) {
		console.error("Failed to load filter history:", error);
		return [];
	}
}

/**
 * Add to filter history
 */
export function addToHistory(
	tableId: string,
	filters: FilterConfig[],
	globalSearch: string,
	resultCount: number,
): void {
	if (filters.length === 0 && !globalSearch.trim()) return;

	const history = getFilterHistory(tableId);
	
	// Generate description
	const description = generateHistoryDescription(filters, globalSearch);
	
	// Check if this exact filter combination already exists in recent history
	const isDuplicate = history.some(
		(h) =>
			h.description === description &&
			Date.now() - h.timestamp.getTime() < 60000, // Within last minute
	);
	
	if (isDuplicate) return;
	
	const historyItem: FilterHistory = {
		id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		description,
		filters,
		globalSearch,
		timestamp: new Date(),
		resultCount,
	};
	
	// Add to beginning of array
	history.unshift(historyItem);
	
	// Keep only MAX_HISTORY_ITEMS
	const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
	
	localStorage.setItem(`${HISTORY_STORAGE_KEY}_${tableId}`, JSON.stringify(trimmed));
}

/**
 * Clear filter history
 */
export function clearHistory(tableId: string): void {
	localStorage.removeItem(`${HISTORY_STORAGE_KEY}_${tableId}`);
}

/**
 * Generate a human-readable description of filters
 */
function generateHistoryDescription(
	filters: FilterConfig[],
	globalSearch: string,
): string {
	const parts: string[] = [];
	
	if (globalSearch.trim()) {
		parts.push(`Search: "${globalSearch}"`);
	}
	
	if (filters.length > 0) {
		const filterDescriptions = filters
			.slice(0, 2)
			.map((f) => `${f.columnName} ${f.operator} ${f.value || ""}`);
		
		parts.push(...filterDescriptions);
		
		if (filters.length > 2) {
			parts.push(`+${filters.length - 2} more`);
		}
	}
	
	return parts.join(" • ") || "No filters";
}

/**
 * Export presets to JSON
 */
export function exportPresets(tableId: string): string {
	const presets = getPresets(tableId);
	return JSON.stringify(presets, null, 2);
}

/**
 * Import presets from JSON
 */
export function importPresets(tableId: string, json: string): number {
	try {
		const imported = JSON.parse(json) as FilterPreset[];
		const existing = getPresets(tableId);
		
		// Add imported presets with new IDs to avoid conflicts
		const newPresets = imported.map((p) => ({
			...p,
			id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			createdAt: new Date(),
			updatedAt: new Date(),
		}));
		
		const combined = [...existing, ...newPresets];
		localStorage.setItem(`${PRESETS_STORAGE_KEY}_${tableId}`, JSON.stringify(combined));
		
		return newPresets.length;
	} catch (error) {
		console.error("Failed to import presets:", error);
		return 0;
	}
}

