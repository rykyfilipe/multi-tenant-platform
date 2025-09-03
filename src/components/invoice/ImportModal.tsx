/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImportModalProps {
	isOpen: boolean;
	onClose: () => void;
	tenantId: string;
	onImportComplete?: (result: any) => void;
}

interface Provider {
	name: string;
	displayName: string;
	description: string;
	requiresApiKey: boolean;
	supportsFileUpload: boolean;
	supportsDateRange: boolean;
}

interface ImportResult {
	success: boolean;
	imported: number;
	updated: number;
	skipped: number;
	errors: number;
	summary: {
		created: any[];
		updated: any[];
		skipped: any[];
		errors: any[];
	};
}

export function ImportModal({ isOpen, onClose, tenantId, onImportComplete }: ImportModalProps) {
	const [providers, setProviders] = useState<Provider[]>([]);
	const [selectedProvider, setSelectedProvider] = useState<string>('');
	const [apiKey, setApiKey] = useState('');
	const [fileContent, setFileContent] = useState('');
	const [dateFrom, setDateFrom] = useState('');
	const [dateTo, setDateTo] = useState('');
	const [deduplicationStrategy, setDeduplicationStrategy] = useState<'external_id' | 'invoice_number_date_customer'>('external_id');
	const [skipDuplicates, setSkipDuplicates] = useState(true);
	const [createMissingCustomers, setCreateMissingCustomers] = useState(true);
	const [createMissingProducts, setCreateMissingProducts] = useState(true);
	const [isLoading, setIsLoading] = useState(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();

	useEffect(() => {
		if (isOpen) {
			fetchProviders();
		}
	}, [isOpen]);

	const fetchProviders = async () => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/invoices/import`);
			const data = await response.json();
			
			if (data.success) {
				setProviders(data.providers);
			} else {
				setError('Failed to load providers');
			}
		} catch (error) {
			console.error('Error fetching providers:', error);
			setError('Failed to load providers');
		}
	};

	const handleImport = async () => {
		if (!selectedProvider) {
			setError('Please select a provider');
			return;
		}

		const provider = providers.find(p => p.name === selectedProvider);
		if (!provider) {
			setError('Invalid provider selected');
			return;
		}

		if (provider.requiresApiKey && !apiKey) {
			setError('API key is required for this provider');
			return;
		}

		if (provider.supportsFileUpload && !fileContent) {
			setError('File content is required for this provider');
			return;
		}

		setIsLoading(true);
		setError(null);
		setImportResult(null);

		try {
			const requestBody: any = {
				provider: selectedProvider,
				deduplicationStrategy,
				skipDuplicates,
				createMissingCustomers,
				createMissingProducts,
			};

			if (provider.requiresApiKey) {
				requestBody.apiKey = apiKey;
			}

			if (provider.supportsFileUpload) {
				requestBody.fileContent = fileContent;
			}

			if (provider.supportsDateRange) {
				if (dateFrom) requestBody.dateFrom = dateFrom;
				if (dateTo) requestBody.dateTo = dateTo;
			}

			const response = await fetch(`/api/tenants/${tenantId}/invoices/import`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			});

			const data = await response.json();

			if (data.success) {
				setImportResult(data.result);
				toast({
					title: 'Import completed',
					description: `Imported ${data.result.imported} invoices, updated ${data.result.updated}, skipped ${data.result.skipped}`,
				});
				
				if (onImportComplete) {
					onImportComplete(data.result);
				}
			} else {
				setError(data.message || 'Import failed');
			}
		} catch (error) {
			console.error('Import error:', error);
			setError('Import failed. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (e) => {
				setFileContent(e.target?.result as string);
			};
			reader.readAsText(file);
		}
	};

	const resetForm = () => {
		setSelectedProvider('');
		setApiKey('');
		setFileContent('');
		setDateFrom('');
		setDateTo('');
		setDeduplicationStrategy('external_id');
		setSkipDuplicates(true);
		setCreateMissingCustomers(true);
		setCreateMissingProducts(true);
		setImportResult(null);
		setError(null);
	};

	const handleClose = () => {
		resetForm();
		onClose();
	};

	if (!isOpen) return null;

	const selectedProviderInfo = providers.find(p => p.name === selectedProvider);

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-background rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-foreground">Import Invoices</h2>
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

					{importResult && (
						<Card className="mb-6">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<CheckCircle className="h-5 w-5 text-green-500" />
									Import Results
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
									<div className="text-center">
										<div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
										<div className="text-sm text-muted-foreground">Imported</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
										<div className="text-sm text-muted-foreground">Updated</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
										<div className="text-sm text-muted-foreground">Skipped</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-red-600">{importResult.errors}</div>
										<div className="text-sm text-muted-foreground">Errors</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					<Tabs defaultValue="provider" className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="provider">Provider</TabsTrigger>
							<TabsTrigger value="options">Options</TabsTrigger>
						</TabsList>

						<TabsContent value="provider" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Select Provider</CardTitle>
									<CardDescription>
										Choose the source to import invoices from
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label htmlFor="provider">Provider</Label>
										<Select value={selectedProvider} onValueChange={setSelectedProvider}>
											<SelectTrigger>
												<SelectValue placeholder="Select a provider" />
											</SelectTrigger>
											<SelectContent>
												{providers.map((provider) => (
													<SelectItem key={provider.name} value={provider.name}>
														<div>
															<div className="font-medium">{provider.displayName}</div>
															<div className="text-sm text-muted-foreground">
																{provider.description}
															</div>
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									{selectedProviderInfo && (
										<div className="space-y-4">
											{selectedProviderInfo.requiresApiKey && (
												<div>
													<Label htmlFor="apiKey">API Key</Label>
													<Input
														id="apiKey"
														type="password"
														value={apiKey}
														onChange={(e) => setApiKey(e.target.value)}
														placeholder="Enter your API key"
													/>
												</div>
											)}

											{selectedProviderInfo.supportsFileUpload && (
												<div>
													<Label htmlFor="file">Upload File</Label>
													<Input
														id="file"
														type="file"
														accept=".csv,.json"
														onChange={handleFileUpload}
													/>
													{fileContent && (
														<div className="mt-2">
															<Label htmlFor="fileContent">File Content</Label>
															<Textarea
																id="fileContent"
																value={fileContent}
																onChange={(e) => setFileContent(e.target.value)}
																rows={10}
																placeholder="File content will appear here..."
															/>
														</div>
													)}
												</div>
											)}

											{selectedProviderInfo.supportsDateRange && (
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
											)}
										</div>
									)}
								</CardContent>
							</Card>
						</TabsContent>

						<TabsContent value="options" className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Import Options</CardTitle>
									<CardDescription>
										Configure how invoices should be imported
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<Label htmlFor="deduplicationStrategy">Deduplication Strategy</Label>
										<Select 
											value={deduplicationStrategy} 
											onValueChange={(value: string) => setDeduplicationStrategy(value as 'external_id' | 'invoice_number_date_customer')}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="external_id">
													External ID (Provider + External ID)
												</SelectItem>
												<SelectItem value="invoice_number_date_customer">
													Invoice Number + Date + Customer
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div>
												<Label htmlFor="skipDuplicates">Skip Duplicates</Label>
												<p className="text-sm text-muted-foreground">
													Skip invoices that already exist
												</p>
											</div>
											<Switch
												id="skipDuplicates"
												checked={skipDuplicates}
												onCheckedChange={setSkipDuplicates}
											/>
										</div>

										<div className="flex items-center justify-between">
											<div>
												<Label htmlFor="createMissingCustomers">Create Missing Customers</Label>
												<p className="text-sm text-muted-foreground">
													Automatically create customers that don't exist
												</p>
											</div>
											<Switch
												id="createMissingCustomers"
												checked={createMissingCustomers}
												onCheckedChange={setCreateMissingCustomers}
											/>
										</div>

										<div className="flex items-center justify-between">
											<div>
												<Label htmlFor="createMissingProducts">Create Missing Products</Label>
												<p className="text-sm text-muted-foreground">
													Automatically create products that don't exist
												</p>
											</div>
											<Switch
												id="createMissingProducts"
												checked={createMissingProducts}
												onCheckedChange={setCreateMissingProducts}
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>

					<div className="flex justify-end gap-3 mt-6">
						<Button variant="outline" onClick={handleClose}>
							Cancel
						</Button>
						<Button onClick={handleImport} disabled={isLoading || !selectedProvider}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Importing...
								</>
							) : (
								<>
									<Upload className="mr-2 h-4 w-4" />
									Import
								</>
							)}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
