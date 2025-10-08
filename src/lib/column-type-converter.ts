/** @format */

/**
 * Column Type Converter
 * Handles safe conversion between different column types
 */

import { ColumnType, ConversionResult } from '@/types/column-conversion';

/**
 * Attempts to convert a value from one type to another
 */
export function attemptConversion(
	value: any,
	fromType: ColumnType,
	toType: ColumnType,
): ConversionResult {
	// Handle NULL/undefined values
	if (value === null || value === undefined || value === '') {
		return {
			success: true,
			newValue: null,
			dataLoss: false,
		};
	}

	// Same type - no conversion needed
	if (fromType === toType) {
		return {
			success: true,
			newValue: value,
			dataLoss: false,
		};
	}

	// Normalize 'text' to 'string'
	const normalizedFromType = fromType === 'text' ? 'string' : fromType;
	const normalizedToType = toType === 'text' ? 'string' : toType;

	const conversionKey = `${normalizedFromType}->${normalizedToType}`;

	// Define all conversion functions
	const conversions: Record<string, (v: any) => ConversionResult> = {
		// ========== STRING CONVERSIONS ==========
		'string->number': (v: string) => {
			const trimmed = String(v).trim();
			if (trimmed === '') return { success: true, newValue: null };

			// Remove common formatting
			const cleaned = trimmed.replace(/[,\s]/g, '');
			const num = Number(cleaned);

			if (isNaN(num)) {
				return {
					success: false,
					newValue: null,
					error: `Cannot convert "${v}" to number`,
				};
			}

			return {
				success: true,
				newValue: num,
				dataLoss: false,
			};
		},

		'string->boolean': (v: string) => {
			const lower = String(v).toLowerCase().trim();

			// True values
			if (['true', '1', 'yes', 'da', 'y', 't'].includes(lower)) {
				return { success: true, newValue: true };
			}

			// False values
			if (['false', '0', 'no', 'nu', 'n', 'f', ''].includes(lower)) {
				return { success: true, newValue: false };
			}

			return {
				success: false,
				newValue: null,
				error: `Cannot convert "${v}" to boolean. Use true/false, yes/no, 1/0`,
			};
		},

		'string->date': (v: string) => {
			const trimmed = String(v).trim();
			if (trimmed === '') return { success: true, newValue: null };

			const date = new Date(trimmed);
			if (isNaN(date.getTime())) {
				return {
					success: false,
					newValue: null,
					error: `Cannot convert "${v}" to date. Use ISO format (YYYY-MM-DD)`,
				};
			}

			return {
				success: true,
				newValue: date.toISOString(),
				dataLoss: false,
			};
		},

		// ========== NUMBER CONVERSIONS ==========
		'number->string': (v: number) => {
			return {
				success: true,
				newValue: String(v),
				dataLoss: false,
			};
		},

		'number->boolean': (v: number) => {
			const isZero = v === 0;
			const isOne = v === 1;

			return {
				success: true,
				newValue: v !== 0,
				dataLoss: !isZero && !isOne,
				warning:
					!isZero && !isOne
						? `Number ${v} converted to ${v !== 0 ? 'true' : 'false'}. Non 0/1 values may lose precision.`
						: undefined,
			};
		},

		'number->date': (v: number) => {
			try {
				// Try to interpret as timestamp
				const date = new Date(v);
				if (isNaN(date.getTime())) {
					return {
						success: false,
						newValue: null,
						error: `Cannot convert number ${v} to date`,
					};
				}

				return {
					success: true,
					newValue: date.toISOString(),
					dataLoss: false,
					warning: 'Number interpreted as Unix timestamp',
				};
			} catch (e) {
				return {
					success: false,
					newValue: null,
					error: `Cannot convert number ${v} to date`,
				};
			}
		},

		// ========== BOOLEAN CONVERSIONS ==========
		'boolean->string': (v: boolean) => {
			return {
				success: true,
				newValue: v ? 'true' : 'false',
				dataLoss: false,
			};
		},

		'boolean->number': (v: boolean) => {
			return {
				success: true,
				newValue: v ? 1 : 0,
				dataLoss: false,
			};
		},

		// ========== DATE CONVERSIONS ==========
		'date->string': (v: string | Date) => {
			try {
				const date = new Date(v);
				if (isNaN(date.getTime())) {
					return {
						success: false,
						newValue: null,
						error: 'Invalid date value',
					};
				}

				return {
					success: true,
					newValue: date.toISOString(),
					dataLoss: false,
				};
			} catch (e) {
				return {
					success: false,
					newValue: null,
					error: 'Invalid date value',
				};
			}
		},

		'date->number': (v: string | Date) => {
			try {
				const date = new Date(v);
				if (isNaN(date.getTime())) {
					return {
						success: false,
						newValue: null,
						error: 'Invalid date value',
					};
				}

				return {
					success: true,
					newValue: date.getTime(),
					dataLoss: false,
					warning: 'Date converted to Unix timestamp',
				};
			} catch (e) {
				return {
					success: false,
					newValue: null,
					error: 'Invalid date value',
				};
			}
		},

		// ========== REFERENCE CONVERSIONS ==========
		'reference->string': (v: any) => {
			// References are stored as IDs or arrays of IDs
			if (Array.isArray(v)) {
				return {
					success: true,
					newValue: v.join(', '),
					dataLoss: true,
					warning: 'Reference IDs converted to comma-separated string',
				};
			}

			return {
				success: true,
				newValue: String(v),
				dataLoss: true,
				warning: 'Reference ID converted to string',
			};
		},

		'reference->number': (v: any) => {
			if (Array.isArray(v)) {
				return {
					success: false,
					newValue: null,
					error: 'Cannot convert multiple references to single number',
				};
			}

			const num = Number(v);
			if (isNaN(num)) {
				return {
					success: false,
					newValue: null,
					error: 'Reference value is not a valid number',
				};
			}

			return {
				success: true,
				newValue: num,
				dataLoss: true,
				warning: 'Reference converted to numeric ID',
			};
		},

		// ========== CUSTOM ARRAY CONVERSIONS ==========
		'customArray->string': (v: any) => {
			if (Array.isArray(v)) {
				return {
					success: true,
					newValue: v.join(', '),
					dataLoss: true,
					warning: 'Array converted to comma-separated string',
				};
			}

			return {
				success: true,
				newValue: String(v),
				dataLoss: false,
			};
		},

		// ========== TO REFERENCE CONVERSIONS ==========
		'string->reference': (v: string) => {
			// Check if it looks like a numeric ID
			const num = Number(v);
			if (!isNaN(num) && num > 0) {
				return {
					success: true,
					newValue: num,
					dataLoss: false,
					warning: 'String converted to reference ID. Verify the reference exists.',
				};
			}

			return {
				success: false,
				newValue: null,
				error: 'Cannot convert non-numeric string to reference',
			};
		},

		'number->reference': (v: number) => {
			if (v > 0 && Number.isInteger(v)) {
				return {
					success: true,
					newValue: v,
					dataLoss: false,
					warning: 'Number converted to reference ID. Verify the reference exists.',
				};
			}

			return {
				success: false,
				newValue: null,
				error: 'Reference ID must be a positive integer',
			};
		},

		// ========== TO CUSTOM ARRAY CONVERSIONS ==========
		'string->customArray': (v: string) => {
			// Try to parse as comma-separated values
			const items = v.split(',').map((item) => item.trim()).filter(Boolean);

			return {
				success: true,
				newValue: items.length > 0 ? items : null,
				dataLoss: false,
				warning: 'String split by commas into array',
			};
		},
	};

	// Get the conversion function
	const converter = conversions[conversionKey];

	if (!converter) {
		// No direct conversion available - try default conversion
		return {
			success: false,
			newValue: null,
			error: `No conversion available from ${fromType} to ${toType}`,
		};
	}

	try {
		return converter(value);
	} catch (error: any) {
		return {
			success: false,
			newValue: null,
			error: `Conversion failed: ${error.message}`,
		};
	}
}

/**
 * Validates if a conversion is safe (no data loss)
 */
export function isConversionSafe(
	fromType: ColumnType,
	toType: ColumnType,
): boolean {
	const safeConversions = [
		'number->string',
		'boolean->string',
		'boolean->number',
		'date->string',
	];

	const conversionKey = `${fromType}->${toType}`;
	return safeConversions.includes(conversionKey);
}

/**
 * Gets a human-readable description of what will happen during conversion
 */
export function getConversionDescription(
	fromType: ColumnType,
	toType: ColumnType,
): string {
	const descriptions: Record<string, string> = {
		'string->number': 'Text will be parsed as numbers. Non-numeric text will fail.',
		'string->boolean': 'Text like "true", "yes", "1" become true. "false", "no", "0" become false.',
		'string->date': 'Text will be parsed as dates (ISO format preferred).',
		'number->string': 'Numbers will be converted to text. Safe conversion.',
		'number->boolean': 'Zero becomes false, all other numbers become true.',
		'number->date': 'Numbers will be interpreted as Unix timestamps.',
		'boolean->string': 'true/false will become "true"/"false" text. Safe conversion.',
		'boolean->number': 'true becomes 1, false becomes 0. Safe conversion.',
		'date->string': 'Dates will be formatted as ISO strings. Safe conversion.',
		'date->number': 'Dates will be converted to Unix timestamps.',
		'reference->string': 'Reference IDs will be converted to text.',
		'reference->number': 'Single reference IDs will be converted to numbers.',
		'customArray->string': 'Arrays will be joined with commas.',
		'string->reference': 'Numeric text will be converted to reference IDs.',
		'number->reference': 'Numbers will be used as reference IDs.',
		'string->customArray': 'Text will be split by commas into array items.',
	};

	const key = `${fromType}->${toType}`;
	return (
		descriptions[key] ||
		`Conversion from ${fromType} to ${toType} may not preserve all data.`
	);
}

