/** @format */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InvoiceForm } from "@/components/invoice/InvoiceForm";
import { EnhancedInvoiceList } from "@/components/invoice/EnhancedInvoiceList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	FileText,
	Plus,
	List,
	TrendingUp,
	DollarSign,
	Users,
	Puzzle,
	Settings,
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

	// Invoice system hook - moved here to avoid re-fetching on tab changes
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
				console.error("Failed to check module status:", error);
			} finally {
				setLoading(false);
			}
		};

		checkModuleStatus();
	}, [tenant, token]);

	// Manual ANAF authentication - no auto-connect
	const handleANAFConnect = async () => {
		if (moduleEnabled && user?.id && tenant?.id && token && !isANAFAuthenticated && !anafLoading && !silentAuthLoading) {
			try {
				console.log('Connecting to ANAF...');
				const result = await authenticateSilently();
				if (result.success && result.authenticated) {
					console.log('ANAF authentication successful');
					// Refresh the page to update the UI
					window.location.reload();
				} else if (result.requiresUserInteraction) {
					console.log('Redirecting to ANAF authentication...');
					// User will be redirected to ANAF and back
				}
			} catch (error) {
				console.error('Failed to connect to ANAF:', error);
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

	// Show loading state
	if (loading) {
		return (
			<div className='min-h-screen bg-background flex items-center justify-center'>
				<div className='text-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
					<p className='text-muted-foreground'>Checking module status...</p>
				</div>
			</div>
		);
	}

	// Show module not enabled message
	if (!moduleEnabled) {
		return (
			<div className='min-h-screen bg-background'>
				<div className='container mx-auto px-4 py-8 sm:py-12'>
					<div className='max-w-2xl mx-auto text-center space-y-6'>
						<div className='inline-flex items-center justify-center w-20 h-20 bg-muted/30 rounded-2xl'>
							<Puzzle className='w-10 h-10 text-muted-foreground' />
						</div>
						<h1 className='text-3xl font-bold tracking-tight text-foreground'>
							Billing Module Not Enabled
						</h1>
						<p className='text-lg text-muted-foreground leading-relaxed'>
							The billing and invoicing module is not currently enabled for your
							organization. This module provides professional invoicing
							capabilities with customer management.
						</p>
						<div className='space-y-4'>
							<Card className='border border-border/20 bg-card/50'>
								<CardContent className='p-6'>
									<h3 className='font-semibold text-foreground mb-2'>
										What's included:
									</h3>
									<ul className='text-sm text-muted-foreground space-y-1 text-left'>
										<li>• Customer management system</li>
										<li>• Professional invoice creation</li>
										<li>• Invoice line items management</li>
										<li>• Customer relationship tracking</li>
									</ul>
								</CardContent>
							</Card>
							{user?.role === "ADMIN" && (
								<div className='space-y-3'>
									<p className='text-sm text-muted-foreground'>
										As an administrator, you can enable this module in your
										organization settings.
									</p>
									<Button
										onClick={() => router.push("/home/tenant")}
										className='gap-2'>
										<Settings className='w-4 h-4' />
										Go to Organization Settings
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-background'>
			{/* Hero Section */}
			<div className='bg-gradient-to-br from-primary/5 via-background to-muted/20 border-b'>
				<div className='container mx-auto px-4 py-8 sm:py-12'>
					<div className='max-w-4xl mx-auto text-center space-y-4' data-tour-id="invoice-header">
						<div className='inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4'>
							<FileText className='w-8 h-8 text-primary' />
						</div>
						<h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight'>
							Invoice Management
						</h1>
						<p className='text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
							Create professional invoices, manage customer relationships, and
							streamline your billing process
						</p>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='container mx-auto px-4 py-6 sm:py-8'>
				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className='space-y-6'>
					<TabsList className='grid w-full grid-cols-2 h-12 bg-card border shadow-sm'>
						<TabsTrigger
							value='list'
							className='flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200'>
							<List className='w-4 h-4' />
							<span className='hidden sm:inline'>Invoice List</span>
							<span className='sm:hidden'>List</span>
						</TabsTrigger>
						<TabsTrigger
							value='create'
							className='flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-200'
							data-tour-id="create-invoice-button">
							<Plus className='w-4 h-4' />
							<span className='hidden sm:inline'>Create Invoice</span>
							<span className='sm:hidden'>Create</span>
						</TabsTrigger>
					</TabsList>

					<TabsContent value='list' className='space-y-6'>
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

					<TabsContent value='create' className='space-y-6'>
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
					console.log(`Tour ${tourId} completed`);
				}}
				onTourSkip={(tourId) => {
					console.log(`Tour ${tourId} skipped`);
				}}
			/>
		</div>
	);
}
