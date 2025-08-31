/** @format */

import React, { useState, useEffect, useCallback } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Download,
	Receipt,
	Calendar,
	DollarSign,
	AlertCircle,
	CheckCircle,
	XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useApp } from "@/contexts/AppContext";

interface Invoice {
	id: string;
	number: string;
	amount: number | null;
	currency: string;
	status: string;
	created: number;
	due_date?: number;
	pdf_url?: string;
	hosted_invoice_url?: string;
}

interface BillingHistoryProps {
	customerId: string | null;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({ customerId }) => {
	const { showAlert } = useApp();
	const [invoices, setInvoices] = useState<Invoice[]>([]);
	const [loading, setLoading] = useState(false);
	const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
	const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

	const fetchInvoices = useCallback(async () => {
		if (!customerId) return;

		setLoading(true);
		try {
			const response = await fetch("/api/stripe/invoices", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ customerId }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to fetch invoices");
			}

			const data = await response.json();
			setInvoices(data.invoices || []);
		} catch (error) {
			console.error("Error fetching invoices:", error);
			showAlert(
				error instanceof Error
					? error.message
					: "Failed to load billing history",
				"error",
			);
		} finally {
			setLoading(false);
		}
	}, [customerId, showAlert]);

	useEffect(() => {
		if (customerId) {
			fetchInvoices();
		}
	}, [customerId, fetchInvoices]);

	const handleDownloadInvoice = async (invoice: Invoice) => {
		if (!invoice.pdf_url) {
			showAlert("Invoice PDF not available", "error");
			return;
		}

		try {
			const response = await fetch("/api/stripe/download-invoice", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ invoiceId: invoice.id }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to download invoice");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `invoice-${invoice.number}.pdf`;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error("Error downloading invoice:", error);
			showAlert(
				error instanceof Error ? error.message : "Failed to download invoice",
				"error",
			);
		}
	};

	const handleViewInvoice = (invoice: Invoice) => {
		setSelectedInvoice(invoice);
		setShowInvoiceDialog(true);
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "paid":
				return <CheckCircle className='w-4 h-4 text-green-600' />;
			case "open":
				return <AlertCircle className='w-4 h-4 text-yellow-600' />;
			case "void":
				return <XCircle className='w-4 h-4 text-red-600' />;
			case "draft":
				return <AlertCircle className='w-4 h-4 text-gray-600' />;
			case "uncollectible":
				return <XCircle className='w-4 h-4 text-red-600' />;
			default:
				return <AlertCircle className='w-4 h-4 text-gray-600' />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "bg-green-100 text-green-800 border-green-200";
			case "open":
				return "bg-yellow-100 text-yellow-800 border-yellow-200";
			case "void":
				return "bg-red-100 text-red-800 border-red-200";
			case "draft":
				return "bg-gray-100 text-gray-800 border-gray-200";
			case "uncollectible":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	const formatAmount = (
		amount: number | null | undefined,
		currency: string,
	) => {
		if (amount === null || amount === undefined) {
			return "N/A";
		}
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency.toUpperCase(),
		}).format(amount / 100);
	};

	if (!customerId) {
		return (
			<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Receipt className='w-5 h-5' />
						Billing History
					</CardTitle>
					<CardDescription>
						View your past invoices and payment history
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='text-center py-8'>
						<AlertCircle className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
						<p className='text-muted-foreground'>
							No billing history available. Subscribe to a plan to see your
							invoices.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<>
			<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Receipt className='w-5 h-5' />
						Billing History
					</CardTitle>
					<CardDescription>
						View your past invoices and payment history
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className='text-center py-8'>
							<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto'></div>
							<p className='text-muted-foreground mt-2'>Loading invoices...</p>
						</div>
					) : invoices.length === 0 ? (
						<div className='text-center py-8'>
							<Receipt className='w-16 h-16 text-muted-foreground mx-auto mb-4' />
							<p className='text-muted-foreground'>No invoices found</p>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Invoice</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Amount</TableHead>
										<TableHead>Status</TableHead>
										<TableHead className='text-right'>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{invoices.map((invoice) => (
										<TableRow key={invoice.id}>
											<TableCell className='font-medium'>
												{invoice.number}
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-1'>
													<Calendar className='w-4 h-4 text-muted-foreground' />
													{format(
														new Date(invoice.created * 1000),
														"MMM dd, yyyy",
													)}
												</div>
											</TableCell>
											<TableCell>
												<div className='flex items-center gap-1'>
													<DollarSign className='w-4 h-4 text-muted-foreground' />
													{formatAmount(invoice.amount, invoice.currency)}
												</div>
											</TableCell>
											<TableCell>
												<Badge className={getStatusColor(invoice.status)}>
													{getStatusIcon(invoice.status)}
													<span className='ml-1 capitalize'>
														{invoice.status}
													</span>
												</Badge>
											</TableCell>
											<TableCell className='text-right'>
												<div className='flex items-center justify-end gap-2'>
													{invoice.hosted_invoice_url && (
														<Button
															variant='outline'
															size='sm'
															onClick={() => handleViewInvoice(invoice)}>
															<Receipt className='w-4 h-4' />
														</Button>
													)}
													{invoice.pdf_url && (
														<Button
															variant='outline'
															size='sm'
															onClick={() => handleDownloadInvoice(invoice)}>
															<Download className='w-4 h-4' />
														</Button>
													)}
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Invoice Preview Dialog */}
			<Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
				<DialogContent className='max-w-4xl'>
					<DialogHeader>
						<DialogTitle>Invoice Preview</DialogTitle>
						<DialogDescription>
							View invoice details and download if needed
						</DialogDescription>
					</DialogHeader>
					{selectedInvoice && (
						<div className='space-y-4'>
							<div className='grid grid-cols-2 gap-4'>
								<div>
									<label className='text-sm font-medium text-muted-foreground'>
										Invoice Number
									</label>
									<p className='text-foreground'>{selectedInvoice.number}</p>
								</div>
								<div>
									<label className='text-sm font-medium text-muted-foreground'>
										Amount
									</label>
									<p className='text-foreground'>
										{formatAmount(
											selectedInvoice.amount,
											selectedInvoice.currency,
										)}
									</p>
								</div>
								<div>
									<label className='text-sm font-medium text-muted-foreground'>
										Date
									</label>
									<p className='text-foreground'>
										{format(
											new Date(selectedInvoice.created * 1000),
											"MMM dd, yyyy",
										)}
									</p>
								</div>
								<div>
									<label className='text-sm font-medium text-muted-foreground'>
										Status
									</label>
									<Badge className={getStatusColor(selectedInvoice.status)}>
										{getStatusIcon(selectedInvoice.status)}
										<span className='ml-1 capitalize'>
											{selectedInvoice.status}
										</span>
									</Badge>
								</div>
							</div>
							<div className='flex gap-2'>
								{selectedInvoice.hosted_invoice_url && (
									<Button
										onClick={() =>
											window.open(selectedInvoice.hosted_invoice_url, "_blank")
										}
										className='flex-1'>
										<Receipt className='w-4 h-4 mr-2' />
										View Online
									</Button>
								)}
								{selectedInvoice.pdf_url && (
									<Button
										onClick={() => handleDownloadInvoice(selectedInvoice)}
										variant='outline'
										className='flex-1'>
										<Download className='w-4 h-4 mr-2' />
										Download PDF
									</Button>
								)}
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default BillingHistory;
