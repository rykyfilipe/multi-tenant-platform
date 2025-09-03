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
	Download,
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
	Upload,
	Download as DownloadIcon,
	Settings as SettingsIcon,
	Search,
	Filter,
	Plus,
} from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '@/contexts/AppContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { convertCurrency } from '@/lib/currency-exchange-client';
import { InvoiceList } from './InvoiceList';
import { ImportModal } from './ImportModal';
import { ExportModal } from './ExportModal';
import { SeriesManager } from './SeriesManager';
import { InvoiceForm } from './InvoiceForm';

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
	const [showImportModal, setShowImportModal] = useState(false);
	const [showExportModal, setShowExportModal] = useState(false);
	const [showSeriesManager, setShowSeriesManager] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	
	// Filter states
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('');
	const [customerFilter, setCustomerFilter] = useState('');
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
		
		const matchesStatus = !statusFilter || invoice.status === statusFilter;
		
		const matchesCustomer = !customerFilter || invoice.customer_id === parseInt(customerFilter);
		
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

	const handleImportComplete = (result: any) => {
		setShowImportModal(false);
		if (refreshInvoices) {
			refreshInvoices();
		}
		showAlert(`Import completed: ${result.imported} imported, ${result.updated} updated, ${result.skipped} skipped`, 'success');
	};

	const handleExportComplete = (result: any) => {
		setShowExportModal(false);
		showAlert(`Export completed: ${result.filename}`, 'success');
	};

	const handleCreateInvoice = () => {
		setShowCreateForm(true);
	};

	const handleEditInvoice = (invoice: any) => {
		if (onEditInvoice) {
			onEditInvoice(invoice);
		}
		setShowCreateForm(true);
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
						Manage your invoices, import from external systems, and export data
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button onClick={handleCreateInvoice} className="bg-primary hover:bg-primary/90">
						<Plus className="mr-2 h-4 w-4" />
						New Invoice
					</Button>
					<Button variant="outline" onClick={() => setShowImportModal(true)}>
						<Upload className="mr-2 h-4 w-4" />
						Import
					</Button>
					<Button variant="outline" onClick={() => setShowExportModal(true)}>
						<DownloadIcon className="mr-2 h-4 w-4" />
						Export
					</Button>
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
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
									<SelectItem value="">All statuses</SelectItem>
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
									<SelectItem value="">All customers</SelectItem>
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
			<InvoiceList
				onEditInvoice={handleEditInvoice}
				invoices={paginatedInvoices}
				customers={customers}
				loading={loading}
				error={error}
				deleteInvoice={deleteInvoice}
				getInvoiceDetails={getInvoiceDetails}
			/>

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

			{/* Modals */}
			<ImportModal
				isOpen={showImportModal}
				onClose={() => setShowImportModal(false)}
				tenantId={tenant?.id?.toString() || ''}
				onImportComplete={handleImportComplete}
			/>

			<ExportModal
				isOpen={showExportModal}
				onClose={() => setShowExportModal(false)}
				tenantId={tenant?.id?.toString() || ''}
				onExportComplete={handleExportComplete}
			/>

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

			{showCreateForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
						<div className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-foreground">Create Invoice</h2>
								<Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
									×
								</Button>
							</div>
							<InvoiceForm
								onClose={() => setShowCreateForm(false)}
								onSuccess={() => {
									setShowCreateForm(false);
									if (refreshInvoices) {
										refreshInvoices();
									}
								}}
								customers={customers}
								createInvoice={async (invoiceData: any) => {
									// This should be implemented based on your API
									const response = await fetch(`/api/tenants/${tenant?.id}/invoices`, {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
											'Authorization': `Bearer ${token}`,
										},
										body: JSON.stringify(invoiceData),
									});
									if (!response.ok) {
										throw new Error('Failed to create invoice');
									}
									return response.json();
								}}
								updateInvoice={async (invoiceId: number, updateData: any) => {
									// This should be implemented based on your API
									const response = await fetch(`/api/tenants/${tenant?.id}/invoices/${invoiceId}`, {
										method: 'PUT',
										headers: {
											'Content-Type': 'application/json',
											'Authorization': `Bearer ${token}`,
										},
										body: JSON.stringify(updateData),
									});
									if (!response.ok) {
										throw new Error('Failed to update invoice');
									}
									return response.json();
								}}
								createCustomer={async (customerData: any) => {
									// This should be implemented based on your API
									const response = await fetch(`/api/tenants/${tenant?.id}/customers`, {
										method: 'POST',
										headers: {
											'Content-Type': 'application/json',
											'Authorization': `Bearer ${token}`,
										},
										body: JSON.stringify(customerData),
									});
									if (!response.ok) {
										throw new Error('Failed to create customer');
									}
									return response.json();
								}}
								getInvoiceDetails={getInvoiceDetails}
								loading={loading}
								error={error}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
