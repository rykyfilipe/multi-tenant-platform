/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";
import { z } from "zod";

// Schema de validare pentru import (compatibil cu frontend-ul actual)
const ImportSchema = z.object({
	rows: z.array(
		z.object({
			cells: z.array(
				z.object({
					columnId: z.number().positive(),
					value: z.any().optional().nullable(),
				}),
			),
		}),
	),
});

// Funcție pentru validarea tipurilor de date (similar cu ImportExportControls)
function validateCellValue(
	value: any,
	columnType: string,
	customOptions?: string[],
): boolean {
	if (value === null || value === undefined || value === "") {
		return true; // Valori goale sunt valide
	}

	switch (columnType) {
		case "text":
		case "string":
		case "email":
		case "url":
			return typeof value === "string";
		case "number":
		case "integer":
		case "decimal":
			return !isNaN(parseFloat(value));
		case "boolean":
			return (
				value === "true" ||
				value === "false" ||
				value === true ||
				value === false ||
				value === "✓" ||
				value === "✗" ||
				value === "1" ||
				value === "0"
			);
		case "date":
		case "datetime":
			return !isNaN(new Date(value).getTime());
		case "reference":
			// Pentru reference, valoarea poate fi orice tip (string, number, etc.)
			// Sau poate fi o listă de valori separate cu virgulă
			if (typeof value === "string" && value.includes(",")) {
				// Multiple references - validate each individual value
				const refs = value
					.split(",")
					.map((ref) => ref.trim())
					.filter(Boolean);
				return refs.length > 0; // Must have at least one valid reference
			}
			// Single reference - any non-empty value is valid
			const isValid = value != null && value !== "";
			return isValid;
		case "customArray":
			if (customOptions && customOptions.length > 0) {
				return customOptions.includes(value);
			}
			return typeof value === "string";
		default:
			return true;
	}
}

// Funcție pentru procesarea valorilor înainte de salvare (similar cu ImportExportControls)
function processCellValue(value: any, columnType: string): any {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	switch (columnType) {
		case "number":
		case "integer":
		case "decimal":
			return parseFloat(value);
		case "boolean":
			// Suport pentru multiple formate boolean
			if (
				value === "true" ||
				value === true ||
				value === "✓" ||
				value === "1"
			) {
				return true;
			}
			if (
				value === "false" ||
				value === false ||
				value === "✗" ||
				value === "0"
			) {
				return false;
			}
			return Boolean(value);
		case "date":
		case "datetime":
			return new Date(value);
		case "reference":
			// Pentru reference, verificăm dacă valoarea conține multiple referințe separate cu virgulă
			if (typeof value === "string" && value.includes(",")) {
				// Multiple references - split by comma and trim whitespace
				const result = value
					.split(",")
					.map((ref) => ref.trim())
					.filter(Boolean);
				return result;
			}
			// Single reference - return as is
			return value;
		default:
			return value;
	}
}

// Funcție pentru procesarea referințelor - creează rândurile referențiate și returnează ID-urile lor
async function processReferenceValue(
	value: any,
	column: any,
	referenceTableId: number,
	tx: any
): Promise<any> {
	if (value === null || value === undefined || value === "") {
		return null;
	}

	// Obține coloanele tabelului de referință
	const referenceColumns = await tx.column.findMany({
		where: { tableId: referenceTableId },
		select: {
			id: true,
			name: true,
			type: true,
			required: true,
			order: true,
		},
		orderBy: { order: "asc" },
	});

	// Funcție pentru crearea unui rând referențiat
	const createReferencedRow = async (rowData: any) => {
		// Creează rândul nou
		const newRow = await tx.row.create({
			data: {
				tableId: referenceTableId,
			},
			select: { id: true },
		});

		// Creează celulele pentru rândul referențiat
		for (const [columnName, cellValue] of Object.entries(rowData)) {
			const refColumn = referenceColumns.find((col: any) => col.name === columnName);
			if (refColumn && cellValue !== null && cellValue !== undefined && cellValue !== "") {
				const processedValue = processCellValue(cellValue, refColumn.type);
				await tx.cell.create({
					data: {
						rowId: newRow.id,
						columnId: refColumn.id,
						value: processedValue,
					},
				});
			}
		}

		return newRow.id;
	};

	// Handle multiple reference values (arrays)
	if (Array.isArray(value)) {
		const rowIds = [];
		for (const refValue of value) {
			if (refValue && typeof refValue === "object") {
				// Dacă este un obiect cu datele rândului, creează rândul
				const rowId = await createReferencedRow(refValue);
				rowIds.push(rowId);
			} else if (refValue && typeof refValue === "string") {
				// Dacă este un string, încearcă să-l parseze ca JSON sau să-l trateze ca ID
				try {
					const parsedData = JSON.parse(refValue);
					if (typeof parsedData === "object") {
						const rowId = await createReferencedRow(parsedData);
						rowIds.push(rowId);
					} else {
						// Tratează ca ID existent
						rowIds.push(refValue);
					}
				} catch {
					// Nu este JSON valid, tratează ca ID existent
					rowIds.push(refValue);
				}
			} else {
				// Tratează ca ID existent
				rowIds.push(refValue);
			}
		}
		return rowIds;
	}

	// Single reference
	if (typeof value === "object") {
		// Dacă este un obiect cu datele rândului, creează rândul
		return await createReferencedRow(value);
	} else if (typeof value === "string") {
		// Dacă este un string, încearcă să-l parseze ca JSON sau să-l trateze ca ID
		try {
			const parsedData = JSON.parse(value);
			if (typeof parsedData === "object") {
				return await createReferencedRow(parsedData);
			} else {
				// Tratează ca ID existent
				return value;
			}
		} catch {
			// Nu este JSON valid - verifică dacă este un ID numeric sau o valoare pentru crearea unui rând nou
			const numericValue = Number(value);
			if (!isNaN(numericValue) && numericValue > 0) {
				// Este un ID numeric valid, tratează ca ID existent
				return value;
			} else {
				// Este o valoare text - creează un rând nou în tabelul referențiat
				// Folosește prima coloană non-primary ca nume pentru rândul nou
				const firstNonPrimaryColumn = referenceColumns.find((col: any) => !col.primary);
				if (firstNonPrimaryColumn) {
					const rowData = {
						[firstNonPrimaryColumn.name]: value
					};
					return await createReferencedRow(rowData);
				} else {
					// Dacă nu există coloane non-primary, folosește prima coloană
					const firstColumn = referenceColumns[0];
					if (firstColumn) {
						const rowData = {
							[firstColumn.name]: value
						};
						return await createReferencedRow(rowData);
					}
					// Dacă nu există coloane deloc, returnează valoarea ca atare
					return value;
				}
			}
		}
	}

	// Fallback - tratează ca ID existent
	return value;
}

// POST endpoint pentru import CSV
export async function POST(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{ tenantId: string; databaseId: string; tableId: string }>;
	},
) {
	const { tenantId, databaseId, tableId } = await params;

	// Verificare autentificare
	const sessionResult = await requireAuthResponse();
	if (sessionResult instanceof NextResponse) {
		return sessionResult;
	}
	const userId = getUserId(sessionResult);

	// Verificare acces tenant
	    const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
	if (tenantAccessError) {
		return tenantAccessError;
	}

	try {
		// Verificare existență database și table
		const database = await prisma.database.findFirst({
			where: {
				id: Number(databaseId),
				tenantId: Number(tenantId),
			},
		});

		if (!database) {
			return NextResponse.json(
				{ error: "Database not found" },
				{ status: 404 },
			);
		}

		const table = await prisma.table.findFirst({
			where: {
				id: Number(tableId),
				databaseId: Number(databaseId),
			},
		});

		if (!table) {
			return NextResponse.json({ error: "Table not found" }, { status: 404 });
		}

		// Verificare permisiuni pentru utilizatorii non-admin
		if (sessionResult.user.role !== "ADMIN") {
			const permission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId,
					tableId: Number(tableId),
					canCreate: true,
				},
			});

			if (!permission) {
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Obține coloanele tabelului pentru validare
		const tableColumns = await prisma.column.findMany({
			where: { tableId: Number(tableId) },
			select: {
				id: true,
				name: true,
				type: true,
				required: true,
				order: true,
				referenceTableId: true,
				customOptions: true,
			},
			orderBy: { order: "asc" },
		});

		// Parsare body request
		const body = await request.json();

		const validatedData = ImportSchema.parse(body);

		const { rows } = validatedData;
		if (!rows || rows.length === 0) {
			return NextResponse.json(
				{ error: "No rows provided for import" },
				{ status: 400 },
			);
		}

		// Procesare rânduri direct (nu mai este nevoie de parsare CSV)
		const dataRows = rows;
		const validRows: any[] = [];
		const warnings: string[] = [];
		const errors: string[] = [];

		for (let i = 0; i < dataRows.length; i++) {
			const rowData = dataRows[i];
			const rowIndex = i + 1;

			try {
				// Verificare că rândul are celule
				if (!rowData.cells || !Array.isArray(rowData.cells)) {
					errors.push(`Row ${rowIndex}: Invalid cell structure`);
					continue;
				}

				// Verificare că rândul are cel puțin o celulă cu valoare
				const hasValidCells = rowData.cells.some(
					(cell: any) =>
						cell.value !== null &&
						cell.value !== undefined &&
						cell.value !== "",
				);

				if (!hasValidCells) {
					warnings.push(`Row ${rowIndex}: Empty row - skipping`);
					continue;
				}

				// Validare că toate coloanele obligatorii sunt prezente și au valori
				const requiredColumns = tableColumns.filter((col: any) => col.required);
				const providedCells = rowData.cells.filter(
					(cell: any) =>
						cell.value !== null &&
						cell.value !== undefined &&
						cell.value !== "",
				);
				const providedColumnIds = providedCells.map((cell: any) =>
					Number(cell.columnId),
				);

				for (const requiredCol of requiredColumns) {
					if (!providedColumnIds.includes(Number(requiredCol.id))) {
						errors.push(
							`Row ${rowIndex}: Missing required column '${requiredCol.name}'`,
						);
					}
				}

				// Validare și procesare celule
				const validCells: any[] = [];
				let rowHasValidData = false;

				for (const cell of rowData.cells) {
					// Skip empty cells
					if (
						cell.value === null ||
						cell.value === undefined ||
						cell.value === ""
					) {
						continue;
					}

					const column = tableColumns.find(
						(col: any) => Number(col.id) === Number(cell.columnId),
					);
					if (!column) {
						errors.push(
							`Row ${rowIndex}: Unknown column ID ${Number(cell.columnId)}`,
						);
						continue;
					}

					// Validare tip de date
					if (
						!validateCellValue(cell.value, column.type, column.customOptions)
					) {
						errors.push(
							`Row ${rowIndex}, Column '${column.name}': Invalid value '${cell.value}' for type '${column.type}'`,
						);
						continue;
					}

					// Procesare valoare
					const processedValue = processCellValue(cell.value, column.type);

					// Pentru referințe, procesarea se va face în tranzacție
					// Aici doar validăm structura
					if (column.type === "reference" && column.referenceTableId) {
						// Validare că referenceTableId este valid
						const refTableId = Number(column.referenceTableId);
						if (isNaN(refTableId) || refTableId <= 0) {
							warnings.push(
								`Row ${rowIndex}, Column '${column.name}': Invalid reference table ID '${column.referenceTableId}'`,
							);
							continue;
						}
					}

					validCells.push({
						columnId: Number(cell.columnId),
						value: processedValue,
					});
					rowHasValidData = true;
				}

				// Doar adăugăm rândul dacă are cel puțin o celulă validă cu date
				if (rowHasValidData && validCells.length > 0) {
					validRows.push({ cells: validCells });
				} else {
					warnings.push(`Row ${rowIndex}: No valid data found - skipping`);
				}
			} catch (error) {
				errors.push(`Row ${rowIndex}: Processing error - ${error}`);
			}
		}

		// Dacă sunt prea multe erori, nu continuăm cu importul
		// Dar să fie mai permisiv - doar dacă mai mult de 50% din rânduri au erori
		const errorThreshold = Math.max(1, Math.floor(rows.length * 0.5));
		if (errors.length > errorThreshold) {
			return NextResponse.json(
				{
					error: `Too many validation errors (${errors.length}/${rows.length}) - import cancelled`,
					details: errors.slice(0, 10),
					totalErrors: errors.length,
					warnings: warnings,
					summary: {
						totalRows: rows.length,
						validRows: validRows.length,
						invalidRows: rows.length - validRows.length,
						errorCount: errors.length,
						warningCount: warnings.length,
						errorThreshold: errorThreshold,
					},
				},
				{ status: 400 },
			);
		}

		// Dacă nu sunt rânduri valide, returnăm eroare
		if (validRows.length === 0) {
			return NextResponse.json(
				{
					error: "No valid rows found for import",
					details: errors,
					warnings: warnings,
					summary: {
						totalRows: rows.length,
						validRows: 0,
						invalidRows: rows.length,
						errorTypes: {
							validationErrors: errors.length,
							structureErrors: errors.filter((e) =>
								e.includes("Invalid cell structure"),
							).length,
							columnErrors: errors.filter((e) =>
								e.includes("Unknown column ID"),
							).length,
							typeErrors: errors.filter((e) => e.includes("Invalid value"))
								.length,
						},
					},
				},
				{ status: 400 },
			);
		}

		// Import rânduri în baza de date - folosim tranzacție pentru consistență
		const importedRows: any[] = [];
		const importErrors: string[] = [];

		try {
			// Pentru importuri mari, folosim batch processing
			const batchSize = 100;
			const batches = [];
			
			for (let i = 0; i < validRows.length; i += batchSize) {
				batches.push(validRows.slice(i, i + batchSize));
			}

			for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
				const batch = batches[batchIndex];
				
				await prisma.$transaction(async (tx: any) => {
					for (let i = 0; i < batch.length; i++) {
						const rowData = batch[i];
						const rowIndex = (batchIndex * batchSize) + i + 1;

						try {
							// Creare rând nou
							const newRow = await tx.row.create({
								data: {
									tableId: Number(tableId),
								},
								select: {
									id: true,
								},
							});

							// Creare celule pentru rând
							const createdCells = [];
							for (const cell of rowData.cells) {
								const column = tableColumns.find(
									(col: any) => Number(col.id) === Number(cell.columnId),
								);
								
								let cellValue = cell.value;
								
								// Pentru referințe, procesează valorile pentru a crea rândurile referențiate
								if (column?.type === "reference" && column?.referenceTableId) {
									cellValue = await processReferenceValue(
										cell.value,
										column,
										column.referenceTableId,
										tx
									);
								}
								
								const createdCell = await tx.cell.create({
									data: {
										rowId: newRow.id,
										columnId: Number(cell.columnId),
										value: cellValue,
									},
								});
								createdCells.push(createdCell);
							}

							// Obține rândul complet cu celulele create
							const completeRow = await tx.row.findUnique({
								where: { id: newRow.id },
								include: {
									cells: true,
								},
							});

							importedRows.push(completeRow);
						} catch (error) {
							importErrors.push(`Row ${rowIndex}: Failed to import - ${error}`);
							throw error; // Rollback tranzacția pentru acest batch
						}
					}
				}, {
					timeout: 30000, // 30 seconds timeout per batch
				});
			}
		} catch (error) {
			console.error("Transaction failed:", error);
			return NextResponse.json(
				{
					error: "Failed to import data",
					details: importErrors,
					summary: {
						totalRows: rows.length,
						validRows: validRows.length,
						importedRows: importedRows.length,
						failedRows: validRows.length - importedRows.length,
					},
				},
				{ status: 500 },
			);
		}

		// Răspuns final
		const response: any = {
			message: `Successfully imported ${importedRows.length} rows`,
			importedRows: importedRows.length,
			importedRowsData: importedRows, // Include the actual row data
			totalRows: rows.length,
			validRows: validRows.length,
			summary: {
				totalRows: rows.length,
				validRows: validRows.length,
				importedRows: importedRows.length,
				invalidRows: rows.length - validRows.length,
				errorTypes: {
					validationErrors: errors.length,
					warnings: warnings.length,
					importErrors: importErrors.length,
				},
			},
		};

		if (warnings.length > 0) {
			response.warnings = warnings;
		}

		if (errors.length > 0) {
			response.errors = errors;
		}

		if (importErrors.length > 0) {
			response.importErrors = importErrors;
		}

		// Status code bazat pe rezultat
		let statusCode = 200;
		if (importErrors.length > 0) {
			statusCode = 207; // Partial success
		} else if (warnings.length > 0 || errors.length > 0) {
			statusCode = 207; // Success with warnings
		}

		return NextResponse.json(response, { status: statusCode });
	} catch (error) {
		console.error("Error importing rows:", error);
		console.error("Error details:", {
			name: error instanceof Error ? error.name : "Unknown",
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{
					error: "Invalid import data",
					details: error.errors,
					code: "VALIDATION_ERROR",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error: "Failed to import rows",
				code: "INTERNAL_ERROR",
				details: error instanceof Error ? error.message : String(error),
			},
			{ status: 500 },
		);
	}
}
