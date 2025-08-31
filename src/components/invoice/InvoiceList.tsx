/** @format */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { convertCurrency } from "@/lib/currency-exchange-client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InvoiceForm } from "./InvoiceForm";
import { Skeleton } from "@/components/ui/skeleton";

interface InvoiceListProps {
	onEditInvoice?: (invoice: any) => void;
	invoices: any[];
	customers: any[];
	loading: boolean;
	error: string | null;
	deleteInvoice: (invoiceId: number) => Promise<boolean>;
	getInvoiceDetails: (invoiceId: number) => Promise<any>;
}

export function InvoiceList({
	onEditInvoice,
	invoices,
	customers,
	loading,
	error,
	deleteInvoice,
	getInvoiceDetails,
}: InvoiceListProps) {
	const { token, tenant, showAlert } = useApp();
	const { t } = useLanguage();
	const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
	const [deletingInvoice, setDeletingInvoice] = useState<number | null>(null);
	const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [convertedTotals, setConvertedTotals] = useState<
		Record<
			number,
			{
				original: number;
				converted: number;
				currency: string;
				baseCurrency: string;
			}
		>
	>({});

	// Convert invoice totals to base currency
	useEffect(() => {
		const convertInvoiceTotals = async () => {
			if (!invoices || invoices.length === 0 || !tenant?.defaultCurrency)
				return;

			const baseCurrency = tenant.defaultCurrency;
			const conversions: Record<
				number,
				{
					original: number;
					converted: number;
					currency: string;
					baseCurrency: string;
				}
			> = {};

			for (const invoice of invoices) {
				if (
					invoice.total_amount &&
					invoice.currency &&
					invoice.currency !== baseCurrency
				) {
					try {
						const conversion = await convertCurrency(
							invoice.total_amount,
							invoice.currency,
							baseCurrency,
						);
						conversions[invoice.id] = {
							original: invoice.total_amount,
							converted: conversion.convertedAmount,
							currency: invoice.currency,
							baseCurrency: baseCurrency,
						};
					} catch (error) {
						console.error(
							`Failed to convert currency for invoice ${invoice.id}:`,
							error,
						);
						// Fallback: use original amount
						conversions[invoice.id] = {
							original: invoice.total_amount,
							converted: invoice.total_amount,
							currency: invoice.currency,
							baseCurrency: baseCurrency,
						};
					}
				} else if (invoice.total_amount) {
					// Same currency, no conversion needed
					conversions[invoice.id] = {
						original: invoice.total_amount,
						converted: invoice.total_amount,
						currency: invoice.currency || baseCurrency,
						baseCurrency: baseCurrency,
					};
				}
			}

			setConvertedTotals(conversions);
		};

		convertInvoiceTotals();
	}, [invoices, tenant?.defaultCurrency]);

	const getCustomerName = (customerId: number) => {
		const customer = customers.find((c) => c.id === customerId);
		return customer
			? customer.customer_name
			: t("invoice.list.invoiceInfo.customer", { id: customerId });
	};

	const getCustomerEmail = (customerId: number) => {
		const customer = customers.find((c) => c.id === customerId);
		return customer ? customer.customer_email : "";
	};

	const formatDate = (dateString: string) => {
		try {
			return format(new Date(dateString), "MMM dd, yyyy");
		} catch {
			return dateString;
		}
	};

	const formatPrice = (price: any, currency?: string): string => {
		if (price == null || price === undefined) return "0.00";
		const numPrice =
			typeof price === "string" ? parseFloat(price) : Number(price);
		const formattedPrice = isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
		return currency
			? `${formattedPrice} ${currency.toUpperCase()}`
			: formattedPrice;
	};

	const getInvoiceStatus = (invoice: any) => {
		if (invoice.paid)
			return {
				label: t("status.paid"),
				varifant: "default",
				icon: CheckCircle,
			};
		if (invoice.due_date) {
			const dueDate = new Date(invoice.due_date);
			const now = new Date();
			if (dueDate < now)
				return {
					label: t("status.overdue"),
					variant: "destructive",
					icon: AlertCircle,
				};
			return { label: t("status.pending"), variant: "secondary", icon: Clock };
		}
		return { label: t("status.draft"), variant: "outline", icon: FileText };
	};

	const handleDownloadInvoice = async (invoiceId: number) => {
		try {
			// Generate PDF and download
			const response = await fetch(
				`/api/tenants/${tenant?.id}/invoices/${invoiceId}/download`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);

			if (response.ok) {
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `invoice-${invoiceId}.pdf`;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				showAlert(t("invoice.list.alerts.downloadSuccess"), "success");
			} else {
				showAlert(t("invoice.list.alerts.downloadFailed"), "error");
			}
		} catch (error) {
			console.error("Error downloading invoice:", error);
			showAlert(t("invoice.list.alerts.downloadFailed"), "error");
		}
	};

	const handleDeleteInvoice = async (invoiceId: number) => {
		setDeletingInvoice(invoiceId);
		try {
			await deleteInvoice(invoiceId);
			showAlert(t("invoice.list.alerts.deleteSuccess"), "success");
		} catch (error) {
			console.error("Error deleting invoice:", error);
			showAlert(t("invoice.list.alerts.deleteFailed"), "error");
		} finally {
			setDeletingInvoice(null);
		}
	};

	const handleEditInvoice = async (invoiceId: number) => {
		try {
			setLoadingDetails(true);
			const details = await getInvoiceDetails(invoiceId);

			// Use callback to switch to create tab with edit data
			if (onEditInvoice) {
				onEditInvoice(details);
			}
		} catch (error) {
			console.error("Error fetching invoice details:", error);
			showAlert(t("invoice.list.alerts.loadDetailsFailed"), "error");
		} finally {
			setLoadingDetails(false);
		}
	};

	const handleViewInvoice = async (invoiceId: number) => {
		setSelectedInvoice(invoiceId);
		setLoadingDetails(true);

		try {
			const details = await getInvoiceDetails(invoiceId);
			setInvoiceDetails(details);
		} catch (error) {
			console.error("Error fetching invoice details:", error);
			showAlert(t("invoice.list.alerts.loadDetailsFailed"), "error");
		} finally {
			setLoadingDetails(false);
		}
	};

	if (error) {
		return (
			<Card className='border-destructive/20 bg-destructive/5'>
				<CardContent className='p-6 text-center'>
					<AlertCircle className='w-12 h-12 text-destructive mx-auto mb-4' />
					<div className='text-destructive font-medium'>
						{t("invoice.list.errorLoading")}
					</div>
					<div className='text-sm text-destructive/70 mt-2'>{error}</div>
				</CardContent>
			</Card>
		);
	}

	if (!loading && invoices && invoices.length === 0) {
		return (
			<Card className='border-0 shadow-sm bg-card/50'>
				<CardContent className='text-center py-16 px-6'>
					<div className='w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6'>
						<FileText className='w-10 h-10 text-muted-foreground' />
					</div>
					<h3 className='text-xl font-semibold text-foreground mb-3'>
						{t("invoice.list.noInvoices")}
					</h3>
					<p className='text-muted-foreground max-w-md mx-auto leading-relaxed'>
						{t("invoice.list.noInvoicesDescription")}
					</p>
				</CardContent>
			</Card>
		);
	}

	// Calculate total amount in base currency for summary card
	const getTotalAmountInBaseCurrency = () => {
		if (!tenant?.defaultCurrency) return 0;

		return invoices.reduce((sum, invoice) => {
			const conversion = convertedTotals[invoice.id];
			if (conversion) {
				return sum + conversion.converted;
			}
			// Fallback to original amount if conversion not available
			const total = invoice.total_amount || 0;
			return sum + (typeof total === "string" ? parseFloat(total) || 0 : total);
		}, 0);
	};

	return (
		<div className='space-y-6'>
			{/* Summary Cards */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
				<Card className='border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20'>
					<CardContent className='p-6'>
						<div className='flex items-center gap-4'>
							<div className='w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center'>
								<FileText className='w-6 h-6 text-blue-600 dark:text-blue-400' />
							</div>
							<div>
								<p className='text-sm font-medium text-blue-700 dark:text-blue-300'>
									{t("invoice.list.summaryCards.totalInvoices")}
								</p>
								<p className='text-3xl font-bold text-blue-900 dark:text-blue-100'>
									{invoices.length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className='border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20'>
					<CardContent className='p-6'>
						<div className='flex items-center gap-4'>
							<div className='w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center'>
								<DollarSign className='w-6 h-6 text-green-600 dark:text-green-400' />
							</div>
							<div>
								<p className='text-sm font-medium text-green-700 dark:text-green-300'>
									{t("invoice.list.summaryCards.totalAmount")}
								</p>
								<p className='text-3xl font-bold text-green-900 dark:text-green-100'>
									{formatPrice(
										getTotalAmountInBaseCurrency(),
										tenant?.defaultCurrency || "USD",
									)}
								</p>
								<p className='text-xs text-green-600 dark:text-green-400 mt-1'>
									{t("invoice.list.summaryCards.convertedToBaseCurrency")}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className='border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20'>
					<CardContent className='p-6'>
						<div className='flex items-center gap-4'>
							<div className='w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center'>
								<Package className='w-6 h-6 text-purple-600 dark:text-purple-400' />
							</div>
							<div>
								<p className='text-sm font-medium text-purple-700 dark:text-purple-300'>
									{t("invoice.list.summaryCards.thisMonth")}
								</p>
								<p className='text-3xl font-bold text-purple-900 dark:text-purple-100'>
									{
										invoices.filter((invoice) => {
											const invoiceDate = new Date(invoice.date);
											const now = new Date();
											return (
												invoiceDate.getMonth() === now.getMonth() &&
												invoiceDate.getFullYear() === now.getFullYear()
											);
										}).length
									}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className='border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20'>
					<CardContent className='p-6'>
						<div className='flex items-center gap-4'>
							<div className='w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center'>
								<Users className='w-6 h-6 text-orange-600 dark:text-orange-400' />
							</div>
							<div>
								<p className='text-sm font-medium text-orange-700 dark:text-orange-300'>
									{t("invoice.list.summaryCards.customers")}
								</p>
								<p className='text-3xl font-bold text-orange-900 dark:text-orange-100'>
									{new Set(invoices.map((i) => i.customer_id)).size}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tenant Information */}
			<Card className='border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950/20 dark:to-slate-900/20'>
				<CardHeader className='pb-3'>
					<CardTitle className='flex items-center gap-2 text-lg'>
						<Settings className='w-5 h-5 text-slate-600 dark:text-slate-400' />
						{t("invoice.list.tenantInfo.title")}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
						<div className='flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/30 rounded-lg'>
							<FileText className='w-4 h-4 text-slate-600 dark:text-slate-400' />
							<div>
								<p className='text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
									{t("invoice.list.tenantInfo.companyName")}
								</p>
								<p className='font-semibold text-slate-900 dark:text-slate-100'>
									{tenant?.name || "N/A"}
								</p>
							</div>
						</div>

						<div className='flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/30 rounded-lg'>
							<DollarSign className='w-4 h-4 text-slate-600 dark:text-slate-400' />
							<div>
								<p className='text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
									{t("invoice.list.tenantInfo.baseCurrency")}
								</p>
								<p className='font-semibold text-slate-900 dark:text-slate-100'>
									{tenant?.defaultCurrency || "USD"}
								</p>
							</div>
						</div>

						<div className='flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/30 rounded-lg'>
							<Building className='w-4 h-4 text-slate-600 dark:text-slate-400' />
							<div>
								<p className='text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
									{t("invoice.list.tenantInfo.companyEmail")}
								</p>
								<p className='font-semibold text-slate-900 dark:text-slate-100'>
									{tenant?.companyEmail || "N/A"}
								</p>
							</div>
						</div>

						<div className='flex items-center gap-3 p-3 bg-white/50 dark:bg-slate-800/30 rounded-lg'>
							<CreditCard className='w-4 h-4 text-slate-600 dark:text-slate-400' />
							<div>
								<p className='text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide'>
									{t("invoice.list.tenantInfo.address")}
								</p>
								<p className='font-semibold text-slate-900 dark:text-slate-100 text-sm'>
									{tenant?.address || "N/A"}
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Invoice List */}
			<div className='space-y-4'>
				{invoices.map((invoice) => {
					const status = getInvoiceStatus(invoice);
					const StatusIcon = status.icon;
					const conversion = convertedTotals[invoice.id];

					return (
						<Card
							key={invoice.id}
							className='border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-card'>
							<CardContent className='p-6'>
								<div className='flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6'>
									{/* Invoice Info */}
									<div className='flex-1 space-y-4'>
										{/* Header */}
										<div className='flex items-start gap-4'>
											<div className='w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0'>
												<FileText className='w-6 h-6 text-primary' />
											</div>
											<div className='flex-1 min-w-0'>
												<div className='flex items-center gap-3 mb-2'>
													<h3 className='font-semibold text-lg text-foreground truncate'>
														{invoice.invoice_number}
													</h3>
													<Badge
														variant={status.variant as any}
														className='flex items-center gap-1'>
														<StatusIcon className='w-3 h-3' />
														{status.label}
													</Badge>
												</div>
												<p className='text-sm text-muted-foreground'>
													{t("invoice.list.invoiceInfo.invoiceNumber", {
														id: invoice.id,
													})}
												</p>
											</div>
										</div>

										{/* Details Grid */}
										<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
											<div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
												<User className='w-4 h-4 text-muted-foreground flex-shrink-0' />
												<div className='min-w-0'>
													<p className='font-medium text-sm truncate'>
														{getCustomerName(invoice.customer_id)}
													</p>
													<p className='text-xs text-muted-foreground truncate'>
														{getCustomerEmail(invoice.customer_id)}
													</p>
												</div>
											</div>

											<div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
												<Calendar className='w-4 h-4 text-muted-foreground flex-shrink-0' />
												<div>
													<p className='font-medium text-sm'>
														{t("invoice.list.invoiceInfo.date")}
													</p>
													<p className='text-xs text-muted-foreground'>
														{formatDate(invoice.date)}
													</p>
												</div>
											</div>

											{invoice.due_date && (
												<div className='flex items-center gap-3 p-3 bg-muted/30 rounded-lg'>
													<Clock className='w-4 h-4 text-muted-foreground flex-shrink-0' />
													<div>
														<p className='font-medium text-sm'>
															{t("invoice.list.invoiceInfo.dueDate")}
														</p>
														<p className='text-xs text-muted-foreground'>
															{formatDate(invoice.due_date)}
														</p>
													</div>
												</div>
											)}
										</div>

										{/* Amount with conversion */}
										{invoice.total_amount && (
											<div className='space-y-2'>
												<div className='flex items-center gap-2'>
													<span className='text-sm font-medium text-muted-foreground'>
														{t("invoice.list.invoiceInfo.total")}
													</span>
													<span className='text-xl font-bold text-green-600 dark:text-green-400'>
														{formatPrice(
															invoice.total_amount,
															invoice.currency,
														)}
													</span>
												</div>
												{conversion &&
													conversion.currency !== conversion.baseCurrency && (
														<div className='flex items-center gap-2'>
															<span className='text-sm text-muted-foreground'>
																{t("invoice.list.invoiceInfo.convertedToBase")}
															</span>
															<span className='text-lg font-semibold text-blue-600 dark:text-blue-400'>
																{formatPrice(
																	conversion.converted,
																	conversion.baseCurrency,
																)}
															</span>
															<span className='text-xs text-muted-foreground'>
																({t("invoice.list.invoiceInfo.exchangeRate")}:{" "}
																{conversion.original.toFixed(2)}{" "}
																{conversion.currency} ={" "}
																{conversion.converted.toFixed(2)}{" "}
																{conversion.baseCurrency})
															</span>
														</div>
													)}
											</div>
										)}
									</div>

									{/* Actions */}
									<div className='flex flex-col sm:flex-row gap-2 lg:flex-col lg:items-end'>
										{/* Desktop Actions */}
										<div className='hidden lg:flex flex-col gap-2'>
											<Button
												variant='outline'
												size='sm'
												onClick={() => handleViewInvoice(invoice.id)}
												className='w-full justify-start'>
												<Eye className='w-4 h-4 mr-2' />
												{t("invoice.list.actions.view")}
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={() => handleDownloadInvoice(invoice.id)}
												className='w-full justify-start'>
												<Download className='w-4 h-4 mr-2' />
												{t("invoice.list.actions.download")}
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={() => handleEditInvoice(invoice.id)}
												disabled={loadingDetails}
												className='w-full justify-start'>
												<Edit className='w-4 h-4 mr-2' />
												{loadingDetails
													? t("invoice.list.actions.loading")
													: t("invoice.list.actions.edit")}
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant='outline'
														size='sm'
														disabled={deletingInvoice === invoice.id}
														className='w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10'>
														<Trash2 className='w-4 h-4 mr-2' />
														{deletingInvoice === invoice.id
															? t("invoice.list.actions.deleting")
															: t("invoice.list.actions.delete")}
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															{t("invoice.list.deleteDialog.title")}
														</AlertDialogTitle>
														<AlertDialogDescription>
															{t("invoice.list.deleteDialog.description")}
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															{t("invoice.list.deleteDialog.cancel")}
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => handleDeleteInvoice(invoice.id)}
															className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
															{t("invoice.list.deleteDialog.deleteInvoice")}
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>

										{/* Mobile Actions */}
										<div className='lg:hidden flex gap-2'>
											<Button
												variant='outline'
												size='sm'
												onClick={() => handleViewInvoice(invoice.id)}>
												<Eye className='w-4 h-4' />
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={() => handleDownloadInvoice(invoice.id)}>
												<Download className='w-4 h-4' />
											</Button>
											<Button
												variant='outline'
												size='sm'
												onClick={() => handleEditInvoice(invoice.id)}
												disabled={loadingDetails}>
												<Edit className='w-4 h-4' />
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button variant='outline' size='sm'>
														<Trash2 className='w-4 h-4' />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															{t("invoice.list.deleteDialog.title")}
														</AlertDialogTitle>
														<AlertDialogDescription>
															{t("invoice.list.deleteDialog.description")}
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>
															{t("invoice.list.deleteDialog.cancel")}
														</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => handleDeleteInvoice(invoice.id)}
															className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
															{t("invoice.list.deleteDialog.deleteInvoice")}
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{/* Invoice Details Modal */}
			{selectedInvoice && (
				<div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
					<Card className='w-full max-w-4xl max-h-[90vh] overflow-hidden border-0 shadow-2xl'>
						<CardHeader className='flex items-center justify-between border-b bg-muted/20'>
							<CardTitle className='flex items-center gap-2'>
								<FileText className='w-5 h-5 text-primary' />
								{t("invoice.list.detailsModal.title")}
							</CardTitle>
							<Button
								variant='ghost'
								size='sm'
								onClick={() => {
									setSelectedInvoice(null);
									setInvoiceDetails(null);
								}}
								className='h-8 w-8 p-0'>
								{t("invoice.list.detailsModal.close")}
							</Button>
						</CardHeader>
						<CardContent className='p-6 overflow-y-auto'>
							{loadingDetails ? (
								<div className='flex items-center justify-center py-12'>
									<div className='text-center space-y-4'>
										<div className='w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto'></div>
										<div className='text-muted-foreground'>
											{t("invoice.list.detailsModal.loadingDetails")}
										</div>
									</div>
								</div>
							) : invoiceDetails ? (
								<div className='space-y-6'>
									{/* Invoice Header */}
									<div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
										<Card className='border-0 shadow-sm'>
											<CardHeader className='pb-3'>
												<CardTitle className='text-lg'>
													{t("invoice.list.detailsModal.invoiceInformation")}
												</CardTitle>
											</CardHeader>
											<CardContent className='space-y-3'>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t(
															"invoice.list.detailsModal.fields.invoiceNumber",
														)}
													</span>
													<span className='font-mono'>
														{invoiceDetails.invoice?.invoice_number || "N/A"}
													</span>
												</div>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.date")}
													</span>
													<span>
														{invoiceDetails.invoice?.date
															? formatDate(invoiceDetails.invoice.date)
															: "N/A"}
													</span>
												</div>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.dueDate")}
													</span>
													<span>
														{invoiceDetails.invoice?.due_date
															? formatDate(invoiceDetails.invoice.due_date)
															: "N/A"}
													</span>
												</div>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.paymentTerms")}
													</span>
													<span>
														{invoiceDetails.invoice?.payment_terms || "N/A"}
													</span>
												</div>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t(
															"invoice.list.detailsModal.fields.paymentMethod",
														)}
													</span>
													<span>
														{invoiceDetails.invoice?.payment_method || "N/A"}
													</span>
												</div>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.baseCurrency")}
													</span>
													<span className='font-mono'>
														{invoiceDetails.invoice?.base_currency ||
															tenant?.defaultCurrency ||
															"USD"}
													</span>
												</div>
												<div className='flex justify-between items-center py-2'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.invoiceId")}
													</span>
													<span className='font-mono'>
														#{invoiceDetails.invoice?.id || "N/A"}
													</span>
												</div>
											</CardContent>
										</Card>

										<Card className='border-0 shadow-sm'>
											<CardHeader className='pb-3'>
												<CardTitle className='text-lg'>
													{t("invoice.list.detailsModal.customerInformation")}
												</CardTitle>
											</CardHeader>
											<CardContent className='space-y-3'>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.name")}
													</span>
													<span>
														{invoiceDetails.customer?.customer_name || "N/A"}
													</span>
												</div>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.email")}
													</span>
													<span>
														{invoiceDetails.customer?.customer_email || "N/A"}
													</span>
												</div>
												{invoiceDetails.customer?.customer_address && (
													<div className='flex justify-between items-start py-2'>
														<span className='font-medium'>
															{t("invoice.list.detailsModal.fields.address")}
														</span>
														<span className='text-right max-w-[200px]'>
															{invoiceDetails.customer.customer_address}
														</span>
													</div>
												)}
											</CardContent>
										</Card>

										<Card className='border-0 shadow-sm'>
											<CardHeader className='pb-3'>
												<CardTitle className='text-lg'>
													{t("invoice.list.detailsModal.tenantInformation")}
												</CardTitle>
											</CardHeader>
											<CardContent className='space-y-3'>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.companyName")}
													</span>
													<span>{tenant?.name || "N/A"}</span>
												</div>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t("invoice.list.detailsModal.fields.companyEmail")}
													</span>
													<span>{tenant?.companyEmail || "N/A"}</span>
												</div>
												<div className='flex justify-between items-center py-2 border-b border-muted/30'>
													<span className='font-medium'>
														{t(
															"invoice.list.detailsModal.fields.companyAddress",
														)}
													</span>
													<span className='text-right max-w-[150px]'>
														{tenant?.address || "N/A"}
													</span>
												</div>
												<div className='flex justify-between items-center py-2'>
													<span className='font-medium'>
														{t(
															"invoice.list.detailsModal.fields.defaultCurrency",
														)}
													</span>
													<span className='font-mono'>
														{tenant?.defaultCurrency || "USD"}
													</span>
												</div>
											</CardContent>
										</Card>
									</div>

									{/* Invoice Items */}
									<Card className='border-0 shadow-sm'>
										<CardHeader className='pb-3'>
											<CardTitle className='text-lg'>
												{t("invoice.list.detailsModal.invoiceItems")}
											</CardTitle>
										</CardHeader>
										<CardContent className='p-0'>
											<div className='overflow-x-auto'>
												<table className='w-full'>
													<thead className='bg-muted/30'>
														<tr>
															<th className='px-4 py-3 text-left font-medium text-sm'>
																{t("invoice.list.detailsModal.fields.item")}
															</th>
															<th className='px-4 py-3 text-left font-medium text-sm hidden lg:table-cell'>
																{t("invoice.list.detailsModal.fields.sku")}
															</th>
															<th className='px-4 py-3 text-left font-medium text-sm hidden xl:table-cell'>
																{t("invoice.list.detailsModal.fields.brand")}
															</th>
															<th className='px-4 py-3 text-left font-medium text-sm hidden xl:table-cell'>
																{t("invoice.list.detailsModal.fields.category")}
															</th>
															<th className='px-4 py-3 text-right font-medium text-sm'>
																{t("invoice.list.detailsModal.fields.qty")}
															</th>
															<th className='px-4 py-3 text-right font-medium text-sm'>
																{t("invoice.list.detailsModal.fields.price")}
															</th>
															<th className='px-4 py-3 text-right font-medium text-sm'>
																{t("invoice.list.detailsModal.fields.vat")}
															</th>
															<th className='px-4 py-3 text-right font-medium text-sm'>
																{t("invoice.list.detailsModal.fields.total")}
															</th>
														</tr>
													</thead>
													<tbody>
														{invoiceDetails.items?.map(
															(item: any, index: number) => (
																<tr
																	key={item.id}
																	className={
																		index % 2 === 0
																			? "bg-background"
																			: "bg-muted/20"
																	}>
																	<td className='px-4 py-3'>
																		<div className='space-y-1'>
																			<div className='font-medium'>
																				{item.product_name ||
																					t(
																						"invoice.list.detailsModal.product",
																					)}
																			</div>
																			{item.product_description && (
																				<div className='text-sm text-muted-foreground'>
																					{item.product_description}
																				</div>
																			)}
																			<div className='flex flex-wrap gap-2 text-xs text-muted-foreground'>
																				{item.product_sku && (
																					<span>
																						{t(
																							"invoice.list.detailsModal.sku",
																							{ sku: item.product_sku },
																						)}
																					</span>
																				)}
																				{item.product_brand && (
																					<span>
																						{t(
																							"invoice.list.detailsModal.brand",
																							{ brand: item.product_brand },
																						)}
																					</span>
																				)}
																				{item.product_category && (
																					<span>
																						{t(
																							"invoice.list.detailsModal.category",
																							{
																								category: item.product_category,
																							},
																						)}
																					</span>
																				)}
																			</div>
																		</div>
																	</td>
																	<td className='px-4 py-3 font-mono text-sm hidden lg:table-cell'>
																		{item.product_sku || "N/A"}
																	</td>
																	<td className='px-4 py-3 text-sm hidden xl:table-cell'>
																		{item.product_brand || "N/A"}
																	</td>
																	<td className='px-4 py-3 text-sm hidden xl:table-cell'>
																		{item.product_category || "N/A"}
																	</td>
																	<td className='px-4 py-3 text-right'>
																		{item.quantity}
																	</td>
																	<td className='px-4 py-3 text-right'>
																		{formatPrice(item.price, item.currency)}
																	</td>
																	<td className='px-4 py-3 text-right font-medium'>
																		{item.product_vat
																			? `${item.product_vat}%`
																			: "0%"}
																	</td>
																	<td className='px-4 py-3 text-right font-medium'>
																		{formatPrice(
																			(item.quantity || 0) * (item.price || 0),
																			item.currency,
																		)}
																	</td>
																</tr>
															),
														)}
													</tbody>
												</table>
											</div>
										</CardContent>
									</Card>

									{/* Totals */}
									<Card className='border-0 shadow-sm bg-muted/10'>
										<CardContent className='p-6'>
											<div className='flex justify-end'>
												<div className='text-right space-y-3'>
													{/* Subtotal */}
													<div className='text-lg'>
														<span className='font-medium text-muted-foreground'>
															{t("invoice.list.detailsModal.subtotalExclVat")}{" "}
														</span>
														<span className='text-green-600 dark:text-green-400 font-semibold'>
															{formatPrice(
																invoiceDetails.totals?.subtotal || 0,
																invoiceDetails.totals?.base_currency || "USD",
															)}
														</span>
													</div>

													{/* VAT Total */}
													{invoiceDetails.totals?.vat_total && (
														<div className='text-lg'>
															<span className='font-medium text-muted-foreground'>
																{t("invoice.list.detailsModal.vatTotal")}{" "}
															</span>
															<span className='text-orange-600 dark:text-orange-400 font-semibold'>
																{formatPrice(
																	invoiceDetails.totals.vat_total,
																	invoiceDetails.totals?.base_currency || "USD",
																)}
															</span>
														</div>
													)}

													{/* Grand Total */}
													<div className='text-2xl font-bold pt-2 border-t border-border'>
														<span className='font-medium text-muted-foreground'>
															{t("invoice.list.detailsModal.grandTotalInclVat")}{" "}
														</span>
														<span className='text-primary'>
															{formatPrice(
																invoiceDetails.totals?.grand_total ||
																	invoiceDetails.totals?.subtotal ||
																	0,
																invoiceDetails.totals?.base_currency || "USD",
															)}
														</span>
													</div>

													{invoiceDetails.totals?.totals_by_currency && (
														<div className='text-sm text-muted-foreground space-y-1'>
															{Object.entries(
																invoiceDetails.totals.totals_by_currency,
															).map(([currency, amount]) => (
																<div key={currency}>
																	{currency}: {formatPrice(amount, currency)}
																</div>
															))}
														</div>
													)}
													<div className='text-sm text-muted-foreground'>
														{t("invoice.list.detailsModal.itemsCount", {
															count: invoiceDetails.totals?.items_count || 0,
														})}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>

									{/* Actions */}
									<div className='flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t'>
										<Button
											variant='outline'
											onClick={() =>
												selectedInvoice &&
												handleDownloadInvoice(selectedInvoice)
											}>
											<Download className='w-4 h-4 mr-2' />
											{t("invoice.list.actions.download")}
										</Button>
										<Button
											variant='outline'
											onClick={() => {
												if (selectedInvoice) {
													handleEditInvoice(selectedInvoice);
												}
											}}
											disabled={loadingDetails}
											className='bg-blue-600 text-white hover:bg-blue-700'>
											<Edit className='w-4 h-4 mr-2' />
											{loadingDetails
												? t("invoice.list.actions.loading")
												: t("invoice.list.detailsModal.editInvoice")}
										</Button>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button
													variant='outline'
													className='text-destructive hover:text-destructive hover:bg-destructive/10'>
													<Trash2 className='w-4 h-4 mr-2' />
													{t("invoice.list.actions.delete")}
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														{t("invoice.list.deleteDialog.title")}
													</AlertDialogTitle>
													<AlertDialogDescription>
														{t("invoice.list.deleteDialog.description")}
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>
														{t("invoice.list.deleteDialog.cancel")}
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={() =>
															selectedInvoice &&
															handleDeleteInvoice(selectedInvoice)
														}
														className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
														{t("invoice.list.deleteDialog.deleteInvoice")}
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								</div>
							) : (
								<div className='text-center py-12 text-muted-foreground'>
									<AlertCircle className='w-12 h-12 mx-auto mb-4 opacity-50' />
									{t("invoice.list.detailsModal.failedToLoad")}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
