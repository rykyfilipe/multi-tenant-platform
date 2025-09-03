/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportModalProps {
	isOpen: boolean;
	onClose: () => void;
	tenantId: string;
	onExportComplete?: (result: any) => void;
}

interface ExportFormat {
	name: string;
	displayName: string;
	description: string;
	mimeType: string;
}

interface ExportHistory {
	id: string;
	format: string;
	exportedAt: string;
	userId: string;
	count: number;
	success: boolean;
}

export function ExportModal({ isOpen, onClose, tenantId, onExportComplete }: ExportModalProps) {
	const [formats, setFormats] = useState<ExportFormat[]>([]);
	const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
	const [selectedFormat, setSelectedFormat] = useState<string>('');
	const [limit, setLimit] = useState<number>(1000);
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [status, setStatus] = useState('');
	const [customerId, setCustomerId] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();

	useEffect(() => {
		if (isOpen) {
			fetchExportInfo();
		}
	}, [isOpen]);

	const fetchExportInfo = async () => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/invoices/export`);
			const data = await response.json();
			
			if (data.success) {
				setFormats(data.formats);
				setExportHistory(data.exportHistory);
			} else {
				setError('Failed to load export information');
			}
		} catch (error) {
			console.error('Error fetching export info:', error);
			setError('Failed to load export information');
		}
	};

	const handleExport = async () => {
		if (!selectedFormat) {
			setError('Please select an export format');
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const requestBody: any = {
				format: selectedFormat,
				limit,
			};

			// Add filters if provided
			const filters: any = {};
			if (dateFrom) filters.dateFrom = dateFrom;
			if (dateTo) filters.dateTo = dateTo;
			if (status) filters.status = status;
			if (customerId) filters.customerId = parseInt(customerId);

			if (Object.keys(filters).length > 0) {
				requestBody.filters = filters;
			}

			const response = await fetch(`/api/tenants/${tenantId}/invoices/export`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			if (response.ok) {
				// Get filename from Content-Disposition header
				const contentDisposition = response.headers.get('Content-Disposition');
				const filename = contentDisposition
					?.split('filename=')[1]
					?.replace(/"/g, '') || `invoices_export_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;

				// Create blob and download
				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);

				toast({
					title: 'Export completed',
					description: `Invoices exported successfully as ${selectedFormat.toUpperCase()}`,
				});

				if (onExportComplete) {
					onExportComplete({ format: selectedFormat, filename });
				}

				// Refresh export history
				fetchExportInfo();
			} else {
				const errorData = await response.json();
				setError(errorData.message || 'Export failed');
			}
		} catch (error) {
			console.error('Export error:', error);
			setError('Export failed. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const resetForm = () => {
		setSelectedFormat('');
		setLimit(1000);
		setDateFrom('');
		setDateTo('');
		setStatus('');
		setCustomerId('');
		setError(null);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-foreground">Export Invoices</h2>
						<Button variant="ghost" size="sm" onClick={handleClose}>
							<XCircle className="h-4 w-4" />
						</Button>
					</div>

					{error && (
						<Alert className="mb-6" variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<Tabs defaultValue="export" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="export">Export</TabsTrigger>
							<TabsTrigger value="history">History</TabsTrigger>
						</TabsList>

						<TabsContent value="export" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Export Configuration</CardTitle>
									<CardDescription>
										Configure how invoices should be exported
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label htmlFor="format">Export Format</Label>
										<Select value={selectedFormat} onValueChange={setSelectedFormat}>
											<SelectTrigger>
												<SelectValue placeholder="Select export format" />
											</SelectTrigger>
											<SelectContent>
												{formats.map((format) => (
													<SelectItem key={format.name} value={format.name}>
														<div>
															<div className="font-medium">{format.displayName}</div>
															<div className="text-sm text-muted-foreground">
																{format.description}
															</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div>
										<Label htmlFor="limit">Limit</Label>
										<Input
											id="limit"
											type="number"
											min="1"
											max="10000"
											value={limit}
											onChange={(e) => setLimit(parseInt(e.target.value) || 1000)}
											placeholder="Maximum number of invoices to export"
										/>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardHeader>
									<CardTitle>Filters</CardTitle>
									<CardDescription>
										Optional filters to limit which invoices are exported
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label htmlFor="dateFrom">From Date</Label>
											<Input
												id="dateFrom"
												type="date"
												value={dateFrom}
												onChange={(e) => setDateFrom(e.target.value)}
											/>
										</div>
										<div>
											<Label htmlFor="dateTo">To Date</Label>
											<Input
												id="dateTo"
												type="date"
												value={dateTo}
												onChange={(e) => setDateTo(e.target.value)}
											/>
										</div>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<Label htmlFor="status">Status</Label>
											<Select value={status} onValueChange={setStatus}>
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
													<SelectItem value="credit_note">Credit Note</SelectItem>
													<SelectItem value="proforma">Pro-forma</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div>
											<Label htmlFor="customerId">Customer ID</Label>
											<Input
												id="customerId"
												type="number"
												value={customerId}
												onChange={(e) => setCustomerId(e.target.value)}
												placeholder="Filter by customer ID"
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="history" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Export History</CardTitle>
									<CardDescription>
										Recent export operations
									</CardDescription>
								</CardHeader>
								<CardContent>
									{exportHistory.length === 0 ? (
										<div className="text-center py-8 text-muted-foreground">
											No export history available
										</div>
									) : (
										<div className="space-y-4">
											{exportHistory.map((history) => (
												<div
													key={history.id}
													className="flex items-center justify-between p-4 border rounded-lg"
												>
													<div className="flex items-center gap-3">
														{history.success ? (
															<CheckCircle className="h-5 w-5 text-green-500" />
														) : (
															<XCircle className="h-5 w-5 text-red-500" />
														)}
														<div>
															<div className="font-medium">
																{history.format.toUpperCase()} Export
															</div>
															<div className="text-sm text-muted-foreground">
																{new Date(history.exportedAt).toLocaleString()}
															</div>
														</div>
													</div>
													<div className="text-right">
														<div className="font-medium">{history.count} invoices</div>
														<div className="text-sm text-muted-foreground">
															{history.success ? 'Success' : 'Failed'}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					<div className="flex justify-end gap-3 mt-6">
						<Button variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button onClick={handleExport} disabled={isLoading || !selectedFormat}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Exporting...
								</>
							) : (
								<>
									<Download className="mr-2 h-4 w-4" />
									Export
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
