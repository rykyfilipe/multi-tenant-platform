/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Edit, Trash2, Eye, Download, AlertCircle, CheckCircle, FileText, Palette, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InvoiceTemplateManagerProps {
	tenantId: string;
}

interface InvoiceTemplate {
	id: number;
	name: string;
	description: string;
	templateType: 'standard' | 'proforma' | 'credit_note' | 'quote';
	isDefault: boolean;
	headerHtml: string;
	footerHtml: string;
	bodyHtml: string;
	cssStyles: string;
	settings: {
		showLogo: boolean;
		showCompanyInfo: boolean;
		showCustomerInfo: boolean;
		showItemDetails: boolean;
		showTotals: boolean;
		showPaymentTerms: boolean;
		showNotes: boolean;
		pageOrientation: 'portrait' | 'landscape';
		pageSize: 'A4' | 'Letter' | 'Legal';
		marginTop: number;
		marginBottom: number;
		marginLeft: number;
		marginRight: number;
	};
	createdAt: string;
	updatedAt: string;
}

const defaultTemplates = [
	{
		name: 'Standard Invoice',
		description: 'Clean and professional invoice template',
		templateType: 'standard' as const,
		headerHtml: `
			<div class="invoice-header">
				<div class="company-info">
					<h1 class="company-name">{{company.name}}</h1>
					<p class="company-address">{{company.address}}</p>
					<p class="company-contact">{{company.phone}} | {{company.email}}</p>
				</div>
				<div class="invoice-title">
					<h2>INVOICE</h2>
					<p class="invoice-number">#{{invoice.number}}</p>
					<p class="invoice-date">Date: {{invoice.date}}</p>
				</div>
			</div>
		`,
		bodyHtml: `
			<div class="invoice-body">
				<div class="customer-info">
					<h3>Bill To:</h3>
					<p class="customer-name">{{customer.name}}</p>
					<p class="customer-address">{{customer.address}}</p>
					<p class="customer-contact">{{customer.phone}} | {{customer.email}}</p>
				</div>
				
				<div class="invoice-items">
					<table class="items-table">
						<thead>
							<tr>
								<th>Description</th>
								<th>Quantity</th>
								<th>Price</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody>
							{{#each items}}
							<tr>
								<td>{{description}}</td>
								<td>{{quantity}}</td>
								<td>{{price}}</td>
								<td>{{total}}</td>
							</tr>
							{{/each}}
						</tbody>
					</table>
				</div>
				
				<div class="invoice-totals">
					<div class="totals-row">
						<span>Subtotal:</span>
						<span>{{totals.subtotal}}</span>
					</div>
					<div class="totals-row">
						<span>Tax:</span>
						<span>{{totals.tax}}</span>
					</div>
					<div class="totals-row total">
						<span>Total:</span>
						<span>{{totals.grandTotal}}</span>
					</div>
				</div>
			</div>
		`,
		footerHtml: `
			<div class="invoice-footer">
				<p class="payment-terms">Payment Terms: {{invoice.paymentTerms}}</p>
				<p class="notes">{{invoice.notes}}</p>
			</div>
		`,
		cssStyles: `
			.invoice-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 2rem;
				padding-bottom: 1rem;
				border-bottom: 2px solid #e5e7eb;
			}
			
			.company-name {
				font-size: 1.5rem;
				font-weight: bold;
				color: #1f2937;
				margin-bottom: 0.5rem;
			}
			
			.invoice-title h2 {
				font-size: 2rem;
				font-weight: bold;
				color: #1f2937;
				margin: 0;
			}
			
			.invoice-number {
				font-size: 1.1rem;
				color: #6b7280;
				margin: 0.25rem 0;
			}
			
			.items-table {
				width: 100%;
				border-collapse: collapse;
				margin: 1rem 0;
			}
			
			.items-table th,
			.items-table td {
				padding: 0.75rem;
				text-align: left;
				border-bottom: 1px solid #e5e7eb;
			}
			
			.items-table th {
				background-color: #f9fafb;
				font-weight: 600;
			}
			
			.invoice-totals {
				margin-top: 1rem;
				text-align: right;
			}
			
			.totals-row {
				display: flex;
				justify-content: space-between;
				padding: 0.5rem 0;
			}
			
			.totals-row.total {
				font-weight: bold;
				font-size: 1.1rem;
				border-top: 2px solid #1f2937;
				padding-top: 0.75rem;
			}
			
			.invoice-footer {
				margin-top: 2rem;
				padding-top: 1rem;
				border-top: 1px solid #e5e7eb;
				font-size: 0.9rem;
				color: #6b7280;
			}
		`,
		settings: {
			showLogo: true,
			showCompanyInfo: true,
			showCustomerInfo: true,
			showItemDetails: true,
			showTotals: true,
			showPaymentTerms: true,
			showNotes: true,
			pageOrientation: 'portrait' as 'portrait' | 'landscape',
			pageSize: 'A4' as const,
			marginTop: 20,
			marginBottom: 20,
			marginLeft: 20,
			marginRight: 20,
		},
	},
	{
		name: 'Proforma Invoice',
		description: 'Professional proforma invoice template',
		templateType: 'proforma' as const,
		headerHtml: `
			<div class="invoice-header">
				<div class="company-info">
					<h1 class="company-name">{{company.name}}</h1>
					<p class="company-address">{{company.address}}</p>
					<p class="company-contact">{{company.phone}} | {{company.email}}</p>
				</div>
				<div class="invoice-title">
					<h2>PROFORMA INVOICE</h2>
					<p class="invoice-number">#{{invoice.number}}</p>
					<p class="invoice-date">Date: {{invoice.date}}</p>
				</div>
			</div>
		`,
		bodyHtml: `
			<div class="invoice-body">
				<div class="customer-info">
					<h3>Bill To:</h3>
					<p class="customer-name">{{customer.name}}</p>
					<p class="customer-address">{{customer.address}}</p>
					<p class="customer-contact">{{customer.phone}} | {{customer.email}}</p>
				</div>
				
				<div class="invoice-items">
					<table class="items-table">
						<thead>
							<tr>
								<th>Description</th>
								<th>Quantity</th>
								<th>Price</th>
								<th>Total</th>
							</tr>
						</thead>
						<tbody>
							{{#each items}}
							<tr>
								<td>{{description}}</td>
								<td>{{quantity}}</td>
								<td>{{price}}</td>
								<td>{{total}}</td>
							</tr>
							{{/each}}
						</tbody>
					</table>
				</div>
				
				<div class="invoice-totals">
					<div class="totals-row">
						<span>Subtotal:</span>
						<span>{{totals.subtotal}}</span>
					</div>
					<div class="totals-row">
						<span>Tax:</span>
						<span>{{totals.tax}}</span>
					</div>
					<div class="totals-row total">
						<span>Total:</span>
						<span>{{totals.grandTotal}}</span>
					</div>
				</div>
			</div>
		`,
		footerHtml: `
			<div class="invoice-footer">
				<p class="payment-terms">Payment Terms: {{invoice.paymentTerms}}</p>
				<p class="notes">{{invoice.notes}}</p>
				<p class="proforma-note">This is a proforma invoice and does not constitute a demand for payment.</p>
			</div>
		`,
		cssStyles: `
			.invoice-header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 2rem;
				padding-bottom: 1rem;
				border-bottom: 2px solid #3b82f6;
			}
			
			.company-name {
				font-size: 1.5rem;
				font-weight: bold;
				color: #1f2937;
				margin-bottom: 0.5rem;
			}
			
			.invoice-title h2 {
				font-size: 2rem;
				font-weight: bold;
				color: #3b82f6;
				margin: 0;
			}
			
			.invoice-number {
				font-size: 1.1rem;
				color: #6b7280;
				margin: 0.25rem 0;
			}
			
			.items-table {
				width: 100%;
				border-collapse: collapse;
				margin: 1rem 0;
			}
			
			.items-table th,
			.items-table td {
				padding: 0.75rem;
				text-align: left;
				border-bottom: 1px solid #e5e7eb;
			}
			
			.items-table th {
				background-color: #eff6ff;
				font-weight: 600;
				color: #1e40af;
			}
			
			.invoice-totals {
				margin-top: 1rem;
				text-align: right;
			}
			
			.totals-row {
				display: flex;
				justify-content: space-between;
				padding: 0.5rem 0;
			}
			
			.totals-row.total {
				font-weight: bold;
				font-size: 1.1rem;
				border-top: 2px solid #3b82f6;
				padding-top: 0.75rem;
			}
			
			.invoice-footer {
				margin-top: 2rem;
				padding-top: 1rem;
				border-top: 1px solid #e5e7eb;
				font-size: 0.9rem;
				color: #6b7280;
			}
			
			.proforma-note {
				font-style: italic;
				color: #dc2626;
				margin-top: 1rem;
			}
		`,
		settings: {
			showLogo: true,
			showCompanyInfo: true,
			showCustomerInfo: true,
			showItemDetails: true,
			showTotals: true,
			showPaymentTerms: true,
			showNotes: true,
			pageOrientation: 'portrait' as 'portrait' | 'landscape',
			pageSize: 'A4' as const,
			marginTop: 20,
			marginBottom: 20,
			marginLeft: 20,
			marginRight: 20,
		},
	},
];

export function InvoiceTemplateManager({ tenantId }: InvoiceTemplateManagerProps) {
	const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
	const { toast } = useToast();

	// Form state
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		templateType: 'standard' as 'standard' | 'proforma' | 'credit_note' | 'quote',
		headerHtml: '',
		footerHtml: '',
		bodyHtml: '',
		cssStyles: '',
		settings: {
			showLogo: true,
			showCompanyInfo: true,
			showCustomerInfo: true,
			showItemDetails: true,
			showTotals: true,
			showPaymentTerms: true,
			showNotes: true,
			pageOrientation: 'portrait' as 'portrait' | 'landscape',
			pageSize: 'A4' as 'A4' | 'Letter' | 'Legal',
			marginTop: 20,
			marginBottom: 20,
			marginLeft: 20,
			marginRight: 20,
		},
	});

	useEffect(() => {
		fetchTemplates();
	}, []);

	const fetchTemplates = async () => {
		try {
			setIsLoading(true);
			// In a real implementation, this would fetch from an API
			// For now, we'll use the default templates
			setTemplates(defaultTemplates.map((template, index) => ({
				...template,
				id: index + 1,
				isDefault: index === 0,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			})));
		} catch (error) {
			console.error('Error fetching templates:', error);
			setError('Failed to load invoice templates');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreate = async () => {
		if (!formData.name.trim()) {
			setError('Template name is required');
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			// In a real implementation, this would save to an API
			const newTemplate: InvoiceTemplate = {
				id: Date.now(),
				...formData,
				isDefault: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			setTemplates([...templates, newTemplate]);
			resetForm();
			setShowCreateForm(false);
			toast({
				title: 'Template created',
				description: `Invoice template "${formData.name}" created successfully`,
			});
		} catch (error) {
			console.error('Error creating template:', error);
			setError('Failed to create template');
		} finally {
			setIsCreating(false);
		}
	};

	const handleUpdate = async (id: number) => {
		if (!formData.name.trim()) {
			setError('Template name is required');
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			// In a real implementation, this would update via API
			const updatedTemplate: InvoiceTemplate = {
				...formData,
				id,
				isDefault: false,
				createdAt: templates.find(t => t.id === id)?.createdAt || new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			setTemplates(templates.map(t => t.id === id ? updatedTemplate : t));
			resetForm();
			setIsEditing(null);
			setShowCreateForm(false);
			toast({
				title: 'Template updated',
				description: `Invoice template "${formData.name}" updated successfully`,
			});
		} catch (error) {
			console.error('Error updating template:', error);
			setError('Failed to update template');
		} finally {
			setIsCreating(false);
		}
	};

	const handleDelete = async (id: number, templateName: string) => {
		if (!confirm(`Are you sure you want to delete the template "${templateName}"?`)) {
			return;
		}

		try {
			// In a real implementation, this would delete via API
			setTemplates(templates.filter(t => t.id !== id));
			toast({
				title: 'Template deleted',
				description: `Invoice template "${templateName}" deleted successfully`,
			});
		} catch (error) {
			console.error('Error deleting template:', error);
			setError('Failed to delete template');
		}
	};

	const handleSetDefault = async (id: number) => {
		try {
			// In a real implementation, this would update via API
			setTemplates(templates.map(t => ({
				...t,
				isDefault: t.id === id
			})));
			toast({
				title: 'Default template set',
				description: 'Template set as default successfully',
			});
		} catch (error) {
			console.error('Error setting default template:', error);
			setError('Failed to set default template');
		}
	};

	const resetForm = () => {
		setFormData({
			name: '',
			description: '',
			templateType: 'standard',
			headerHtml: '',
			footerHtml: '',
			bodyHtml: '',
			cssStyles: '',
			settings: {
				showLogo: true,
				showCompanyInfo: true,
				showCustomerInfo: true,
				showItemDetails: true,
				showTotals: true,
				showPaymentTerms: true,
				showNotes: true,
				pageOrientation: 'portrait',
				pageSize: 'A4' as 'A4' | 'Letter' | 'Legal',
				marginTop: 20,
				marginBottom: 20,
				marginLeft: 20,
				marginRight: 20,
			},
		});
	};

	const startEdit = (template: InvoiceTemplate) => {
		setFormData({
			name: template.name,
			description: template.description,
			templateType: template.templateType,
			headerHtml: template.headerHtml,
			footerHtml: template.footerHtml,
			bodyHtml: template.bodyHtml,
			cssStyles: template.cssStyles,
			settings: {
				...template.settings,
				pageSize: template.settings.pageSize as 'A4' | 'Letter' | 'Legal',
			},
		});
		setIsEditing(template.id);
		setShowCreateForm(true);
	};

	const cancelEdit = () => {
		resetForm();
		setIsEditing(null);
		setShowCreateForm(false);
	};

	const loadDefaultTemplate = (templateType: string) => {
		const defaultTemplate = defaultTemplates.find(t => t.templateType === templateType);
		if (defaultTemplate) {
			setFormData({
				name: `${defaultTemplate.name} (Custom)`,
				description: defaultTemplate.description,
				templateType: defaultTemplate.templateType as any,
				headerHtml: defaultTemplate.headerHtml,
				footerHtml: defaultTemplate.footerHtml,
				bodyHtml: defaultTemplate.bodyHtml,
				cssStyles: defaultTemplate.cssStyles,
				settings: {
					...defaultTemplate.settings,
					pageSize: defaultTemplate.settings.pageSize as 'A4' | 'Letter' | 'Legal',
				},
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<Loader2 className="h-8 w-8 animate-spin" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold text-foreground">Invoice Templates</h2>
					<p className="text-muted-foreground">
						Manage invoice templates and styling
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(true)}>
					<Plus className="mr-2 h-4 w-4" />
					New Template
				</Button>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{showCreateForm && (
				<Card>
					<CardHeader>
						<CardTitle>
							{isEditing ? 'Edit Template' : 'Create New Template'}
						</CardTitle>
						<CardDescription>
							Configure the invoice template
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="basic" className="w-full">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="basic">Basic</TabsTrigger>
								<TabsTrigger value="content">Content</TabsTrigger>
								<TabsTrigger value="styling">Styling</TabsTrigger>
								<TabsTrigger value="settings">Settings</TabsTrigger>
							</TabsList>

							<TabsContent value="basic" className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="name">Template Name</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e) => setFormData({ ...formData, name: e.target.value })}
											placeholder="e.g., Standard Invoice"
										/>
									</div>
									<div>
										<Label htmlFor="templateType">Template Type</Label>
										<Select
											value={formData.templateType}
											onValueChange={(value: string) => setFormData({ ...formData, templateType: value as any })}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="standard">Standard Invoice</SelectItem>
												<SelectItem value="proforma">Proforma Invoice</SelectItem>
												<SelectItem value="credit_note">Credit Note</SelectItem>
												<SelectItem value="quote">Quote</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div>
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) => setFormData({ ...formData, description: e.target.value })}
										placeholder="Template description..."
										rows={3}
									/>
								</div>

								<div>
									<Label>Load Default Template</Label>
									<div className="flex gap-2 mt-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => loadDefaultTemplate('standard')}
										>
											Standard
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => loadDefaultTemplate('proforma')}
										>
											Proforma
										</Button>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="content" className="space-y-4">
								<div>
									<Label htmlFor="headerHtml">Header HTML</Label>
									<Textarea
										id="headerHtml"
										value={formData.headerHtml}
										onChange={(e) => setFormData({ ...formData, headerHtml: e.target.value })}
										placeholder="Header HTML template..."
										rows={8}
										className="font-mono text-sm"
									/>
								</div>

								<div>
									<Label htmlFor="bodyHtml">Body HTML</Label>
									<Textarea
										id="bodyHtml"
										value={formData.bodyHtml}
										onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })}
										placeholder="Body HTML template..."
										rows={12}
										className="font-mono text-sm"
									/>
								</div>

								<div>
									<Label htmlFor="footerHtml">Footer HTML</Label>
									<Textarea
										id="footerHtml"
										value={formData.footerHtml}
										onChange={(e) => setFormData({ ...formData, footerHtml: e.target.value })}
										placeholder="Footer HTML template..."
										rows={6}
										className="font-mono text-sm"
									/>
								</div>
							</TabsContent>

							<TabsContent value="styling" className="space-y-4">
								<div>
									<Label htmlFor="cssStyles">CSS Styles</Label>
									<Textarea
										id="cssStyles"
										value={formData.cssStyles}
										onChange={(e) => setFormData({ ...formData, cssStyles: e.target.value })}
										placeholder="CSS styles for the template..."
										rows={15}
										className="font-mono text-sm"
									/>
								</div>
							</TabsContent>

							<TabsContent value="settings" className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="pageOrientation">Page Orientation</Label>
										<Select
											value={formData.settings.pageOrientation}
											onValueChange={(value: string) => setFormData({
												...formData,
												settings: { ...formData.settings, pageOrientation: value as any }
											})}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="portrait">Portrait</SelectItem>
												<SelectItem value="landscape">Landscape</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div>
										<Label htmlFor="pageSize">Page Size</Label>
										<Select
											value={formData.settings.pageSize}
											onValueChange={(value: string) => setFormData({
												...formData,
												settings: { ...formData.settings, pageSize: value as any }
											})}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="A4">A4</SelectItem>
												<SelectItem value="Letter">Letter</SelectItem>
												<SelectItem value="Legal">Legal</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="showLogo">Show Logo</Label>
											<p className="text-sm text-muted-foreground">
												Display company logo in header
											</p>
										</div>
										<Switch
											id="showLogo"
											checked={formData.settings.showLogo}
											onCheckedChange={(checked) => setFormData({
												...formData,
												settings: { ...formData.settings, showLogo: checked }
											})}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="showCompanyInfo">Show Company Info</Label>
											<p className="text-sm text-muted-foreground">
												Display company information
											</p>
										</div>
										<Switch
											id="showCompanyInfo"
											checked={formData.settings.showCompanyInfo}
											onCheckedChange={(checked) => setFormData({
												...formData,
												settings: { ...formData.settings, showCompanyInfo: checked }
											})}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="showCustomerInfo">Show Customer Info</Label>
											<p className="text-sm text-muted-foreground">
												Display customer information
											</p>
										</div>
										<Switch
											id="showCustomerInfo"
											checked={formData.settings.showCustomerInfo}
											onCheckedChange={(checked) => setFormData({
												...formData,
												settings: { ...formData.settings, showCustomerInfo: checked }
											})}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="showItemDetails">Show Item Details</Label>
											<p className="text-sm text-muted-foreground">
												Display detailed item information
											</p>
										</div>
										<Switch
											id="showItemDetails"
											checked={formData.settings.showItemDetails}
											onCheckedChange={(checked) => setFormData({
												...formData,
												settings: { ...formData.settings, showItemDetails: checked }
											})}
										/>
									</div>

									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="showTotals">Show Totals</Label>
											<p className="text-sm text-muted-foreground">
												Display invoice totals
											</p>
										</div>
										<Switch
											id="showTotals"
											checked={formData.settings.showTotals}
											onCheckedChange={(checked) => setFormData({
												...formData,
												settings: { ...formData.settings, showTotals: checked }
											})}
										/>
									</div>
								</div>
							</TabsContent>
						</Tabs>

						<div className="flex justify-end gap-3 mt-6">
							<Button variant="outline" onClick={cancelEdit}>
								Cancel
							</Button>
							<Button
								onClick={isEditing ? () => handleUpdate(isEditing) : handleCreate}
								disabled={isCreating}
							>
								{isCreating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{isEditing ? 'Updating...' : 'Creating...'}
									</>
								) : (
									<>
										<CheckCircle className="mr-2 h-4 w-4" />
										{isEditing ? 'Update' : 'Create'}
									</>
								)}
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{templates.map((template) => (
					<Card key={template.id} className="relative">
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="text-lg">{template.name}</CardTitle>
								{template.isDefault && (
									<Badge variant="default">Default</Badge>
								)}
							</div>
							<CardDescription>{template.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<FileText className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										{template.templateType.replace('_', ' ').toUpperCase()}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Palette className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										{template.settings.pageSize} {template.settings.pageOrientation}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Settings className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm text-muted-foreground">
										{Object.values(template.settings).filter(Boolean).length} settings enabled
									</span>
								</div>
							</div>

							<div className="flex gap-2 mt-4">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setSelectedTemplate(template)}
								>
									<Eye className="h-4 w-4" />
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => startEdit(template)}
								>
									<Edit className="h-4 w-4" />
								</Button>
								{!template.isDefault && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDelete(template.id, template.name)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
								{!template.isDefault && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleSetDefault(template.id)}
									>
										<CheckCircle className="h-4 w-4" />
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
