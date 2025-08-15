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
			// Sau poate fi o listă de valori separate cu virgulă
			console.log(`Validating reference value:`, { value, type: typeof value });
			if (typeof value === "string" && value.includes(",")) {
				// Multiple references - validate each individual value
				const refs = value
					.split(",")
					.map((ref) => ref.trim())
					.filter(Boolean);
				console.log(`Validated multiple references:`, refs);
				return refs.length > 0; // Must have at least one valid reference
			}
			// Single reference - any non-empty value is valid
			const isValid = value != null && value !== "";
			console.log(`Single reference validation result:`, isValid);
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
			console.log(`Processing reference value:`, { value, type: typeof value });
			if (typeof value === "string" && value.includes(",")) {
				// Multiple references - split by comma and trim whitespace
				const result = value
					.split(",")
					.map((ref) => ref.trim())
					.filter(Boolean);
				console.log(`Split multiple references:`, result);
				return result;
			}
			// Single reference - return as is
			console.log(`Single reference value:`, value);
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
				order: true,
				referenceTableId: true,
			},
			orderBy: { order: "asc" },
		});

		console.log(`Found table columns:`, tableColumns);

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

		console.log(`Import data:`, {
			totalRows: rows.length,
			sampleRow: rows[0],
			sampleCells: rows[0]?.cells,
		});

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

					console.log(`Processing cell for column '${column.name}':`, {
						columnId: column.id,
						columnType: column.type,
						referenceTableId: column.referenceTableId,
						cellValue: cell.value,
					});

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

					console.log(`Processed value for column '${column.name}':`, {
						originalValue: cell.value,
						processedValue,
						processedValueType: typeof processedValue,
						isArray: Array.isArray(processedValue),
					});

					// Validare referințe - doar pentru valori non-null
					if (
						column.type === "reference" &&
						column.referenceTableId !== null &&
						column.referenceTableId !== undefined &&
						processedValue !== null
					) {
						console.log(
							`Starting reference validation for column '${column.name}':`,
							{
								referenceTableId: column.referenceTableId,
								referenceTableIdType: typeof column.referenceTableId,
								processedValue,
								processedValueType: typeof processedValue,
								isArray: Array.isArray(processedValue),
							},
						);

						try {
							// Verificăm că referenceTableId este valid
							console.log(
								`Raw referenceTableId:`,
								column.referenceTableId,
								`Type:`,
								typeof column.referenceTableId,
							);
							console.log(`Column object:`, column);

							if (
								column.referenceTableId === null ||
								column.referenceTableId === undefined
							) {
								warnings.push(
									`Row ${rowIndex}, Column '${column.name}': Reference table ID is null or undefined`,
								);
								continue;
							}

							// Verificăm tipul de date
							if (
								typeof column.referenceTableId !== "number" &&
								typeof column.referenceTableId !== "string"
							) {
								warnings.push(
									`Row ${rowIndex}, Column '${
										column.name
									}': Reference table ID has invalid type '${typeof column.referenceTableId}'`,
								);
								continue;
							}

							const refTableId = Number(column.referenceTableId);
							console.log(
								`Converted refTableId:`,
								refTableId,
								`IsNaN:`,
								isNaN(refTableId),
							);
							console.log(
								`Original value:`,
								column.referenceTableId,
								`Converted:`,
								refTableId,
							);

							if (isNaN(refTableId) || refTableId <= 0) {
								warnings.push(
									`Row ${rowIndex}, Column '${column.name}': Invalid reference table ID '${column.referenceTableId}'`,
								);
								continue;
							}

							// Verificăm că refTableId este un număr valid
							if (!Number.isInteger(refTableId)) {
								warnings.push(
									`Row ${rowIndex}, Column '${column.name}': Reference table ID must be an integer, got '${refTableId}'`,
								);
								continue;
							}

							console.log(
								`Final refTableId:`,
								refTableId,
								`Type:`,
								typeof refTableId,
							);

							// Mai întâi găsim coloana primară din tabela referențiată
							const query = {
								where: {
									tableId: refTableId as number,
									primary: true,
								},
								select: { id: true, name: true },
							};

							console.log(`Primary column query:`, query);

							const primaryColumn = await prisma.column.findFirst(query);

							console.log(`Found primary column:`, primaryColumn);

							if (!primaryColumn) {
								warnings.push(
									`Row ${rowIndex}, Column '${column.name}': Referenced table has no primary column`,
								);
							} else {
								console.log(`Primary column found:`, {
									id: primaryColumn.id,
									name: primaryColumn.name,
									tableId: refTableId,
								});
								// Handle multiple reference values (arrays)
								if (Array.isArray(processedValue)) {
									// Multiple references - check each one
									if (processedValue.length === 0) {
										warnings.push(
											`Row ${rowIndex}, Column '${column.name}': Empty reference array`,
										);
									} else {
										for (const refValue of processedValue) {
											if (refValue == null || refValue === "") {
												warnings.push(
													`Row ${rowIndex}, Column '${column.name}': Empty reference value in array`,
												);
												continue;
											}

											const referenceQuery = {
												where: {
													tableId: refTableId as number,
													cells: {
														some: {
															columnId: Number(primaryColumn.id),
															value: {
																equals: refValue,
															},
														},
													},
												},
											};

											console.log(`Reference lookup query:`, referenceQuery);

											const referenceExists = await prisma.row.findFirst(
												referenceQuery,
											);

											console.log(`Reference lookup for '${refValue}':`, {
												referenceExists: !!referenceExists,
												tableId: refTableId,
												primaryColumnId: primaryColumn.id,
												query: referenceQuery,
											});

											if (!referenceExists) {
												warnings.push(
													`Row ${rowIndex}, Column '${column.name}': Reference value '${refValue}' not found in referenced table`,
												);
											}
										}
									}
								} else {
									// Single reference - check if exists
									if (processedValue == null || processedValue === "") {
										warnings.push(
											`Row ${rowIndex}, Column '${column.name}': Empty reference value`,
										);
									} else {
										const singleReferenceQuery = {
											where: {
												tableId: refTableId as number,
												cells: {
													some: {
														columnId: Number(primaryColumn.id),
														value: {
															equals: processedValue,
														},
													},
												},
											},
										};

										console.log(
											`Single reference lookup query:`,
											singleReferenceQuery,
										);

										const referenceExists = await prisma.row.findFirst(
											singleReferenceQuery,
										);

										console.log(
											`Single reference lookup for '${processedValue}':`,
											{
												referenceExists: !!referenceExists,
												tableId: refTableId,
												primaryColumnId: primaryColumn.id,
												query: {
													tableId: refTableId as number,
													cells: {
														some: {
															columnId: Number(primaryColumn.id),
															value: processedValue,
														},
													},
												},
											},
										);

										if (!referenceExists) {
											warnings.push(
												`Row ${rowIndex}, Column '${column.name}': Reference value '${processedValue}' not found in referenced table`,
											);
										}
									}
								}
							}
						} catch (error) {
							console.error(
								`Reference validation error for column '${column.name}':`,
								{
									processedValue,
									error: error instanceof Error ? error.message : String(error),
									stack: error instanceof Error ? error.stack : undefined,
									columnDetails: {
										name: column.name,
										type: column.type,
										referenceTableId: column.referenceTableId,
									},
								},
							);
							warnings.push(
								`Row ${rowIndex}, Column '${
									column.name
								}': Error checking reference value '${processedValue}' - ${
									error instanceof Error ? error.message : String(error)
								}`,
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
				} else {
					warnings.push(`Row ${rowIndex}: No valid data found - skipping`);
				}
			} catch (error) {
				errors.push(`Row ${rowIndex}: Processing error - ${error}`);
			}
		}

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

		// Import rânduri în baza de date - folosim tranzacție pentru consistență
		const importedRows: any[] = [];
		const importErrors: string[] = [];

		try {
			await prisma.$transaction(async (tx: any) => {
				console.log(`Starting transaction for ${validRows.length} rows`);

				for (let i = 0; i < validRows.length; i++) {
					const rowData = validRows[i];
					const rowIndex = i + 1;

					try {
						console.log(`Processing row ${rowIndex} in transaction`);

						// Creare rând nou
						const newRow = await tx.row.create({
							data: {
								tableId: Number(tableId),
							},
							select: {
								id: true,
							},
						});

						console.log(`Created row:`, newRow);

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
						throw error; // Rollback tranzacția
					}
				}
			});
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

		console.log(`Import response:`, response);

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

		console.log(`Final status code:`, statusCode);

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
