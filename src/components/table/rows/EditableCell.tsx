/** @format */

"use client";

import { useState, KeyboardEvent, useMemo, JSX, memo, useEffect } from "react";
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
import { Button } from "../../ui/button";
import { SearchableReferenceSelect } from "./SearchableReferenceSelect";
import { MultipleReferenceSelect } from "./MultipleReferenceSelect";
import { Badge } from "../../ui/badge";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { useOptimizedReferenceData } from "@/hooks/useOptimizedReferenceData";

// Componenta pentru tooltip-ul cu toate referințele
const MultipleReferencesTooltip = ({
	value,
	referenceTable,
	column,
}: {
	value: any[];
	referenceTable: Table;
	column: Column;
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
						{value.length} Reference{value.length !== 1 ? "s" : ""} in{" "}
						{referenceTable.name}
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
								: `Row #${referenceRow.id}`;

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
				id: row.id || 0,
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
}: Props) {
	// TOATE HOOKS-URILE TREBUIE SĂ FIE AICI, ÎNAINTE DE ORICE RETURN CONDIȚIONAL

	// State pentru valoarea celulei
	const [value, setValue] = useState<any>(() => {
		// Ensure reference columns always have array values
		const column = columns?.find((col) => col.id === cell?.columnId);
		if (column?.type === USER_FRIENDLY_COLUMN_TYPES.link) {
			if (Array.isArray(cell?.value)) {
				return cell.value;
			}
			return cell?.value ? [cell.value] : [];
		}
		return cell?.value;
	});

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
			if (!column?.referenceTableId) return;

			setLoading(true);
			try {
				// Folosim URL-ul relativ pentru a evita hardcodarea tenant/database IDs
				const response = await fetch(
					`/api/tenants/1/databases/1/tables/${column.referenceTableId}/rows?limit=1000&includeCells=true`,
				);
				if (response.ok) {
					const data = await response.json();
					setReferenceTable(data);
				}
			} catch (error) {
				console.error("Error fetching reference table:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchReferenceTable();
	}, [column?.referenceTableId]);

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

	// ACUM PUTEM FACE RETURN-URI CONDIȚIONALE

	// Handle cases where cell might be undefined or missing properties
	if (!cell || !cell.columnId || !columns) {
		return <div className='text-gray-400 italic'>Empty</div>;
	}

	if (!column) return null;

	// Verificăm dacă utilizatorul poate citi această coloană
	if (!tablePermissions.canReadColumn(column.id)) {
		return <div className='text-gray-400 italic'>Access Denied</div>;
	}

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

	// Process value before saving for reference columns
	const handleSave = () => {
		// Prevent saving if there are invalid references
		if (
			column.type === USER_FRIENDLY_COLUMN_TYPES.link &&
			hasInvalidReferences
		) {
			return; // Don't save invalid references
		}

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
	};

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
						placeholder={`Select ${referencedTable?.name || "references"}`}
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
				<div className='flex items-center gap-2'>
					<div className='flex-1 p-2 bg-muted rounded text-sm text-muted-foreground'>
						You don't have permission to edit this column
					</div>
					<Button variant='ghost' size='sm' onClick={onCancel}>
						✕
					</Button>
				</div>
			);
		}

		return (
			<div className='flex items-start gap-2'>
				{column.type === "boolean" ? (
					<Select
						value={String(value)}
						onValueChange={(v) => setValue(v === "true")}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='true'>True</SelectItem>
							<SelectItem value='false'>False</SelectItem>
						</SelectContent>
					</Select>
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.link ? (
					referenceSelect
				) : column.type === USER_FRIENDLY_COLUMN_TYPES.customArray ? (
					<Select
						value={String(value || "")}
						onValueChange={(v) => setValue(v)}>
						<SelectTrigger>
							<SelectValue placeholder='Select an option' />
						</SelectTrigger>
						<SelectContent>
							{column.customOptions && column.customOptions.length > 0 ? (
								column.customOptions.map((option) => (
									<SelectItem key={option} value={option}>
										{option}
									</SelectItem>
								))
							) : (
								<SelectItem disabled value='no-options'>
									No options available
								</SelectItem>
							)}
						</SelectContent>
					</Select>
				) : (
					<Input
						className='w-max'
						type={
							column.type === USER_FRIENDLY_COLUMN_TYPES.date
								? "date"
								: column.type === USER_FRIENDLY_COLUMN_TYPES.number
								? "number"
								: "text"
						}
						value={value ?? ""}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={handleKey}
						autoFocus
					/>
				)}

				<Button
					variant='ghost'
					size='sm'
					onClick={handleSave}
					disabled={
						column.type === USER_FRIENDLY_COLUMN_TYPES.link &&
						hasInvalidReferences
					}
					title={
						column.type === USER_FRIENDLY_COLUMN_TYPES.link &&
						hasInvalidReferences
							? "Cannot save: Invalid references detected"
							: "Save"
					}>
					✓
				</Button>
				<Button variant='ghost' size='sm' onClick={onCancel}>
					✕
				</Button>
			</div>
		);
	}

	let display: string;

	if (value == null || value === "") {
		display = "Double-click to add value";
	} else if (column.type === "boolean") {
		display = value === true ? "True" : "False";
	} else if (column.type === "date") {
		display = new Date(value).toLocaleDateString();
	} else if (column.type === USER_FRIENDLY_COLUMN_TYPES.customArray) {
		// Pentru coloanele customArray, verificăm dacă valoarea există în opțiunile definite
		if (column.customOptions && column.customOptions.includes(value)) {
			display = String(value);
		} else {
			display = `⚠️ Invalid: ${value}`;
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

	// Determinăm stilul în funcție de tipul de afișare
	const getDisplayStyle = () => {
		if (
			display === "Double-click to add value" ||
			display === "Double-click to add values"
		) {
			return "text-gray-400 italic  rounded px-2 py-1 cursor-pointer hover:translate-y-[-1px] transition-colors";
		} else if (display.startsWith("⚠️")) {
			return "text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1";
		}
		return "cursor-pointer hover:translate-y-[-1px] rounded px-1 transition-colors";
	};

	return (
		<div
			onDoubleClick={canEdit ? onStartEdit : undefined}
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
						/>
					) : null;
				})()}
			<p className='max-w-[300px] overflow-hidden whitespace-nowrap text-ellipsis select-none'>
				{display}
			</p>
		</div>
	);
}
