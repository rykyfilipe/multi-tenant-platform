/** @format */

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { FilterConfig, ColumnType, FilterOperator } from "@/types/filtering";
import { Column } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Layers, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Import sub-components
import { FilterHeader, FilterMode } from "./FilterHeader";
import { FilterSummary } from "./FilterSummary";
import { GlobalSearch } from "./GlobalSearch";
import { FilterItem } from "./FilterItem";
import { FilterGroup, FilterGroupData } from "./FilterGroup";
import { FilterFooter } from "./FilterFooter";

// Import utilities
import {
	getPresets,
	savePreset,
	deletePreset,
	getFilterHistory,
	addToHistory,
	exportPresets,
	importPresets,
	FilterPreset,
	FilterHistory,
} from "./utils/filterPresets";
import { validateFilters } from "./utils/filterValidation";

interface FilterPanelProps {
	/** Current active filters */
	filters: FilterConfig[];
	/** Available columns for filtering */
	columns: Column[];
	/** Global search value */
	globalSearch: string;
	/** Callback when filters are applied */
	onApplyFilters: (filters: FilterConfig[], globalSearch: string) => void;
	/** Callback when filters are updated (without applying) */
	onFiltersChange?: (filters: FilterConfig[]) => void;
	/** Callback when global search changes */
	onGlobalSearchChange?: (search: string) => void;
	/** Reference data for reference columns */
	referenceData?: Record<number, any[]>;
	/** Table ID for preset storage */
	tableId: string;
	/** Current filtered row count */
	filteredCount?: number;
	/** Total row count */
	totalCount?: number;
	/** Whether filters are being applied */
	isFiltering?: boolean;
	/** Panel display mode */
	mode?: "sidebar" | "inline";
	/** Custom className */
	className?: string;
	/** Callback when panel is closed (sidebar mode) */
	onClose?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
	filters: initialFilters,
	columns,
	globalSearch: initialGlobalSearch,
	onApplyFilters,
	onFiltersChange,
	onGlobalSearchChange,
	referenceData = {},
	tableId,
	filteredCount = 0,
	totalCount = 0,
	isFiltering = false,
	mode = "sidebar",
	className,
	onClose,
}) => {
	// --- STATE MANAGEMENT ---
	const [filterMode, setFilterMode] = useState<FilterMode>("simple");
	const [localFilters, setLocalFilters] = useState<FilterConfig[]>(initialFilters);
	const [localGlobalSearch, setLocalGlobalSearch] = useState(initialGlobalSearch);
	const [filterGroups, setFilterGroups] = useState<FilterGroupData[]>([]);
	const [presets, setPresets] = useState<FilterPreset[]>([]);
	const [recentFilters, setRecentFilters] = useState<FilterHistory[]>([]);
	const [hasChanges, setHasChanges] = useState(false);

	// Load presets and history on mount
	useEffect(() => {
		setPresets(getPresets(tableId));
		setRecentFilters(getFilterHistory(tableId));
	}, [tableId]);

	// Sync local state with props
	useEffect(() => {
		setLocalFilters(initialFilters);
	}, [initialFilters]);

	useEffect(() => {
		setLocalGlobalSearch(initialGlobalSearch);
	}, [initialGlobalSearch]);

	// Initialize filter groups from flat filters (for advanced mode)
	useEffect(() => {
		if (filterMode === "advanced" && localFilters.length > 0 && filterGroups.length === 0) {
			// Create a single default group with all filters
			setFilterGroups([
				{
					id: `group_${Date.now()}`,
					logicOperator: "AND",
					filters: localFilters,
					expanded: true,
				},
			]);
		}
	}, [filterMode, localFilters, filterGroups.length]);

	// Track changes
	useEffect(() => {
		const filtersChanged =
			JSON.stringify(localFilters) !== JSON.stringify(initialFilters);
		const searchChanged = localGlobalSearch !== initialGlobalSearch;
		setHasChanges(filtersChanged || searchChanged);
	}, [localFilters, localGlobalSearch, initialFilters, initialGlobalSearch]);

	// --- FILTER OPERATIONS ---

	const addFilter = useCallback(() => {
		if (columns.length === 0) return;

		const firstColumn = columns[0];
		const newFilter: FilterConfig = {
			id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			columnId: firstColumn.id,
			columnName: firstColumn.name,
			columnType: firstColumn.type as ColumnType,
			operator: "equals",
			value: "",
		};

		setLocalFilters((prev) => [...prev, newFilter]);
		onFiltersChange?.([...localFilters, newFilter]);
	}, [columns, localFilters, onFiltersChange]);

	const updateFilter = useCallback(
		(filterId: string, updates: Partial<FilterConfig>) => {
			setLocalFilters((prev) =>
				prev.map((f) => (f.id === filterId ? { ...f, ...updates } : f))
			);
		},
		[]
	);

	const removeFilter = useCallback((filterId: string) => {
		setLocalFilters((prev) => prev.filter((f) => f.id !== filterId));
	}, []);

	const duplicateFilter = useCallback((filter: FilterConfig) => {
		const duplicated: FilterConfig = {
			...filter,
			id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		};
		setLocalFilters((prev) => [...prev, duplicated]);
	}, []);

	const clearAllFilters = useCallback(() => {
		setLocalFilters([]);
		setLocalGlobalSearch("");
		setFilterGroups([]);
		onApplyFilters([], "");
	}, [onApplyFilters]);

	// --- ADVANCED MODE: GROUP OPERATIONS ---

	const addFilterGroup = useCallback(() => {
		const newGroup: FilterGroupData = {
			id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			logicOperator: "AND",
			filters: [],
			expanded: true,
		};
		setFilterGroups((prev) => [...prev, newGroup]);
	}, []);

	const updateGroup = useCallback(
		(groupId: string, updates: Partial<FilterGroupData>) => {
			setFilterGroups((prev) =>
				prev.map((g) => (g.id === groupId ? { ...g, ...updates } : g))
			);
		},
		[]
	);

	const addFilterToGroup = useCallback(
		(groupId: string) => {
			if (columns.length === 0) return;

			const firstColumn = columns[0];
			const newFilter: FilterConfig = {
				id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				columnId: firstColumn.id,
				columnName: firstColumn.name,
				columnType: firstColumn.type as ColumnType,
				operator: "equals",
				value: "",
			};

			setFilterGroups((prev) =>
				prev.map((g) =>
					g.id === groupId ? { ...g, filters: [...g.filters, newFilter] } : g
				)
			);
		},
		[columns]
	);

	const removeFilterFromGroup = useCallback((filterId: string) => {
		setFilterGroups((prev) =>
			prev.map((g) => ({
				...g,
				filters: g.filters.filter((f) => f.id !== filterId),
			}))
		);
	}, []);

	const updateFilterInGroup = useCallback(
		(filterId: string, updates: Partial<FilterConfig>) => {
			setFilterGroups((prev) =>
				prev.map((g) => ({
					...g,
					filters: g.filters.map((f) =>
						f.id === filterId ? { ...f, ...updates } : f
					),
				}))
			);
		},
		[]
	);

	// --- PRESET OPERATIONS ---

	const handleSavePreset = useCallback(() => {
		const name = window.prompt("Enter preset name:");
		if (!name) return;

		const description = window.prompt("Enter description (optional):");

		const preset = savePreset(tableId, name, localFilters, localGlobalSearch, {
			description: description || undefined,
		});

		setPresets((prev) => [...prev, preset]);
	}, [tableId, localFilters, localGlobalSearch]);

	const handleLoadPreset = useCallback(
		(preset: FilterPreset) => {
			setLocalFilters(preset.filters);
			setLocalGlobalSearch(preset.globalSearch);
			// Auto-apply preset
			onApplyFilters(preset.filters, preset.globalSearch);
		},
		[onApplyFilters]
	);

	const handleExportPresets = useCallback(() => {
		const json = exportPresets(tableId);
		const blob = new Blob([json], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `filter-presets-${tableId}-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}, [tableId]);

	const handleImportPresets = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "application/json";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = (e) => {
				const json = e.target?.result as string;
				const count = importPresets(tableId, json);
				setPresets(getPresets(tableId));
				alert(`Imported ${count} preset(s)`);
			};
			reader.readAsText(file);
		};
		input.click();
	}, [tableId]);

	// --- HISTORY OPERATIONS ---

	const handleLoadRecent = useCallback(
		(recent: FilterHistory) => {
			setLocalFilters(recent.filters);
			setLocalGlobalSearch(recent.globalSearch);
			// Auto-apply history
			onApplyFilters(recent.filters, recent.globalSearch);
		},
		[onApplyFilters]
	);

	// --- APPLY FILTERS ---

	const handleApplyFilters = useCallback(() => {
		// Flatten groups to filters if in advanced mode
		const filtersToApply =
			filterMode === "advanced"
				? filterGroups.flatMap((g) => g.filters)
				: localFilters;

		// Validate filters
		const validation = validateFilters(filtersToApply);
		if (!validation.isValid) {
			const errorMessage = validation.errors
				.map((e) => e.message)
				.join("\n");
			alert(`Filter validation failed:\n${errorMessage}`);
			return;
		}

		// Add to history
		addToHistory(tableId, filtersToApply, localGlobalSearch, filteredCount);
		setRecentFilters(getFilterHistory(tableId));

		// Apply filters
		onApplyFilters(filtersToApply, localGlobalSearch);
		setHasChanges(false);
	}, [
		filterMode,
		filterGroups,
		localFilters,
		localGlobalSearch,
		tableId,
		filteredCount,
		onApplyFilters,
	]);

	// --- SEARCH OPERATIONS ---

	const handleGlobalSearchChange = useCallback(
		(value: string) => {
			setLocalGlobalSearch(value);
			onGlobalSearchChange?.(value);
		},
		[onGlobalSearchChange]
	);

	const handleClearGlobalSearch = useCallback(() => {
		setLocalGlobalSearch("");
		onGlobalSearchChange?.("");
	}, [onGlobalSearchChange]);

	// --- VALIDATION ---

	const canApply = useMemo(() => {
		if (filterMode === "advanced") {
			const allFilters = filterGroups.flatMap((g) => g.filters);
			return hasChanges && allFilters.length >= 0;
		}
		return hasChanges;
	}, [filterMode, filterGroups, localFilters, hasChanges]);

	// --- RENDER ---

	return (
		<div
			className={cn(
				"flex flex-col h-full bg-background",
				mode === "sidebar" && "border-l",
				className
			)}
		>
			{/* Header with sticky positioning */}
			<div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
				<div className="flex items-center justify-between mb-3">
					<h2 className="text-lg font-semibold text-foreground">Filters</h2>
					{mode === "sidebar" && onClose && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="h-8 w-8"
						>
							<X className="h-4 w-4" />
						</Button>
					)}
				</div>

				<FilterHeader
					mode={filterMode}
					onModeChange={setFilterMode}
					presets={presets}
					onLoadPreset={handleLoadPreset}
					onSavePreset={handleSavePreset}
					onExportPresets={handleExportPresets}
					onImportPresets={handleImportPresets}
				/>

				{/* Active Filters Summary */}
				<div className="mt-3">
					<FilterSummary
						filters={localFilters}
						globalSearch={localGlobalSearch}
						onRemoveFilter={removeFilter}
						onClearGlobalSearch={handleClearGlobalSearch}
					/>
				</div>
			</div>

			{/* Scrollable Content */}
			<ScrollArea className="flex-1 px-4">
				<div className="py-4 space-y-4">
					{/* Global Search */}
					<GlobalSearch
						value={localGlobalSearch}
						onChange={handleGlobalSearchChange}
						onClear={handleClearGlobalSearch}
						onSubmit={handleApplyFilters}
						matchCount={filteredCount}
					/>

					{/* Simple Mode: Flat Filter List */}
					{filterMode === "simple" && (
						<div className="space-y-3">
							{localFilters.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
									<Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
									<p className="text-sm font-medium mb-1">No filters yet</p>
									<p className="text-xs mb-4">
										Add filters to refine your data
									</p>
									<Button
										variant="outline"
										size="sm"
										onClick={addFilter}
										disabled={columns.length === 0}
									>
										<Plus className="w-4 h-4 mr-2" />
										Add First Filter
									</Button>
								</div>
							) : (
								<>
									{localFilters.map((filter) => (
										<FilterItem
											key={filter.id}
											filter={filter}
											columns={columns}
											onUpdate={updateFilter}
											onRemove={removeFilter}
											onDuplicate={duplicateFilter}
											referenceData={referenceData}
										/>
									))}
									<Button
										variant="outline"
										onClick={addFilter}
										disabled={columns.length === 0}
										className="w-full border-dashed hover:border-primary hover:bg-primary/5"
									>
										<Plus className="w-4 h-4 mr-2" />
										Add Filter
									</Button>
								</>
							)}
						</div>
					)}

					{/* Advanced Mode: Filter Groups with AND/OR Logic */}
					{filterMode === "advanced" && (
						<div className="space-y-6">
							{filterGroups.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
									<Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
									<p className="text-sm font-medium mb-1">
										No filter groups yet
									</p>
									<p className="text-xs mb-4">
										Create groups with AND/OR logic for complex filtering
									</p>
									<Button
										variant="outline"
										size="sm"
										onClick={addFilterGroup}
									>
										<Layers className="w-4 h-4 mr-2" />
										Add First Group
									</Button>
								</div>
							) : (
								<>
									{filterGroups.map((group, index) => (
										<FilterGroup
											key={group.id}
											group={group}
											columns={columns}
											onUpdateGroup={updateGroup}
											onUpdateFilter={updateFilterInGroup}
											onRemoveFilter={removeFilterFromGroup}
											onDuplicateFilter={duplicateFilter}
											onAddFilter={addFilterToGroup}
											referenceData={referenceData}
											showLogicToggle={index > 0}
										/>
									))}
									<Button
										variant="outline"
										onClick={addFilterGroup}
										className="w-full border-2 border-dashed hover:border-primary hover:bg-primary/5"
									>
										<Layers className="w-4 h-4 mr-2" />
										Add Filter Group
									</Button>
								</>
							)}
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Footer with sticky positioning */}
			<FilterFooter
				filteredCount={filteredCount}
				totalCount={totalCount}
				isFiltering={isFiltering}
				hasChanges={hasChanges}
				canApply={canApply}
				onApply={handleApplyFilters}
				onClear={clearAllFilters}
				recentFilters={recentFilters}
				onLoadRecent={handleLoadRecent}
			/>
		</div>
	);
};

