/** @format */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { EnhancedInvoiceList } from "@/components/invoice/InvoiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	FileText,
	Plus,
	List,
	DollarSign,
	Users,
	Puzzle,
	Settings,
	Clock,
	CheckCircle2,
	AlertCircle,
	TrendingUp,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useInvoiceSystem } from "@/hooks/useInvoiceSystem";
import { useANAF } from "@/hooks/useANAF";
import { useSilentANAF } from "@/hooks/useSilentANAF";
import { TourManager } from "@/components/tours/TourManager";
import { allTours } from "@/tours";

export default function InvoicesPage() {
	const [activeTab, setActiveTab] = useState("list");
	const [editingInvoice, setEditingInvoice] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [moduleEnabled, setModuleEnabled] = useState(false);

	const { user, tenant, token } = useApp();
	const { t } = useLanguage();
	const router = useRouter();

	// ANAF authentication hook
	const { 
		isAuthenticated: isANAFAuthenticated, 
		isLoading: anafLoading, 
		authenticate: anafAuthenticate,
		disconnect: anafDisconnect 
	} = useANAF();

	// Silent ANAF authentication hook
	const { 
		authenticateSilently, 
		loading: silentAuthLoading, 
		error: silentAuthError 
	} = useSilentANAF();

	// Invoice system hook
	const {
		invoices,
		customers,
		initialLoading: invoiceLoading,
		loading: invoiceOperationLoading,
		error: invoiceError,
		createInvoice,
		updateInvoice,
		deleteInvoice,
		getInvoiceDetails,
		createCustomer,
		refresh,
	} = useInvoiceSystem();

	useEffect(() => {
		const checkModuleStatus = async () => {
			if (!tenant || !token) return;

			try {
				const response = await fetch(`/api/tenants/${tenant.id}/modules`, {
					headers: { Authorization: `Bearer ${token}` },
				});

				if (response.ok) {
					const data = await response.json();
					setModuleEnabled(data.enabledModules.includes("billing"));
				}
			} catch (error) {
				// Silent fail
			} finally {
				setLoading(false);
			}
		};

		checkModuleStatus();
	}, [tenant, token]);

	const handleANAFConnect = async () => {
		if (moduleEnabled && user?.id && tenant?.id && token && !isANAFAuthenticated && !anafLoading && !silentAuthLoading) {
			try {
				const result = await authenticateSilently();
				if (result.success && result.authenticated) {
					window.location.reload();
				}
			} catch (error) {
				// Silent fail
			}
		}
	};

	const handleEditInvoice = (invoiceData: any) => {
		setEditingInvoice(invoiceData);
		setActiveTab("create");
	};

	const handleInvoiceUpdated = () => {
		setEditingInvoice(null);
		setActiveTab("list");
	};

	// Calculate invoice statistics
	const stats = useMemo(() => {
		if (!invoices || invoices.length === 0) {
			return {
				totalInvoices: 0,
				totalRevenue: 0,
				paidCount: 0,
				pendingCount: 0,
				overdueCount: 0,
			};
		}

		const totalRevenue = invoices.reduce((sum, inv) => {
			const total = inv.total_amount || inv.totalAmount || 0;
			return sum + Number(total);
		}, 0);

		const paidCount = invoices.filter(inv => inv.status === 'paid').length;
		const pendingCount = invoices.filter(inv => inv.status === 'pending').length;
		const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

		return {
			totalInvoices: invoices.length,
			totalRevenue,
			paidCount,
			pendingCount,
			overdueCount,
		};
	}, [invoices]);

	// Loading state
	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6'>
				<div className='max-w-[1600px] mx-auto space-y-6'>
					<div className="flex items-center justify-between">
						<div className="space-y-2">
							<Skeleton className="h-9 w-64" />
							<Skeleton className="h-4 w-96" />
						</div>
						<Skeleton className="h-10 w-32" />
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-32 rounded-xl" />
						))}
					</div>
					<Skeleton className="h-96 rounded-xl" />
				</div>
			</div>
		);
	}

	// Module not enabled
	if (!moduleEnabled) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 md:p-6'>
				<div className='max-w-2xl mx-auto'>
					<Card className='bg-card border-border shadow-sm'>
						<CardHeader className='text-center pb-6'>
							<div className='inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-muted border border-border mb-6 mx-auto'>
								<Puzzle className='w-10 h-10 text-muted-foreground' />
							</div>
							<CardTitle className='text-2xl font-bold text-foreground mb-2'>
								Billing Module Not Enabled
							</CardTitle>
							<p className='text-sm text-muted-foreground leading-relaxed max-w-md mx-auto'>
								The billing and invoicing module is not currently enabled for your organization. 
								This module provides professional invoicing capabilities with customer management.
							</p>
						</CardHeader>
						<CardContent className='space-y-6'>
							<Card className='border-border bg-muted/30'>
								<CardContent className='p-5'>
									<h3 className='font-semibold text-foreground mb-3 text-sm'>
										What's included:
									</h3>
									<ul className='text-sm text-muted-foreground space-y-2'>
										<li className="flex items-center gap-2">
											<div className="w-1.5 h-1.5 rounded-full bg-primary" />
											Customer management system
										</li>
										<li className="flex items-center gap-2">
											<div className="w-1.5 h-1.5 rounded-full bg-primary" />
											Professional invoice creation
										</li>
										<li className="flex items-center gap-2">
											<div className="w-1.5 h-1.5 rounded-full bg-primary" />
											Invoice line items management
										</li>
										<li className="flex items-center gap-2">
											<div className="w-1.5 h-1.5 rounded-full bg-primary" />
											Customer relationship tracking
										</li>
									</ul>
								</CardContent>
							</Card>
							{user?.role === "ADMIN" && (
								<div className='text-center space-y-3 pt-2'>
									<p className='text-sm text-muted-foreground'>
										As an administrator, you can enable this module in your organization settings.
									</p>
									<Button
										onClick={() => router.push("/home/tenant")}
										className='gap-2'>
										<Settings className='w-4 h-4' />
										Go to Organization Settings
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
			<div className='max-w-[1600px] mx-auto p-4 md:p-6 space-y-6'>
				{/* Header */}
				<div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
					<div className='flex items-start gap-4'>
						<div className='p-3 rounded-2xl bg-primary/10 border border-primary/20'>
							<FileText className='w-7 h-7 text-primary' />
						</div>
						<div>
							<h1 className='text-2xl md:text-3xl font-bold text-foreground tracking-tight'>
								Invoice Management
							</h1>
							<p className='text-sm text-muted-foreground mt-1'>
								Create professional invoices and manage customer relationships
							</p>
							<div className='flex items-center gap-3 mt-2'>
								<Badge variant="outline" className='bg-primary/10 text-primary border-primary/20 font-semibold'>
									<FileText className='w-3 h-3 mr-1.5' />
									{stats.totalInvoices} {stats.totalInvoices === 1 ? 'Invoice' : 'Invoices'}
								</Badge>
								<Badge variant="outline" className='bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-semibold'>
									<Users className='w-3 h-3 mr-1.5' />
									{customers?.length || 0} {customers?.length === 1 ? 'Customer' : 'Customers'}
								</Badge>
							</div>
						</div>
					</div>

					<div className="flex items-center gap-2">
						{isANAFAuthenticated && (
							<Badge variant="outline" className='bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-semibold'>
								<CheckCircle2 className='w-3 h-3 mr-1.5' />
								ANAF Connected
							</Badge>
						)}
					</div>
				</div>

				{/* Quick Stats */}
				{stats.totalInvoices > 0 && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
							<CardContent className="p-5">
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<div className="p-2 rounded-lg bg-primary/10">
												<DollarSign className="h-4 w-4 text-primary" />
											</div>
											<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
										</div>
										<div className="text-2xl font-bold text-foreground tabular-nums">
											${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-card border-green-500/20 shadow-sm hover:shadow-md transition-shadow">
							<CardContent className="p-5">
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<div className="p-2 rounded-lg bg-green-500/10">
												<CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
											</div>
											<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Paid</p>
										</div>
										<div className="text-2xl font-bold text-foreground tabular-nums">
											{stats.paidCount}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-card border-amber-500/20 shadow-sm hover:shadow-md transition-shadow">
							<CardContent className="p-5">
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<div className="p-2 rounded-lg bg-amber-500/10">
												<Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
											</div>
											<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending</p>
										</div>
										<div className="text-2xl font-bold text-foreground tabular-nums">
											{stats.pendingCount}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-card border-destructive/20 shadow-sm hover:shadow-md transition-shadow">
							<CardContent className="p-5">
								<div className="flex items-start justify-between gap-3">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-3">
											<div className="p-2 rounded-lg bg-destructive/10">
												<AlertCircle className="h-4 w-4 text-destructive" />
											</div>
											<p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Overdue</p>
										</div>
										<div className="text-2xl font-bold text-foreground tabular-nums">
											{stats.overdueCount}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				)}

				{/* Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className='space-y-6'>
					<TabsList className='grid w-full sm:w-auto sm:inline-grid grid-cols-2 h-11 bg-muted/50 border border-border shadow-sm'>
						<TabsTrigger
							value='list'
							className='gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all'>
							<List className='w-4 h-4' />
							<span className='hidden sm:inline'>Invoice List</span>
							<span className='sm:hidden'>List</span>
						</TabsTrigger>
						<TabsTrigger
							value='create'
							className='gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all'
							data-tour-id="create-invoice-button">
							<Plus className='w-4 h-4' />
							<span className='hidden sm:inline'>Create Invoice</span>
							<span className='sm:hidden'>Create</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value='list' className='mt-0'>
						<EnhancedInvoiceList
							onEditInvoice={handleEditInvoice}
							invoices={invoices}
							customers={customers}
							loading={invoiceLoading}
							error={invoiceError}
							deleteInvoice={deleteInvoice}
							getInvoiceDetails={getInvoiceDetails}
							refreshInvoices={refresh}
							isANAFAuthenticated={isANAFAuthenticated}
						/>
					</TabsContent>

					<TabsContent value='create' className='mt-0'>
						<InvoiceForm
							open={activeTab === 'create'}
							editInvoice={editingInvoice}
							onInvoiceUpdated={handleInvoiceUpdated}
							customers={customers}
							createInvoice={createInvoice}
							updateInvoice={updateInvoice}
							createCustomer={createCustomer}
							getInvoiceDetails={getInvoiceDetails}
							loading={invoiceOperationLoading}
							error={invoiceError}
							isANAFAuthenticated={isANAFAuthenticated}
							anafLoading={anafLoading}
							onANAFAuthenticate={anafAuthenticate}
							onANAFDisconnect={anafDisconnect}
						/>
					</TabsContent>
				</Tabs>
			</div>
			
			<TourManager
				tours={allTours}
				currentPage="invoice"
				userRole={user?.role}
				enabledFeatures={[]}
				onTourComplete={(tourId) => {
					// Tour completed
				}}
				onTourSkip={(tourId) => {
					// Tour skipped
				}}
			/>
		</div>
	);
}
