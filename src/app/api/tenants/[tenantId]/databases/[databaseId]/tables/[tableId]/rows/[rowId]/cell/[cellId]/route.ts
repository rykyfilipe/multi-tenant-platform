/** @format */

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
	checkUserTenantAccess,
	getUserFromRequest,
	verifyLogin,
	checkTableEditPermission,
} from "@/lib/auth";
import { updateMemoryAfterRowChange } from "@/lib/memory-middleware";
import { z } from "zod";

const CellUpdateSchema = z.object({
	value: z.any(),
});

export async function PATCH(
	request: NextRequest,
	{
		params,
	}: {
		params: Promise<{
			tenantId: string;
			databaseId: string;
			tableId: string;
			rowId: string;
			cellId: string;
		}>;
	},
) {
	const { tenantId, databaseId, tableId, rowId, cellId } = await params;
	const logged = verifyLogin(request);
	if (!logged) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const userResult = await getUserFromRequest(request);
	if (userResult instanceof NextResponse) {
		return userResult;
	}

	const { userId, role } = userResult;

	const isMember = await checkUserTenantAccess(userId, Number(tenantId));
	if (!isMember)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	// Check table edit permissions instead of hard-coded role check
	const canEdit = await checkTableEditPermission(
		userId,
		Number(tableId),
		Number(tenantId),
	);
	if (!canEdit)
		return NextResponse.json(
			{ error: "Insufficient permissions to edit this table" },
			{ status: 403 },
		);

	try {
		const body = await request.json();
		const parsedData = CellUpdateSchema.parse(body);

		// Verificăm că celula există și aparține tabelului corect
		const cellWithContext = await prisma.cell.findFirst({
			where: {
				id: Number(cellId),
				rowId: Number(rowId),
				row: {
					tableId: Number(tableId),
					table: {
						databaseId: Number(databaseId),
						database: {
							tenantId: Number(tenantId),
						},
					},
				},
			},
			include: {
				column: true,
				row: {
					select: {
						table: {
							select: {
								databaseId: true,
								database: {
									select: {
										tenantId: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!cellWithContext) {
			return NextResponse.json(
				{ error: "Cell not found or access denied" },
				{ status: 404 },
			);
		}

		// Validate reference column values
		if (cellWithContext.column.type === "reference") {
			// Ensure reference columns always receive array values
			if (!Array.isArray(parsedData.value)) {
				parsedData.value = parsedData.value ? [parsedData.value] : [];
			}

			// Validate reference integrity if referenceTableId is set
			if (cellWithContext.column.referenceTableId) {
				// For reference columns, we now expect primary key values, not row IDs
				// We need to validate that these primary key values exist in the reference table
				const referenceTable = await prisma.table.findFirst({
					where: { id: cellWithContext.column.referenceTableId },
					include: {
						columns: {
							where: { primary: true },
							select: { id: true, name: true, type: true },
						},
					},
				});

				if (referenceTable && referenceTable.columns.length > 0) {
					const primaryColumn = referenceTable.columns[0];

					// Validate each primary key value exists in the reference table
					const validationPromises = parsedData.value.map(
						async (primaryKeyValue: any) => {
							const referenceRow = await prisma.row.findFirst({
								where: {
									tableId: cellWithContext.column.referenceTableId!,
									cells: {
										some: {
											columnId: primaryColumn.id,
											value: {
												equals: primaryKeyValue,
											},
										},
									},
								},
							});
							return { primaryKeyValue, exists: !!referenceRow };
						},
					);

					const validationResults = await Promise.all(validationPromises);
					const invalidValues = validationResults.filter(
						(result) => !result.exists,
					);

					if (invalidValues.length > 0) {
						return NextResponse.json(
							{
								error: `Some referenced primary key values do not exist in the reference table`,
								details: `Invalid values: ${invalidValues
									.map((v) => v.primaryKeyValue)
									.join(", ")}`,
							},
							{ status: 400 },
						);
					}
				}
			}
		}

		// Verificăm permisiunile pentru utilizatorii non-admin (doar dacă e necesar)
		if (role !== "ADMIN") {
			const hasPermission = await prisma.tablePermission.findFirst({
				where: {
					userId: userId,
					tableId: Number(tableId),
					canEdit: true,
				},
				select: { id: true }, // Selectăm doar ID pentru performanță
			});

			if (!hasPermission) {
				return NextResponse.json({ error: "Access denied" }, { status: 403 });
			}
		}

		// Actualizăm celula (optimized: returnăm doar datele necesare)
		const updatedCell = await prisma.cell.update({
			where: {
				id: Number(cellId),
			},
			data: {
				value: parsedData.value,
			},
			select: {
				id: true,
				value: true,
				rowId: true,
				columnId: true,
				column: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
		});

		// Optimized: Actualizăm memoria după actualizarea celulei doar dacă e necesar
		// Pentru o singură celulă, această operație ar putea fi amânată sau evitată
		// Se poate face async fără să aștepte utilizatorul
		updateMemoryAfterRowChange(Number(tenantId)).catch((error) => {
			console.error("Error updating memory cache:", error);
		});

		return NextResponse.json(updatedCell);
	} catch (error) {
		console.error("Error updating cell:", error);
		return NextResponse.json(
			{ error: "Failed to update cell" },
			{ status: 500 },
		);
	}
}
