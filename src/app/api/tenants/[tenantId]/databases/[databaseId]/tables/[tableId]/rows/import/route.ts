/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
} from "@/lib/auth";
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
			// Validarea se face la nivel de existență în tabela referențiată
			return true;
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
			// Pentru reference, păstrăm valoarea originală (poate fi string, number, etc.)
			// Validarea se face la nivel de existență în tabela referențiată
			return value;
		default:
			return value;
	}
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
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	// Verificare acces tenant
	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
		if (role !== "ADMIN") {
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
				customOptions: true,
				referenceTableId: true,
				order: true,
			},
			orderBy: { order: "asc" },
		});

		console.log("Table columns:", JSON.stringify(tableColumns, null, 2));

		// Parsare body request
		const body = await request.json();
		console.log("Import request body:", JSON.stringify(body, null, 2));

		const validatedData = ImportSchema.parse(body);
		console.log("Validated data:", JSON.stringify(validatedData, null, 2));

		const { rows } = validatedData;
		if (!rows || rows.length === 0) {
			return NextResponse.json(
				{ error: "No rows provided for import" },
				{ status: 400 },
			);
		}

		console.log(`Processing ${rows.length} rows for import`);

		// Procesare rânduri direct (nu mai este nevoie de parsare CSV)
		const dataRows = rows;
		const validRows: any[] = [];
		const warnings: string[] = [];
		const errors: string[] = [];

		for (let i = 0; i < dataRows.length; i++) {
			const rowData = dataRows[i];
			const rowIndex = i + 1;

			console.log(
				`Processing row ${rowIndex}:`,
				JSON.stringify(rowData, null, 2),
			);

			try {
				// Verificare că rândul are celule
				if (!rowData.cells || !Array.isArray(rowData.cells)) {
					console.log(
						`Row ${rowIndex}: Invalid cell structure - cells:`,
						rowData.cells,
					);
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
					console.log(`Row ${rowIndex}: No valid cells found`);
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
					console.log(`Row ${rowIndex}, Cell:`, JSON.stringify(cell, null, 2));

					// Skip empty cells
					if (
						cell.value === null ||
						cell.value === undefined ||
						cell.value === ""
					) {
						console.log(
							`Row ${rowIndex}: Skipping empty cell for column ${cell.columnId}`,
						);
						continue;
					}

					const column = tableColumns.find(
						(col: any) => Number(col.id) === Number(cell.columnId),
					);
					if (!column) {
						console.log(
							`Row ${rowIndex}: Column ID ${Number(
								cell.columnId,
							)} not found in table columns`,
						);
						errors.push(
							`Row ${rowIndex}: Unknown column ID ${Number(cell.columnId)}`,
						);
						continue;
					}

					console.log(
						`Row ${rowIndex}, Column found:`,
						JSON.stringify(column, null, 2),
					);

					// Validare tip de date
					console.log(
						`Row ${rowIndex}, Column '${column.name}': Validating value '${cell.value}' for type '${column.type}'`,
					);

					if (
						!validateCellValue(cell.value, column.type, column.customOptions)
					) {
						console.log(
							`Row ${rowIndex}, Column '${column.name}': Validation failed for value '${cell.value}' and type '${column.type}'`,
						);
						errors.push(
							`Row ${rowIndex}, Column '${column.name}': Invalid value '${cell.value}' for type '${column.type}'`,
						);
						continue;
					}

					console.log(
						`Row ${rowIndex}, Column '${column.name}': Validation passed`,
					);

					// Procesare valoare
					const processedValue = processCellValue(cell.value, column.type);

					// Validare referințe - doar pentru valori non-null
					if (
						column.type === "reference" &&
						column.referenceTableId !== null &&
						processedValue !== null
					) {
						try {
							console.log(
								`Row ${rowIndex}, Column '${column.name}': Checking reference value '${processedValue}' in table ${column.referenceTableId}`,
							);

							// Mai întâi găsim coloana primară din tabela referențiată
							const primaryColumn = await prisma.column.findFirst({
								where: {
									tableId: Number(column.referenceTableId),
									primary: true,
								},
								select: { id: true, name: true },
							});

							console.log(
								`Row ${rowIndex}, Column '${column.name}': Primary column found:`,
								JSON.stringify(primaryColumn, null, 2),
							);

							if (!primaryColumn) {
								console.warn(
									`No primary column found in referenced table ${Number(
										column.referenceTableId,
									)}`,
								);
								warnings.push(
									`Row ${rowIndex}, Column '${column.name}': Referenced table has no primary column`,
								);
							} else {
								// Căutăm rândul care are valoarea în coloana primară
								const referenceExists = await prisma.row.findFirst({
									where: {
										tableId: Number(column.referenceTableId),
										cells: {
											some: {
												columnId: Number(primaryColumn.id),
												value: {
													equals: processedValue,
												},
											},
										},
									},
								});

								console.log(
									`Row ${rowIndex}, Column '${column.name}': Reference search result:`,
									JSON.stringify(referenceExists, null, 2),
								);

								if (!referenceExists) {
									console.warn(
										`Row ${rowIndex}, Column '${column.name}': Reference value '${processedValue}' not found in referenced table`,
									);
									// Pentru moment, să permitem importul cu avertismente în loc de erori
									warnings.push(
										`Row ${rowIndex}, Column '${column.name}': Reference value '${processedValue}' not found in referenced table`,
									);
									// Continuăm cu importul - poate fi o referință validă care nu există încă
								}
							}
						} catch (error) {
							console.error(
								`Error checking reference for column ${column.name}:`,
								error,
							);
							warnings.push(
								`Row ${rowIndex}, Column '${column.name}': Error checking reference value '${processedValue}'`,
							);
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
					console.log(
						`Row ${rowIndex}: Added to valid rows with ${validCells.length} cells`,
					);
				} else {
					warnings.push(`Row ${rowIndex}: No valid data found - skipping`);
				}
			} catch (error) {
				console.error(`Error processing row ${rowIndex}:`, error);
				errors.push(`Row ${rowIndex}: Processing error - ${error}`);
			}
		}

		console.log(
			`Processing complete: ${validRows.length} valid rows, ${errors.length} errors, ${warnings.length} warnings`,
		);

		// Dacă sunt prea multe erori, nu continuăm cu importul
		if (errors.length > 0 && errors.length >= validRows.length) {
			return NextResponse.json(
				{
					error: "Too many validation errors - import cancelled",
					details: errors.slice(0, 10),
					totalErrors: errors.length,
					warnings: warnings,
					summary: {
						totalRows: rows.length,
						validRows: validRows.length,
						invalidRows: rows.length - validRows.length,
						errorCount: errors.length,
						warningCount: warnings.length,
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

		console.log(`Starting database import for ${validRows.length} rows`);

		// Import rânduri în baza de date - folosim tranzacție pentru consistență
		const importedRows: any[] = [];
		const importErrors: string[] = [];

		try {
			await prisma.$transaction(async (tx: any) => {
				for (let i = 0; i < validRows.length; i++) {
					const rowData = validRows[i];
					const rowIndex = i + 1;

					try {
						console.log(
							`Importing row ${rowIndex}:`,
							JSON.stringify(rowData, null, 2),
						);

						// Creare rând nou
						const newRow = await tx.row.create({
							data: {
								tableId: Number(tableId),
							},
							select: {
								id: true,
							},
						});

						console.log(`Created row with ID: ${newRow.id}`);

						// Creare celule pentru rând
						const createdCells = [];
						for (const cell of rowData.cells) {
							const createdCell = await tx.cell.create({
								data: {
									rowId: newRow.id,
									columnId: Number(cell.columnId),
									value: cell.value,
								},
							});
							createdCells.push(createdCell);
							console.log(
								`Created cell: column ${cell.columnId}, value: ${cell.value}`,
							);
						}

						// Obține rândul complet cu celulele create
						const completeRow = await tx.row.findUnique({
							where: { id: newRow.id },
							include: {
								cells: true,
							},
						});

						importedRows.push(completeRow);
						console.log(
							`Successfully imported row ${rowIndex} with ID ${newRow.id}`,
						);
					} catch (error) {
						console.error(`Failed to import row ${rowIndex}:`, error);
						importErrors.push(`Row ${rowIndex}: Failed to import - ${error}`);
						throw error; // Rollback tranzacția
					}
				}
			});

			console.log(
				`Transaction completed successfully. Imported ${importedRows.length} rows`,
			);
		} catch (error) {
			console.error("Transaction failed:", error);
			return NextResponse.json(
				{
					error: "Failed to import data",
					details: importErrors,
					summary: {
						totalRows: rows.length,
						validRows: validRows.length,
						importedRows: 0,
						failedRows: validRows.length,
					},
				},
				{ status: 500 },
			);
		}

		// Răspuns final
		const response: any = {
			message: `Successfully imported ${importedRows.length} rows`,
			importedRows: importedRows.length,
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

		console.log(
			"Import completed:",
			JSON.stringify(
				{
					importedRows: importedRows.length,
					totalRows: rows.length,
					statusCode,
				},
				null,
				2,
			),
		);

		return NextResponse.json(response, { status: statusCode });
	} catch (error) {
		console.error("Error importing rows:", error);

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
