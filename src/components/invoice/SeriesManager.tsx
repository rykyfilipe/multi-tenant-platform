/** @format */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SeriesManagerProps {
	tenantId: string;
}

interface InvoiceSeries {
	id: number;
	series: string;
	prefix: string;
	suffix: string;
	separator: string;
	includeYear: boolean;
	includeMonth: boolean;
	resetYearly: boolean;
	currentNumber: number;
}

export function SeriesManager({ tenantId }: SeriesManagerProps) {
	const [series, setSeries] = useState<InvoiceSeries[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const { toast } = useToast();

	// Form state
	const [formData, setFormData] = useState({
		series: '',
		prefix: '',
		suffix: '',
		separator: '-',
		includeYear: false,
		includeMonth: false,
		resetYearly: false,
		startNumber: 1,
	});

	useEffect(() => {
		fetchSeries();
	}, []);

	const fetchSeries = async () => {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/tenants/${tenantId}/invoices/series`);
			const data = await response.json();
			
			if (data.success) {
				setSeries(data.series);
			} else {
				setError('Failed to load invoice series');
			}
		} catch (error) {
			console.error('Error fetching series:', error);
			setError('Failed to load invoice series');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreate = async () => {
		if (!formData.series.trim()) {
			setError('Series name is required');
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			const response = await fetch(`/api/tenants/${tenantId}/invoices/series`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (data.success) {
				setSeries([...series, data.series]);
				resetForm();
				setShowCreateForm(false);
				toast({
					title: 'Series created',
					description: `Invoice series "${formData.series}" created successfully`,
				});
			} else {
				setError(data.message || 'Failed to create series');
			}
		} catch (error) {
			console.error('Error creating series:', error);
			setError('Failed to create series');
		} finally {
			setIsCreating(false);
		}
	};

	const handleUpdate = async (id: number) => {
		if (!formData.series.trim()) {
			setError('Series name is required');
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			const response = await fetch(`/api/tenants/${tenantId}/invoices/series`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					id,
					...formData,
				}),
			});

			const data = await response.json();

			if (data.success) {
				setSeries(series.map(s => s.id === id ? data.series : s));
				resetForm();
				setIsEditing(null);
				toast({
					title: 'Series updated',
					description: `Invoice series "${formData.series}" updated successfully`,
				});
			} else {
				setError(data.message || 'Failed to update series');
			}
		} catch (error) {
			console.error('Error updating series:', error);
			setError('Failed to update series');
		} finally {
			setIsCreating(false);
		}
	};

	const handleDelete = async (id: number, seriesName: string) => {
		if (!confirm(`Are you sure you want to delete the series "${seriesName}"?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/tenants/${tenantId}/invoices/series`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ id }),
			});

			const data = await response.json();

			if (data.success) {
				setSeries(series.filter(s => s.id !== id));
				toast({
					title: 'Series deleted',
					description: `Invoice series "${seriesName}" deleted successfully`,
				});
			} else {
				setError(data.message || 'Failed to delete series');
			}
		} catch (error) {
			console.error('Error deleting series:', error);
			setError('Failed to delete series');
		}
	};

	const resetForm = () => {
		setFormData({
			series: '',
			prefix: '',
			suffix: '',
			separator: '-',
			includeYear: false,
			includeMonth: false,
			resetYearly: false,
			startNumber: 1,
		});
	};

	const startEdit = (seriesItem: InvoiceSeries) => {
		setFormData({
			series: seriesItem.series,
			prefix: seriesItem.prefix,
			suffix: seriesItem.suffix,
			separator: seriesItem.separator,
			includeYear: seriesItem.includeYear,
			includeMonth: seriesItem.includeMonth,
			resetYearly: seriesItem.resetYearly,
			startNumber: seriesItem.currentNumber,
		});
		setIsEditing(seriesItem.id);
		setShowCreateForm(true);
	};

	const cancelEdit = () => {
		resetForm();
		setIsEditing(null);
		setShowCreateForm(false);
	};

	const generateExampleNumber = (seriesItem: InvoiceSeries) => {
		let number = seriesItem.prefix;
		if (seriesItem.includeYear) {
			number += new Date().getFullYear();
		}
		if (seriesItem.includeMonth) {
			number += String(new Date().getMonth() + 1).padStart(2, '0');
		}
		if (number && seriesItem.separator) {
			number += seriesItem.separator;
		}
		number += String(seriesItem.currentNumber + 1).padStart(4, '0');
		if (seriesItem.suffix) {
			number += seriesItem.suffix;
		}
		return number;
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
					<h2 className="text-2xl font-bold text-foreground">Invoice Series Manager</h2>
					<p className="text-muted-foreground">
						Manage invoice numbering series and configurations
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(true)}>
					<Plus className="mr-2 h-4 w-4" />
					New Series
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
							{isEditing ? 'Edit Series' : 'Create New Series'}
						</CardTitle>
						<CardDescription>
							Configure the invoice numbering series
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="series">Series Name</Label>
								<Input
									id="series"
									value={formData.series}
									onChange={(e) => setFormData({ ...formData, series: e.target.value })}
									placeholder="e.g., INV, QUO, CRN"
								/>
							</div>
							<div>
								<Label htmlFor="startNumber">Start Number</Label>
								<Input
									id="startNumber"
									type="number"
									min="1"
									value={formData.startNumber}
									onChange={(e) => setFormData({ ...formData, startNumber: Math.max(1, parseInt(e.target.value) || 1) })}
								/>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4">
							<div>
								<Label htmlFor="prefix">Prefix</Label>
								<Input
									id="prefix"
									value={formData.prefix}
									onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
									placeholder="e.g., INV"
								/>
							</div>
							<div>
								<Label htmlFor="separator">Separator</Label>
								<Input
									id="separator"
									value={formData.separator}
									onChange={(e) => setFormData({ ...formData, separator: e.target.value })}
									placeholder="e.g., -"
								/>
							</div>
							<div>
								<Label htmlFor="suffix">Suffix</Label>
								<Input
									id="suffix"
									value={formData.suffix}
									onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
									placeholder="e.g., /2024"
								/>
							</div>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<Label htmlFor="includeYear">Include Year</Label>
									<p className="text-sm text-muted-foreground">
										Add current year to the invoice number
									</p>
								</div>
								<Switch
									id="includeYear"
									checked={formData.includeYear}
									onCheckedChange={(checked) => setFormData({ ...formData, includeYear: checked })}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<Label htmlFor="includeMonth">Include Month</Label>
									<p className="text-sm text-muted-foreground">
										Add current month to the invoice number
									</p>
								</div>
								<Switch
									id="includeMonth"
									checked={formData.includeMonth}
									onCheckedChange={(checked) => setFormData({ ...formData, includeMonth: checked })}
								/>
							</div>

							<div className="flex items-center justify-between">
								<div>
									<Label htmlFor="resetYearly">Reset Yearly</Label>
									<p className="text-sm text-muted-foreground">
										Reset numbering at the beginning of each year
									</p>
								</div>
								<Switch
									id="resetYearly"
									checked={formData.resetYearly}
									onCheckedChange={(checked) => setFormData({ ...formData, resetYearly: checked })}
								/>
							</div>
						</div>

						<div className="flex justify-end gap-3">
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

			<Card>
				<CardHeader>
					<CardTitle>Invoice Series</CardTitle>
					<CardDescription>
						Current invoice numbering series and their configurations
					</CardDescription>
				</CardHeader>
				<CardContent>
					{series.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No invoice series configured
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Series</TableHead>
									<TableHead>Configuration</TableHead>
									<TableHead>Example</TableHead>
									<TableHead>Current Number</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{series.map((seriesItem) => (
									<TableRow key={seriesItem.id}>
										<TableCell className="font-medium">{seriesItem.series}</TableCell>
										<TableCell>
											<div className="text-sm">
												<div>Prefix: {seriesItem.prefix || 'None'}</div>
												<div>Separator: {seriesItem.separator}</div>
												<div>Suffix: {seriesItem.suffix || 'None'}</div>
												<div className="flex gap-2 mt-1">
													{seriesItem.includeYear && (
														<span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
															Year
														</span>
													)}
													{seriesItem.includeMonth && (
														<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
															Month
														</span>
													)}
													{seriesItem.resetYearly && (
														<span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
															Reset Yearly
														</span>
													)}
												</div>
											</div>
										</TableCell>
										<TableCell className="font-mono text-sm">
											{generateExampleNumber(seriesItem)}
										</TableCell>
										<TableCell>{seriesItem.currentNumber}</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => startEdit(seriesItem)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDelete(seriesItem.id, seriesItem.series)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
