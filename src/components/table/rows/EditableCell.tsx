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
import { Badge } from "../../ui/badge";
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
						setHighlightedIndex(-1);
					}
					break;
				case "Escape":
					event.preventDefault();
					setIsOpen(false);
					setHighlightedIndex(-1);
					break;
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, highlightedIndex, options, onValueChange]);

	// Auto-scroll to highlighted option
	useEffect(() => {
		if (highlightedIndex >= 0 && dropdownRef.current) {
			const highlightedElement = dropdownRef.current.children[
				highlightedIndex
			] as HTMLElement;
			if (highlightedElement) {
				highlightedElement.scrollIntoView({
					block: "nearest",
					behavior: "smooth",
				});
			}
		}
	}, [highlightedIndex]);

	const selectOption = (option: string) => {
		onValueChange(option);
		setIsOpen(false);
		setHighlightedIndex(-1);
	};

	const toggleDropdown = () => {
		setIsOpen(!isOpen);
	};

	return (
		<div ref={containerRef} className={cn("relative", className)}>
			{/* Main trigger button */}
			<div
				className={cn(
					"flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base sm:text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 cursor-pointer",
					isOpen && "ring-2 ring-ring ring-offset-2",
				)}
				onClick={toggleDropdown}>
				<div className='flex-1 flex items-center'>
					{value ? (
						<span className='truncate' title={value}>
							{value}
						</span>
					) : (
						<span className='text-muted-foreground'>{placeholder}</span>
					)}
				</div>
				<div className='flex items-center'>
					{isOpen ? (
						<ChevronUp className='h-4 w-4 text-muted-foreground' />
					) : (
						<ChevronDown className='h-4 w-4 text-muted-foreground' />
					)}
				</div>
			</div>

			{/* Absolute Dropdown */}
			<AbsoluteDropdown
				isOpen={isOpen}
				onClose={() => {
					setIsOpen(false);
					setHighlightedIndex(-1);
				}}
				triggerRef={containerRef}
				className="w-full min-w-[250px] max-w-[90vw] sm:max-w-[400px]"
				placement="bottom-start">
				{/* Options list */}
				<div
					ref={dropdownRef}
					className="overflow-auto p-1 max-h-60"
					role='listbox'
					data-dropdown="true">
					{options.length > 0 ? (
						options.map((option, index) => (
							<div
								key={option}
								className={cn(
									"relative flex cursor-pointer select-none items-center rounded-sm px-3 py-3 text-base sm:text-sm outline-none transition-colors",
									"hover:bg-accent hover:text-accent-foreground",
									index === highlightedIndex &&
										"bg-accent text-accent-foreground",
									option === value &&
										"bg-primary text-primary-foreground",
								)}
								onClick={() => selectOption(option)}
								role='option'
								aria-selected={option === value}
								data-dropdown="true">
								<span className='truncate' title={option}>
									{option}
								</span>
							</div>
						))
					) : (
						<div className='px-2 py-4 text-center text-sm text-muted-foreground'>
							No options available
						</div>
					)}
				</div>
			</AbsoluteDropdown>
		</div>
	);
};

// Componenta pentru tooltip-ul cu toate referințele
const MultipleReferencesTooltip = ({
	value,
	referenceTable,
	column,
	t,
}: {
	value: any[];
	referenceTable: Table;
	column: Column;
	t: (key: string, params?: any) => string;
}) => {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState<"top" | "bottom">("top");

	// Detectăm poziția optimă pentru tooltip
	useEffect(() => {
		if (isVisible) {
			// Folosim un timeout pentru a permite DOM-ului să se actualizeze
			const timer = setTimeout(() => {
				const tooltipElement = document.querySelector(
					'[data-tooltip="multiple-references"]',
				);
				if (tooltipElement) {
					const rect = tooltipElement.getBoundingClientRect();
					const viewportHeight = window.innerHeight;
					const spaceAbove = rect.top;
					const spaceBelow = viewportHeight - rect.bottom;

					// Dacă avem mai mult spațiu jos și este suficient, afișăm tooltip-ul jos
					if (spaceBelow > 250 && spaceBelow > spaceAbove) {
						setPosition("bottom");
					} else {
						setPosition("top");
					}
				}
			}, 10);

			return () => clearTimeout(timer);
		}
	}, [isVisible]);

	// Reset poziția când tooltip-ul se ascunde
	useEffect(() => {
		if (!isVisible) {
			setPosition("top"); // Reset la poziția default
		}
	}, [isVisible]);

	if (!Array.isArray(value) || value.length === 0) return null;

	const refPrimaryKeyColumn = referenceTable.columns?.find(
		(col) => col.primary,
	);
	if (!refPrimaryKeyColumn) return null;

	const referenceRows = value
		.map((refValue) => {
			const referenceRow = referenceTable.rows?.find((refRow) => {
				// Verificăm că refRow există și are celule
				if (!refRow || !refRow.cells || !Array.isArray(refRow.cells))
					return false;

				const refPrimaryKeyCell = refRow.cells.find(
					(refCell) => refCell.columnId === refPrimaryKeyColumn.id,
				);
				return refPrimaryKeyCell && refPrimaryKeyCell.value === refValue;
			});
			return { refValue, referenceRow };
		})
		.filter((item) => item.referenceRow);

	return (
		<div
			className='relative inline-block'
			onMouseEnter={() => setIsVisible(true)}
			onMouseLeave={() => setIsVisible(false)}>
			{/* Tooltip */}
			{isVisible && (
				<div
					data-tooltip='multiple-references'
					className={`absolute z-[9999] ${
						position === "top"
							? "bottom-full left-0 mb-2"
							: "top-full left-0 mt-2"
					} p-3 bg-popover border border-border rounded-lg shadow-2xl min-w-[300px] max-w-[500px]`}>
					<div className='mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider'>
						{t("table.references.count", {
							count: value.length,
							tableName: referenceTable.name,
						})}
					</div>
					<div className='space-y-2'>
						{referenceRows.map(({ refValue, referenceRow }, index) => {
							if (!referenceRow) return null;

							// Construim display value cu informații relevante
							const displayParts: string[] = [];
							let addedColumns = 0;
							const maxColumns = 3;

							referenceTable.columns?.forEach((col) => {
								if (addedColumns >= maxColumns) return;

								// Verificăm că referenceRow există și are celule
								if (
									referenceRow &&
									referenceRow.cells &&
									Array.isArray(referenceRow.cells)
								) {
									const cell = referenceRow.cells.find(
										(c) => c.columnId === col.id,
									);
									if (
										cell?.value != null &&
										cell.value.toString().trim() !== ""
									) {
										let formattedValue = cell.value.toString().trim();

										if (formattedValue.length > 20) {
											formattedValue = formattedValue.substring(0, 20) + "...";
										}

										if (col.primary) {
											displayParts.push(formattedValue);
										} else {
											// Pentru coloanele non-primary, afișăm numele coloanei + valoarea
											const columnName =
												col.name.length > 10
													? col.name.substring(0, 10) + "..."
													: col.name;
											displayParts.push(`${columnName}: ${formattedValue}`);
										}
										addedColumns++;
									}
								}
							});

							const displayValue = displayParts.length
								? displayParts.join(" • ")
								: t("table.references.rowNumber", { id: referenceRow.id });

							return (
								<div
									key={index}
									className='flex items-center gap-2 p-2 bg-muted/30 rounded-md'>
									<Badge variant='outline' className='text-xs font-mono'>
										{index + 1}
									</Badge>
									<span className='text-sm'>{displayValue}</span>
								</div>
							);
						})}
					</div>
					{/* Arrow - poziționat în funcție de direcția tooltip-ului */}
					<div
						className={`absolute ${
							position === "top"
								? "top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"
								: "bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-popover"
						}`}></div>
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
		{ id: number; displayValue: string; primaryKeyValue: any }[]
	> = {};

	if (
		!table ||
		!table.id ||
		!Array.isArray(table.rows) ||
		!Array.isArray(table.columns)
	) {
		return referenceData;
	}

	const options: {
		id: number;
		displayValue: string;
		primaryKeyValue: any;
	}[] = [];

	// Procesăm doar rândurile care au celule
	table.rows.forEach((row: Row) => {
		if (
			row &&
			row.id &&
			row.cells &&
			Array.isArray(row.cells) &&
			row.cells.length > 0 &&
			table.columns &&
			Array.isArray(table.columns)
		) {
			const displayParts: string[] = [];
			let addedColumns = 0;
			const maxColumns = 3;
			let primaryKeyValue: any = null;

			table.columns.forEach((column: Column) => {
				if (!column || !column.id || addedColumns >= maxColumns) return;

				// Verificăm că row.cells există și este un array
				if (row.cells && Array.isArray(row.cells)) {
					const cell = row.cells.find(
						(c: any) => c && c.columnId === column.id,
					);
					if (cell?.value != null && cell.value.toString().trim() !== "") {
						let formattedValue = cell.value.toString().trim();

						if (formattedValue.length > 15) {
							formattedValue = formattedValue.substring(0, 15) + "...";
						}

						if (column.type === "date") {
							try {
								formattedValue = new Date(formattedValue).toLocaleDateString(
									"ro-RO",
								);
							} catch {
								// fallback la valoarea brută
							}
						} else if (column.type === "boolean") {
							formattedValue = formattedValue === "true" ? "✓" : "✗";
						}

						if (addedColumns === 0 && column.primary) {
							displayParts.push(formattedValue);
							primaryKeyValue = cell.value;
						} else {
							displayParts.push(formattedValue);
						}
						addedColumns++;
					}
				}
			});

			const displayValue = displayParts.length
				? displayParts.join(" • ").slice(0, 50)
				: `Row #${row.id || "unknown"}`;

			options.push({
				id: typeof row.id === 'string' ? parseInt(row.id) : (row.id || 0),
				displayValue,
				primaryKeyValue: primaryKeyValue || row.id,
			});
		}
	});

	referenceData[table.id] = options;
	return referenceData;
};

export function EditableCell({
	columns,
	cell,
	isEditing,
	onStartEdit,
	onSave,
	onCancel,
	tables,
	hasPendingChange = false,
	pendingValue,
}: Props) {
	// TOATE HOOKS-URILE TREBUIE SĂ FIE AICI, ÎNAINTE DE ORICE RETURN CONDIȚIONAL

	// Hook pentru traduceri
	const { t } = useLanguage();

	// State pentru valoarea celulei - folosește pending value dacă există
	const [value, setValue] = useState<any>(() => {
		// Folosește valoarea pending dacă există, altfel valoarea din celulă
		const initialValue = hasPendingChange ? pendingValue : cell?.value;

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
		if (!isEditing) {
			const newValue = hasPendingChange ? pendingValue : cell?.value;
			const column = columns?.find((col) => col.id === cell?.columnId);
			
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
		
		// For immediate optimistic updates, call onSave right away for non-reference columns
		const column = columns?.find((col) => col.id === cell?.columnId);
		if (column?.type !== USER_FRIENDLY_COLUMN_TYPES.link && 
			column?.type !== USER_FRIENDLY_COLUMN_TYPES.customArray) {
			// Save immediately for better UX
			onSave(newValue);
		}
	}, [columns, cell?.columnId, onSave]);

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
				const token = localStorage.getItem("token") || "";
				const response = await fetch(
					`/api/tenants/${currentTable.databaseId}/databases/${currentTable.databaseId}/tables/${column.referenceTableId}/rows?limit=1000&includeCells=true`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					},
				);
				if (response.ok) {
					const data = await response.json();
					setReferenceTable(data);
				} else if (response.status === 403) {
					// Utilizatorul nu are permisiuni pentru tabelul de referință
					console.warn(
						`No permission to access reference table ${column.referenceTableId}`,
					);
					setReferenceTable({ rows: [], columns: [] });
				}
			} catch (error) {
				console.error("Error fetching reference table:", error);
				setReferenceTable({ rows: [], columns: [] });
			} finally {
				setLoading(false);
			}
		};

		fetchReferenceTable();
	}, [column?.referenceTableId, tables, column?.tableId]);

	// Hook pentru datele de referință
	const { referenceData } = useOptimizedReferenceData(
		tables || [],
		column?.referenceTableId,
	);

	// Hook pentru permisiuni
	const { permissions: userPermissions } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		column?.tableId || 0,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	// Debug: log permissions pentru a vedea ce se întâmplă

	// ACUM PUTEM FACE RETURN-URI CONDIȚIONALE

	// Handle cases where cell might be undefined or missing properties
	if (!cell || !cell.columnId || !columns) {
		return <div className='text-gray-400 italic'>Empty</div>;
	}

	if (!column) return null;

	// Nu mai afișăm skeleton la nivelul EditableCell - se ocupă TableEditor

	// TableEditor gestionează skeleton și "Access Denied" - aici doar verificăm editarea

	// Verificăm dacă utilizatorul poate edita această coloană
	const canEdit = tablePermissions.canEditColumn(column.id);

	const handleKey = (e: KeyboardEvent) => {
		if (e.key === "Enter") {
			// Prevent saving if there are invalid references
			if (
				column.type === USER_FRIENDLY_COLUMN_TYPES.link &&
				hasInvalidReferences
			) {
				return; // Don't save invalid references
			}

			// Process value before saving for reference columns
			if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
				const processedValue = Array.isArray(value)
					? value
					: value
					? [value]
					: [];
				onSave(processedValue);
			} else {
				onSave(value);
			}
		}
		if (e.key === "Escape") onCancel();
	};

	// Auto-save is now handled immediately in handleValueChange for better optimistic UX
	// No need for debounced auto-save since we update UI immediately

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

				// For reference columns, save before canceling
				if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
					if (!hasInvalidReferences) {
						const processedValue = Array.isArray(value)
							? value
							: value
							? [value]
							: [];
						onSave(processedValue);
					} else {
						onCancel();
					}
				} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
					// For customArray, value is already saved on change, just cancel
					onCancel();
				} else {
					onCancel();
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
	}, [isEditing, onCancel, column?.type, hasInvalidReferences, value, onSave]);


	let referenceSelect: JSX.Element | null = null;
	if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
		const options = referenceData[column.referenceTableId ?? -1] ?? [];

		const referencedTable = tables?.find(
			(t) => t.id === column.referenceTableId,
		);

		// Use MultipleReferenceSelect for all reference columns (always multiple selection)
		if (column.type === USER_FRIENDLY_COLUMN_TYPES.link) {
			referenceSelect = (
				<div className='flex flex-col gap-1'>
					<MultipleReferenceSelect
						value={value}
						onValueChange={(val) => setValue(val)}
						options={options}
						placeholder={`${t("table.select")} ${
							referencedTable?.name || t("table.references")
						}`}
						referencedTableName={referencedTable?.name}
						isMultiple={true}
						onValidationChange={(isValid, invalidCount) =>
							setHasInvalidReferences(invalidCount > 0)
						}
					/>

					{/* Show warning for invalid references */}
					{hasInvalidReferences && (
						<div className='text-xs text-destructive bg-destructive/10 px-2 py-1 rounded border border-destructive/20'>
							⚠️ Some selected references are no longer valid. Please remove
							them before saving.
						</div>
					)}

					{process.env.NODE_ENV === "development" && (
						<div className=' text-xs text-muted-foreground'>
							Table:{" "}
							{referencedTable?.name ||
								`Unknown (ID: ${column.referenceTableId})`}
							, Options: {options.length}, Multiple: Always Enabled
						</div>
					)}
				</div>
			);
		}
	}

	if (isEditing) {
		// Verificăm dacă utilizatorul poate edita această coloană
		if (!canEdit) {
			return (
				<div className='p-2 bg-muted rounded text-sm text-muted-foreground'>
					You don't have permission to edit this column
				</div>
			);
		}

		return (
			<div ref={editContainerRef} className='w-full'>
				{column.type === "boolean" ? (
					<Switch
						checked={value === true}
						onCheckedChange={(checked) => {
							setValue(checked);
							// Save immediately for boolean changes
							onSave(checked);
						}}>
						<span className='sr-only'>{t("table.toggleBoolean")}</span>
					</Switch>
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.link ? (
					referenceSelect
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.customArray ? (
					<AbsoluteSelect
						value={String(value || "")}
						onValueChange={(v) => {
							setValue(v);
							// Auto-save for customArray when value changes
							onSave(v);
						}}
						options={column.customOptions || []}
						placeholder='Select an option'
						className="w-full"
					/>
				) : (
					<Input
						className='w-full h-8 border border-blue-500 shadow-sm focus:ring-1 focus:ring-blue-500 bg-white text-sm font-medium px-3 py-1 rounded'
						type={
							column.type === USER_FRIENDLY_COLUMN_TYPES.date
								? "date"
								: column.type === USER_FRIENDLY_COLUMN_TYPES.number
								? "number"
								: "text"
						}
						value={
							column.type === USER_FRIENDLY_COLUMN_TYPES.date && value
								? new Date(value).toISOString().split('T')[0]
								: value ?? ""
						}
						onChange={(e) => handleValueChange(e.target.value)}
						onKeyDown={handleKey}
						autoFocus
						placeholder={column.type === "date" ? "YYYY-MM-DD" : "Enter value..."}
					/>
				)}
			</div>
		);
	}

	let display: string;

	if (value == null || value === "") {
		display = t("table.doubleClickToAddValue");
	} else if (column.type === "boolean") {
		display = value === true ? t("common.true") : t("common.false");
	} else if (column.type === "date") {
		display = new Date(value).toLocaleDateString();
	} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
		// Pentru coloanele customArray, verificăm dacă valoarea există în opțiunile definite
		if (value && column.customOptions && column.customOptions.includes(value)) {
			display = String(value);
		} else if (value) {
			display = `⚠️ Invalid: ${value}`;
		} else {
			display = t("table.doubleClickToAddValue");
		}
	} else if (
		column.type === USER_FRIENDLY_COLUMN_TYPES.link &&
		column.referenceTableId
	) {
		// Pentru coloanele de referință, folosim datele deja fetch-uite din hooks-urile de sus

		if (loading) {
			display = "Loading references...";
		} else if (referenceTable && referenceTable.columns) {
			const refPrimaryKeyColumn = referenceTable.columns.find(
				(col: any) => col.primary,
			);

			if (refPrimaryKeyColumn && referenceTable.rows) {
				// Handle reference values (always multiple)
				// Ensure value is always treated as array
				const referenceValues = Array.isArray(value)
					? value
					: value
					? [value]
					: [];

				if (referenceValues.length === 0) {
					display = "Double-click to add values";
				} else {
					// Pentru multiple references, afișăm doar cheile primare
					const primaryKeys = referenceValues.map((refValue) => {
						// Căutăm rândul cu cheia primară specificată
						const referenceRow = referenceTable.rows.find((refRow: any) => {
							// Verificăm că refRow există și are celule
							if (!refRow || !refRow.cells || !Array.isArray(refRow.cells))
								return false;

							const refPrimaryKeyCell = refRow.cells.find(
								(refCell: any) => refCell.columnId === refPrimaryKeyColumn.id,
							);
							return refPrimaryKeyCell && refPrimaryKeyCell.value === refValue;
						});

						if (referenceRow) {
							// Afișăm doar cheia primară fără #
							return referenceRow.cells.find(
								(refCell: any) => refCell.columnId === refPrimaryKeyColumn.id,
							).value;
						} else {
							return `⚠️ Invalid: ${refValue}`;
						}
					});

					// Pentru multiple references, afișăm doar primul și un contor
					if (referenceValues.length === 1) {
						display = primaryKeys[0];
					} else {
						display = `${primaryKeys[0]} +${referenceValues.length - 1} more`;
					}
				}
			} else {
				// Nu există cheie primară în tabelul de referință
				display = `⚠️ No primary key in ${referenceTable.name}`;
			}
		} else {
			// Tabelul de referință nu există - afișăm valoarea normal
			const referenceValues = Array.isArray(value)
				? value
				: value
				? [value]
				: [];
			if (referenceValues.length === 0) {
				display = "Double-click to add values";
			} else {
				// Afișăm doar cheile primare separate prin virgulă
				display = referenceValues.join(", ");
			}
		}
	} else {
		display = String(value);
	}

	// Determinăm stilul în funcție de tipul de afișare și starea pending
	const getDisplayStyle = () => {
		let baseStyle = "";

		if (
			display === "Double-click to add value" ||
			display === "Double-click to add values"
		) {
			baseStyle =
				"text-neutral-400 italic cursor-pointer hover:bg-neutral-100 transition-all duration-200 text-sm font-medium";
		} else if (display.startsWith("⚠️")) {
			baseStyle =
				"text-red-600 bg-red-50 border border-red-200 text-sm font-medium";
		} else {
			baseStyle =
				"cursor-pointer hover:bg-neutral-100 transition-all duration-200 text-sm font-medium text-neutral-700";
		}

		// Adaugă styling pentru modificări pending
		if (hasPendingChange) {
			baseStyle += " bg-yellow-50 border-l-4 border-yellow-400";
		}

		return baseStyle;
	};

	return (
		<div
			onDoubleClick={() => {
				if (canEdit) {
					onStartEdit();
				}
			}}
			title={
				!canEdit
					? "You don't have permission to edit this column"
					: value == null ||
					  value === "" ||
					  (Array.isArray(value) && value.length === 0)
					? column.type === "reference"
						? "Double-click to add values"
						: "Double-click to add value"
					: "Double-click to edit"
			}
			className={`${getDisplayStyle()} ${
				!canEdit ? "cursor-not-allowed opacity-60" : ""
			}`}>
			{/* Pentru references, afișăm tooltip-ul (always multiple) */}
			{column.type === USER_FRIENDLY_COLUMN_TYPES.link &&
				(() => {
					// Ensure value is always treated as array for reference columns
					const referenceValues = Array.isArray(value)
						? value
						: value
						? [value]
						: [];
					return (
						referenceValues.length > 0 && column.referenceTableId && tables
					);
				})() &&
				(() => {
					if (!tables) return null;
					const refTable = tables.find((t) => t.id === column.referenceTableId);
					const referenceValues = Array.isArray(value)
						? value
						: value
						? [value]
						: [];
					return refTable ? (
						<MultipleReferencesTooltip
							value={referenceValues}
							referenceTable={refTable}
							column={column}
							t={t}
						/>
					) : null;
				})()}
			<p className='max-w-[250px] sm:max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis select-none leading-relaxed text-sm sm:text-base'>
				{display}
			</p>
		</div>
	);
}
