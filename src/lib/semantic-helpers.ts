/** @format */

import { SemanticColumnType } from "./semantic-types";

/**
 * Extract data from a table's columns based on semantic types
 * This makes the system work regardless of column names
 */

export interface SemanticDataExtractor {
	getValue: (semanticType: SemanticColumnType) => any;
	hasSemanticType: (semanticType: SemanticColumnType) => boolean;
	getColumnName: (semanticType: SemanticColumnType) => string | null;
	getAllSemanticTypes: () => SemanticColumnType[];
}

/**
 * Create a semantic data extractor for a table row
 */
export function createSemanticExtractor(
	tableColumns: any[],
	rowCells: any[],
): SemanticDataExtractor {
	// Create a map of semantic type to column
	const semanticColumnMap = new Map<SemanticColumnType, any>();
	const columnNameMap = new Map<SemanticColumnType, string>();

	// Build the mapping
	tableColumns.forEach((column) => {
		if (column.semanticType) {
			semanticColumnMap.set(column.semanticType, column);
			columnNameMap.set(column.semanticType, column.name);
		}
	});

	// Create a map of column ID to cell value
	const cellValueMap = new Map<number, any>();
	rowCells.forEach((cell) => {
		cellValueMap.set(cell.columnId, cell.value);
	});

	return {
		/**
		 * Get value for a specific semantic type
		 */
		getValue: (semanticType: SemanticColumnType): any => {
			const column = semanticColumnMap.get(semanticType);
			if (!column) return null;

			const cellValue = cellValueMap.get(column.id);
			return cellValue;
		},

		/**
		 * Check if the table has a specific semantic type
		 */
		hasSemanticType: (semanticType: SemanticColumnType): boolean => {
			return semanticColumnMap.has(semanticType);
		},

		/**
		 * Get the actual column name for a semantic type
		 */
		getColumnName: (semanticType: SemanticColumnType): string | null => {
			return columnNameMap.get(semanticType) || null;
		},

		/**
		 * Get all available semantic types in this table
		 */
		getAllSemanticTypes: (): SemanticColumnType[] => {
			return Array.from(semanticColumnMap.keys());
		},
	};
}

/**
 * Extract product details using semantic types
 */
export function extractProductDetails(
	tableColumns: any[],
	rowCells: any[],
): any {
	const extractor = createSemanticExtractor(tableColumns, rowCells);

	return {
		id:
			extractor.getValue(SemanticColumnType.ID) ||
			extractor.getValue(SemanticColumnType.REFERENCE),
		name:
			extractor.getValue(SemanticColumnType.PRODUCT_NAME) ||
			extractor.getValue(SemanticColumnType.NAME),
		description:
			extractor.getValue(SemanticColumnType.PRODUCT_DESCRIPTION) ||
			extractor.getValue(SemanticColumnType.DESCRIPTION),
		price:
			extractor.getValue(SemanticColumnType.PRODUCT_PRICE) ||
			extractor.getValue(SemanticColumnType.PRICE) ||
			extractor.getValue(SemanticColumnType.UNIT_PRICE),
		vat: (() => {
			const vatValue = extractor.getValue(SemanticColumnType.PRODUCT_VAT);
			if (vatValue === null || vatValue === undefined || vatValue === "")
				return 0;
			const numericVat =
				typeof vatValue === "string" ? parseFloat(vatValue) : Number(vatValue);
			return isNaN(numericVat) ? 0 : numericVat;
		})(),
		currency: extractor.getValue(SemanticColumnType.CURRENCY),
		unitOfMeasure: extractor.getValue(SemanticColumnType.UNIT_OF_MEASURE),
		sku:
			extractor.getValue(SemanticColumnType.PRODUCT_SKU) ||
			extractor.getValue(SemanticColumnType.CODE),
		category: extractor.getValue(SemanticColumnType.PRODUCT_CATEGORY),
		brand: extractor.getValue(SemanticColumnType.PRODUCT_BRAND),
		weight: extractor.getValue(SemanticColumnType.PRODUCT_WEIGHT),
		dimensions: extractor.getValue(SemanticColumnType.PRODUCT_DIMENSIONS),
		image: extractor.getValue(SemanticColumnType.PRODUCT_IMAGE),
		status:
			extractor.getValue(SemanticColumnType.PRODUCT_STATUS) ||
			extractor.getValue(SemanticColumnType.STATUS),

		// Metadata about what semantic types are available
		hasName:
			extractor.hasSemanticType(SemanticColumnType.PRODUCT_NAME) ||
			extractor.hasSemanticType(SemanticColumnType.NAME),
		hasPrice:
			extractor.hasSemanticType(SemanticColumnType.PRODUCT_PRICE) ||
			extractor.hasSemanticType(SemanticColumnType.PRICE),
		hasDescription:
			extractor.hasSemanticType(SemanticColumnType.PRODUCT_DESCRIPTION) ||
			extractor.hasSemanticType(SemanticColumnType.DESCRIPTION),

		// Available semantic types
		availableSemanticTypes: extractor.getAllSemanticTypes(),
	};
}

/**
 * Extract customer details using semantic types
 */
export function extractCustomerDetails(
	tableColumns: any[],
	rowCells: any[],
): any {
	const extractor = createSemanticExtractor(tableColumns, rowCells);

	return {
		id:
			extractor.getValue(SemanticColumnType.ID) ||
			extractor.getValue(SemanticColumnType.REFERENCE),
		name:
			extractor.getValue(SemanticColumnType.CUSTOMER_NAME) ||
			extractor.getValue(SemanticColumnType.NAME),
		email:
			extractor.getValue(SemanticColumnType.CUSTOMER_EMAIL) ||
			extractor.getValue(SemanticColumnType.EMAIL),
		phone:
			extractor.getValue(SemanticColumnType.CUSTOMER_PHONE) ||
			extractor.getValue(SemanticColumnType.PHONE),
		address:
			extractor.getValue(SemanticColumnType.CUSTOMER_ADDRESS) ||
			extractor.getValue(SemanticColumnType.ADDRESS),
		city: extractor.getValue(SemanticColumnType.CUSTOMER_CITY),
		country: extractor.getValue(SemanticColumnType.CUSTOMER_COUNTRY),
		postalCode: extractor.getValue(SemanticColumnType.CUSTOMER_POSTAL_CODE),

		// Metadata
		hasName:
			extractor.hasSemanticType(SemanticColumnType.CUSTOMER_NAME) ||
			extractor.hasSemanticType(SemanticColumnType.NAME),
		hasEmail:
			extractor.hasSemanticType(SemanticColumnType.CUSTOMER_EMAIL) ||
			extractor.hasSemanticType(SemanticColumnType.EMAIL),

		// Available semantic types
		availableSemanticTypes: extractor.getAllSemanticTypes(),
	};
}

/**
 * Validate if a table has required semantic types for invoices
 */
export function validateTableForInvoices(
	tableColumns: any[],
	tableName: string,
): {
	isValid: boolean;
	missingTypes: SemanticColumnType[];
	warnings: string[];
} {
	const extractor = createSemanticExtractor(tableColumns, []);
	const warnings: string[] = [];

	// Required semantic types for products
	const requiredProductTypes = [
		SemanticColumnType.PRODUCT_NAME,
		SemanticColumnType.PRODUCT_PRICE,
		SemanticColumnType.PRODUCT_VAT,
		SemanticColumnType.CURRENCY,
		SemanticColumnType.UNIT_OF_MEASURE,
	];

	// Check for required types
	const missingTypes = requiredProductTypes.filter(
		(type) => !extractor.hasSemanticType(type),
	);

	// Check for recommended types
	const recommendedTypes = [
		SemanticColumnType.PRODUCT_DESCRIPTION,
		SemanticColumnType.PRODUCT_SKU,
		SemanticColumnType.PRODUCT_CATEGORY,
	];

	const missingRecommended = recommendedTypes.filter(
		(type) => !extractor.hasSemanticType(type),
	);

	if (missingRecommended.length > 0) {
		warnings.push(
			`Table "${tableName}" doesn't have columns for: ${missingRecommended
				.map((type) => type.replace("product_", "").replace("_", " "))
				.join(", ")}. These are recommended for complete invoices.`,
		);
	}

	// Check if table has any product-related semantic types
	const hasAnyProductType = extractor
		.getAllSemanticTypes()
		.some((type) => type.startsWith("product_"));

	if (!hasAnyProductType) {
		warnings.push(
			`Table "${tableName}" doesn't seem to contain products. Make sure you have set the correct semantic types.`,
		);
	}

	return {
		isValid: missingTypes.length === 0,
		missingTypes,
		warnings,
	};
}

/**
 * Get user-friendly validation message
 */
export function getValidationMessage(
	validation: {
		isValid: boolean;
		missingTypes: SemanticColumnType[];
		warnings: string[];
	},
	tableName: string,
): string {
	if (validation.isValid) {
		return `✅ Table "${tableName}" is valid for invoices!`;
	}

	const missingLabels = validation.missingTypes.map((type) =>
		type.replace("product_", "").replace("_", " "),
	);

	return `❌ Table "${tableName}" cannot be used for invoices. Missing: ${missingLabels.join(
		", ",
	)}`;
}
