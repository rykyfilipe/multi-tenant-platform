/** @format */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { convertCurrency } from '@/lib/currency-exchange-client';
import { SeriesManager } from './SeriesManager';

interface EnhancedInvoiceListProps {
	onEditInvoice?: (invoice: any) => void;
	invoices: any[];
	customers: any[];
	loading: boolean;
	error: string | null;
	deleteInvoice: (invoiceId: number) => Promise<boolean>;
	getInvoiceDetails: (invoiceId: number) => Promise<any>;
	refreshInvoices?: () => void;
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
}: EnhancedInvoiceListProps) {
	const { token, tenant, showAlert } = useApp();
	const { t } = useLanguage();
	
	// Modal states
	const [showSeriesManager, setShowSeriesManager] = useState(false);
	
	// Filter states
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [customerFilter, setCustomerFilter] = useState('all');
	const [dateFromFilter, setDateFromFilter] = useState('');
	const [dateToFilter, setDateToFilter] = useState('');
	
	// Pagination states
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage, setItemsPerPage] = useState(10);

	// Filter invoices based on current filters
	const filteredInvoices = invoices.filter(invoice => {
		const matchesSearch = !searchTerm || 
			invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			getCustomerName(invoice.customer_id)?.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesStatus = !statusFilter || statusFilter === "all" || invoice.status === statusFilter;
		
		const matchesCustomer = !customerFilter || customerFilter === "all" || invoice.customer_id === parseInt(customerFilter);
		
		const matchesDateFrom = !dateFromFilter || new Date(invoice.date) >= new Date(dateFromFilter);
		
		const matchesDateTo = !dateToFilter || new Date(invoice.date) <= new Date(dateToFilter);
		
		return matchesSearch && matchesStatus && matchesCustomer && matchesDateFrom && matchesDateTo;
	});

	// Paginate filtered invoices
	const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + itemsPerPage);

	const getCustomerName = (customerId: number) => {
		const customer = customers.find((c) => c.id === customerId);
		return customer ? customer.customer_name : `Customer ${customerId}`;
	};

	const getStatusVariant = (status: string) => {
		switch (status?.toLowerCase()) {
			case 'paid':
				return 'default';
			case 'pending':
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
			// You can implement a modal or navigation to view invoice details
			console.log('Invoice details:', details);
		} catch (error) {
			console.error('Error fetching invoice details:', error);
		}
	};

	const handleDeleteInvoice = async (invoiceId: number) => {
		if (window.confirm('Are you sure you want to delete this invoice?')) {
			try {
				const success = await deleteInvoice(invoiceId);
				if (success) {
					showAlert('Invoice deleted successfully', 'success');
					if (refreshInvoices) {
						refreshInvoices();
					}
				} else {
					showAlert('Failed to delete invoice', 'error');
				}
			} catch (error) {
				console.error('Error deleting invoice:', error);
				showAlert('Failed to delete invoice', 'error');
			}
		}
	};



	const handleEditInvoice = (invoice: any) => {
		if (onEditInvoice) {
			onEditInvoice(invoice);
		}
	};

	const clearFilters = () => {
		setSearchTerm('');
		setStatusFilter('');
		setCustomerFilter('');
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
			if (invoice.paid) {
				counts.paid++;
			} else if (invoice.due_date) {
				const dueDate = new Date(invoice.due_date);
				const now = new Date();
				if (dueDate < now) {
					counts.overdue++;
				} else {
					counts.issued++;
				}
			} else {
				counts.draft++;
			}
		});

		return counts;
	};

	const statusCounts = getStatusCounts();

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
				<div className="flex flex-wrap gap-2" data-tour-id="series-management">
					<Button variant="outline" onClick={() => setShowSeriesManager(true)}>
						<SettingsIcon className="mr-2 h-4 w-4" />
						Series
					</Button>
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
											<Badge variant={getStatusVariant(invoice.status)}>
												{invoice.status}
											</Badge>
										</div>
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
											<div>
												<span className="font-medium">Customer:</span> {invoice.customer_name || 'N/A'}
											</div>
											<div>
												<span className="font-medium">Date:</span> {format(new Date(invoice.date), 'MMM dd, yyyy')}
											</div>
											<div>
												<span className="font-medium">Amount:</span> {formatPrice(invoice.total_amount, invoice.base_currency)}
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2" data-tour-id="invoice-actions">
										<Button
											variant="outline"
											size="sm"
											onClick={() => onEditInvoice?.(invoice)}
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleViewInvoice(invoice.id)}
										>
											<Eye className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleDeleteInvoice(invoice.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
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


			{showSeriesManager && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-background rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-foreground">Invoice Series Manager</h2>
								<Button variant="ghost" size="sm" onClick={() => setShowSeriesManager(false)}>
									×
								</Button>
							</div>
							<SeriesManager tenantId={tenant?.id?.toString() || ''} />
						</div>
					</div>
				</div>
			)}

		</div>
	);
}
