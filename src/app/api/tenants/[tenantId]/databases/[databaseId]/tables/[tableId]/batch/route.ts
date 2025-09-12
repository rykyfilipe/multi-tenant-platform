/** @format */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuthResponse, requireTenantAccess, getUserId } from "@/lib/session";

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
		const { tenantId, databaseId, tableId } = await params;
		const sessionResult = await requireAuthResponse();
		if (sessionResult instanceof NextResponse) {
			return sessionResult;
		}
		const userId = getUserId(sessionResult);

		// Check tenant access
		const tenantAccessError = requireTenantAccess(sessionResult, tenantId);
		if (tenantAccessError) {
			return tenantAccessError;
		}

		const body = await request.json();
		const { operations }: { operations: BatchOperation[] } = body;

		console.log("🔍 SERVER DEBUG: Batch API called", {
			tenantId,
			databaseId,
			tableId,
			userId,
			operationsCount: operations?.length || 0,
			operations: operations
		});

		if (!Array.isArray(operations)) {
			console.error("❌ SERVER ERROR: Invalid operations format", { operations });
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
			console.log("🔍 SERVER DEBUG: Processing operation", {
				operation: operation.operation,
				data: operation.data
			});

			switch (operation.operation) {
				case "update":
					if ("rowId" in operation.data && "columnId" in operation.data && "cellId" in operation.data) {
						const updateData = operation.data as BatchCellUpdate;
						console.log("🔍 SERVER DEBUG: Adding cell update", {
							rowId: updateData.rowId,
							columnId: updateData.columnId,
							cellId: updateData.cellId,
							value: updateData.value,
							valueType: typeof updateData.value
						});
						cellUpdates.push(updateData);
					}
					break;
				case "create":
					if ("rowId" in operation.data && "columnId" in operation.data && "cellId" in operation.data) {
						const createData = operation.data as BatchCellUpdate;
						console.log("🔍 SERVER DEBUG: Adding cell create", createData);
						cellCreates.push(createData);
					} else if ("cells" in operation.data) {
						console.log("🔍 SERVER DEBUG: Adding row create", operation.data);
						rowCreates.push(operation.data as { cells: any[] });
					}
					break;
				case "delete":
					if ("rowId" in operation.data) {
						console.log("🔍 SERVER DEBUG: Adding row delete", operation.data);
						rowDeletes.push((operation.data as { rowId: string }).rowId);
					}
					break;
			}
		}

		console.log("🔍 SERVER DEBUG: Grouped operations", {
			cellUpdatesCount: cellUpdates.length,
			cellCreatesCount: cellCreates.length,
			rowDeletesCount: rowDeletes.length,
			rowCreatesCount: rowCreates.length,
			cellUpdates: cellUpdates,
			cellCreates: cellCreates
		});

		// Execută operațiile într-o tranzacție
		const result = await prisma.$transaction(async (tx:any) => {
			const results = {
				updatedCells: [] as any[],
				createdCells: [] as any[],
				deletedRows: [] as any[],
				createdRows: [] as any[],
			};

			// Actualizează celulele existente
			for (const update of cellUpdates) {
				console.log("🔍 SERVER DEBUG: Processing cell update", {
					update,
					cellId: update.cellId,
					isVirtual: update.cellId === "virtual"
				});

				if (update.cellId !== "virtual") {
					console.log("🔍 SERVER DEBUG: Updating existing cell", {
						cellId: update.cellId,
						oldValue: "fetching...",
						newValue: update.value,
						newValueType: typeof update.value
					});

					// First, get the current value to compare
					const currentCell = await tx.cell.findUnique({
						where: { id: parseInt(update.cellId) },
						select: { value: true, columnId: true, rowId: true }
					});

					console.log("🔍 SERVER DEBUG: Current cell before update", {
						cellId: update.cellId,
						currentValue: currentCell?.value,
						currentValueType: typeof currentCell?.value,
						newValue: update.value,
						newValueType: typeof update.value,
						columnId: currentCell?.columnId,
						rowId: currentCell?.rowId
					});

					const updatedCell = await tx.cell.update({
						where: { id: parseInt(update.cellId) },
						data: { value: update.value },
						include: {
							column: true,
						},
					});

					console.log("🔍 SERVER DEBUG: Cell updated successfully", {
						cellId: update.cellId,
						updatedValue: updatedCell.value,
						updatedValueType: typeof updatedCell.value
					});

					results.updatedCells.push(updatedCell);
				} else {
					console.log("🔍 SERVER DEBUG: Skipping virtual cell update", {
						update
					});
				}
			}

			// Creează celule noi
			for (const create of cellCreates) {
				console.log("🔍 SERVER DEBUG: Processing cell create", {
					create,
					cellId: create.cellId,
					isVirtual: create.cellId === "virtual"
				});

				if (create.cellId === "virtual") {
					console.log("🔍 SERVER DEBUG: Creating new cell", {
						rowId: create.rowId,
						columnId: create.columnId,
						value: create.value,
						valueType: typeof create.value
					});

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

					console.log("🔍 SERVER DEBUG: New cell created successfully", {
						cellId: newCell.id,
						value: newCell.value,
						valueType: typeof newCell.value,
						columnId: newCell.columnId,
						rowId: newCell.rowId
					});

					results.createdCells.push(newCell);
				} else {
					console.log("🔍 SERVER DEBUG: Skipping non-virtual cell create", {
						create
					});
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

			console.log("🔍 SERVER DEBUG: Transaction completed", {
				results
			});

			return results;
		});

		console.log("🔍 SERVER DEBUG: Batch operations completed successfully", {
			result
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
