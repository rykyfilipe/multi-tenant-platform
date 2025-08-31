/** @format */

/**
 * Database Transaction Management Module
 * Provides consistent transaction handling and rollback mechanisms
 */

import prisma from "./prisma";
import { PrismaClient } from "@/generated/prisma/index";

// Transaction options
export interface TransactionOptions {
	maxWait?: number; // Maximum time to wait for a transaction slot (in ms)
	timeout?: number; // Maximum time the transaction can run (in ms)
	isolationLevel?:
		| "ReadUncommitted"
		| "ReadCommitted"
		| "RepeatableRead"
		| "Serializable";
}

// Default transaction options
const DEFAULT_TRANSACTION_OPTIONS: TransactionOptions = {
	maxWait: 2000, // 2 seconds
	timeout: 5000, // 5 seconds
	isolationLevel: "ReadCommitted",
};

// Transaction result wrapper
export interface TransactionResult<T> {
	success: boolean;
	data?: T;
	error?: Error;
	rollbackReason?: string;
}

// Transaction manager class
export class TransactionManager {
	/**
	 * Execute operations within a database transaction
	 */
	static async execute<T>(
		operations: (tx: PrismaClient) => Promise<T>,
		options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS,
	): Promise<TransactionResult<T>> {
		try {
			const data = await prisma.$transaction(operations, {
				maxWait: options.maxWait || DEFAULT_TRANSACTION_OPTIONS.maxWait,
				timeout: options.timeout || DEFAULT_TRANSACTION_OPTIONS.timeout,
				isolationLevel:
					options.isolationLevel || DEFAULT_TRANSACTION_OPTIONS.isolationLevel,
			});

			return {
				success: true,
				data,
			};
		} catch (error) {
			console.error("Transaction failed:", error);

			return {
				success: false,
				error: error instanceof Error ? error : new Error(String(error)),
				rollbackReason: error instanceof Error ? error.message : String(error),
			};
		}
	}

	/**
	 * Execute operations with automatic retry on deadlock
	 */
	static async executeWithRetry<T>(
		operations: (tx: PrismaClient) => Promise<T>,
		maxRetries = 3,
		options: TransactionOptions = DEFAULT_TRANSACTION_OPTIONS,
	): Promise<TransactionResult<T>> {
		let lastError: Error | undefined;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			const result = await this.execute(operations, options);

			if (result.success) {
				return result;
			}

			lastError = result.error;

			// Check if error is retryable (deadlock, timeout, etc.)
			if (this.isRetryableError(result.error)) {
				console.warn(
					`Transaction attempt ${attempt} failed, retrying...`,
					result.error?.message,
				);

				// Exponential backoff
				if (attempt < maxRetries) {
					await this.delay(Math.pow(2, attempt - 1) * 100);
				}
				continue;
			}

			// Non-retryable error, return immediately
			return result;
		}

		return {
			success: false,
			error: lastError || new Error("Transaction failed after maximum retries"),
			rollbackReason: `Failed after ${maxRetries} attempts`,
		};
	}

	/**
	 * Check if error is retryable
	 */
	private static isRetryableError(error?: Error): boolean {
		if (!error) return false;

		const retryableErrorCodes = [
			"P2034", // Transaction conflict
			"P2037", // Too many database connections
			"P1017", // Server has closed the connection
			"P1008", // Operations timed out
		];

		const errorMessage = error.message.toLowerCase();

		return (
			retryableErrorCodes.some((code) => error.message.includes(code)) ||
			errorMessage.includes("deadlock") ||
			errorMessage.includes("timeout") ||
			errorMessage.includes("connection") ||
			errorMessage.includes("serialization failure")
		);
	}

	/**
	 * Delay utility for retry backoff
	 */
	private static delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Specialized transaction handlers for common operations

/**
 * Handle row creation with cells in a transaction
 */
export async function createRowWithCellsTransaction(
	tableId: number,
	cellsData: Array<{ columnId: number; value: any }>,
): Promise<TransactionResult<{ row: any; cells: any[] }>> {
	return TransactionManager.execute(async (tx) => {
		// Create the row
		const row = await tx.row.create({
			data: { tableId },
		});

		// Create all cells
		const cells = await Promise.all(
			cellsData.map((cellData) =>
				tx.cell.create({
					data: {
						rowId: row.id,
						columnId: cellData.columnId,
						value: cellData.value,
					},
				}),
			),
		);

		return { row, cells };
	});
}

/**
 * Handle row update with cells in a transaction
 */
export async function updateRowWithCellsTransaction(
	rowId: number,
	cellUpdates: Array<{ cellId: number; value: any }>,
	newCells?: Array<{ columnId: number; value: any }>,
): Promise<
	TransactionResult<{ row: any; updatedCells: any[]; newCells: any[] }>
> {
	return TransactionManager.execute(async (tx) => {
		// Get the row to ensure it exists
		const row = await tx.row.findUniqueOrThrow({
			where: { id: rowId },
		});

		// Update existing cells
		const updatedCells = await Promise.all(
			cellUpdates.map((update) =>
				tx.cell.update({
					where: { id: update.cellId },
					data: { value: update.value },
				}),
			),
		);

		// Create new cells if provided
		const createdCells = newCells
			? await Promise.all(
					newCells.map((cellData) =>
						tx.cell.create({
							data: {
								rowId: row.id,
								columnId: cellData.columnId,
								value: cellData.value,
							},
						}),
					),
			  )
			: [];

		return {
			row,
			updatedCells,
			newCells: createdCells,
		};
	});
}

/**
 * Handle row deletion with cascade in a transaction
 */
export async function deleteRowTransaction(
	rowId: number,
): Promise<TransactionResult<{ deletedRow: any; deletedCellsCount: number }>> {
	return TransactionManager.execute(async (tx) => {
		// Delete all cells first
		const deletedCells = await tx.cell.deleteMany({
			where: { rowId },
		});

		// Delete the row
		const deletedRow = await tx.row.delete({
			where: { id: rowId },
		});

		return {
			deletedRow,
			deletedCellsCount: deletedCells.count,
		};
	});
}

/**
 * Handle table deletion with cascade in a transaction
 */
export async function deleteTableTransaction(tableId: number): Promise<
	TransactionResult<{
		deletedTable: any;
		deletedRowsCount: number;
		deletedCellsCount: number;
		deletedColumnsCount: number;
	}>
> {
	return TransactionManager.execute(async (tx) => {
		// Delete all cells
		const deletedCells = await tx.cell.deleteMany({
			where: {
				row: { tableId },
			},
		});

		// Delete all rows
		const deletedRows = await tx.row.deleteMany({
			where: { tableId },
		});

		// Delete all columns
		const deletedColumns = await tx.column.deleteMany({
			where: { tableId },
		});

		// Delete table permissions
		await tx.tablePermission.deleteMany({
			where: { tableId },
		});

		// Delete column permissions
		await tx.columnPermission.deleteMany({
			where: { tableId },
		});

		// Delete the table
		const deletedTable = await tx.table.delete({
			where: { id: tableId },
		});

		return {
			deletedTable,
			deletedRowsCount: deletedRows.count,
			deletedCellsCount: deletedCells.count,
			deletedColumnsCount: deletedColumns.count,
		};
	});
}

/**
 * Handle user deletion with cascade in a transaction
 */
export async function deleteUserTransaction(userId: number): Promise<
	TransactionResult<{
		deletedUser: any;
		deletedPermissionsCount: number;
		deletedSessionsCount: number;
		deletedAccountsCount: number;
	}>
> {
	return TransactionManager.execute(async (tx) => {
		// Delete permissions
		const deletedTablePermissions = await tx.tablePermission.deleteMany({
			where: { userId },
		});

		const deletedColumnPermissions = await tx.columnPermission.deleteMany({
			where: { userId },
		});

		// Delete sessions
		const deletedSessions = await tx.session.deleteMany({
			where: { userId },
		});

		// Delete accounts
		const deletedAccounts = await tx.account.deleteMany({
			where: { userId },
		});

		// Delete the user
		const deletedUser = await tx.user.delete({
			where: { id: userId },
		});

		return {
			deletedUser,
			deletedPermissionsCount:
				deletedTablePermissions.count + deletedColumnPermissions.count,
			deletedSessionsCount: deletedSessions.count,
			deletedAccountsCount: deletedAccounts.count,
		};
	});
}

/**
 * Handle bulk row import in a transaction
 */
export async function bulkImportRowsTransaction(
	tableId: number,
	rowsData: Array<{ cells: Array<{ columnId: number; value: any }> }>,
): Promise<TransactionResult<{ importedRows: any[]; totalCells: number }>> {
	return TransactionManager.execute(
		async (tx) => {
			const importedRows = [];
			let totalCells = 0;

			for (const rowData of rowsData) {
				// Create row
				const row = await tx.row.create({
					data: { tableId },
				});

				// Create cells for this row
				const cells = await Promise.all(
					rowData.cells.map((cellData) =>
						tx.cell.create({
							data: {
								rowId: row.id,
								columnId: cellData.columnId,
								value: cellData.value,
							},
						}),
					),
				);

				importedRows.push({ ...row, cells });
				totalCells += cells.length;
			}

			return {
				importedRows,
				totalCells,
			};
		},
		{
			timeout: 30000, // 30 seconds for bulk operations
			maxWait: 5000, // 5 seconds wait
		},
	);
}

/**
 * Handle tenant setup in a transaction
 */
export async function createTenantTransaction(
	tenantData: any,
	adminData: any,
): Promise<TransactionResult<{ tenant: any; admin: any; database: any }>> {
	return TransactionManager.execute(async (tx) => {
		// Create admin user
		const admin = await tx.user.create({
			data: adminData,
		});

		// Create tenant with admin
		const tenant = await tx.tenant.create({
			data: {
				...tenantData,
				adminId: admin.id,
			},
		});

		// Update user with tenant reference
		await tx.user.update({
			where: { id: admin.id },
			data: { tenantId: tenant.id },
		});

		// Create default database
		const database = await tx.database.create({
			data: {
				name: "Main Database",
				tenantId: tenant.id,
			},
		});

		return { tenant, admin, database };
	});
}

// Export default instance
export default TransactionManager;
