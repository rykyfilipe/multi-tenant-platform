/** @format */

"use client";

import { useState, useEffect } from "react";

import {
	useInvoiceCurrency,
	ProductWithConversion,
} from "@/hooks/useInvoiceCurrency";

import { InvoiceProduct } from "@/lib/invoice-system";
import {
	validateTableForInvoices,
	getValidationMessage,
} from "@/lib/semantic-helpers";
import { SemanticColumnType } from "@/lib/semantic-types";
import { InvoiceCalculationService } from "@/lib/invoice-calculations";
import { 
	validateInvoiceForm, 
	ValidationResult, 
	canSubmitForm, 
	formatValidationErrors,
	formatMissingFields 
} from "@/lib/invoice-form-validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
// TODO: Add Command component for searchable dropdowns
// import {
// 	Command,
// 	CommandEmpty,
// 	CommandGroup,
// 	CommandInput,
// 	CommandItem,
// 	CommandList,
// } from "@/components/ui/command";
// import {
// 	Popover,
// 	PopoverContent,
// 	PopoverTrigger,
// } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
	Plus,
	Trash2,
	FileText,
	User,
	Package,
	Database,
	AlertTriangle,
	Globe,
	Info,
	Calculator,
	CreditCard,
	CheckCircle,
	Eye,
	Send,
	X,
	// Check,
	// ChevronsUpDown,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProductDetailsModal } from "./ProductDetailsModal";
import { ANAFIntegrationToggle } from "@/components/anaf/ANAFIntegrationToggle";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceFormProps {
	open: boolean;
			editInvoice?: any;
	onInvoiceUpdated?: () => void;
	onClose?: () => void;
	onSuccess?: () => void;
	customers: any[];
	createInvoice: (invoiceData: any) => Promise<any>;
	updateInvoice: (invoiceId: number, updateData: any) => Promise<any>;
	createCustomer: (customerData: any) => Promise<any>;
	getInvoiceDetails: (invoiceId: number) => Promise<any>;
	loading: boolean;
	error: string | null;
}

export function InvoiceForm({
	open,
	editInvoice,
	onInvoiceUpdated,
	onClose,
	onSuccess,
	customers,
	createInvoice,
	updateInvoice,
	createCustomer,
	getInvoiceDetails,
	loading,
	error,
}: InvoiceFormProps) {
	const { token, tenant, showAlert } = useApp();
	const { t } = useLanguage();

	// Currency management
	const {
		baseCurrency,
		setBaseCurrency,
		availableCurrencies,
		convertProducts,
		calculateInvoiceTotals,
		formatCurrency,
		exchangeRates,
		conversionDate,
	} = useInvoiceCurrency(tenant?.defaultCurrency || "USD");

	const [selectedCustomer, setSelectedCustomer] = useState<number | null>(null);
	const [products, setProducts] = useState<ProductWithConversion[]>([]);
	const [availableTables, setAvailableTables] = useState<any[]>([]);
	const [availableTablesLoading, setAvailableTablesLoading] = useState(false);
	const [selectedTable, setSelectedTable] = useState<string>("");
	const [tableRows, setTableRows] = useState<any[]>([]);
	const [tableRowsLoading, setTableRowsLoading] = useState(false);
	const [availableSeries, setAvailableSeries] = useState<any[]>([]);
	const [availableSeriesLoading, setAvailableSeriesLoading] = useState(false);
	const [tableValidation, setTableValidation] = useState<{
		isValid: boolean;
		message: string;
		missingTypes: string[];
	} | null>(null);
	const [showCustomerForm, setShowCustomerForm] = useState(false);
	const [customerForm, setCustomerForm] = useState({
		customer_name: "",
		customer_email: "",
		customer_address: "",
	});

	// Edit mode state
	const isEditMode = Boolean(editInvoice);
	const [isInitialized, setIsInitialized] = useState(false);

	// Invoice totals state for unified calculations
	const [invoiceTotals, setInvoiceTotals] = useState<any>(null);

	// Validation state
	const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
	const [showValidationErrors, setShowValidationErrors] = useState(false);

	// Form state for adding products
	const [productForm, setProductForm] = useState({
		product_ref_table: "",
		product_ref_id: 0,
		quantity: 1,
		description: "",
	});

	// Form state for invoice details
	const [invoiceForm, setInvoiceForm] = useState({
		due_date: "",
		payment_terms: t("invoice.form.net15Days"),
		payment_method: t("invoice.form.bankTransfer"),
		notes: "",
		status: "draft",
		invoice_series: "",
	});

	// Calculate invoice totals when products change
	useEffect(() => {
		const calculateTotals = async () => {
			try {
				const totals = await InvoiceCalculationService.calculateInvoiceTotals(
					products.map((product) => {
						// Ensure all values are valid numbers
						const safePrice = typeof product.extractedPrice === 'number' && !isNaN(product.extractedPrice) ? product.extractedPrice : 0;
						const safeQuantity = typeof product.quantity === 'number' && !isNaN(product.quantity) ? product.quantity : 1;
						const safeVat = typeof product.vatRate === 'number' && !isNaN(product.vatRate) ? product.vatRate : 0;
						
						return {
							id:
								typeof product.id === "string"
									? parseInt(product.id)
									: product.id,
							product_ref_table: product.product_ref_table || "",
							product_ref_id: product.product_ref_id || 0,
							quantity: safeQuantity,
							price: safePrice,
							currency: product.currency || "USD",
							product_vat: safeVat,
							description: product.description || "",
							unit_of_measure: "",
						};
					}),
					{
						baseCurrency,
						exchangeRates,
					},
				);
				setInvoiceTotals(totals);
			} catch (error) {
				console.error("Error calculating invoice totals:", error);
			}
		};

		if (products.length > 0) {
			calculateTotals();
		}
	}, [products, baseCurrency, exchangeRates]);

	// Validate form in real-time
	useEffect(() => {
		console.log("=== VALIDATION EFFECT TRIGGERED ===");
		console.log("Selected Customer:", selectedCustomer);
		console.log("Base Currency:", baseCurrency);
		console.log("Due Date:", invoiceForm.due_date);
		console.log("Payment Method:", invoiceForm.payment_method);
		console.log("Products:", products);
		
		const validation = validateInvoiceForm({
			customer_id: selectedCustomer,
			base_currency: baseCurrency,
			due_date: invoiceForm.due_date,
			payment_method: invoiceForm.payment_method,
			products: products,
			invoiceForm: invoiceForm,
		});
		
		console.log("Validation Result:", validation);
		setValidationResult(validation);
	}, [selectedCustomer, baseCurrency, invoiceForm, products]);


	// Fetch available tables for product selection from all databases
	useEffect(() => {
		const fetchTables = async () => {
			if (!token || !tenant?.id) return;

			setAvailableTablesLoading(true);
			try {
				const response = await fetch(
					`/api/tenants/${tenant.id}/databases/tables`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				if (response.ok) {
					const tables = await response.json();
					setAvailableTables(tables);
				}
			} catch (error) {
				console.error("Error fetching tables:", error);
			} finally {
				setAvailableTablesLoading(false);
			}
		};

		fetchTables();
	}, [token, tenant?.id]);

	// Fetch available invoice series
	useEffect(() => {
		const fetchSeries = async () => {
			if (!token || !tenant?.id) return;

			setAvailableSeriesLoading(true);
			try {
				const response = await fetch(
					`/api/tenants/${tenant.id}/invoices/series`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				if (response.ok) {
					const data = await response.json();
					setAvailableSeries(data.series || []);
				}
			} catch (error) {
				console.error("Error fetching series:", error);
			} finally {
				setAvailableSeriesLoading(false);
			}
		};

		fetchSeries();
	}, [token, tenant?.id]);

	// Fetch table rows when table is selected
	useEffect(() => {
		const fetchTableRows = async () => {
			if (!selectedTable || !token || !tenant?.id) {
				return;
			}

			// Find the selected table object to get database ID and table ID
			const selectedTableObj = availableTables.find(
				(table) => table.name === selectedTable,
			);
			if (!selectedTableObj) {
				return;
			}

			setTableRowsLoading(true);
			try {
				const apiUrl = `/api/tenants/${tenant.id}/databases/${selectedTableObj.database.id}/tables/${selectedTableObj.id}/rows`;

				const response = await fetch(apiUrl, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (response.ok) {
					const responseData = await response.json();

					// Extract rows from API response - API returns { data: [...] }
					const actualRows = responseData.data || [];
					setTableRows(actualRows);

					// Validate table for invoice creation using table columns
					const validation = validateTableForInvoices(
						selectedTableObj.columns || [],
						selectedTableObj.name,
					);

					// Transform validation result to match expected type
					setTableValidation({
						isValid: validation.isValid,
						message:
							validation.warnings.length > 0
								? validation.warnings.join("; ")
								: validation.isValid
								? t("invoice.form.tableValid")
								: t("invoice.form.tableMissingFields"),
						missingTypes: validation.missingTypes.map((type) =>
							type.toString(),
						),
					});
				} else {
					console.error(
						t("invoice.form.failedToFetchRows"),
						response.status,
						response.statusText,
					);
				}
			} catch (error) {
				console.error("Error fetching table rows:", error);
			} finally {
				setTableRowsLoading(false);
			}
		};

		fetchTableRows();
	}, [selectedTable, token, tenant?.id, availableTables]);

	// Initialize form with edit data
	useEffect(() => {
		if (editInvoice && !isInitialized) {
			console.log("=== INITIALIZING EDIT MODE ===");
			console.log("editInvoice structure:", editInvoice);
			
			// Set customer
			if (editInvoice.customer?.id) {
				setSelectedCustomer(editInvoice.customer.id);
			}

			// Set base currency - check both invoice and direct properties
			const baseCurrency = editInvoice.invoice?.base_currency || editInvoice.base_currency;
			if (baseCurrency) {
				setBaseCurrency(baseCurrency);
			}

			// Set invoice form fields - check both invoice and direct properties
			const invoiceData = editInvoice.invoice || editInvoice;
			console.log("Invoice data for form:", invoiceData);
			
			setInvoiceForm({
				due_date: invoiceData.due_date || "",
				payment_terms: invoiceData.payment_terms || t("invoice.form.paymentTerms"),
				payment_method: invoiceData.payment_method || t("invoice.form.paymentMethod"),
				notes: invoiceData.notes || "",
				status: invoiceData.status || "draft",
				invoice_series: invoiceData.invoice_series || "",
			});
			
			console.log("Form initialized with:", {
				due_date: invoiceData.due_date,
				payment_terms: invoiceData.payment_terms,
				payment_method: invoiceData.payment_method,
				notes: invoiceData.notes,
				status: invoiceData.status,
				invoice_series: invoiceData.invoice_series,
			});

			// Set selected table from first product if available and load table rows
			if (editInvoice.items && editInvoice.items.length > 0) {
				const firstItem = editInvoice.items[0];
				if (firstItem.product_ref_table) {
					setSelectedTable(firstItem.product_ref_table);

					// Load table rows for the products being edited
					setTimeout(async () => {
						if (token && tenant?.id) {
							try {
								// Find the table object to get database ID and table ID
								const tableObj = availableTables.find(
									(table) => table.name === firstItem.product_ref_table,
								);
								if (tableObj) {
									const apiUrl = `/api/tenants/${tenant.id}/databases/${tableObj.database.id}/tables/${tableObj.id}/rows`;
									const response = await fetch(apiUrl, {
										headers: { Authorization: `Bearer ${token}` },
									});
									if (response.ok) {
										const responseData = await response.json();
										const actualRows = responseData.data || [];
										setTableRows(actualRows);
									}
								}
							} catch (error) {
								console.error("Error loading table rows for edit:", error);
							}
						}
					}, 200); // Small delay to ensure availableTables is loaded
				}
			}

			// Set products with VAT rate
			if (editInvoice.items && Array.isArray(editInvoice.items)) {
				const convertedProducts = editInvoice.items.map(
					(item: any, index: number) => {
						const price = Number(item.price) || 0;
						const quantity = Number(item.quantity) || 1;
						const calculatedTotal = price * quantity;

						return {
							id: `edit-${item.id || index}`,
							product_ref_table: item.product_ref_table,
							product_ref_id: item.product_ref_id,
							quantity: quantity,
							description: item.description || "",
							currency: item.currency || "USD",
							extractedPrice: price,
							calculatedTotal: calculatedTotal,
							vatRate: Number(item.product_vat) || 0, // Include VAT rate from edit data
						};
					},
				);

				setProducts(convertedProducts);

				// Convert products to base currency after setting them
				setTimeout(async () => {
					try {
						const currencyConvertedProducts = await convertProducts(
							convertedProducts,
						);
						setProducts(currencyConvertedProducts);
					} catch (error) {
						console.error("Error converting products to base currency:", error);
					}
				}, 100);
			}

			setIsInitialized(true);
		}
	}, [
		editInvoice,
		isInitialized,
		setBaseCurrency,
		t,
		availableTables,
		token,
		tenant?.id,
	]);

	// Reset initialization when editInvoice changes
	useEffect(() => {
		setIsInitialized(false);
		// Reset form fields when switching from edit to create mode
		if (!editInvoice) {
			setSelectedCustomer(null);
			setProducts([]);
			setSelectedTable("");
			setTableRows([]);
			setTableValidation(null);
			setInvoiceForm({
				due_date: "",
				payment_terms: t("invoice.form.net15Days"),
				payment_method: t("invoice.form.bankTransfer"),
				notes: "",
				status: "draft",
				invoice_series: "",
			});
		}
	}, [editInvoice]);

	const addProductFromForm = async () => {
		if (!selectedTable || productForm.product_ref_id === 0) {
			showAlert(t("invoice.form.selectTableAndProduct"), "error");
			return;
		}

		// Extract price, currency, unit of measure and VAT from the selected product
		const extractedPrice = extractProductPrice(
			selectedTable,
			productForm.product_ref_id,
		);
		const extractedCurrency = extractProductCurrency(
			selectedTable,
			productForm.product_ref_id,
		);
		const extractedUnitOfMeasure = extractProductUnitOfMeasure(
			selectedTable,
			productForm.product_ref_id,
		);

		// Extract VAT rate from product
		const selectedRow = tableRows.find(
			(r: any) => r.id === productForm.product_ref_id,
		);
		const productDetails = extractProductDetails(selectedTable, selectedRow);
		const extractedVat = productDetails.vat || 0;

		// Ensure we have valid numeric values
		const safePrice = typeof extractedPrice === 'number' && !isNaN(extractedPrice) ? extractedPrice : 0;
		const safeQuantity = typeof productForm.quantity === 'number' && !isNaN(productForm.quantity) ? productForm.quantity : 1;
		const safeVat = typeof extractedVat === 'number' && !isNaN(extractedVat) ? extractedVat : 0;

		const newProduct: ProductWithConversion = {
			id: Date.now().toString(),
			product_ref_table: productForm.product_ref_table,
			product_ref_id: productForm.product_ref_id,
			quantity: safeQuantity,
			description: productForm.description,
			currency: extractedCurrency || "USD", // Folosește moneda extrasă sau USD ca fallback
			extractedPrice: safePrice,
			calculatedTotal: safePrice * safeQuantity,
			vatRate: safeVat,
		};

		// Convert the product to base currency
		const convertedProduct = await convertProducts([newProduct]);
		setProducts([...products, ...convertedProduct]);

		// Reset only product form, keep table selection and rows
		setProductForm({
			product_ref_table: selectedTable, // Keep the selected table
			product_ref_id: 0,
			quantity: 1,
			description: "",
		});
		// Don't reset selectedTable and tableRows - keep them for next product
	};

	const removeProduct = (id: string) => {
		setProducts(products.filter((p) => p.id !== id));
	};

	const updateProduct = async (
		id: string,
		field: keyof ProductWithConversion,
		value: any,
	) => {
		const updatedProducts = products.map((p) => {
			if (p.id === id) {
				const updatedProduct = { ...p, [field]: value };

				// Recalculează totalul dacă s-a schimbat cantitatea
				if (field === "quantity") {
					const safePrice = typeof updatedProduct.extractedPrice === 'number' && !isNaN(updatedProduct.extractedPrice) ? updatedProduct.extractedPrice : 0;
					const safeQuantity = typeof value === 'number' && !isNaN(value) ? value : 1;
					updatedProduct.calculatedTotal = safePrice * safeQuantity;
				}

				return updatedProduct;
			}
			return p;
		});

		// Convert updated products to base currency
		const convertedProducts = await convertProducts(updatedProducts);
		setProducts(convertedProducts);
	};

	const handleCreateCustomer = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createCustomer(customerForm);
			setShowCustomerForm(false);
			setCustomerForm({
				customer_name: "",
				customer_email: "",
				customer_address: "",
			});
		} catch (error) {
			console.error("Error creating customer:", error);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		console.log("=== INVOICE FORM SUBMISSION STARTED ===");
		console.log("Form submitted at:", new Date().toISOString());
		

		// Validate form using the validator
		const validation = validateInvoiceForm({
			customer_id: selectedCustomer,
			base_currency: baseCurrency,
			due_date: invoiceForm.due_date,
			payment_method: invoiceForm.payment_method,
			products: products,
			invoiceForm: invoiceForm,
		});

		// Debug logging
		console.log("=== VALIDATION DEBUG ===");
		console.log("Selected Customer:", selectedCustomer);
		console.log("Base Currency:", baseCurrency);
		console.log("Due Date:", invoiceForm.due_date);
		console.log("Payment Method:", invoiceForm.payment_method);
		console.log("Products:", products);
		console.log("Validation Result:", validation);

		if (!validation.isValid) {
			setShowValidationErrors(true);
			const errorMessage = formatValidationErrors(validation);
			const missingFields = formatMissingFields(validation);
			console.error("Validation failed:", errorMessage);
			console.error("Missing fields:", missingFields);
			
			// Show alert with detailed error information
			const fullErrorMessage = `Please fix the following errors:\n\n${errorMessage}${missingFields ? `\n\n${missingFields}` : ""}`;
			console.log("Showing alert with message:", fullErrorMessage);
			showAlert(fullErrorMessage, "error");
			return;
		}

		// Hide validation errors if form is valid
		setShowValidationErrors(false);

		try {
			const invoiceData = {
				customer_id: selectedCustomer,
				base_currency: baseCurrency,
				due_date: invoiceForm.due_date,
				payment_terms: invoiceForm.payment_terms,
				payment_method: invoiceForm.payment_method,
				notes: invoiceForm.notes,
				status: invoiceForm.status || "draft",
				invoice_series: invoiceForm.invoice_series || undefined,
				products: products.map((p) => ({
					product_ref_table: p.product_ref_table,
					product_ref_id: p.product_ref_id,
					quantity: p.quantity,
					unit_of_measure:
						extractProductUnitOfMeasure(
							p.product_ref_table,
							p.product_ref_id,
						) || t("invoice.form.unit"),
					description: p.description || undefined,
					currency: p.currency,
					original_price: p.extractedPrice,
					converted_price: p.convertedTotal,
					price: p.extractedPrice, // Add price for update
				})),
			};
	

			if (isEditMode && editInvoice?.invoice?.id) {
				// Update existing invoice
				await updateInvoice(editInvoice.invoice.id, invoiceData);
				showAlert(t("invoice.form.invoiceUpdated"), "success");
				onInvoiceUpdated?.();
				onSuccess?.();
			} else {
				// Create new invoice
				await createInvoice(invoiceData);
				// Reset forms
				setProducts([]);
				setInvoiceForm({
					due_date: "",
					payment_terms: t("invoice.form.net15Days"),
					payment_method: t("invoice.form.bankTransfer"),
					notes: "",
					status: "draft",
					invoice_series: "",
				});
				showAlert(t("invoice.form.invoiceCreated"), "success");
				onSuccess?.();
			}
		} catch (error: any) {
			console.error(
				isEditMode
					? t("invoice.form.errorUpdating")
					: t("invoice.form.errorCreating"),
				error,
			);

			// Handle API error responses
			let errorMessage = isEditMode
				? t("invoice.form.failedToUpdate")
				: t("invoice.form.failedToCreate");

			if (error?.response?.data) {
				const apiError = error.response.data;
				if (apiError.message) {
					errorMessage = apiError.message;
				}
				if (apiError.details) {
					errorMessage += `\n\nDetails: ${apiError.details}`;
				}
			} else if (error?.message) {
				errorMessage = error.message;
			}

			showAlert(errorMessage, "error");
		}
	};



	const getRowDisplayName = (tableName: string, rowId: number) => {
		if (!tableName || tableName === "" || tableName !== selectedTable)
			return `ID: ${rowId}`;

		const row = tableRows.find((r: any) => r.id === rowId);
		if (!row) return `ID: ${rowId}`;

		// Try to find a meaningful display field
		const nameCell = row.cells?.find(
			(c: any) =>
				c.column.name.toLowerCase().includes("name") ||
				c.column.name.toLowerCase().includes("description"),
		);

		return nameCell?.value || `ID: ${rowId}`;
	};

	// Funcție pentru a extrage prețul din produs
	const extractProductPrice = (
		tableName: string,
		rowId: number,
	): number | null => {
		const row = tableRows.find((r: any) => r.id === rowId);
		if (!row || !row.cells) return 0; // Return 0 instead of null for better handling

		// Caută coloana cu preț folosind tipuri semantice
		const priceCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;

			// Verifică tipurile semantice pentru preț
			if (
				semanticType === "product_price" ||
				semanticType === "price" ||
				semanticType === "unit_price"
			) {
				return true;
			}

			// Fallback: caută în numele coloanei
			return (
				columnName.includes("price") ||
				columnName.includes("cost") ||
				columnName.includes("amount")
			);
		});

		if (
			priceCell &&
			priceCell.value !== null &&
			priceCell.value !== undefined &&
			priceCell.value !== ""
		) {
			const price = parseFloat(priceCell.value.toString());
			return isNaN(price) ? 0 : price; // Return 0 instead of null for better handling
		}

		return 0; // Return 0 instead of null for better handling
	};

	// Funcție pentru a extrage moneda din produs
	const extractProductCurrency = (
		tableName: string,
		rowId: number,
	): string | null => {
		const row = tableRows.find((r: any) => r.id === rowId);
		if (!row || !row.cells) {
			return null;
		}

		// Caută coloana cu monedă folosind tipuri semantice
		const currencyCell = row.cells.find((cell: any) => {
			const semanticType = cell.column.semanticType;
			const isCurrency = semanticType === SemanticColumnType.CURRENCY;

			return isCurrency;
		});

		if (
			currencyCell &&
			currencyCell.value !== null &&
			currencyCell.value !== undefined
		) {
			const currency = currencyCell.value.toString().toUpperCase();

			// Verifică dacă moneda este suportată
			if (availableCurrencies.includes(currency)) {
				return currency;
			}
		}

		return null;
	};

	// Funcție pentru a extrage unitatea de măsură din produs
	const extractProductUnitOfMeasure = (
		tableName: string,
		rowId: number,
	): string | null => {
		const row = tableRows.find((r: any) => r.id === rowId);
		if (!row || !row.cells) {
			return null;
		}

		// Caută coloana cu unitatea de măsură folosind tipuri semantice
		const unitCell = row.cells.find((cell: any) => {
			const semanticType = cell.column.semanticType;
			const columnName = cell.column.name.toLowerCase();

			// Verifică tipul semantic pentru unitatea de măsură
			if (semanticType === "unit_of_measure") {
				return true;
			}

			// Fallback: caută în numele coloanei
			return (
				columnName.includes("unit") ||
				columnName.includes("measure") ||
				columnName.includes("um") ||
				columnName.includes("unitate")
			);
		});

		if (unitCell && unitCell.value !== null && unitCell.value !== undefined) {
			return unitCell.value.toString().trim();
		}

		return t("invoice.form.unit"); // Valoare implicită
	};

	// Funcție pentru a extrage toate detaliile produsului
	const extractProductDetails = (tableName: string | null, row: any) => {
		if (!tableName || !row || !row.cells) {
			return {
				name: null,
				description: null,
				price: null,
				currency: null,
				sku: null,
				category: null,
				brand: null,
				vat: 0,
			};
		}

		const details: any = {};

		// Extract product name
		const nameCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;
			return (
				semanticType === "PRODUCT_NAME" ||
				columnName.includes("name") ||
				columnName.includes("title") ||
				columnName.includes("label")
			);
		});
		if (nameCell && nameCell.value) {
			details.name = String(nameCell.value).trim();
		}

		// Extract description
		const descriptionCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;
			return (
				semanticType === "PRODUCT_DESCRIPTION" ||
				columnName.includes("description") ||
				columnName.includes("desc") ||
				columnName.includes("details") ||
				columnName.includes("info")
			);
		});
		if (descriptionCell && descriptionCell.value) {
			details.description = String(descriptionCell.value).trim();
		}

		// Extract price
		const priceCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;
			return (
				semanticType === "PRODUCT_PRICE" ||
				columnName.includes("price") ||
				columnName.includes("cost") ||
				columnName.includes("amount") ||
				columnName.includes("rate")
			);
		});
		if (priceCell && priceCell.value != null) {
			const priceValue = Number(priceCell.value);
			if (!isNaN(priceValue)) {
				details.price = priceValue.toFixed(2);
			}
		}

		// Extract currency
		const currencyCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;
			return (
				semanticType === "CURRENCY" ||
				columnName.includes("currency") ||
				columnName.includes("curr") ||
				columnName.includes("money")
			);
		});
		if (currencyCell && currencyCell.value) {
			details.currency = String(currencyCell.value).trim().toUpperCase();
		}

		// Extract SKU
		const skuCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;
			return (
				semanticType === "PRODUCT_SKU" ||
				columnName.includes("sku") ||
				columnName.includes("code") ||
				columnName.includes("barcode") ||
				columnName.includes("id")
			);
		});
		if (skuCell && skuCell.value) {
			details.sku = String(skuCell.value).trim();
		}

		// Extract category
		const categoryCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;
			return (
				semanticType === "PRODUCT_CATEGORY" ||
				columnName.includes("category") ||
				columnName.includes("type") ||
				columnName.includes("group") ||
				columnName.includes("class")
			);
		});
		if (categoryCell && categoryCell.value) {
			details.category = String(categoryCell.value).trim();
		}

		// Extract brand
		const brandCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;
			return (
				semanticType === "PRODUCT_BRAND" ||
				columnName.includes("brand") ||
				columnName.includes("manufacturer") ||
				columnName.includes("maker") ||
				columnName.includes("company")
			);
		});
		if (brandCell && brandCell.value) {
			details.brand = String(brandCell.value).trim();
		}

		// Extract VAT
		const vatCell = row.cells.find((cell: any) => {
			const columnName = cell.column.name.toLowerCase();
			const semanticType = cell.column.semanticType;
			return (
				semanticType === "PRODUCT_VAT" ||
				columnName.includes("vat") ||
				columnName.includes("tax") ||
				columnName.includes("tva")
			);
		});
		if (vatCell && vatCell.value != null) {
			const vatValue =
				typeof vatCell.value === "string"
					? parseFloat(vatCell.value)
					: Number(vatCell.value);
			if (!isNaN(vatValue)) {
				details.vat = vatValue;
			}
		}

		return details;
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center p-12'>
				<div className='text-center space-y-4'>
					<div className='w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto'></div>
					<div className='text-muted-foreground'>
						{t("invoice.form.loadingForm")}
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<Card className='border-destructive/20 bg-destructive/5'>
				<CardContent className='p-6 text-center'>
					<AlertTriangle className='w-12 h-12 text-destructive mx-auto mb-4' />
					<div className='text-destructive font-medium'>
						{t("invoice.form.errorLoadingForm")}
					</div>
					<div className='text-sm text-destructive/70 mt-2'>{error}</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header Card */}
			<Card className='border-0 shadow-lg bg-gradient-to-r from-primary/5 to-primary/10'>
				<CardContent className='p-6'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-4'>
							<div className='w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center'>
								<FileText className='w-6 h-6 text-primary' />
							</div>
							<div>
								<h2 className='text-2xl font-bold text-foreground'>
									{isEditMode
										? t("invoice.form.editInvoice")
										: t("invoice.form.createInvoice")}
								</h2>
								<p className='text-muted-foreground'>
									{isEditMode
										? t("invoice.form.editDescription")
										: t("invoice.form.createDescription")}
								</p>
							</div>
						</div>
						{isEditMode ? (
							<div className='flex gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										// Reset to create mode by clearing editInvoice
										window.location.href = "/home/invoices";
									}}>
									<Trash2 className='w-4 h-4 mr-2' />
									{t("invoice.form.cancelEdit")}
								</Button>
								<Link href='/home/invoices'>
									<Button variant='outline' size='sm'>
										<Database className='w-4 h-4 mr-2' />
										{t("invoice.form.backToList")}
									</Button>
								</Link>
							</div>
						) : (
							<div className='flex gap-2'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => {
										// Reset form to start fresh
										setSelectedCustomer(null);
										setProducts([]);
										setSelectedTable("");
										setTableRows([]);
										setTableValidation(null);
									setInvoiceForm({
										due_date: "",
										payment_terms: t("invoice.form.net15Days"),
										payment_method: t("invoice.form.bankTransfer"),
										notes: "",
										status: "draft",
										invoice_series: "",
									});
										setInvoiceTotals(null);
									}}>
									<Plus className='w-4 h-4 mr-2' />
									{t("invoice.form.newInvoice")}
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card className='border-0 shadow-lg'>
				<CardHeader className='pb-4'>
					<CardTitle className='flex items-center gap-2 text-xl'>
						<Calculator className='w-5 h-5 text-primary' />
						{t("invoice.form.invoiceConfiguration")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-8'>
						{/* Invoice Base Currency Selection */}
						<div className='space-y-4'>
							<Label className='text-base font-medium flex items-center gap-2'>
								<Globe className='w-4 h-4 text-primary' />
								{t("invoice.form.baseCurrency")}
							</Label>
							<Select value={baseCurrency} onValueChange={setBaseCurrency}>
								<SelectTrigger className='w-full sm:w-64'>
									<SelectValue
										placeholder={t("invoice.form.selectBaseCurrency")}
									/>
								</SelectTrigger>
								<SelectContent>
									{availableCurrencies.map((currency) => (
										<SelectItem key={currency} value={currency}>
											{currency} -{" "}
											{currency === "RON"
												? t("invoice.form.currencies.ron")
												: currency === "EUR"
												? t("invoice.form.currencies.eur")
												: currency === "USD"
												? t("invoice.form.currencies.usd")
												: currency === "GBP"
												? t("invoice.form.currencies.gbp")
												: currency === "CAD"
												? t("invoice.form.currencies.cad")
												: currency === "AUD"
												? t("invoice.form.currencies.aud")
												: currency === "JPY"
												? t("invoice.form.currencies.jpy")
												: currency === "CHF"
												? t("invoice.form.currencies.chf")
												: currency}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className='text-sm text-muted-foreground'>
								{t("invoice.form.baseCurrencyDescription", {
									currency: baseCurrency,
								})}
							</p>
						</div>

						{/* Customer Selection */}
						<div className='space-y-4'>
							<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
								<Label className='text-base font-medium flex items-center gap-2'>
									<User className='w-4 h-4 text-primary' />
									{t("invoice.form.customer")}
								</Label>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => setShowCustomerForm(true)}
									className='w-full sm:w-auto'>
									<Plus className='w-4 h-4 mr-2' />
									{t("invoice.form.addNewCustomer")}
								</Button>
							</div>

							{loading ? (
								<div className='w-full h-10 bg-muted/30 rounded-md flex items-center px-3'>
									<Skeleton className='h-4 w-48' />
								</div>
							) : (
								<Select
									value={
										selectedCustomer
											? selectedCustomer.toString()
											: "no-customer"
									}
									onValueChange={(value) => {
										if (value === "no-customer") return;
										setSelectedCustomer(Number(value));
									}}>
									<SelectTrigger className='w-full'>
										<SelectValue
											placeholder={t("invoice.form.selectCustomer")}
										/>
									</SelectTrigger>
									<SelectContent>
										{customers.map((customer) => (
											<SelectItem
												key={customer.id}
												value={customer.id.toString()}>
												<div className='flex items-center gap-2'>
													<User className='w-4 h-4' />
													{customer.name ||
														customer.customer_name ||
														"Nume lipsă"}
													{(customer.email || customer.customer_email) &&
														` (${customer.email || customer.customer_email})`}
												</div>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>

						{/* Invoice Details */}
						<div className='space-y-4'>
							<Label className='text-base font-medium flex items-center gap-2'>
								<FileText className='w-4 h-4 text-primary' />
								{t("invoice.form.invoiceDetails")}
							</Label>

							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								{/* Data Scadentă */}
								<div>
									<Label htmlFor='due_date'>
										{t("invoice.form.dueDate")} *
									</Label>
									<Input
										id='due_date'
										type='date'
										value={invoiceForm.due_date}
										onChange={(e) =>
											setInvoiceForm({
												...invoiceForm,
												due_date: e.target.value,
											})
										}
										required
										className='w-full'
									/>
								</div>

								{/* Status Factură */}
								<div>
									<Label htmlFor='status'>
										{t("invoice.form.status")} *
									</Label>
									<Select
										value={invoiceForm.status || "draft"}
										onValueChange={(value) =>
											setInvoiceForm({
												...invoiceForm,
												status: value,
											})
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">
												{t("status.draft")}
											</SelectItem>
											<SelectItem value="issued">
												{t("status.issued")}
											</SelectItem>
											<SelectItem value="paid">
												{t("status.paid")}
											</SelectItem>
											<SelectItem value="overdue">
												{t("status.overdue")}
											</SelectItem>
											<SelectItem value="canceled">
												{t("status.canceled")}
											</SelectItem>
										</SelectContent>
									</Select>
									
									{/* Quick Status Action Buttons */}
									<div className='flex gap-2 mt-2'>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => setInvoiceForm({...invoiceForm, status: "paid"})}
											className={`${invoiceForm.status === "paid" ? "bg-green-50 border-green-200 text-green-800" : ""}`}
										>
											<CheckCircle className='w-3 h-3 mr-1' />
											{t("status.paid")}
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => setInvoiceForm({...invoiceForm, status: "canceled"})}
											className={`${invoiceForm.status === "canceled" ? "bg-red-50 border-red-200 text-red-800" : ""}`}
										>
											<X className='w-3 h-3 mr-1' />
											{t("status.canceled")}
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => setInvoiceForm({...invoiceForm, status: "issued"})}
											className={`${invoiceForm.status === "issued" ? "bg-blue-50 border-blue-200 text-blue-800" : ""}`}
										>
											<Send className='w-3 h-3 mr-1' />
											{t("status.issued")}
										</Button>
									</div>
								</div>

								{/* Termeni de Plată */}
								<div>
									<Label htmlFor='payment_terms'>
										{t("invoice.form.paymentTerms")}
									</Label>
									<Select
										value={invoiceForm.payment_terms}
										onValueChange={(value) =>
											setInvoiceForm({
												...invoiceForm,
												payment_terms: value,
											})
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={t("invoice.form.net15Days")}>
												{t("invoice.form.net15Days")}
											</SelectItem>
											<SelectItem value={t("invoice.form.net30Days")}>
												{t("invoice.form.net30Days")}
											</SelectItem>
											<SelectItem value={t("invoice.form.net45Days")}>
												{t("invoice.form.net45Days")}
											</SelectItem>
											<SelectItem value={t("invoice.form.net60Days")}>
												{t("invoice.form.net60Days")}
											</SelectItem>
											<SelectItem value={t("invoice.form.onPresentation")}>
												{t("invoice.form.onPresentation")}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{/* Metodă de Plată */}
								<div>
									<Label htmlFor='payment_method'>
										{t("invoice.form.paymentMethod")} *
									</Label>
									<Select
										value={invoiceForm.payment_method}
										onValueChange={(value) =>
											setInvoiceForm({
												...invoiceForm,
												payment_method: value,
											})
										}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value={t("invoice.form.bankTransfer")}>
												{t("invoice.form.bankTransfer")}
											</SelectItem>
											<SelectItem value={t("invoice.form.bankCard")}>
												{t("invoice.form.bankCard")}
											</SelectItem>
											<SelectItem value={t("invoice.form.cash")}>
												{t("invoice.form.cash")}
											</SelectItem>
											<SelectItem value={t("invoice.form.check")}>
												{t("invoice.form.check")}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Seria Facturii */}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<div>
									<Label htmlFor='invoice_series'>
										{t("invoice.form.invoiceSeries")}
									</Label>
									<Select
										value={invoiceForm.invoice_series || ""}
										onValueChange={(value) =>
											setInvoiceForm({
												...invoiceForm,
												invoice_series: value,
											})
										}>
										<SelectTrigger>
											<SelectValue placeholder={t("invoice.form.selectSeries")} />
										</SelectTrigger>
										<SelectContent>
											{availableSeries && availableSeries.length > 0 ? (
												availableSeries.map((series) => (
													<SelectItem key={series.id} value={series.series}>
														{series.series}
													</SelectItem>
												))
											) : (
												<SelectItem value="no-series" disabled>
													{t("invoice.form.noSeriesAvailable")}
												</SelectItem>
											)}
										</SelectContent>
									</Select>
								</div>
							</div>

							{/* Notes */}
							<div>
								<Label htmlFor='notes'>{t("invoice.form.notes")}</Label>
								<Textarea
									id='notes'
									value={invoiceForm.notes}
									onChange={(e) =>
										setInvoiceForm({
											...invoiceForm,
											notes: e.target.value,
										})
									}
									placeholder={t("invoice.form.notesPlaceholder")}
									className='w-full'
								/>
							</div>
						</div>

						{/* Product Selection Form */}
						<div className='space-y-4'>
							<Label className='text-base font-medium flex items-center gap-2'>
								<Package className='w-4 h-4 text-primary' />
								{t("invoice.form.addProduct")}
							</Label>

							<Card className='border-0 shadow-sm bg-muted/20'>
								<CardContent className='p-6'>
									<div className='grid grid-cols-1 lg:grid-cols-6 gap-4'>
										{/* Table Selection */}
										<div className='lg:col-span-2'>
											<Label className='text-sm font-medium'>
												{t("invoice.form.productTable")}
											</Label>
											{loading || availableTablesLoading ? (
												<div className='w-full h-10 bg-muted/30 rounded-md flex items-center px-3'>
													<Skeleton className='h-4 w-32' />
												</div>
											) : (
												<Select
													value={selectedTable || "no-table"}
													onValueChange={(value) => {
														if (value === "no-table") return;
														setSelectedTable(value);
														// Reset product selection
														setProductForm((prev) => ({
															...prev,
															product_ref_table: value,
															product_ref_id: 0,
														}));
													}}>
													<SelectTrigger className='w-full'>
														<SelectValue
															placeholder={t("invoice.form.selectTable")}
														/>
													</SelectTrigger>
													<SelectContent>
														{availableTables && availableTables.length > 0 ? (
															availableTables.map((table) => (
																<SelectItem key={table.id} value={table.name}>
																	{table.name}
																</SelectItem>
															))
														) : (
															<SelectItem value='no-tables' disabled>
																{t("invoice.form.noTablesAvailable")}
															</SelectItem>
														)}
													</SelectContent>
												</Select>
											)}

											{/* Table Validation Message */}
											{tableValidation && (
												<div
													className={`mt-3 p-3 rounded-lg text-sm border ${
														tableValidation.isValid
															? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800"
															: "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800"
													}`}>
													{tableValidation.message}
													{!tableValidation.isValid &&
														tableValidation.missingTypes.length > 0 && (
															<div className='mt-2'>
																<strong>
																	{t("invoice.form.missingSemanticTypes")}:
																</strong>
																<ul className='list-disc list-inside ml-2 mt-1'>
																	{tableValidation.missingTypes.map(
																		(type, index) => (
																			<li key={index}>{type}</li>
																		),
																	)}
																</ul>
																<p className='text-xs mt-2'>
																	{t("invoice.form.addSemanticColumnsHint")}
																</p>
															</div>
														)}
												</div>
											)}

											{(!availableTables || availableTables.length === 0) && (
												<p className='text-sm text-muted-foreground mt-2'>
													{t("invoice.form.noCustomTables")}
												</p>
											)}
										</div>

										{/* Row Selection */}
										<div className='lg:col-span-2'>
											<Label className='text-sm font-medium'>
												{t("invoice.form.product")}
											</Label>
											{loading || tableRowsLoading ? (
												<div className='w-full h-10 bg-muted/30 rounded-md flex items-center px-3'>
													<Skeleton className='h-4 w-40' />
												</div>
											) : (
												<Select
													value={
														productForm.product_ref_id > 0
															? productForm.product_ref_id.toString()
															: "no-product"
													}
													onValueChange={(value) => {
														if (value === "no-product") return;
														setProductForm((prev) => ({
															...prev,
															product_ref_id: Number(value),
														}));
													}}
													disabled={!selectedTable}>
													<SelectTrigger className='w-full'>
														<SelectValue
															placeholder={t("invoice.form.selectProduct")}
														/>
													</SelectTrigger>
													<SelectContent>
														{tableRows.length > 0 ? (
															tableRows.map((row: any) => {
																const productDetails = extractProductDetails(
																	selectedTable,
																	row,
																);
																return (
																	<SelectItem
																		key={row.id}
																		value={row.id.toString()}>
																		<div className='flex flex-col gap-1 py-1'>
																			<div className='flex items-center justify-between'>
																				<div className='font-medium'>
																					{productDetails.name ||
																						`Product #${row.id}`}
																				</div>
																			</div>
																			<div className='text-xs text-muted-foreground space-y-1'>
																				{productDetails.description && (
																					<div className='truncate max-w-[200px]'>
																						{productDetails.description}
																					</div>
																				)}
																				<div className='flex items-center gap-2'>
																					{productDetails.price &&
																						productDetails.currency && (
																							<span className='bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded text-xs font-medium'>
																								{productDetails.price}{" "}
																								{productDetails.currency}
																							</span>
																						)}
																					{productDetails.sku && (
																						<span className='bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs'>
																							SKU: {productDetails.sku}
																						</span>
																					)}
																				</div>
																				{productDetails.category && (
																					<div className='text-xs text-muted-foreground'>
																						Category: {productDetails.category}
																					</div>
																				)}
																			</div>
																		</div>
																	</SelectItem>
																);
															})
														) : (
															<SelectItem value='no-rows' disabled>
																{selectedTable
																	? t("invoice.form.noRowsAvailable")
																	: t("invoice.form.selectTableFirst")}
															</SelectItem>
														)}
													</SelectContent>
												</Select>
											)}
										</div>

										{/* Quantity */}
										<div>
											<Label className='text-sm font-medium'>
												{t("invoice.form.quantity")}
											</Label>
											<Input
												type='number'
												min='1'
												value={productForm.quantity}
												onChange={(e) =>
													setProductForm((prev) => ({
														...prev,
														quantity: Number(e.target.value),
													}))
												}
												className='w-full'
											/>
										</div>
									</div>

									{/* Description */}
									<div className='mt-4'>
										<Label className='text-sm font-medium'>
											{t("invoice.form.description")}
										</Label>
										<Textarea
											value={productForm.description}
											onChange={(e) =>
												setProductForm((prev) => ({
													...prev,
													description: e.target.value,
												}))
											}
											placeholder={t("invoice.form.descriptionPlaceholder")}
											className='w-full'
										/>
									</div>

									{/* Add Button */}
									<div className='flex justify-end mt-4'>
										<Button
											type='button'
											variant='outline'
											size='sm'
											onClick={addProductFromForm}
											className='w-full sm:w-auto'>
											<Plus className='w-4 h-4 mr-2' />
											{t("invoice.form.addProduct")}
										</Button>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Products List */}
						<div className='space-y-4'>
							<Label className='text-base font-medium flex items-center gap-2'>
								<Package className='w-4 h-4 text-primary' />
								{t("invoice.form.selectedProducts")}
							</Label>

							{products.length === 0 && (
								<Card className='border-0 shadow-sm bg-muted/20'>
									<CardContent className='text-center py-12'>
										<div className='w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4'>
											<Package className='w-8 h-8 text-muted-foreground' />
										</div>
										<p className='text-muted-foreground font-medium'>
											{t("invoice.form.noProductsAdded")}
										</p>
										<p className='text-sm text-muted-foreground mt-1'>
											{t("invoice.form.useFormToAddProducts")}
										</p>
									</CardContent>
								</Card>
							)}

							<div className='space-y-4'>
								{products.map((product, index) => (
									<Card
										key={product.id}
										className='border-0 shadow-sm hover:shadow-md transition-all duration-200'>
										<CardContent className='p-6'>
											<div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
												<div className='flex-1 space-y-4'>
													{/* Product Header */}
													<div className='mb-6'>
														<div className='flex items-start gap-4 mb-4'>
															<div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg'>
																<span className='text-sm font-medium text-white'>
																	{index + 1}
																</span>
															</div>
															<div className='flex-1 min-w-0'>
																<h4 className='font-semibold text-lg text-foreground truncate'>
																	{(() => {
																		const row = tableRows.find(
																			(r: any) =>
																				r.id === product.product_ref_id,
																		);
																		const details = extractProductDetails(
																			product.product_ref_table,
																			row,
																		);
																		return (
																			details.name ||
																			getRowDisplayName(
																				product.product_ref_table,
																				product.product_ref_id,
																			)
																		);
																	})()}
																</h4>
																<div className='text-sm text-muted-foreground space-y-1'>
																	<div>
																		{t("invoice.form.table")}:{" "}
																		<span className='font-medium'>
																			{product.product_ref_table}
																		</span>{" "}
																		• ID:{" "}
																		<span className='font-medium'>
																			{product.product_ref_id}
																		</span>
																	</div>
																	{(() => {
																		const row = tableRows.find(
																			(r: any) =>
																				r.id === product.product_ref_id,
																		);
																		const details = extractProductDetails(
																			product.product_ref_table,
																			row,
																		);
																		return (
																			<div className='flex flex-wrap gap-2 mt-2'>
																				{details.description && (
																					<div className='bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs max-w-[200px] truncate'>
																						{details.description}
																					</div>
																				)}
																				{details.sku && (
																					<div className='bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs'>
																						SKU: {details.sku}
																					</div>
																				)}
																				{details.category && (
																					<div className='bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded text-xs'>
																						{details.category}
																					</div>
																				)}
																				{details.brand && (
																					<div className='bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded text-xs'>
																						{details.brand}
																					</div>
																				)}
																			</div>
																		);
																	})()}
																</div>
															</div>
														</div>

														{/* View Details Button */}
														<div className='flex-shrink-0'>
															<ProductDetailsModal
																productName={(() => {
																	const row = tableRows.find(
																		(r: any) => r.id === product.product_ref_id,
																	);
																	const details = extractProductDetails(
																		product.product_ref_table,
																		row,
																	);
																	return (
																		details.name ||
																		getRowDisplayName(
																			product.product_ref_table,
																			product.product_ref_id,
																		)
																	);
																})()}
																productDetails={(() => {
																	const row = tableRows.find(
																		(r: any) => r.id === product.product_ref_id,
																	);
																	return row;
																})()}
																tableName={product.product_ref_table}
																productId={product.product_ref_id}>
																<Button
																	variant='outline'
																	size='sm'
																	className='flex items-center gap-2'>
																	<Eye className='w-4 h-4' />
																	{t("invoice.form.viewDetails")}
																</Button>
															</ProductDetailsModal>
														</div>
													</div>

													{/* Product Details Grid */}
													<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
														<div className='space-y-2 p-3 bg-muted/20 rounded-lg'>
															<p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>
																{t("invoice.form.quantity")}
															</p>
															<Input
																type='number'
																min='1'
																value={product.quantity}
																onChange={(e) =>
																	updateProduct(
																		product.id,
																		"quantity",
																		Number(e.target.value),
																	)
																}
																className='w-20 h-16 text-center text-lg font-semibold'
															/>
														</div>
														<div className='space-y-2 p-3 bg-muted/20 rounded-lg'>
															<p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>
																{t("invoice.form.unitOfMeasure")}
															</p>
															<p className='font-bold text-lg text-purple-600 dark:text-purple-400'>
																{extractProductUnitOfMeasure(
																	product.product_ref_table,
																	product.product_ref_id,
																) || t("invoice.form.unit")}
															</p>
														</div>
														<div className='space-y-2 p-3 bg-muted/20 rounded-lg'>
															<p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>
																{t("invoice.form.currency")}
															</p>
															<p className='font-bold text-lg text-blue-600 dark:text-blue-400'>
																{product.currency}
															</p>
														</div>
														<div className='space-y-2 p-3 bg-muted/20 rounded-lg'>
															<p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>
																{t("invoice.form.unitPrice")}
															</p>
															<p className='font-bold text-lg text-green-600 dark:text-green-400'>
																{product.extractedPrice && !isNaN(product.extractedPrice) ? (
																	`${product.extractedPrice.toFixed(2)} ${
																		product.currency
																	}`
																) : (
																	<span className='text-muted-foreground'>
																		{t("invoice.form.noPriceFound")}
																	</span>
																)}
															</p>
														</div>
														<div className='space-y-2 p-3 bg-muted/20 rounded-lg'>
															<p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>
																{t("invoice.form.totalOriginal")}
															</p>
															<p className='font-bold text-xl text-green-700 dark:text-green-300'>
																{product.calculatedTotal && !isNaN(product.calculatedTotal) ? (
																	`${product.calculatedTotal.toFixed(2)} ${
																		product.currency
																	}`
																) : (
																	<span className='text-muted-foreground'>
																		0.00 {product.currency}
																	</span>
																)}
															</p>
														</div>
														<div className='space-y-2 p-3 bg-muted/20 rounded-lg'>
															<p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>
																{t("invoice.form.totalConverted", {
																	currency: baseCurrency,
																})}
															</p>
															<p className='font-bold text-xl text-blue-700 dark:text-blue-300'>
																{product.convertedTotal && !isNaN(product.convertedTotal) ? (
																	`${formatCurrency(
																		product.convertedTotal,
																		baseCurrency,
																	)}`
																) : (
																	<span className='text-muted-foreground'>
																		{formatCurrency(0, baseCurrency)}
																	</span>
																)}
															</p>
														</div>
														<div className='space-y-2 p-3 bg-muted/20 rounded-lg'>
															<p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>
																{t("invoice.form.vatRate")}
															</p>
															<p className='font-bold text-lg text-orange-600 dark:text-orange-400'>
																{(() => {
																	const row = tableRows.find(
																		(r: any) => r.id === product.product_ref_id,
																	);
																	const details = extractProductDetails(
																		product.product_ref_table,
																		row,
																	);
																	return details.vat ? `${details.vat}%` : "0%";
																})()}
															</p>
														</div>
														<div className='space-y-2 p-3 bg-muted/20 rounded-lg'>
															<p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>
																{t("invoice.form.status")}
															</p>
															<Badge variant='secondary' className='text-xs'>
																<CheckCircle className='w-3 h-3 mr-1' />
																{t("invoice.form.added")}
															</Badge>
														</div>
													</div>

													{/* Conversion Details */}
													{product.conversion &&
														product.currency !== baseCurrency && (
															<div className='pt-3 border-t border-border'>
																<div className='flex items-center gap-2 text-sm text-muted-foreground'>
																	<Globe className='w-4 h-4' />
																	<span>
																		{t("invoice.form.exchangeRate", {
																			fromCurrency: product.currency,
																			toCurrency: baseCurrency,
																			rate: product.conversion.exchangeRate.toFixed(
																				4,
																			),
																		})}
																	</span>
																</div>
															</div>
														)}

													{/* Description */}
													{product.description && (
														<div className='pt-3 border-t border-border'>
															<p className='text-sm text-muted-foreground'>
																<span className='font-medium'>
																	{t("invoice.form.description")}:
																</span>{" "}
																{product.description}
															</p>
														</div>
													)}
												</div>

												{/* Actions */}
												<div className='flex flex-col gap-2 lg:items-end'>
													<Button
														type='button'
														variant='outline'
														size='sm'
														onClick={() => removeProduct(product.id)}
														className='w-full lg:w-auto text-destructive hover:text-destructive hover:bg-destructive/10'>
														<Trash2 className='w-4 h-4 mr-2' />
														{t("invoice.form.remove")}
													</Button>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</div>

						{/* Invoice Summary */}
						{products.length > 0 ? (
							<Card className='border-0 shadow-lg bg-gradient-to-br from-muted/20 to-muted/40'>
								<CardContent className='p-6'>
									<div className='space-y-6'>
										<div className='flex items-center justify-between'>
											<div className='space-y-1'>
												<p className='text-sm text-muted-foreground font-medium'>
													{t("invoice.form.totalItems")}
												</p>
												<p className='text-3xl font-bold text-foreground'>
													{products.length}
												</p>
											</div>
											<div className='w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center'>
												<Calculator className='w-8 h-8 text-primary' />
											</div>
										</div>

										{/* Currency Breakdown */}
										{invoiceTotals && invoiceTotals.totalsByCurrency ? (
											<div className='space-y-3'>
												<p className='text-sm text-muted-foreground font-medium'>
													{t("invoice.form.amountByCurrency")}
												</p>
												<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
													{Object.entries(invoiceTotals.totalsByCurrency).map(
														([currency, amount]) => (
															<div
																key={currency}
																className='flex justify-between items-center p-3 bg-background rounded-lg border shadow-sm'>
																<span className='font-medium'>{currency}</span>
																<span className='text-lg font-bold text-green-600 dark:text-green-400'>
																	{(amount as number).toFixed(2)}
																</span>
															</div>
														),
													)}
												</div>
											</div>
										) : (
											<div className='space-y-3'>
												<p className='text-sm text-muted-foreground font-medium'>
													{t("invoice.form.amountByCurrency")}
												</p>
												<div className='text-center py-4 text-muted-foreground'>
													{t("invoice.form.calculatingBreakdown")}
												</div>
											</div>
										)}

										{/* Base Currency Total */}
										<div className='pt-4 border-t border-border'>
											<div className='space-y-3'>
												<div className='flex justify-between items-center'>
													<span className='text-lg font-medium text-muted-foreground'>
														{t("invoice.form.subtotalExclVat", {
															currency: baseCurrency,
														})}
													</span>
													<span className='text-2xl font-bold text-green-600 dark:text-green-400'>
														{invoiceTotals
															? formatCurrency(
																	invoiceTotals.subtotalInBaseCurrency,
																	baseCurrency,
															  )
															: t("invoice.form.calculating")}
													</span>
												</div>
												<div className='flex justify-between items-center'>
													<span className='text-lg font-medium text-muted-foreground'>
														{t("invoice.form.vatTotal", {
															currency: baseCurrency,
														})}
													</span>
													<span className='text-2xl font-bold text-orange-600 dark:text-orange-400'>
														{invoiceTotals
															? formatCurrency(
																	invoiceTotals.vatTotalInBaseCurrency,
																	baseCurrency,
															  )
															: t("invoice.form.calculating")}
													</span>
												</div>
												<div className='pt-3 border-t border-border'>
													<div className='flex justify-between items-center'>
														<span className='text-xl font-medium text-muted-foreground'>
															{t("invoice.form.grandTotalInclVat", {
																currency: baseCurrency,
															})}
														</span>
														<span className='text-4xl font-bold text-primary'>
															{invoiceTotals
																? formatCurrency(
																		invoiceTotals.grandTotalInBaseCurrency,
																		baseCurrency,
																  )
																: t("invoice.form.calculating")}
														</span>
													</div>
												</div>
											</div>
										</div>

										{/* Exchange Rate Information */}
										{Object.keys(exchangeRates).length > 0 && (
											<div className='pt-4 border-t border-border'>
												<div className='space-y-3'>
													<p className='text-sm text-muted-foreground font-medium'>
														{t("invoice.form.exchangeRatesUsed")}
													</p>
													<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
														{Object.entries(exchangeRates).map(
															([currency, rate]) => (
																<div
																	key={currency}
																	className='text-xs bg-background p-3 rounded-lg border shadow-sm'>
																	<div className='font-medium'>
																		{currency} → {baseCurrency}
																	</div>
																	<div className='text-muted-foreground text-lg font-bold'>
																		{rate.rate.toFixed(4)}
																	</div>
																</div>
															),
														)}
													</div>
													<p className='text-xs text-muted-foreground'>
														{t("invoice.form.ratesAsOf", {
															date: conversionDate ? new Date(conversionDate).toLocaleString() : 'Unknown date',
														})}
													</p>
												</div>
											</div>
										)}

										{/* Warning for mixed currencies */}
										{(() => {
											const currencies = [
												...new Set(products.map((p) => p.currency)),
											];
											if (currencies.length > 1) {
												return (
													<div className='p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg'>
														<div className='flex items-center gap-2'>
															<AlertTriangle className='w-4 h-4 text-yellow-600 dark:text-yellow-400' />
															<p className='text-sm text-yellow-800 dark:text-yellow-200'>
																{t("invoice.form.mixedCurrenciesWarning", {
																	currency: baseCurrency,
																})}
															</p>
														</div>
													</div>
												);
											}
											return null;
										})()}
									</div>
								</CardContent>
							</Card>
						) : null}

						{/* Validation Errors Display */}
						{showValidationErrors && validationResult && !validationResult.isValid && (
							<Card className='border-destructive/20 bg-destructive/5'>
								<CardContent className='p-4'>
									<div className='flex items-start gap-3'>
										<AlertTriangle className='w-5 h-5 text-destructive mt-0.5 flex-shrink-0' />
										<div className='space-y-2'>
											<h4 className='font-medium text-destructive'>
												Please fix the following errors:
											</h4>
											<ul className='text-sm text-destructive/80 space-y-1'>
												{validationResult.errors.map((error, index) => (
													<li key={index} className='flex items-start gap-2'>
														<span className='text-destructive font-medium'>{index + 1}.</span>
														<span>{error}</span>
													</li>
												))}
											</ul>
											{validationResult.missingFields.length > 0 && (
												<div className='pt-2 border-t border-destructive/20'>
													<p className='text-sm font-medium text-destructive'>
														Missing required fields: {validationResult.missingFields.join(", ")}
													</p>
												</div>
											)}
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Warnings Display */}
						{validationResult && validationResult.warnings.length > 0 && (
							<Card className='border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20'>
								<CardContent className='p-4'>
									<div className='flex items-start gap-3'>
										<Info className='w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0' />
										<div className='space-y-2'>
											<h4 className='font-medium text-yellow-800 dark:text-yellow-200'>
												Warnings:
											</h4>
											<ul className='text-sm text-yellow-700 dark:text-yellow-300 space-y-1'>
												{validationResult.warnings.map((warning, index) => (
													<li key={index} className='flex items-start gap-2'>
														<span className='text-yellow-600 dark:text-yellow-400 font-medium'>{index + 1}.</span>
														<span>{warning}</span>
													</li>
												))}
											</ul>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* ANAF Integration Toggle */}
						<div className='pt-4 border-t border-border/20'>
							<ANAFIntegrationToggle
								onToggle={(enabled) => console.log('ANAF toggle:', enabled)}
								isEnabled={false}
								isAuthenticated={false}
								onAuthenticate={() => console.log('ANAF authenticate')}
								onDisconnect={() => console.log('ANAF disconnect')}
								isLoading={false}
							/>
						</div>

						{/* Submit Button */}
						<div className='flex justify-end pt-4'>
							
							<Button
								type='submit'
								size='lg'
								disabled={!validationResult}
								className='w-full sm:w-auto px-8 py-6 text-lg'>
								<FileText className='w-5 h-5 mr-2' />
								{isEditMode
									? t("invoice.form.updateInvoice")
									: t("invoice.form.generateInvoice")}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			{/* Customer Creation Modal */}
			{showCustomerForm && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
					<Card className='w-full max-w-md border-0 shadow-2xl'>
						<CardHeader className='pb-4'>
							<CardTitle className='flex items-center gap-2'>
								<User className='w-5 h-5 text-primary' />
								{t("invoice.form.addNewCustomer")}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleCreateCustomer} className='space-y-4'>
								<div>
									<Label
										htmlFor='customer_name'
										className='text-sm font-medium'>
										{t("invoice.form.customerName")} *
									</Label>
									<Input
										id='customer_name'
										value={customerForm.customer_name}
										onChange={(e) =>
											setCustomerForm({
												...customerForm,
												customer_name: e.target.value,
											})
										}
										required
										className='w-full'
									/>
								</div>

								<div>
									<Label
										htmlFor='customer_email'
										className='text-sm font-medium'>
										{t("invoice.form.email")} *
									</Label>
									<Input
										id='customer_email'
										type='email'
										value={customerForm.customer_email}
										onChange={(e) =>
											setCustomerForm({
												...customerForm,
												customer_email: e.target.value,
											})
										}
										required
										className='w-full'
									/>
								</div>

								<div>
									<Label
										htmlFor='customer_address'
										className='text-sm font-medium'>
										{t("invoice.form.address")}
									</Label>
									<Textarea
										id='customer_address'
										value={customerForm.customer_address}
										onChange={(e) =>
											setCustomerForm({
												...customerForm,
												customer_address: e.target.value,
											})
										}
										className='w-full'
									/>
								</div>

								<div className='flex flex-col sm:flex-row gap-2 justify-end pt-4'>
									<Button
										type='button'
										variant='outline'
										onClick={() => setShowCustomerForm(false)}
										className='w-full sm:w-auto'>
										{t("invoice.form.cancel")}
									</Button>
									<Button type='submit' className='w-full sm:w-auto'>
										{t("invoice.form.createCustomer")}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
