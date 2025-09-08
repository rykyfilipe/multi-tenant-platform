/** @format */

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { InvoiceProduct } from "@/lib/invoice-system";

export interface Customer {
	id: number;
	customer_name: string;
	customer_email: string;
	customer_address?: string;
	[key: string]: any;
}

export interface Invoice {
	id: number;
	invoice_number: string;
	date: string;
	customer_id: number;
	[key: string]: any;
}

export interface InvoiceItem {
	id: number;
	product_ref_table: string;
	product_ref_id: number;
	quantity: number;
	price: number;
	description?: string;
	product_details?: any;
}

export interface InvoiceDetails {
	invoice: Invoice;
	customer: Customer;
	items: InvoiceItem[];
	totals: {
		subtotal: number;
		items_count: number;
	};
}

export function useInvoiceSystem() {
	const { token, user, tenant } = useApp();
	const [customers, setCustomers] = useState<Customer[]>([]);
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [initialLoading, setInitialLoading] = useState(false);

	const tenantId = tenant?.id;

	// Fetch customers
	const fetchCustomers = useCallback(async () => {
		if (!token || !tenantId) return;

		try {
			setInitialLoading(true);
			setError(null);

			const response = await fetch(`/api/tenants/${tenantId}/customers`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error("Failed to fetch customers");
			}

			const data = await response.json();
			console.log(data);
			setCustomers(data.customers || []);
		} catch (err) {
			console.error("Error fetching customers:", err);
			setError(
				err instanceof Error ? err.message : "Failed to fetch customers",
			);
		} finally {
			setInitialLoading(false);
		}
	}, [token, tenantId]);

	// Fetch invoices
	const fetchInvoices = useCallback(async () => {
		if (!token || !tenantId) return;

		try {
			setInitialLoading(true);
			setError(null);

			const response = await fetch(`/api/tenants/${tenantId}/invoices`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error("Failed to fetch invoices");
			}

			const data = await response.json();
			setInvoices(data.data.invoices || []);
		} catch (err) {
			console.error("Error fetching invoices:", err);
			setError(err instanceof Error ? err.message : "Failed to fetch invoices");
		} finally {
			setInitialLoading(false);
		}
	}, [token, tenantId]);

	// Create customer
	const createCustomer = useCallback(
		async (customerData: {
			customer_name: string;
			customer_email: string;
			customer_address?: string;
			additional_data?: Record<string, any>;
		}) => {
			if (!token || !tenantId) {
				throw new Error("Not authenticated");
			}

			try {
				setError(null);

				const response = await fetch(`/api/tenants/${tenantId}/customers`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(customerData),
				});

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to create customer");
				}

				const data = await response.json();

				// Add to local state immediately
				setCustomers((prev) => [...prev, data.customer]);

				return data.customer;
			} catch (err) {
				console.error("Error creating customer:", err);
				setError(
					err instanceof Error ? err.message : "Failed to create customer",
				);
				throw err;
			}
		},
		[token, tenantId],
	);

	// Create invoice
	const createInvoice = useCallback(
		async (invoiceData: {
			customer_id: number;
			base_currency: string;
			due_date: string;
			payment_terms?: string;
			payment_method: string;
			notes?: string;
			status?: string;
			invoice_series?: string;
			products: Array<{
				product_ref_table: string;
				product_ref_id: number;
				quantity: number;
				unit_of_measure?: string;
				description?: string;
				currency: string;
				original_price: number;
				converted_price: number;
				price: number;
			}>;
			additional_data?: Record<string, any>;
		}) => {
			if (!token || !tenantId) {
				throw new Error("Not authenticated");
			}

			try {
				setError(null);

				// Debug: Log the data being sent
				console.log("=== CREATING INVOICE ===");
				console.log("Invoice data:", JSON.stringify(invoiceData, null, 2));

				const response = await fetch(`/api/tenants/${tenantId}/invoices`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(invoiceData),
				});

				console.log("Response status:", response.status);
				console.log("Response ok:", response.ok);

				if (!response.ok) {
					const errorData = await response.json();
					console.error("API Error:", errorData);
					throw new Error(errorData.error || "Failed to create invoice");
				}

				const data = await response.json();

				// Add to local state immediately (optimistic update) with all calculated data
				const newInvoice = {
					id: data.invoice.id,
					invoice_number: data.invoice.invoice_number,
					customer_id: data.invoice.customer_id,
					date: data.invoice.date || new Date().toISOString(),
					due_date: data.invoice.due_date,
					status: data.invoice.status || "draft",
					base_currency: data.invoice.base_currency,
					payment_terms: data.invoice.payment_terms,
					payment_method: data.invoice.payment_method,
					notes: data.invoice.notes,
					items_count: data.invoice.items_count || 0,
					subtotal: data.invoice.subtotal || 0,
					vat_total: data.invoice.vat_total || 0,
					total_amount: data.invoice.total_amount || 0,
					// Add other fields that might be needed
				};

				console.log("✅ Adding invoice to local state:", newInvoice);
				setInvoices((prev) => [newInvoice, ...prev]);

				return data.invoice;
			} catch (err) {
				console.error("Error creating invoice:", err);
				setError(
					err instanceof Error ? err.message : "Failed to create invoice",
				);
				throw err;
			}
		},
		[token, tenantId],
	);

	// Get invoice details
	const getInvoiceDetails = useCallback(
		async (invoiceId: number): Promise<InvoiceDetails> => {
			if (!token || !tenantId) {
				throw new Error("Not authenticated");
			}

			try {
				const response = await fetch(
					`/api/tenants/${tenantId}/invoices/${invoiceId}`,
					{
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to fetch invoice details");
				}

				return await response.json();
			} catch (err) {
				console.error("Error fetching invoice details:", err);
				throw err;
			}
		},
		[token, tenantId],
	);

	// Update invoice
	const updateInvoice = useCallback(
		async (invoiceId: number, updateData: Partial<Invoice>) => {
			if (!token || !tenantId) {
				throw new Error("Not authenticated");
			}

			try {
				setLoading(true);
				setError(null);

				const response = await fetch(
					`/api/tenants/${tenantId}/invoices/${invoiceId}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify(updateData),
					},
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to update invoice");
				}

				const data = await response.json();

				// Update local state immediately
				setInvoices((prev) =>
					prev.map((invoice) =>
						invoice.id === invoiceId ? { ...invoice, ...updateData } : invoice,
					),
				);

				return data.invoice;
			} catch (err) {
				console.error("Error updating invoice:", err);
				setError(
					err instanceof Error ? err.message : "Failed to update invoice",
				);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, tenantId],
	);

	// Delete invoice
	const deleteInvoice = useCallback(
		async (invoiceId: number) => {
			if (!token || !tenantId) {
				throw new Error("Not authenticated");
			}

			try {
				setLoading(true);
				setError(null);

				const response = await fetch(
					`/api/tenants/${tenantId}/invoices/${invoiceId}`,
					{
						method: "DELETE",
						headers: { Authorization: `Bearer ${token}` },
					},
				);

				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || "Failed to delete invoice");
				}

				// Remove from local state immediately
				setInvoices((prev) =>
					prev.filter((invoice) => invoice.id !== invoiceId),
				);

				return true;
			} catch (err) {
				console.error("Error deleting invoice:", err);
				setError(
					err instanceof Error ? err.message : "Failed to delete invoice",
				);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[token, tenantId],
	);

	// Initialize data on mount
	useEffect(() => {
		if (token && tenantId) {
			fetchCustomers();
			fetchInvoices();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [token, tenantId]);

	return {
		customers,
		invoices,
		loading,
		initialLoading,
		error,
		fetchCustomers,
		fetchInvoices,
		createCustomer,
		createInvoice,
		updateInvoice,
		getInvoiceDetails,
		deleteInvoice,
		refresh: () => {
			fetchCustomers();
			fetchInvoices();
		},
	};
}
