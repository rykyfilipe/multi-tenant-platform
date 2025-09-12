/**
 * Semantic column types - what each column represents
 * This makes the system work regardless of column names
 *
 * @format
 */

export enum SemanticColumnType {
	// Product related
	PRODUCT_NAME = "product_name",
	PRODUCT_DESCRIPTION = "product_description",
	PRODUCT_PRICE = "product_price",
	PRODUCT_VAT = "product_vat",
	PRODUCT_SKU = "product_sku",
	PRODUCT_CATEGORY = "product_category",
	PRODUCT_BRAND = "product_brand",
	PRODUCT_WEIGHT = "product_weight",
	PRODUCT_DIMENSIONS = "product_dimensions",
	PRODUCT_IMAGE = "product_image",
	PRODUCT_STATUS = "product_status",

	// Customer related
	CUSTOMER_NAME = "customer_name",
	CUSTOMER_EMAIL = "customer_email",
	CUSTOMER_PHONE = "customer_phone",
	CUSTOMER_ADDRESS = "customer_address",
	CUSTOMER_CITY = "customer_city",
	CUSTOMER_STATE = "customer_state",
	CUSTOMER_COUNTRY = "customer_country",
	CUSTOMER_POSTAL_CODE = "customer_postal_code",
	CUSTOMER_TAX_ID = "customer_tax_id",
	CUSTOMER_REGISTRATION_NUMBER = "customer_registration_number",
	CUSTOMER_VAT_NUMBER = "customer_vat_number",
	CUSTOMER_STREET = "customer_street",
	CUSTOMER_STREET_NUMBER = "customer_street_number",
	CUSTOMER_WEBSITE = "customer_website",
	CUSTOMER_NOTES = "customer_notes",

	// Invoice related
	INVOICE_NUMBER = "invoice_number",
	INVOICE_DATE = "invoice_date",
	INVOICE_DUE_DATE = "invoice_due_date",
	INVOICE_CUSTOMER_ID = "invoice_customer_id",
	INVOICE_STATUS = "invoice_status",
	INVOICE_TOTAL_AMOUNT = "invoice_total_amount",
	INVOICE_SUBTOTAL = "invoice_subtotal",
	INVOICE_TAX_TOTAL = "invoice_tax_total",
	INVOICE_DISCOUNT_AMOUNT = "invoice_discount_amount",
	INVOICE_DISCOUNT_RATE = "invoice_discount_rate",
	INVOICE_SERIES = "invoice_series",
	INVOICE_PAYMENT_TERMS = "invoice_payment_terms",
	INVOICE_PAYMENT_METHOD = "invoice_payment_method",
	INVOICE_LATE_FEE = "invoice_late_fee",
	INVOICE_NOTES = "invoice_notes",
	INVOICE_BASE_CURRENCY = "invoice_base_currency",
	INVOICE_EXCHANGE_RATE = "invoice_exchange_rate",
	INVOICE_REFERENCE_CURRENCY = "invoice_reference_currency",
	INVOICE_SHIPPING_COST = "invoice_shipping_cost",
	INVOICE_LANGUAGE = "invoice_language",
	INVOICE_BANK_DETAILS = "invoice_bank_details",
	INVOICE_SWIFT_CODE = "invoice_swift_code",
	INVOICE_IBAN = "invoice_iban",
	INVOICE_CURRENCY = "invoice_currency",

	// Order/Quantity related
	QUANTITY = "quantity",
	UNIT_OF_MEASURE = "unit_of_measure",
	UNIT_PRICE = "unit_price",
	TOTAL_PRICE = "total_price",
	TAX_RATE = "tax_rate",
	TAX_AMOUNT = "tax_amount",
	DISCOUNT_RATE = "discount_rate",
	DISCOUNT_AMOUNT = "discount_amount",

	// Generic
	NAME = "name",
	DESCRIPTION = "description",
	EMAIL = "email",
	PHONE = "phone",
	ADDRESS = "address",
	DATE = "date",
	STATUS = "status",
	PRICE = "price",
	AMOUNT = "amount",
	CODE = "code",
	ID = "id",
	REFERENCE = "reference",
	NOTES = "notes",
	COMMENTS = "comments",
	CURRENCY = "currency",

	// Company/Business related
	COMPANY_NAME = "company_name",
	COMPANY_TAX_ID = "company_tax_id",
	COMPANY_REGISTRATION_NUMBER = "company_registration_number",
	COMPANY_STREET = "company_street",
	COMPANY_STREET_NUMBER = "company_street_number",
	COMPANY_CITY = "company_city",
	COMPANY_COUNTRY = "company_country",
	COMPANY_POSTAL_CODE = "company_postal_code",
	COMPANY_IBAN = "company_iban",
	COMPANY_BIC = "company_bic",
	COMPANY_BANK = "company_bank",
}

/**
 * User-friendly labels for semantic types
 */
export const SEMANTIC_TYPE_LABELS: Record<SemanticColumnType, string> = {
	// Product related
	[SemanticColumnType.PRODUCT_NAME]: "Product Name",
	[SemanticColumnType.PRODUCT_DESCRIPTION]: "Product Description",
	[SemanticColumnType.PRODUCT_PRICE]: "Product Price",
	[SemanticColumnType.PRODUCT_VAT]: "Product VAT (%)",
	[SemanticColumnType.PRODUCT_SKU]: "Product SKU",
	[SemanticColumnType.PRODUCT_CATEGORY]: "Product Category",
	[SemanticColumnType.PRODUCT_BRAND]: "Product Brand",
	[SemanticColumnType.PRODUCT_WEIGHT]: "Product Weight",
	[SemanticColumnType.PRODUCT_DIMENSIONS]: "Product Dimensions",
	[SemanticColumnType.PRODUCT_IMAGE]: "Product Image",
	[SemanticColumnType.PRODUCT_STATUS]: "Product Status",

	// Customer related
	[SemanticColumnType.CUSTOMER_NAME]: "Customer Name",
	[SemanticColumnType.CUSTOMER_EMAIL]: "Customer Email",
	[SemanticColumnType.CUSTOMER_PHONE]: "Customer Phone",
	[SemanticColumnType.CUSTOMER_ADDRESS]: "Customer Address",
	[SemanticColumnType.CUSTOMER_CITY]: "Customer City",
	[SemanticColumnType.CUSTOMER_STATE]: "Customer State",
	[SemanticColumnType.CUSTOMER_COUNTRY]: "Customer Country",
	[SemanticColumnType.CUSTOMER_POSTAL_CODE]: "Customer Postal Code",
	[SemanticColumnType.CUSTOMER_TAX_ID]: "Customer Tax ID/VAT",
	[SemanticColumnType.CUSTOMER_REGISTRATION_NUMBER]:
		"Customer Registration Number",
	[SemanticColumnType.CUSTOMER_VAT_NUMBER]: "Customer VAT Number",
	[SemanticColumnType.CUSTOMER_WEBSITE]: "Customer Website",
	[SemanticColumnType.CUSTOMER_NOTES]: "Customer Notes",
	[SemanticColumnType.CUSTOMER_STREET]: "Customer Street",
	[SemanticColumnType.CUSTOMER_STREET_NUMBER]: "Customer Street Number",

	// Invoice related
	[SemanticColumnType.INVOICE_NUMBER]: "Invoice Number",
	[SemanticColumnType.INVOICE_DATE]: "Invoice Date",
	[SemanticColumnType.INVOICE_DUE_DATE]: "Invoice Due Date",
	[SemanticColumnType.INVOICE_CUSTOMER_ID]: "Invoice Customer ID",
	[SemanticColumnType.INVOICE_STATUS]: "Invoice Status",
	[SemanticColumnType.INVOICE_TOTAL_AMOUNT]: "Invoice Total",
	[SemanticColumnType.INVOICE_SUBTOTAL]: "Invoice Subtotal",
	[SemanticColumnType.INVOICE_TAX_TOTAL]: "Invoice Tax",
	[SemanticColumnType.INVOICE_DISCOUNT_AMOUNT]: "Invoice Discount",
	[SemanticColumnType.INVOICE_DISCOUNT_RATE]: "Invoice Discount Rate",
	[SemanticColumnType.INVOICE_SERIES]: "Invoice Series",
	[SemanticColumnType.INVOICE_PAYMENT_TERMS]: "Payment Terms",
	[SemanticColumnType.INVOICE_PAYMENT_METHOD]: "Payment Method",
	[SemanticColumnType.INVOICE_LATE_FEE]: "Late Payment Fee",
	[SemanticColumnType.INVOICE_NOTES]: "Invoice Notes",
	[SemanticColumnType.INVOICE_BASE_CURRENCY]: "Invoice Base Currency",
	[SemanticColumnType.INVOICE_EXCHANGE_RATE]: "Invoice Exchange Rate",
	[SemanticColumnType.INVOICE_REFERENCE_CURRENCY]: "Invoice Reference Currency",
	[SemanticColumnType.INVOICE_SHIPPING_COST]: "Invoice Shipping Cost",
	[SemanticColumnType.INVOICE_LANGUAGE]: "Invoice Language",
	[SemanticColumnType.INVOICE_BANK_DETAILS]: "Invoice Bank Details",
	[SemanticColumnType.INVOICE_SWIFT_CODE]: "Invoice Swift Code",
	[SemanticColumnType.INVOICE_IBAN]: "Invoice IBAN",
	[SemanticColumnType.INVOICE_CURRENCY]: "Invoice Currency",

	// Order/Quantity related
	[SemanticColumnType.QUANTITY]: "Quantity",
	[SemanticColumnType.UNIT_OF_MEASURE]: "Unit of Measure",
	[SemanticColumnType.UNIT_PRICE]: "Unit Price",
	[SemanticColumnType.TOTAL_PRICE]: "Total Price",
	[SemanticColumnType.TAX_RATE]: "Tax Rate (%)",
	[SemanticColumnType.TAX_AMOUNT]: "Tax Amount",
	[SemanticColumnType.DISCOUNT_RATE]: "Discount Rate (%)",
	[SemanticColumnType.DISCOUNT_AMOUNT]: "Discount Amount",

	// Generic
	[SemanticColumnType.NAME]: "Name",
	[SemanticColumnType.DESCRIPTION]: "Description",
	[SemanticColumnType.EMAIL]: "Email",
	[SemanticColumnType.PHONE]: "Phone",
	[SemanticColumnType.ADDRESS]: "Address",
	[SemanticColumnType.DATE]: "Date",
	[SemanticColumnType.STATUS]: "Status",
	[SemanticColumnType.PRICE]: "Price",
	[SemanticColumnType.AMOUNT]: "Amount",
	[SemanticColumnType.CODE]: "Code",
	[SemanticColumnType.ID]: "ID",
	[SemanticColumnType.REFERENCE]: "Reference",
	[SemanticColumnType.NOTES]: "Notes",
	[SemanticColumnType.COMMENTS]: "Comments",
	[SemanticColumnType.CURRENCY]: "Currency",

	// Company/Business related
	[SemanticColumnType.COMPANY_NAME]: "Company Name",
	[SemanticColumnType.COMPANY_TAX_ID]: "Company Tax ID/VAT",
	[SemanticColumnType.COMPANY_REGISTRATION_NUMBER]:
		"Company Registration Number",
	[SemanticColumnType.COMPANY_STREET]: "Company Street",
	[SemanticColumnType.COMPANY_STREET_NUMBER]: "Company Street Number",
	[SemanticColumnType.COMPANY_CITY]: "Company City",
	[SemanticColumnType.COMPANY_COUNTRY]: "Company Country",
	[SemanticColumnType.COMPANY_POSTAL_CODE]: "Company Postal Code",
	[SemanticColumnType.COMPANY_IBAN]: "Company IBAN",
	[SemanticColumnType.COMPANY_BIC]: "Company BIC/SWIFT",
	[SemanticColumnType.COMPANY_BANK]: "Company Bank",
};

/**
 * Group semantic types by category for better UX
 */
export const SEMANTIC_TYPE_GROUPS = {
	Products: [
		SemanticColumnType.PRODUCT_NAME,
		SemanticColumnType.PRODUCT_DESCRIPTION,
		SemanticColumnType.PRODUCT_PRICE,
		SemanticColumnType.PRODUCT_VAT,
		SemanticColumnType.PRODUCT_SKU,
		SemanticColumnType.PRODUCT_CATEGORY,
		SemanticColumnType.PRODUCT_BRAND,
		SemanticColumnType.PRODUCT_WEIGHT,
		SemanticColumnType.PRODUCT_DIMENSIONS,
		SemanticColumnType.PRODUCT_IMAGE,
		SemanticColumnType.PRODUCT_STATUS,
	],
	Customers: [
		SemanticColumnType.CUSTOMER_NAME,
		SemanticColumnType.CUSTOMER_EMAIL,
		SemanticColumnType.CUSTOMER_PHONE,
		SemanticColumnType.CUSTOMER_ADDRESS,
		SemanticColumnType.CUSTOMER_CITY,
		SemanticColumnType.CUSTOMER_STATE,
		SemanticColumnType.CUSTOMER_VAT_NUMBER,
		SemanticColumnType.CUSTOMER_WEBSITE,
		SemanticColumnType.CUSTOMER_NOTES,
		SemanticColumnType.CUSTOMER_COUNTRY,
		SemanticColumnType.CUSTOMER_POSTAL_CODE,
		SemanticColumnType.CUSTOMER_TAX_ID,
		SemanticColumnType.CUSTOMER_REGISTRATION_NUMBER,
		SemanticColumnType.CUSTOMER_VAT_NUMBER,
		SemanticColumnType.CUSTOMER_WEBSITE,
		SemanticColumnType.CUSTOMER_NOTES,
		SemanticColumnType.CUSTOMER_CITY,
		SemanticColumnType.CUSTOMER_STATE,
		SemanticColumnType.CUSTOMER_COUNTRY,
		SemanticColumnType.CUSTOMER_STREET,
		SemanticColumnType.CUSTOMER_STREET_NUMBER,
	],
	Invoices: [
		SemanticColumnType.INVOICE_NUMBER,
		SemanticColumnType.INVOICE_DATE,
		SemanticColumnType.INVOICE_DUE_DATE,
		SemanticColumnType.INVOICE_CUSTOMER_ID,
		SemanticColumnType.INVOICE_STATUS,
		SemanticColumnType.INVOICE_TOTAL_AMOUNT,
		SemanticColumnType.INVOICE_SUBTOTAL,
		SemanticColumnType.INVOICE_TAX_TOTAL,
		SemanticColumnType.INVOICE_DISCOUNT_AMOUNT,
		SemanticColumnType.INVOICE_DISCOUNT_RATE,
		SemanticColumnType.INVOICE_SERIES,
		SemanticColumnType.INVOICE_PAYMENT_TERMS,
		SemanticColumnType.INVOICE_PAYMENT_METHOD,
		SemanticColumnType.INVOICE_LATE_FEE,
		SemanticColumnType.INVOICE_NOTES,
		SemanticColumnType.INVOICE_BASE_CURRENCY,
		SemanticColumnType.INVOICE_EXCHANGE_RATE,
		SemanticColumnType.INVOICE_REFERENCE_CURRENCY,
		SemanticColumnType.INVOICE_SHIPPING_COST,
		SemanticColumnType.INVOICE_LANGUAGE,
		SemanticColumnType.INVOICE_BANK_DETAILS,
		SemanticColumnType.INVOICE_SWIFT_CODE,
		SemanticColumnType.INVOICE_IBAN,
		SemanticColumnType.INVOICE_CURRENCY,
		SemanticColumnType.INVOICE_TOTAL_AMOUNT,
	],
	Orders: [
		SemanticColumnType.QUANTITY,
		SemanticColumnType.UNIT_OF_MEASURE,
		SemanticColumnType.UNIT_PRICE,
		SemanticColumnType.TOTAL_PRICE,
		SemanticColumnType.TAX_RATE,
		SemanticColumnType.TAX_AMOUNT,
		SemanticColumnType.DISCOUNT_RATE,
		SemanticColumnType.DISCOUNT_AMOUNT,
	],
	General: [
		SemanticColumnType.NAME,
		SemanticColumnType.DESCRIPTION,
		SemanticColumnType.EMAIL,
		SemanticColumnType.PHONE,
		SemanticColumnType.ADDRESS,
		SemanticColumnType.DATE,
		SemanticColumnType.STATUS,
		SemanticColumnType.PRICE,
		SemanticColumnType.AMOUNT,
		SemanticColumnType.CODE,
		SemanticColumnType.ID,
		SemanticColumnType.REFERENCE,
		SemanticColumnType.NOTES,
		SemanticColumnType.COMMENTS,
		SemanticColumnType.CURRENCY,
	],
	Company: [
		SemanticColumnType.COMPANY_NAME,
		SemanticColumnType.COMPANY_TAX_ID,
		SemanticColumnType.COMPANY_REGISTRATION_NUMBER,
		SemanticColumnType.COMPANY_STREET,
		SemanticColumnType.COMPANY_STREET_NUMBER,
		SemanticColumnType.COMPANY_CITY,
		SemanticColumnType.COMPANY_COUNTRY,
		SemanticColumnType.COMPANY_POSTAL_CODE,
		SemanticColumnType.COMPANY_IBAN,
		SemanticColumnType.COMPANY_BIC,
		SemanticColumnType.COMPANY_BANK,
	],
};

/**
 * Get semantic type by label (for search functionality)
 */
export const getSemanticTypeByLabel = (
	label: string,
): SemanticColumnType | undefined => {
	const entry = Object.entries(SEMANTIC_TYPE_LABELS).find(([_, value]) =>
		value.toLowerCase().includes(label.toLowerCase()),
	);
	return entry ? (entry[0] as SemanticColumnType) : undefined;
};

/**
 * Check if a semantic type is required for invoices
 */
export const isRequiredForInvoices = (
	semanticType: SemanticColumnType,
): boolean => {
	const requiredTypes = [
		// Product requirements
		SemanticColumnType.PRODUCT_NAME,
		SemanticColumnType.PRODUCT_PRICE,
		SemanticColumnType.PRODUCT_VAT,
		SemanticColumnType.CURRENCY,

		// Customer requirements
		SemanticColumnType.CUSTOMER_NAME,
		SemanticColumnType.CUSTOMER_EMAIL,
		SemanticColumnType.CUSTOMER_TAX_ID,
		SemanticColumnType.CUSTOMER_ADDRESS,
		SemanticColumnType.CUSTOMER_STATE,
		SemanticColumnType.CUSTOMER_VAT_NUMBER,
		SemanticColumnType.CUSTOMER_WEBSITE,
		SemanticColumnType.CUSTOMER_NOTES,
		SemanticColumnType.CUSTOMER_CITY,
		SemanticColumnType.CUSTOMER_COUNTRY,
		SemanticColumnType.CUSTOMER_POSTAL_CODE,

		// Invoice requirements
		SemanticColumnType.INVOICE_NUMBER,
		SemanticColumnType.INVOICE_DATE,
		SemanticColumnType.INVOICE_DUE_DATE,
		SemanticColumnType.INVOICE_STATUS,

		// Quantity requirements
		SemanticColumnType.QUANTITY,
		SemanticColumnType.UNIT_OF_MEASURE,
	];
	return requiredTypes.includes(semanticType);
};
