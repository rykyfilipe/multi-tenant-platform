/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyLogin } from "@/lib/auth";
import { getUserFromRequest } from "@/lib/auth";
import { checkUserTenantAccess } from "@/lib/auth";

interface BatchCellUpdate {
	rowId: string;
	columnId: string;
	cellId: string;
	value: any;
}

interface BatchOperation {
	operation: "update" | "create" | "delete";
	data: BatchCellUpdate | { rowId: string } | { cells: any[] };
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ tenantId: string; databaseId: string; tableId: string }> }
) {
	try {
		const logged = verifyLogin(request);
		if (!logged) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { tenantId, databaseId, tableId } = await params;
		const userResult = await getUserFromRequest(request);
		
		if (userResult instanceof NextResponse) {
			return userResult;
		}

		const { userId } = userResult;

		// Verifică că user-ul este membru în tenant
		const isMember = await checkUserTenantAccess(userId, Number(tenantId));
		if (!isMember) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { operations }: { operations: BatchOperation[] } = body;

		if (!Array.isArray(operations)) {
			return NextResponse.json(
				{ error: "Invalid operations format" },
				{ status: 400 }
			);
		}

		// Grupează operațiile pe tip
		const cellUpdates: BatchCellUpdate[] = [];
		const cellCreates: BatchCellUpdate[] = [];
		const rowDeletes: string[] = [];
		const rowCreates: { cells: any[] }[] = [];

		for (const operation of operations) {
			switch (operation.operation) {
				case "update":
					if ("rowId" in operation.data && "columnId" in operation.data && "cellId" in operation.data) {
						cellUpdates.push(operation.data as BatchCellUpdate);
					}
					break;
				case "create":
					if ("rowId" in operation.data && "columnId" in operation.data && "cellId" in operation.data) {
						cellCreates.push(operation.data as BatchCellUpdate);
					} else if ("cells" in operation.data) {
						rowCreates.push(operation.data as { cells: any[] });
					}
					break;
				case "delete":
					if ("rowId" in operation.data) {
						rowDeletes.push((operation.data as { rowId: string }).rowId);
					}
					break;
			}
		}

		// Execută operațiile într-o tranzacție
		const result = await prisma.$transaction(async (tx) => {
			const results = {
				updatedCells: [] as any[],
				createdCells: [] as any[],
				deletedRows: [] as any[],
				createdRows: [] as any[],
			};

			// Actualizează celulele existente
			for (const update of cellUpdates) {
				if (update.cellId !== "virtual") {
					const updatedCell = await tx.cell.update({
						where: { id: parseInt(update.cellId) },
						data: { value: update.value },
						include: {
							column: true,
						},
					});
					results.updatedCells.push(updatedCell);
				}
			}

			// Creează celule noi
			for (const create of cellCreates) {
				if (create.cellId === "virtual") {
					const newCell = await tx.cell.create({
						data: {
							rowId: parseInt(create.rowId),
							columnId: parseInt(create.columnId),
							value: create.value,
						},
						include: {
							column: true,
						},
					});
					results.createdCells.push(newCell);
				}
			}

			// Șterge rândurile
			for (const rowId of rowDeletes) {
				// Șterge mai întâi celulele
				await tx.cell.deleteMany({
					where: { rowId: parseInt(rowId) },
				});

				// Apoi șterge rândul
				const deletedRow = await tx.row.delete({
					where: { id: parseInt(rowId) },
				});
				results.deletedRows.push(deletedRow);
			}

			// Creează rânduri noi
			for (const rowCreate of rowCreates) {
				const newRow = await tx.row.create({
					data: {
						tableId: parseInt(tableId),
						createdAt: new Date(),
					},
				});

				// Creează celulele pentru rândul nou
				const cells = await Promise.all(
					rowCreate.cells.map((cell: any) =>
						tx.cell.create({
							data: {
								rowId: newRow.id,
								columnId: parseInt(cell.columnId),
								value: cell.value,
							},
							include: {
								column: true,
							},
						})
					)
				);

				results.createdRows.push({
					...newRow,
					cells,
				});
			}

			return results;
		});

		return NextResponse.json({
			success: true,
			message: "Batch operations completed successfully",
			data: result,
		});

	} catch (error: any) {
		console.error("Error in batch operations:", error);
		return NextResponse.json(
			{ 
				error: "Failed to complete batch operations",
				details: error.message 
			},
			{ status: 500 }
		);
	}
}
