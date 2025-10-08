/** @format */

/**
 * Column Type Change Analyzer
 * Analyzes the impact of changing a column's type before execution
 */

import prisma from '@/lib/prisma';
import { attemptConversion, getConversionDescription } from './column-type-converter';
import {
	ColumnType,
	TypeChangeAnalysis,
	ConversionExample,
} from '@/types/column-conversion';

/**
 * Analyzes the impact of changing a column's type
 * Returns detailed information about what will happen to existing data
 */
export async function analyzeTypeChange(
	columnId: number,
	newType: ColumnType,
): Promise<TypeChangeAnalysis> {
	// Get column with sample of cells
	const column = await prisma.column.findUnique({
		where: { id: columnId },
		include: {
			cells: {
				take: 500, // Sample first 500 cells for analysis
				select: {
					id: true,
					rowId: true,
					value: true,
				},
			},
		},
	});

	if (!column) {
		throw new Error(`Column ${columnId} not found`);
	}

	const oldType = column.type as ColumnType;

	// If type hasn't changed, return safe analysis
	if (oldType === newType || (oldType === 'text' && newType === 'string') || (oldType === 'string' && newType === 'text')) {
		const totalCells = await prisma.cell.count({
			where: { columnId },
		});

		return {
			columnId,
			columnName: column.name,
			oldType,
			newType,
			totalCells,
			convertible: totalCells,
			lossyConversion: 0,
			willFail: 0,
			examples: {
				success: [],
				lossy: [],
				fail: [],
			},
			safe: true,
			warnings: [],
		};
	}

	// Count total cells
	const totalCells = await prisma.cell.count({
		where: { columnId },
	});

	// Analyze sample
	const analysis: TypeChangeAnalysis = {
		columnId,
		columnName: column.name,
		oldType,
		newType,
		totalCells,
		convertible: 0,
		lossyConversion: 0,
		willFail: 0,
		examples: {
			success: [],
			lossy: [],
			fail: [],
		},
		safe: true,
		warnings: [],
	};

	// Track unique values to avoid duplicate examples
	const seenSuccessValues = new Set<string>();
	const seenLossyValues = new Set<string>();
	const seenFailValues = new Set<string>();

	// Analyze each cell in sample
	for (const cell of column.cells) {
		// Skip null/empty values
		if (cell.value === null || cell.value === undefined || cell.value === '') {
			analysis.convertible++;
			continue;
		}

		const result = attemptConversion(cell.value, oldType, newType);

		if (result.success && !result.dataLoss) {
			// Clean conversion
			analysis.convertible++;

			// Add to examples if not seen before and we need more examples
			const valueKey = JSON.stringify(cell.value);
			if (
				!seenSuccessValues.has(valueKey) &&
				analysis.examples.success.length < 5
			) {
				seenSuccessValues.add(valueKey);
				analysis.examples.success.push({
					original: cell.value,
					converted: result.newValue,
				});
			}
		} else if (result.success && result.dataLoss) {
			// Lossy conversion
			analysis.lossyConversion++;
			analysis.safe = false;

			const valueKey = JSON.stringify(cell.value);
			if (!seenLossyValues.has(valueKey) && analysis.examples.lossy.length < 5) {
				seenLossyValues.add(valueKey);
				analysis.examples.lossy.push({
					original: cell.value,
					converted: result.newValue,
					warning: result.warning,
				});
			}
		} else {
			// Failed conversion
			analysis.willFail++;
			analysis.safe = false;

			const valueKey = JSON.stringify(cell.value);
			if (!seenFailValues.has(valueKey) && analysis.examples.fail.length < 5) {
				seenFailValues.add(valueKey);
				analysis.examples.fail.push({
					original: cell.value,
					error: result.error,
				});
			}
		}
	}

	// Extrapolate sample results to full dataset
	if (column.cells.length < totalCells) {
		const sampleSize = column.cells.length;
		const ratio = totalCells / sampleSize;

		// Adjust counts proportionally
		const originalConvertible = analysis.convertible;
		const originalLossy = analysis.lossyConversion;
		const originalFail = analysis.willFail;

		analysis.convertible = Math.round(originalConvertible * ratio);
		analysis.lossyConversion = Math.round(originalLossy * ratio);
		analysis.willFail = Math.round(originalFail * ratio);

		// Add warning about extrapolation
		if (ratio > 1.5) {
			analysis.warnings.push(
				`Analysis based on sample of ${sampleSize} cells out of ${totalCells} total. Actual results may vary.`,
			);
		}
	}

	// Add conversion description
	analysis.warnings.push(getConversionDescription(oldType, newType));

	// Add specific warnings based on conversion type
	if (analysis.lossyConversion > 0) {
		analysis.warnings.push(
			`${analysis.lossyConversion} cells will undergo lossy conversion (data may be approximated or simplified).`,
		);
	}

	if (analysis.willFail > 0) {
		analysis.warnings.push(
			`${analysis.willFail} cells cannot be converted and will need special handling.`,
		);
	}

	return analysis;
}

/**
 * Quick check if a type change is risky
 */
export async function isTypeChangeRisky(
	columnId: number,
	newType: ColumnType,
): Promise<boolean> {
	const analysis = await analyzeTypeChange(columnId, newType);
	return !analysis.safe || analysis.willFail > 0 || analysis.lossyConversion > 0;
}

/**
 * Gets a summary message for the analysis
 */
export function getAnalysisSummary(analysis: TypeChangeAnalysis): string {
	if (analysis.safe && analysis.willFail === 0 && analysis.lossyConversion === 0) {
		return `✅ Safe conversion: All ${analysis.totalCells} cells can be converted without data loss.`;
	}

	const parts = [];

	if (analysis.convertible > 0) {
		parts.push(`${analysis.convertible} cells will convert successfully`);
	}

	if (analysis.lossyConversion > 0) {
		parts.push(
			`${analysis.lossyConversion} cells will lose precision or be approximated`,
		);
	}

	if (analysis.willFail > 0) {
		parts.push(`${analysis.willFail} cells cannot be converted`);
	}

	return `⚠️ ${parts.join(', ')}.`;
}

