/** @format */

/**
 * Column Type Migrator
 * Executes column type changes with data migration in a safe transaction
 */

import prisma from '@/lib/prisma';
import { attemptConversion } from './column-type-converter';
import {
	ColumnType,
	TypeChangeOptions,
	TypeChangeResult,
	CellConversionLog,
	TypeChangeError,
} from '@/types/column-conversion';

const BATCH_SIZE = 100; // Process cells in batches to avoid memory issues

/**
 * Executes a column type change with data migration
 * All operations are performed in a transaction for safety
 */
export async function executeTypeChange(
	columnId: number,
	newType: ColumnType,
	options: TypeChangeOptions,
): Promise<TypeChangeResult> {
	const startTime = Date.now();

	try {
		return await prisma.$transaction(
			async (tx:any) => {
				// 1. Get column and verify it exists
				const column = await tx.column.findUnique({
					where: { id: columnId },
					include: {
						table: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				});

				if (!column) {
					throw new Error(`Column ${columnId} not found`);
				}

				const oldType = column.type as ColumnType;

				// 2. Get all cells for this column
				const totalCells = await tx.cell.count({
					where: { columnId },
				});

				// Initialize tracking
				const stats = {
					total: totalCells,
					converted: 0,
					deleted: 0,
					nullified: 0,
					lossy: 0,
					failed: 0,
				};

				const conversionLog: CellConversionLog[] = [];

				// 3. Process cells in batches
				let processedCount = 0;

				while (processedCount < totalCells) {
					const cells = await tx.cell.findMany({
						where: { columnId },
						skip: processedCount,
						take: BATCH_SIZE,
						select: {
							id: true,
							rowId: true,
							value: true,
						},
					});

					if (cells.length === 0) break;

					// Process each cell in the batch
					for (const cell of cells) {
						// Skip null/empty values - they remain null
						if (
							cell.value === null ||
							cell.value === undefined ||
							cell.value === ''
						) {
							stats.converted++;
							continue;
						}

						// Attempt conversion
						const result = attemptConversion(cell.value, oldType, newType);

						if (result.success) {
							// Update cell with converted value
							await tx.cell.update({
								where: { id: cell.id },
								data: { value: result.newValue },
							});

							stats.converted++;

							if (result.dataLoss) {
								stats.lossy++;
								conversionLog.push({
									cellId: cell.id,
									rowId: cell.rowId,
									oldValue: cell.value,
									newValue: result.newValue,
									status: 'lossy',
									warning: result.warning,
								});
							} else {
								conversionLog.push({
									cellId: cell.id,
									rowId: cell.rowId,
									oldValue: cell.value,
									newValue: result.newValue,
									status: 'success',
								});
							}
						} else {
							// Conversion failed
							if (options.deleteIncompatible) {
								// Delete the cell
								await tx.cell.delete({
									where: { id: cell.id },
								});

								stats.deleted++;
								conversionLog.push({
									cellId: cell.id,
									rowId: cell.rowId,
									oldValue: cell.value,
									status: 'deleted',
									error: result.error,
								});
							} else if (options.convertToNull) {
								// Convert to NULL
								await tx.cell.update({
									where: { id: cell.id },
									data: { value: null },
								});

								stats.nullified++;
								conversionLog.push({
									cellId: cell.id,
									rowId: cell.rowId,
									oldValue: cell.value,
									newValue: null,
									status: 'nullified',
									error: result.error,
								});
							} else {
								// Not allowed to fail - this shouldn't happen if properly analyzed
								stats.failed++;
								conversionLog.push({
									cellId: cell.id,
									rowId: cell.rowId,
									oldValue: cell.value,
									status: 'failed',
									error: result.error,
								});
							}
						}
					}

					processedCount += cells.length;
				}

				// 4. If there were failures and we're not handling them, throw error
				if (stats.failed > 0) {
					throw new Error(
						`${stats.failed} cells failed conversion and no handling strategy was specified`,
					);
				}

				// 5. Update the column type
				const updatedColumn = await tx.column.update({
					where: { id: columnId },
					data: { type: newType },
				});

				// 6. Create migration log entry (if we add the model to schema)
				// This is optional but recommended for audit trail
				try {
					// Check if ColumnMigrationLog model exists
					if ('columnMigrationLog' in tx) {
						await (tx as any).columnMigrationLog.create({
							data: {
								columnId,
								oldType,
								newType,
								totalCells: stats.total,
								successfulConversions: stats.converted,
								deletedCells: stats.deleted,
								nullifiedCells: stats.nullified,
								lossyConversions: stats.lossy,
								failedCells: stats.failed,
								log: JSON.stringify(conversionLog.slice(0, 100)), // Store first 100 entries
								performedBy: options.userId,
								performedAt: new Date(),
							},
						});
					}
				} catch (e) {
					// Log model doesn't exist yet - that's okay
					console.log('Migration log model not available yet');
				}

				const duration = Date.now() - startTime;

				return {
					success: true,
					column: updatedColumn,
					stats,
					log: conversionLog,
					duration,
				};
			},
			{
				maxWait: 30000, // 30 seconds max wait
				timeout: 60000, // 60 seconds timeout
			},
		);
	} catch (error: any) {
		console.error('Type change failed:', error);

		const typeChangeError: TypeChangeError = {
			code: 'TRANSACTION_FAILED',
			message: error.message || 'Type change transaction failed',
			details: error,
		};

		throw typeChangeError;
	}
}

/**
 * Validates that a type change can be executed safely
 */
export function validateTypeChangeOptions(
	analysis: any,
	options: TypeChangeOptions,
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	// If there are failures, must specify how to handle them
	if (analysis.willFail > 0) {
		if (!options.deleteIncompatible && !options.convertToNull) {
			errors.push(
				'Some cells cannot be converted. You must choose to either delete incompatible cells or convert them to NULL.',
			);
		}
	}

	// If there are lossy conversions, must accept them
	if (analysis.lossyConversion > 0 && !options.acceptLoss) {
		errors.push(
			'Some conversions will result in data loss. You must explicitly accept this by setting acceptLoss: true.',
		);
	}

	// Must be confirmed by user
	if (!options.confirmed) {
		errors.push('Type change must be confirmed by user.');
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Estimates how long a type change will take based on cell count
 */
export function estimateTypeChangeDuration(cellCount: number): {
	seconds: number;
	displayText: string;
} {
	// Rough estimate: ~100 cells per second with conversion logic
	const seconds = Math.ceil(cellCount / 100);

	let displayText: string;
	if (seconds < 60) {
		displayText = `~${seconds} seconds`;
	} else if (seconds < 3600) {
		const minutes = Math.ceil(seconds / 60);
		displayText = `~${minutes} minute${minutes > 1 ? 's' : ''}`;
	} else {
		const hours = Math.ceil(seconds / 3600);
		displayText = `~${hours} hour${hours > 1 ? 's' : ''}`;
	}

	return { seconds, displayText };
}

