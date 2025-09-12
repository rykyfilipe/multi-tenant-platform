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

	// Required semantic types for invoices (core fields)
	const requiredInvoiceTypes = [
		SemanticColumnType.INVOICE_NUMBER,
		SemanticColumnType.INVOICE_SERIES,
		SemanticColumnType.INVOICE_DATE,
		SemanticColumnType.INVOICE_DUE_DATE,
		SemanticColumnType.INVOICE_CUSTOMER_ID,
		SemanticColumnType.INVOICE_STATUS,
		SemanticColumnType.INVOICE_TOTAL_AMOUNT,
		SemanticColumnType.INVOICE_BASE_CURRENCY,
		SemanticColumnType.INVOICE_SUBTOTAL,
		SemanticColumnType.INVOICE_TAX_TOTAL,
	];

	// Required semantic types for invoice items (core fields)
	const requiredItemTypes = [
		SemanticColumnType.INVOICE_NUMBER, // invoice_id reference
		SemanticColumnType.REFERENCE, // product_ref_table
		SemanticColumnType.ID, // product_ref_id
		SemanticColumnType.QUANTITY,
		SemanticColumnType.UNIT_OF_MEASURE,
		SemanticColumnType.UNIT_PRICE,
		SemanticColumnType.CURRENCY,
		SemanticColumnType.TAX_RATE,
		SemanticColumnType.TAX_AMOUNT,
	];

	// Required semantic types for customers (core fields)
	const requiredCustomerTypes = [
		SemanticColumnType.CUSTOMER_NAME,
		SemanticColumnType.CUSTOMER_EMAIL,
		SemanticColumnType.CUSTOMER_PHONE,
		SemanticColumnType.CUSTOMER_TAX_ID,
		SemanticColumnType.CUSTOMER_STREET,
		SemanticColumnType.CUSTOMER_STREET_NUMBER,
		SemanticColumnType.CUSTOMER_CITY,
		SemanticColumnType.CUSTOMER_COUNTRY,
		SemanticColumnType.CUSTOMER_POSTAL_CODE,
	];

	// Required semantic types for products (if using product tables)
	const requiredProductTypes = [
		SemanticColumnType.PRODUCT_NAME,
		SemanticColumnType.PRODUCT_PRICE,
		SemanticColumnType.PRODUCT_VAT,
		SemanticColumnType.CURRENCY,
		SemanticColumnType.UNIT_OF_MEASURE,
	];

	// Determine which required types to check based on table name
	let requiredTypes: SemanticColumnType[] = [];
	let tableType = '';

	if (tableName.toLowerCase().includes('invoice') && !tableName.toLowerCase().includes('item')) {
		// This is the main invoices table
		requiredTypes = requiredInvoiceTypes;
		tableType = 'invoices';
	} else if (tableName.toLowerCase().includes('invoice') && tableName.toLowerCase().includes('item')) {
		// This is the invoice_items table
		requiredTypes = requiredItemTypes;
		tableType = 'invoice_items';
	} else if (tableName.toLowerCase().includes('customer')) {
		// This is the customers table
		requiredTypes = requiredCustomerTypes;
		tableType = 'customers';
	} else {
		// This is a product table
		requiredTypes = requiredProductTypes;
		tableType = 'products';
	}

	// Check for required types
	const missingTypes = requiredTypes.filter(
		(type) => !extractor.hasSemanticType(type),
	);

	// Check for recommended types based on table type
	let recommendedTypes: SemanticColumnType[] = [];
	
	if (tableType === 'invoices') {
		recommendedTypes = [
			SemanticColumnType.INVOICE_PAYMENT_TERMS,
			SemanticColumnType.INVOICE_PAYMENT_METHOD,
			SemanticColumnType.INVOICE_NOTES,
			SemanticColumnType.INVOICE_LANGUAGE,
			SemanticColumnType.INVOICE_BANK_DETAILS,
			SemanticColumnType.INVOICE_SWIFT_CODE,
			SemanticColumnType.INVOICE_IBAN,
		];
	} else if (tableType === 'invoice_items') {
		recommendedTypes = [
			SemanticColumnType.PRODUCT_NAME,
			SemanticColumnType.PRODUCT_DESCRIPTION,
			SemanticColumnType.PRODUCT_SKU,
			SemanticColumnType.PRODUCT_CATEGORY,
			SemanticColumnType.PRODUCT_BRAND,
		];
	} else if (tableType === 'customers') {
		recommendedTypes = [
			SemanticColumnType.CUSTOMER_WEBSITE,
			SemanticColumnType.CUSTOMER_NOTES,
			SemanticColumnType.CUSTOMER_VAT_NUMBER,
			SemanticColumnType.CUSTOMER_STATE,
		];
	} else {
		// Product tables
		recommendedTypes = [
			SemanticColumnType.PRODUCT_DESCRIPTION,
			SemanticColumnType.PRODUCT_SKU,
			SemanticColumnType.PRODUCT_CATEGORY,
		];
	}

	const missingRecommended = recommendedTypes.filter(
		(type) => !extractor.hasSemanticType(type),
	);

	if (missingRecommended.length > 0) {
		warnings.push(
			`Table "${tableName}" (${tableType}) doesn't have columns for: ${missingRecommended
				.map((type) => type.replace(/^(invoice_|customer_|product_)/, "").replace(/_/g, " "))
				.join(", ")}. These are recommended for complete ${tableType}.`,
		);
	}

	// Additional validation based on table type
	if (tableType === 'products' || tableType === 'invoice_items') {
		// Check if table has any product-related semantic types
		const hasAnyProductType = extractor
			.getAllSemanticTypes()
			.some((type) => type.startsWith("product_"));

		if (!hasAnyProductType) {
			warnings.push(
				`Table "${tableName}" doesn't seem to contain product information. Make sure this table has columns for product name, price, and other product details.`,
			);
		}
	}

	// Check for invoice-specific validations
	if (tableType === 'invoices') {
		const hasInvoiceNumber = extractor.hasSemanticType(SemanticColumnType.INVOICE_NUMBER);
		const hasInvoiceDate = extractor.hasSemanticType(SemanticColumnType.INVOICE_DATE);
		const hasCustomerId = extractor.hasSemanticType(SemanticColumnType.INVOICE_CUSTOMER_ID);
		
		if (!hasInvoiceNumber || !hasInvoiceDate || !hasCustomerId) {
			warnings.push(
				`Table "${tableName}" is missing critical invoice fields. Ensure it has invoice number, date, and customer reference.`,
			);
		}
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
