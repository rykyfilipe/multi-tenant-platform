/** @format */

"use client";

import { useState, KeyboardEvent, useMemo, JSX, memo, useEffect, useRef, useCallback } from "react";
import { Cell, Column, Row, Table } from "@/types/database";
import { Input } from "../../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";
import {
	USER_FRIENDLY_COLUMN_TYPES,
	COLUMN_TYPE_LABELS,
} from "@/lib/columnTypes";
import { SearchableReferenceSelect } from "./SearchableReferenceSelect";
import { MultipleReferenceSelect } from "./MultipleReferenceSelect";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { useOptimizedReferenceData } from "@/hooks/useOptimizedReferenceData";
import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "../../ui/switch";
import { AbsoluteDropdown } from "../../ui/absolute-dropdown";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom Select component with absolute positioning
const AbsoluteSelect = ({
	value,
	onValueChange,
	options,
	placeholder = "Select an option",
	className,
}: {
	value: string;
	onValueChange: (value: string) => void;
	options: string[];
	placeholder?: string;
	className?: string;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Handle keyboard navigation
	useEffect(() => {
		const handleKeyDown = (event: globalThis.KeyboardEvent) => {
			if (!isOpen) return;

			switch (event.key) {
				case "ArrowDown":
					event.preventDefault();
					setHighlightedIndex((prev) =>
						prev < options.length - 1 ? prev + 1 : 0,
					);
					break;
				case "ArrowUp":
					event.preventDefault();
					setHighlightedIndex((prev) =>
						prev > 0 ? prev - 1 : options.length - 1,
					);
					break;
				case "Enter":
					event.preventDefault();
					if (highlightedIndex >= 0 && options[highlightedIndex]) {
						onValueChange(options[highlightedIndex]);
						setIsOpen(false);
					}
					break;
				case "Escape":
					setIsOpen(false);
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, highlightedIndex, options, onValueChange]);

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
		setHighlightedIndex(-1);
	};

	const selectOption = (option: string) => {
		onValueChange(option);
		setIsOpen(false);
	};

	return (
		<div ref={containerRef} className={`relative ${className}`}>
			<button
				type="button"
				className='flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
				onClick={toggleDropdown}>
				<div className='flex-1 flex items-center'>
					{value ? (
						<span className='truncate'>
							{value}
						</span>
					) : (
						<span className='text-muted-foreground'>{placeholder}</span>
					)}
				</div>
				{isOpen ? (
					<ChevronUp className='h-4 w-4 opacity-50' />
				) : (
					<ChevronDown className='h-4 w-4 opacity-50' />
				)}
			</button>

			{isOpen && (
				<div
					ref={dropdownRef}
					className='absolute z-[9999] w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto'
					data-dropdown="true">
					{options.map((option, index) => (
						<div
							key={option}
							className={cn(
								"relative flex cursor-pointer select-none items-center rounded-sm px-3 py-3 text-base sm:text-sm outline-none transition-colors",
								index === highlightedIndex &&
									"bg-accent text-accent-foreground",
								option === value &&
									"bg-accent text-accent-foreground"
							)}
							onClick={() => selectOption(option)}
							onMouseEnter={() => setHighlightedIndex(index)}
							role='option'
							aria-selected={option === value}
							data-dropdown="true">
							<span className='truncate'>
								{option}
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

interface Props {
	columns: Column[];
	cell: Cell;
	isEditing: boolean;
	onStartEdit: () => void;
	onSave: (value: any) => void;
	onCancel: () => void;
	tables: Table[] | null;
	hasPendingChange?: boolean;
	pendingValue?: any;
}

// Funcție optimizată pentru un singur tabel - procesează doar rândurile cu celule
const createReferenceDataForTable = (table: Table) => {
	const referenceData: Record<
		number,
		{
			value: any;
			displayName: string;
			row: Row;
		}[]
	> = {};

	// Procesăm doar coloanele care au celule
	table.columns?.forEach((column) => {
		const columnCells = table.rows
			?.filter((row) => row.cells && row.cells.length > 0)
			?.map((row) => {
				const cell = row.cells?.find((c) => c.columnId === column.id);
				return {
					value: cell?.value,
					displayName: cell?.value || `Row ${row.id}`,
					row,
				};
			})
			.filter((item) => item.value != null);

		if (columnCells && columnCells.length > 0) {
			referenceData[column.id] = columnCells;
		}
	});

	return referenceData;
};

// Componenta principală EditableCell - simplificată
const EditableCell = memo(({
	columns,
	cell,
	isEditing,
	onStartEdit,
	onSave,
	onCancel,
	tables,
	hasPendingChange = false,
	pendingValue,
}: Props) => {
	// TOATE HOOKS-URILE TREBUIE SĂ FIE AICI, ÎNAINTE DE ORICE RETURN CONDIȚIONAL

	// Hook pentru traduceri
	const { t } = useLanguage();

	// State pentru valoarea celulei - folosește pending value dacă există
	const [value, setValue] = useState<any>(() => {
		// Folosește valoarea pending dacă există, altfel valoarea din celulă
		const initialValue = hasPendingChange ? pendingValue : cell?.value;

		console.log("🔍 DEBUG: EditableCell useState initialization", { 
			hasPendingChange, 
			pendingValue, 
			cellValue: cell?.value, 
			initialValue 
		});

		// Ensure reference columns always have array values
		const column = columns?.find((col) => col.id === cell?.columnId);
		if (column?.type === USER_FRIENDLY_COLUMN_TYPES.link) {
			if (Array.isArray(initialValue)) {
				return initialValue;
			}
			return initialValue ? [initialValue] : [];
		}
		return initialValue;
	});

	// Update local value when cell value changes (but not when editing)
	useEffect(() => {
		console.log("🔍 DEBUG: EditableCell useEffect triggered", { 
			isEditing, 
			cellValue: cell?.value, 
			hasPendingChange, 
			pendingValue,
			currentValue: value 
		});
		
		if (!isEditing) {
			const newValue = hasPendingChange ? pendingValue : cell?.value;
			const column = columns?.find((col) => col.id === cell?.columnId);
			
			console.log("🔍 DEBUG: Setting new value", { newValue, columnType: column?.type });
			
			if (column?.type === USER_FRIENDLY_COLUMN_TYPES.link) {
				if (Array.isArray(newValue)) {
					setValue(newValue);
				} else {
					setValue(newValue ? [newValue] : []);
				}
			} else {
				setValue(newValue);
			}
		}
	}, [cell?.value, hasPendingChange, pendingValue, isEditing, columns]);

	// Optimistic update: immediately update local state when user types
	const handleValueChange = useCallback((newValue: any) => {
		setValue(newValue);
		
		// Don't call onSave immediately for text/number - let user finish typing
		// onSave will be called on Enter key or click outside
	}, []);

	// Ref pentru container-ul de editare
	const editContainerRef = useRef<HTMLDivElement>(null);

	// State pentru referințe invalide
	const [hasInvalidReferences, setHasInvalidReferences] = useState(false);

	// State pentru tabelul de referință
	const [referenceTable, setReferenceTable] = useState<any>(null);
	const [loading, setLoading] = useState(false);

	// Găsim coloana pentru această celulă
	const column = columns?.find((col) => col.id === cell?.columnId);

	// Fetch la tabelul de referință când este necesar
	useEffect(() => {
		const fetchReferenceTable = async () => {
			if (!column?.referenceTableId || !tables || tables.length === 0) return;

			// Găsim tabelul curent pentru a obține tenant și database info
			const currentTable = tables.find((t) => t.id === column?.tableId);
			if (!currentTable?.databaseId) return;

			setLoading(true);
			try {
				const { referenceTable } = await useOptimizedReferenceData({
					tenantId: currentTable.tenantId,
					databaseId: currentTable.databaseId,
					tableId: column.referenceTableId,
				});

				if (referenceTable) {
					setReferenceTable(referenceTable);
				}
			} catch (error) {
				console.error("Error fetching reference table:", error);
			} finally {
				setLoading(false);
			}
		};

		if (column?.type === USER_FRIENDLY_COLUMN_TYPES.link) {
			fetchReferenceTable();
		}
	}, [column?.referenceTableId, column?.tableId, column?.type, tables]);

	// Permissions
	const { user } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(column?.tableId);

	// TableEditor gestionează skeleton și "Access Denied" - aici doar verificăm editarea

	// Verificăm dacă utilizatorul poate edita această coloană
	const canEdit = tablePermissions.canEditColumn(column.id);

	const handleKey = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			// For reference columns, values are already saved on change
			// Just cancel editing for Enter key
			if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
				if (hasInvalidReferences) {
					return; // Don't cancel if there are invalid references
				}
				onCancel();
			} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
				// For customArray, values are already saved on change
				onCancel();
			} else {
				// For text/number/date, save the current value and cancel
				console.log("🔍 DEBUG: Saving text/number/date on Enter", { columnType: column.type, value });
				onSave(value);
			}
		}
		if (e.key === "Escape") onCancel();
	};

	// Click outside to cancel editing - only on actual click, not focus events
	useEffect(() => {
		if (!isEditing) return;

		const handleClickOutside = (event: MouseEvent) => {
			// Only handle actual mouse clicks, not programmatic events
			if (event.isTrusted && editContainerRef.current && !editContainerRef.current.contains(event.target as Node)) {
				// Check if click is on a dropdown element (AbsoluteDropdown creates a portal)
				const target = event.target as Element;
				const isDropdownClick = target.closest('[data-dropdown]') || 
									   target.closest('.fixed.z-\\[9999\\]') ||
									   target.closest('[role="listbox"]') ||
									   target.closest('[role="option"]');
				
				// Don't cancel editing if clicking on dropdown elements
				if (isDropdownClick) {
					return;
				}

				// For reference columns, values are already saved on change
				if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
					if (hasInvalidReferences) {
						// Don't cancel if there are invalid references
						return;
					}
					onCancel();
				} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
					// For customArray, value is already saved on change, just cancel
					onCancel();
				} else {
					// For text/number/date, save current value and cancel
					console.log("🔍 DEBUG: Saving text/number/date on click outside", { columnType: column.type, value });
					onSave(value);
				}
			}
		};

		// Use a small delay to prevent immediate cancellation on double-click
		const timeoutId = setTimeout(() => {
			document.addEventListener('mousedown', handleClickOutside);
		}, 100);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isEditing, column?.type, hasInvalidReferences, onCancel, onSave, value]);

	// Early returns pentru cazurile speciale
	if (!column) {
		return <div className="text-xs text-muted-foreground">Unknown column</div>;
	}

	// Dacă este în modul de editare, afișăm input-ul corespunzător
	if (isEditing) {
		const editContainer = (
			<div ref={editContainerRef} className="w-full">
				{column.type === USER_FRIENDLY_COLUMN_TYPES.text ||
				column.type === USER_FRIENDLY_COLUMN_TYPES.number ||
				column.type === USER_FRIENDLY_COLUMN_TYPES.date ? (
					<Input
						value={value || ""}
						onChange={(e) => handleValueChange(e.target.value)}
						onKeyDown={handleKey}
						placeholder={COLUMN_TYPE_LABELS[column.type]}
						className="w-full"
						autoFocus
					/>
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.boolean ? (
					<Switch
						checked={value || false}
						onCheckedChange={(checked) => {
							handleValueChange(checked);
							onSave(checked); // Save immediately for boolean
						}}
					/>
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.link ? (
					<MultipleReferenceSelect
						value={value}
						onValueChange={(val) => {
							handleValueChange(val);
							onSave(val); // Save immediately for reference
						}}
						referenceTable={referenceTable}
						column={column}
						loading={loading}
						onInvalidReferencesChange={setHasInvalidReferences}
					/>
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.customArray ? (
					<AbsoluteSelect
						value={value || ""}
						onValueChange={(val) => {
							handleValueChange(val);
							onSave(val); // Save immediately for customArray
						}}
						options={column.options || []}
						placeholder="Select option"
						className="w-full"
					/>
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.yesno ? (
					<Select
						value={value || ""}
						onValueChange={(val) => {
							handleValueChange(val);
							onSave(val); // Save immediately for yesno
						}}>
						<SelectTrigger className="w-full">
							<SelectValue placeholder="Select option" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="yes">Yes</SelectItem>
							<SelectItem value="no">No</SelectItem>
						</SelectContent>
					</Select>
				) : (
					<div className="text-xs text-muted-foreground">
						Unsupported column type: {column.type}
					</div>
				)}
			</div>
		);

		return editContainer;
	}

	// Afișare simplificată pentru celulele care nu sunt în editare
	let display = "";
	
	if (value == null || value === "") {
		display = column.type === "reference" 
			? "No references" 
			: "No value";
	} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.boolean) {
		display = value ? "Yes" : "No";
	} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
		if (Array.isArray(value)) {
			display = value.length > 0 ? `${value.length} reference${value.length > 1 ? 's' : ''}` : "No references";
		} else {
			display = value ? "1 reference" : "No references";
		}
	} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
		display = value || "No selection";
	} else {
		display = String(value);
	}

	// Styling simplificat
	const getDisplayStyle = () => {
		let baseStyle = "cursor-pointer text-sm text-neutral-700";
		
		if (value == null || value === "") {
			baseStyle += " text-neutral-400 italic";
		}
		
		if (hasPendingChange) {
			baseStyle += " bg-yellow-50 border-yellow-200";
		}
		
		return baseStyle;
	};

	return (
		<div
			onClick={() => {
				if (canEdit) {
					onStartEdit();
				}
			}}
			className={`${getDisplayStyle()} ${
				!canEdit ? "cursor-not-allowed opacity-60" : ""
			}`}>
			<p className='max-w-[250px] sm:max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis select-none leading-relaxed text-sm sm:text-base'>
				{display}
			</p>
		</div>
	);
});

EditableCell.displayName = "EditableCell";

export default EditableCell;
