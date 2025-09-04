/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
	Plus, 
	Search, 
	Filter, 
	Download, 
	Upload, 
	Settings, 
	FileText, 
	Calendar, 
	DollarSign, 
	Users, 
	TrendingUp,
	AlertCircle,
	CheckCircle,
	Clock,
	Eye,
	Edit,
	Trash2,
	MoreHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useInvoiceSystem } from '@/hooks/useInvoiceSystem';
import { InvoiceForm } from '@/components/invoice/InvoiceForm';
import { InvoiceList } from '@/components/invoice/InvoiceList';
import { ImportModal } from '@/components/invoice/ImportModal';
import { ExportModal } from '@/components/invoice/ExportModal';
import { SeriesManager } from '@/components/invoice/SeriesManager';
import { InvoiceTemplateManager } from '@/components/invoice/InvoiceTemplateManager';
import { InvoiceAutomation } from '@/components/invoice/InvoiceAutomation';

interface EnhancedInvoicesPageProps {
	params: {
		tenantId: string;
	};
}

interface InvoiceStats {
	totalInvoices: number;
	totalAmount: number;
	paidInvoices: number;
	overdueInvoices: number;
	pendingInvoices: number;
	monthlyRevenue: number;
	growthRate: number;
}

export default function EnhancedInvoicesPage({ params }: EnhancedInvoicesPageProps) {
	const [activeTab, setActiveTab] = useState('overview');
	const [showInvoiceForm, setShowInvoiceForm] = useState(false);
	const [showImportModal, setShowImportModal] = useState(false);
	const [showExportModal, setShowExportModal] = useState(false);
	const [editingInvoice, setEditingInvoice] = useState<any>(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [dateFilter, setDateFilter] = useState('all');
	const [stats, setStats] = useState<InvoiceStats>({
		totalInvoices: 0,
		totalAmount: 0,
		paidInvoices: 0,
		overdueInvoices: 0,
		pendingInvoices: 0,
		monthlyRevenue: 0,
		growthRate: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();
	const { 
		invoices, 
		loading, 
		error: invoiceError, 
		createInvoice, 
		updateInvoice, 
		deleteInvoice,
		refresh,
		customers
	} = useInvoiceSystem();

	useEffect(() => {
		fetchStats();
	}, []);

	const fetchStats = async () => {
		try {
			setIsLoading(true);
			// In a real implementation, this would fetch from an API
			const mockStats: InvoiceStats = {
				totalInvoices: 156,
				totalAmount: 125430.50,
				paidInvoices: 98,
				overdueInvoices: 12,
				pendingInvoices: 46,
				monthlyRevenue: 45230.75,
				growthRate: 15.2,
			};
			setStats(mockStats);
		} catch (error) {
			console.error('Error fetching stats:', error);
			setError('Failed to load invoice statistics');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateInvoice = () => {
		setEditingInvoice(null);
		setShowInvoiceForm(true);
	};

	const handleEditInvoice = (invoice: any) => {
		setEditingInvoice(invoice);
		setShowInvoiceForm(true);
	};

	const handleDeleteInvoice = async (invoiceId: number): Promise<boolean> => {
		if (!confirm('Are you sure you want to delete this invoice?')) {
			return false;
		}

		try {
			await deleteInvoice(invoiceId);
			toast({
				title: 'Invoice deleted',
				description: 'Invoice has been deleted successfully',
			});
			refresh();
			return true;
		} catch (error) {
			console.error('Error deleting invoice:', error);
			toast({
				title: 'Error',
				description: 'Failed to delete invoice',
				variant: 'destructive',
			});
			return false;
		}
	};

	const handleInvoiceFormSubmit = async (invoiceData: any) => {
		try {
			if (editingInvoice) {
				await updateInvoice(editingInvoice.id, invoiceData);
				toast({
					title: 'Invoice updated',
					description: 'Invoice has been updated successfully',
				});
			} else {
				await createInvoice(invoiceData);
				toast({
					title: 'Invoice created',
					description: 'Invoice has been created successfully',
				});
			}
			setShowInvoiceForm(false);
			setEditingInvoice(null);
			refresh();
			fetchStats();
		} catch (error) {
			console.error('Error saving invoice:', error);
			toast({
				title: 'Error',
				description: 'Failed to save invoice',
				variant: 'destructive',
			});
		}
	};

	const filteredInvoices = invoices?.filter((invoice: any) => {
		const matchesSearch = !searchTerm || 
			invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			invoice.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
		
		const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
		
		return matchesSearch && matchesStatus;
	}) || [];

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading invoices...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">Invoice Management</h1>
					<p className="text-muted-foreground">
						Manage invoices, templates, and automation
					</p>
				</div>
				<div className="flex gap-2">
					<Button variant="outline" onClick={() => setShowImportModal(true)}>
						<Upload className="mr-2 h-4 w-4" />
						Import
					</Button>
					<Button variant="outline" onClick={() => setShowExportModal(true)}>
						<Download className="mr-2 h-4 w-4" />
						Export
					</Button>
					<Button onClick={handleCreateInvoice}>
						<Plus className="mr-2 h-4 w-4" />
						New Invoice
					</Button>
				</div>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
						<FileText className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalInvoices}</div>
						<p className="text-xs text-muted-foreground">
							+{stats.growthRate}% from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Amount</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${stats.totalAmount.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground">
							All time revenue
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
						<CheckCircle className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">{stats.paidInvoices}</div>
						<p className="text-xs text-muted-foreground">
							{Math.round((stats.paidInvoices / stats.totalInvoices) * 100)}% success rate
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Overdue</CardTitle>
						<AlertCircle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-red-600">{stats.overdueInvoices}</div>
						<p className="text-xs text-muted-foreground">
							Requires attention
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Main Content */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full grid-cols-6">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="invoices">Invoices</TabsTrigger>
					<TabsTrigger value="templates">Templates</TabsTrigger>
					<TabsTrigger value="series">Series</TabsTrigger>
					<TabsTrigger value="automation">Automation</TabsTrigger>
					<TabsTrigger value="settings">Settings</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-6">
					{/* Recent Invoices */}
					<Card>
						<CardHeader>
							<CardTitle>Recent Invoices</CardTitle>
							<CardDescription>
								Latest invoice activity
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{filteredInvoices.slice(0, 5).map((invoice: any) => (
									<div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
										<div className="flex items-center gap-4">
											<div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
												<FileText className="h-5 w-5 text-primary" />
											</div>
											<div>
												<p className="font-medium">{invoice.invoiceNumber}</p>
												<p className="text-sm text-muted-foreground">{invoice.customerName}</p>
											</div>
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<p className="font-medium">${invoice.totalAmount?.toLocaleString()}</p>
												<Badge variant={
													invoice.status === 'paid' ? 'default' :
													invoice.status === 'overdue' ? 'destructive' :
													'secondary'
												}>
													{invoice.status}
												</Badge>
											</div>
											<div className="flex gap-2">
												<Button variant="outline" size="sm" onClick={() => handleEditInvoice(invoice)}>
													<Edit className="h-4 w-4" />
												</Button>
												<Button variant="outline" size="sm" onClick={() => handleDeleteInvoice(invoice.id)}>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Quick Actions */}
					<Card>
						<CardHeader>
							<CardTitle>Quick Actions</CardTitle>
							<CardDescription>
								Common invoice management tasks
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<Button variant="outline" className="h-20 flex flex-col gap-2" onClick={handleCreateInvoice}>
									<Plus className="h-6 w-6" />
									<span>New Invoice</span>
								</Button>
								<Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setShowImportModal(true)}>
									<Upload className="h-6 w-6" />
									<span>Import</span>
								</Button>
								<Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setShowExportModal(true)}>
									<Download className="h-6 w-6" />
									<span>Export</span>
								</Button>
								<Button variant="outline" className="h-20 flex flex-col gap-2" onClick={() => setActiveTab('templates')}>
									<Settings className="h-6 w-6" />
									<span>Templates</span>
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="invoices" className="space-y-6">
					{/* Filters */}
					<Card>
						<CardHeader>
							<CardTitle>Invoice List</CardTitle>
							<CardDescription>
								Manage and view all invoices
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex gap-4 mb-4">
								<div className="flex-1">
									<Label htmlFor="search">Search</Label>
									<Input
										id="search"
										placeholder="Search invoices..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
									/>
								</div>
								<div>
									<Label htmlFor="status">Status</Label>
									<Select value={statusFilter} onValueChange={setStatusFilter}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All Status</SelectItem>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="issued">Issued</SelectItem>
											<SelectItem value="paid">Paid</SelectItem>
											<SelectItem value="overdue">Overdue</SelectItem>
											<SelectItem value="cancelled">Cancelled</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Invoice List */}
					<InvoiceList
						invoices={filteredInvoices}
						onEditInvoice={(invoice: any) => handleEditInvoice(invoice)}
						customers={customers}
						deleteInvoice={handleDeleteInvoice}
						loading={loading}
						error={invoiceError}
						getInvoiceDetails={async (invoiceId: number) => {
							// This would typically fetch from an API
							return filteredInvoices.find(inv => inv.id === invoiceId) || null;
						}}
					/>
				</TabsContent>

				<TabsContent value="templates">
					<InvoiceTemplateManager tenantId={params.tenantId.toString()} />
				</TabsContent>

				<TabsContent value="series">
					<SeriesManager tenantId={params.tenantId.toString()} />
				</TabsContent>

				<TabsContent value="automation">
					<InvoiceAutomation tenantId={params.tenantId.toString()} />
				</TabsContent>

				<TabsContent value="settings">
					<Card>
						<CardHeader>
							<CardTitle>Invoice Settings</CardTitle>
							<CardDescription>
								Configure invoice system settings
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div>
									<Label>Default Currency</Label>
									<Select defaultValue="USD">
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="USD">USD - US Dollar</SelectItem>
											<SelectItem value="EUR">EUR - Euro</SelectItem>
											<SelectItem value="GBP">GBP - British Pound</SelectItem>
											<SelectItem value="RON">RON - Romanian Leu</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>Default Payment Terms</Label>
									<Select defaultValue="30">
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="0">Due on Receipt</SelectItem>
											<SelectItem value="15">Net 15</SelectItem>
											<SelectItem value="30">Net 30</SelectItem>
											<SelectItem value="60">Net 60</SelectItem>
											<SelectItem value="90">Net 90</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div>
									<Label>Tax Rate (%)</Label>
									<Input type="number" step="0.01" defaultValue="19" />
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Modals */}
			{showInvoiceForm && (
				<InvoiceForm
					open={showInvoiceForm}
					onClose={() => {
						setShowInvoiceForm(false);
						setEditingInvoice(null);
					}}
					onInvoiceUpdated={() => {
						// This callback doesn't need parameters based on the interface
						refresh();
						fetchStats();
					}}
					editInvoice={editingInvoice}
					customers={customers}
					createInvoice={createInvoice}
					updateInvoice={updateInvoice}
					createCustomer={async (customerData: any) => {
						// This would typically create a customer via API
						console.log('Creating customer:', customerData);
						return { id: Date.now(), ...customerData };
					}}
					getInvoiceDetails={async (invoiceId: number) => {
						// This would typically fetch from an API
						return filteredInvoices.find(inv => inv.id === invoiceId) || null;
					}}
					loading={loading}
					error={invoiceError}
				/>
			)}

			{showImportModal && (
				<ImportModal
					isOpen={showImportModal}
					onClose={() => setShowImportModal(false)}
					tenantId={params.tenantId.toString()}
					onImportComplete={() => {
						refresh();
						fetchStats();
					}}
				/>
			)}

			{showExportModal && (
				<ExportModal
					isOpen={showExportModal}
					onClose={() => setShowExportModal(false)}
					tenantId={params.tenantId}
				/>
			)}
		</div>
	);
}
