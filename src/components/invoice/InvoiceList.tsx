/** @format */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	FileText,
	User,
	Calendar,
	Eye,
	Edit,
	Trash2,
	DollarSign,
	Package,
	MoreVertical,
	Clock,
	CheckCircle,
	AlertCircle,
	Users,
	Settings,
	Building,
	CreditCard,
	Settings as SettingsIcon,
	Search,
	Filter,
	Plus,
	Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { convertCurrency } from '@/lib/currency-exchange-client';
import { PDFPreviewModal } from './PDFPreviewModal';
import { ANAFInvoiceActions } from '@/components/anaf/ANAFInvoiceActions';

interface EnhancedInvoiceListProps {
	onEditInvoice?: (invoice: any) => void;
	invoices: any[];
	customers: any[];
	loading: boolean;
	error: string | null;
	deleteInvoice: (invoiceId: number) => Promise<boolean>;
	getInvoiceDetails: (invoiceId: number) => Promise<any>;
	refreshInvoices?: () => void;
	isANAFAuthenticated?: boolean;
}

export function EnhancedInvoiceList({
	onEditInvoice,
	invoices,
	customers,
	loading,
	error,
	deleteInvoice,
	getInvoiceDetails,
	refreshInvoices,
	isANAFAuthenticated = false,
}: EnhancedInvoiceListProps) {
	const { token, tenant, showAlert } = useApp();
	const { t } = useLanguage();
	
	// Add error state for component-level error handling
	const [componentError, setComponentError] = useState<string | null>(null);
	
	// Modal states
	const [viewingInvoice, setViewingInvoice] = useState<any>(null);
	
	// Delete confirmation dialog
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [invoiceToDelete, setInvoiceToDelete] = useState<any>(null);
	const [deleting, setDeleting] = useState(false);
	
	// Optimistic updates state
	const [optimisticInvoices, setOptimisticInvoices] = useState<any[]>(invoices);
	const [optimisticCustomers, setOptimisticCustomers] = useState<any[]>(customers);
	
	// Filter states
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [customerFilter, setCustomerFilter] = useState('all');
	const [dateFromFilter, setDateFromFilter] = useState('');
	const [dateToFilter, setDateToFilter] = useState('');
	
	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);
	
	// PDF Preview state
	const [previewInvoice, setPreviewInvoice] = useState<{ id: number; number: string } | null>(null);
	
	// Status update state
	const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

	// Sync optimistic state with props
	useEffect(() => {
		setOptimisticInvoices(invoices);
	}, [invoices]);

	useEffect(() => {
		setOptimisticCustomers(customers);
	}, [customers]);

	// Error boundary effect to catch any initialization errors
	useEffect(() => {
		try {
			// Validate invoices data on mount
			if (invoices && Array.isArray(invoices)) {
				invoices.forEach((invoice, index) => {
					if (invoice && typeof invoice === 'object') {
						// Test date parsing for each invoice
						if (invoice.date) {
							safeParseDate(invoice.date);
						}
						if (invoice.due_date) {
							safeParseDate(invoice.due_date);
						}
					}
				});
			}
		} catch (error) {
			console.error('Error during invoice data validation:', error);
			setComponentError('Invalid invoice data detected');
		}
	}, [invoices]);

	// Helper functions - declared before they are used
	const getCustomerName = (customerId: number) => {
		const customer = optimisticCustomers.find((c) => c.id === customerId);
		return customer ? customer.customer_name : `Customer ${customerId}`;
	};

	// Helper function to safely parse dates
	const safeParseDate = (dateValue: any): Date | null => {
		try {
			if (!dateValue) return null;
			
			// Handle string dates
			if (typeof dateValue === 'string') {
				// Check for empty or invalid strings
				if (dateValue.trim() === '' || dateValue === 'null' || dateValue === 'undefined') {
					return null;
				}
				
				// Check if it's a valid date string
				const parsed = new Date(dateValue);
				return isNaN(parsed.getTime()) ? null : parsed;
			}
			
			// Handle Date objects
			if (dateValue instanceof Date) {
				return isNaN(dateValue.getTime()) ? null : dateValue;
			}
			
			// Handle numbers (timestamps)
			if (typeof dateValue === 'number') {
				const parsed = new Date(dateValue);
				return isNaN(parsed.getTime()) ? null : parsed;
			}
			
			return null;
		} catch (error) {
			console.warn('Error parsing date:', dateValue, error);
			return null;
		}
	};

	const getInvoiceStatus = (invoice: any) => {
		if (invoice.paid) return 'paid';
		if (invoice.due_date) {
			const dueDate = safeParseDate(invoice.due_date);
			if (dueDate) {
				const now = new Date();
				return dueDate < now ? 'overdue' : 'issued';
			}
		}
		return 'draft';
	};

	// Filter invoices based on current filters
	const filteredInvoices = useMemo(() => {
		try {
			return optimisticInvoices.filter(invoice => {
				try {
					const matchesSearch = !searchTerm || 
						invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
						(invoice.customer_name || getCustomerName(invoice.customer_id))?.toLowerCase().includes(searchTerm.toLowerCase());
					
					const actualStatus = getInvoiceStatus(invoice);
					const matchesStatus = !statusFilter || statusFilter === "all" || actualStatus === statusFilter;
					
					const matchesCustomer = !customerFilter || customerFilter === "all" || invoice.customer_id === parseInt(customerFilter);
					
					const invoiceDate = safeParseDate(invoice.date);
					const fromDate = safeParseDate(dateFromFilter);
					const toDate = safeParseDate(dateToFilter);
					
					const matchesDateFrom = !dateFromFilter || !invoiceDate || !fromDate || invoiceDate >= fromDate;
					
					const matchesDateTo = !dateToFilter || !invoiceDate || !toDate || invoiceDate <= toDate;
					
					return matchesSearch && matchesStatus && matchesCustomer && matchesDateFrom && matchesDateTo;
				} catch (error) {
					console.warn('Error filtering invoice:', invoice, error);
					return false; // Exclude problematic invoices from the list
				}
			});
		} catch (error) {
			console.error('Error filtering invoices:', error);
			setComponentError('Error processing invoice data');
			return [];
		}
	}, [optimisticInvoices, searchTerm, statusFilter, customerFilter, dateFromFilter, dateToFilter]);

	// Paginate filtered invoices
	const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

	const getStatusVariant = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'paid':
				return 'default';
			case 'issued':
				return 'secondary';
			case 'overdue':
				return 'destructive';
			case 'draft':
				return 'outline';
			default:
				return 'secondary';
		}
	};

	const formatPrice = (amount: number, currency: string = 'USD') => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: currency,
		}).format(amount);
	};

	const handleViewInvoice = async (invoiceId: number) => {
		try {
			const details = await getInvoiceDetails(invoiceId);
			setViewingInvoice(details);
		} catch (error) {
			console.error('Error fetching invoice details:', error);
			showAlert('Failed to load invoice details', 'error');
		}
	};

	const handleDeleteInvoice = (invoice: any) => {
		setInvoiceToDelete(invoice);
		setDeleteDialogOpen(true);
	};

	const confirmDeleteInvoice = async () => {
		if (!invoiceToDelete) return;

		try {
			setDeleting(true);
			
			const success = await deleteInvoice(invoiceToDelete.id);
			
			if (success) {
				showAlert('Invoice deleted successfully', 'success');
			} else {
				showAlert('Failed to delete invoice', 'error');
			}
		} catch (error) {
			console.error('Error deleting invoice:', error);
			showAlert('Failed to delete invoice', 'error');
		} finally {
			setDeleting(false);
			setDeleteDialogOpen(false);
			setInvoiceToDelete(null);
		}
	};



	const handleEditInvoice = async (invoice: any) => {
		try {
			// Fetch complete invoice details for editing
			const details = await getInvoiceDetails(invoice.id);
			if (onEditInvoice) {
				onEditInvoice(details);
			}
		} catch (error) {
			console.error('Error fetching invoice details for editing:', error);
			showAlert('Failed to load invoice details for editing', 'error');
		}
	};

	const handleDownloadPDF = async (invoiceId: number, invoiceNumber: string, language: string = 'en') => {
		try {
			const response = await fetch(`/api/tenants/${tenant?.id}/invoices/${invoiceId}/download?enhanced=true&language=${language}`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error('Failed to download PDF');
			}

			// Get language-specific filename
			const getInvoiceFilename = (lang: string) => {
				const filenameMap: Record<string, string> = {
					'en': 'invoice',
					'ro': 'factura',
					'es': 'factura',
					'fr': 'facture',
					'de': 'rechnung'
				};
				return filenameMap[lang] || 'invoice';
			};

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${getInvoiceFilename(language)}-${invoiceNumber}.pdf`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);

			showAlert('Invoice PDF downloaded successfully', 'success');
		} catch (error) {
			console.error('Error downloading PDF:', error);
			showAlert('Failed to download invoice PDF', 'error');
		}
	};

	const handlePreviewPDF = (invoiceId: number, invoiceNumber: string) => {
		setPreviewInvoice({ id: invoiceId, number: invoiceNumber });
	};

	const handleStatusChange = async (invoiceId: number, newStatus: string) => {
		try {
			setUpdatingStatus(invoiceId);
			
			const response = await fetch(`/api/tenants/${tenant?.id}/invoices/${invoiceId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({
					status: newStatus,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to update status');
			}

			// Update optimistic state
			setOptimisticInvoices(prev => 
				prev.map(invoice => 
					invoice.id === invoiceId 
						? { ...invoice, status: newStatus }
						: invoice
				)
			);

			showAlert('Invoice status updated successfully', 'success');
			
			// Refresh invoices if callback is provided
			if (refreshInvoices) {
				refreshInvoices();
			}
		} catch (error) {
			console.error('Error updating invoice status:', error);
			showAlert(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
		} finally {
			setUpdatingStatus(null);
		}
	};

	const clearFilters = () => {
		setSearchTerm('');
		setStatusFilter('all');
		setCustomerFilter('all');
		setDateFromFilter('');
		setDateToFilter('');
		setCurrentPage(1);
	};

	const getStatusCounts = () => {
		const counts = {
			total: invoices.length,
			draft: 0,
			issued: 0,
			paid: 0,
			overdue: 0,
			cancelled: 0,
		};

		invoices.forEach(invoice => {
			const status = getInvoiceStatus(invoice);
			counts[status as keyof typeof counts]++;
		});

		return counts;
	};

	const statusCounts = getStatusCounts();

	// Show error state if there's a component error
	if (componentError) {
		return (
			<div className="space-y-6">
				<div className="text-center py-8">
					<h2 className="text-xl font-semibold text-red-600 mb-2">Error Processing Invoices</h2>
					<p className="text-muted-foreground mb-4">{componentError}</p>
					<Button onClick={() => setComponentError(null)} variant="outline">
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header with Actions */}
		<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
			<div>
				<h1 className="text-3xl font-bold text-foreground">Invoices</h1>
				<p className="text-muted-foreground">
					Manage your invoices and generate PDF documents
				</p>
			</div>
		</div>

			{/* Status Overview */}
			<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
				<Card className="border-0 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
								<FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">Total</p>
								<p className="text-2xl font-bold text-foreground">{statusCounts.total}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
								<FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">Draft</p>
								<p className="text-2xl font-bold text-foreground">{statusCounts.draft}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
								<Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">Issued</p>
								<p className="text-2xl font-bold text-foreground">{statusCounts.issued}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
								<CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">Paid</p>
								<p className="text-2xl font-bold text-foreground">{statusCounts.paid}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-0 shadow-sm">
					<CardContent className="p-4">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
								<AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
							</div>
							<div>
								<p className="text-sm font-medium text-muted-foreground">Overdue</p>
								<p className="text-2xl font-bold text-foreground">{statusCounts.overdue}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card className="border-0 shadow-sm">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Filter className="w-5 h-5" />
						Filters
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" data-tour-id="invoice-search">
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Search
							</label>
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
								<Input
									placeholder="Search invoices..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Status
							</label>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger>
									<SelectValue placeholder="All statuses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All statuses</SelectItem>
									<SelectItem value="draft">Draft</SelectItem>
									<SelectItem value="issued">Issued</SelectItem>
									<SelectItem value="paid">Paid</SelectItem>
									<SelectItem value="overdue">Overdue</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Customer
							</label>
							<Select value={customerFilter} onValueChange={setCustomerFilter}>
								<SelectTrigger>
									<SelectValue placeholder="All customers" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All customers</SelectItem>
									{customers.map((customer) => (
										<SelectItem key={customer.id} value={customer.id.toString()}>
											{customer.customer_name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								From Date
							</label>
							<Input
								type="date"
								value={dateFromFilter}
								onChange={(e) => setDateFromFilter(e.target.value)}
							/>
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								To Date
							</label>
							<Input
								type="date"
								value={dateToFilter}
								onChange={(e) => setDateToFilter(e.target.value)}
							/>
						</div>
					</div>

					<div className="flex justify-between items-center mt-4">
						<div className="text-sm text-muted-foreground">
							Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} invoices
						</div>
						<div className="flex gap-2">
							<Button variant="outline" size="sm" onClick={clearFilters}>
								Clear Filters
							</Button>
							<Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
								<SelectTrigger className="w-20">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="10">10</SelectItem>
									<SelectItem value="25">25</SelectItem>
									<SelectItem value="50">50</SelectItem>
									<SelectItem value="100">100</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Invoice List */}
			<div className="space-y-4" data-tour-id="invoice-list">
				{loading ? (
					<div className="space-y-4">
						{[...Array(5)].map((_, i) => (
							<Card key={i} className="border-0 shadow-sm">
								<CardContent className="p-6">
									<div className="animate-pulse">
										<div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
										<div className="h-3 bg-muted rounded w-1/2"></div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : error ? (
					<Card className="border-0 shadow-sm">
						<CardContent className="p-6 text-center">
							<AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
							<p className="text-destructive">{error}</p>
						</CardContent>
					</Card>
				) : paginatedInvoices.length === 0 ? (
					<Card className="border-0 shadow-sm">
						<CardContent className="p-6 text-center">
							<FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
							<p className="text-muted-foreground">No invoices found</p>
						</CardContent>
					</Card>
				) : (
					paginatedInvoices.map((invoice) => (
						<Card key={invoice.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-3 mb-2">
											<h3 className="font-semibold text-lg">#{invoice.invoice_number}</h3>
											<Select
												value={getInvoiceStatus(invoice)}
												onValueChange={(newStatus) => handleStatusChange(invoice.id, newStatus)}
												disabled={updatingStatus === invoice.id}
											>
												<SelectTrigger className={`w-32 h-8 ${getStatusVariant(getInvoiceStatus(invoice)) === 'destructive' ? 'bg-red-100 text-red-800 border-red-200' : 
													getStatusVariant(getInvoiceStatus(invoice)) === 'default' ? 'bg-green-100 text-green-800 border-green-200' :
													getStatusVariant(getInvoiceStatus(invoice)) === 'secondary' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
													'bg-gray-100 text-gray-800 border-gray-200'} hover:opacity-80 transition-opacity`}>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="draft">Draft</SelectItem>
													<SelectItem value="issued">Issued</SelectItem>
													<SelectItem value="paid">Paid</SelectItem>
													<SelectItem value="overdue">Overdue</SelectItem>
													<SelectItem value="cancelled">Cancelled</SelectItem>
												</SelectContent>
											</Select>
											{updatingStatus === invoice.id && (
												<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
											)}
										</div>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
											<div>
												<span className="font-medium">Customer:</span> {invoice.customer_name || getCustomerName(invoice.customer_id)}
											</div>
											<div>
												<span className="font-medium">Date:</span> {invoice.date ? (() => {
													try {
														const date = safeParseDate(invoice.date);
														return date ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
													} catch (error) {
														console.warn('Error formatting date:', invoice.date, error);
														return 'Invalid Date';
													}
												})() : 'N/A'}
											</div>
											<div>
												<span className="font-medium">Amount:</span> {formatPrice(invoice.total_amount, invoice.base_currency)}
											</div>
										</div>
									</div>
									<div className="flex flex-col sm:flex-row items-center gap-2" data-tour-id="invoice-actions">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handlePreviewPDF(invoice.id, invoice.invoice_number)}
											title="Preview PDF"
											className="hover:bg-primary/10 hover:border-primary/20"
										>
											<Eye className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleEditInvoice(invoice)}
											title="Edit Invoice"
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleViewInvoice(invoice.id)}
											title="View Details"
										>
											<Eye className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDeleteInvoice(invoice)}
											title="Delete Invoice"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
								
								{/* ANAF e-Factura Actions */}
								<div className="mt-4 pt-4 border-t border-border/20">
									<ANAFInvoiceActions 
										invoiceId={invoice.id}
										invoiceNumber={invoice.invoice_number}
										isAuthenticated={isANAFAuthenticated}
										onStatusChange={(status) => {
											// Update local state if needed
											console.log('ANAF status changed:', status);
										}}
									/>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<Card className="border-0 shadow-sm">
					<CardContent className="p-4">
						<div className="flex justify-between items-center">
							<div className="text-sm text-muted-foreground">
								Page {currentPage} of {totalPages}
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
									disabled={currentPage === 1}
								>
									Previous
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
									disabled={currentPage === totalPages}
								>
									Next
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			)}


			{/* Invoice Details Modal */}
			{viewingInvoice && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-foreground">
									Invoice #{viewingInvoice.invoice?.invoice_number || 'N/A'}
								</h2>
								<div className="flex items-center gap-2">
									<Button 
										variant="outline" 
										size="sm"
										onClick={() => handlePreviewPDF(viewingInvoice.invoice?.id, viewingInvoice.invoice?.invoice_number)}
										className="hover:bg-primary/10 hover:border-primary/20"
									>
										<Eye className="h-4 w-4 mr-2" />
										Preview PDF
									</Button>
									<Button variant="ghost" size="sm" onClick={() => setViewingInvoice(null)}>
										×
									</Button>
								</div>
							</div>
							
							<div className="space-y-6">
								{/* Invoice Header */}
								<Card>
									<CardContent className="p-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div>
												<h3 className="font-semibold text-lg mb-4">Invoice Details</h3>
												<div className="space-y-2 text-sm">
													<div><span className="font-medium">Invoice Number:</span> {viewingInvoice.invoice?.invoice_number || 'N/A'}</div>
													<div><span className="font-medium">Date:</span> {viewingInvoice.invoice?.date ? (() => {
														try {
															const date = safeParseDate(viewingInvoice.invoice.date);
															return date ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
														} catch (error) {
															console.warn('Error formatting date:', viewingInvoice.invoice.date, error);
															return 'Invalid Date';
														}
													})() : 'N/A'}</div>
													<div><span className="font-medium">Due Date:</span> {viewingInvoice.invoice?.due_date ? (() => {
														try {
															const date = safeParseDate(viewingInvoice.invoice.due_date);
															return date ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
														} catch (error) {
															console.warn('Error formatting due date:', viewingInvoice.invoice.due_date, error);
															return 'Invalid Date';
														}
													})() : 'N/A'}</div>
													<div><span className="font-medium">Status:</span> 
														<Badge variant={getStatusVariant(viewingInvoice.invoice?.status)} className="ml-2">
															{viewingInvoice.invoice?.status || 'Draft'}
														</Badge>
													</div>
												</div>
											</div>
											<div>
												<h3 className="font-semibold text-lg mb-4">Customer Details</h3>
												<div className="space-y-2 text-sm">
													<div><span className="font-medium">Name:</span> {viewingInvoice.customer?.customer_name || 'N/A'}</div>
													<div><span className="font-medium">Email:</span> {viewingInvoice.customer?.customer_email || 'N/A'}</div>
													<div><span className="font-medium">Address:</span> {viewingInvoice.customer?.customer_address || 'N/A'}</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>

								{/* Invoice Items */}
								<Card>
									<CardHeader>
										<CardTitle>Invoice Items</CardTitle>
									</CardHeader>
									<CardContent>
										{viewingInvoice.items && viewingInvoice.items.length > 0 ? (
											<div className="space-y-4">
												{viewingInvoice.items.map((item: any, index: number) => (
													<div key={index} className="flex justify-between items-center p-4 border rounded-lg">
														<div className="flex-1">
															<div className="font-medium">{item.product_details?.name || item.description || 'Product'}</div>
															<div className="text-sm text-muted-foreground">
																Quantity: {item.quantity} × {formatPrice(item.price, item.currency || 'USD')}
															</div>
														</div>
														<div className="text-right">
															<div className="font-medium">{formatPrice(item.quantity * item.price, item.currency || 'USD')}</div>
														</div>
													</div>
												))}
											</div>
										) : (
											<p className="text-muted-foreground">No items found</p>
										)}
									</CardContent>
								</Card>

								{/* Totals */}
								{viewingInvoice.totals && (
									<Card>
										<CardContent className="p-6">
											<div className="space-y-2 text-right">
												<div className="flex justify-between">
													<span>Subtotal:</span>
													<span>{formatPrice(viewingInvoice.totals.subtotal, viewingInvoice.invoice?.base_currency || 'USD')}</span>
												</div>
												<div className="flex justify-between">
													<span>Items Count:</span>
													<span>{viewingInvoice.totals.items_count || 0}</span>
												</div>
											</div>
										</CardContent>
									</Card>
								)}
							</div>
						</div>
					</div>
				</div>
			)}

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Invoice</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoice_number}</strong>? 
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							This will permanently delete the invoice and all associated data.
						</AlertDescription>
					</Alert>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={deleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDeleteInvoice}
							disabled={deleting}
						>
							{deleting ? 'Deleting...' : 'Delete Invoice'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* PDF Preview Modal */}
			{previewInvoice && (
				<PDFPreviewModal
					isOpen={!!previewInvoice}
					onClose={() => setPreviewInvoice(null)}
					invoiceId={previewInvoice.id}
					invoiceNumber={previewInvoice.number}
					onDownload={handleDownloadPDF}
				/>
			)}

		</div>
	);
}
