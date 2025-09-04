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
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Plus, Edit, Trash2, Play, Pause, Settings, Clock, Calendar as CalendarIcon, AlertCircle, CheckCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InvoiceAutomationProps {
	tenantId: string;
}

interface AutomationRule {
	id: number;
	name: string;
	description: string;
	isActive: boolean;
	triggerType: 'schedule' | 'event' | 'condition';
	triggerConfig: {
		schedule?: {
			frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
			time: string;
			dayOfWeek?: number;
			dayOfMonth?: number;
			month?: number;
		};
		event?: {
			eventType: 'invoice_created' | 'invoice_paid' | 'invoice_overdue' | 'customer_created';
		};
		condition?: {
			field: string;
			operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
			value: string;
		};
	};
	actionType: 'send_email' | 'create_invoice' | 'update_status' | 'send_notification' | 'webhook';
	actionConfig: {
		email?: {
			to: string[];
			subject: string;
			template: string;
		};
		createInvoice?: {
			templateId: number;
			customerId?: number;
			amount?: number;
			description?: string;
		};
		updateStatus?: {
			status: string;
		};
		notification?: {
			message: string;
			channels: string[];
		};
		webhook?: {
			url: string;
			method: 'GET' | 'POST' | 'PUT' | 'DELETE';
			headers: Record<string, string>;
			body: string;
		};
	};
	conditions: {
		field: string;
		operator: string;
		value: string;
	}[];
	createdAt: string;
	updatedAt: string;
	lastRun?: string;
	nextRun?: string;
	runCount: number;
	successCount: number;
	errorCount: number;
}

const defaultRules: AutomationRule[] = [
	{
		id: 1,
		name: 'Monthly Recurring Invoices',
		description: 'Automatically create monthly recurring invoices for subscription customers',
		isActive: true,
		triggerType: 'schedule',
		triggerConfig: {
			schedule: {
				frequency: 'monthly',
				time: '09:00',
				dayOfMonth: 1,
			},
		},
		actionType: 'create_invoice',
		actionConfig: {
			createInvoice: {
				templateId: 1,
				amount: 100,
				description: 'Monthly subscription fee',
			},
		},
		conditions: [
			{
				field: 'customer.subscription_type',
				operator: 'equals',
				value: 'monthly',
			},
		],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		lastRun: new Date(Date.now() - 86400000).toISOString(),
		nextRun: new Date(Date.now() + 86400000).toISOString(),
		runCount: 12,
		successCount: 11,
		errorCount: 1,
	},
	{
		id: 2,
		name: 'Overdue Invoice Reminder',
		description: 'Send email reminders for overdue invoices',
		isActive: true,
		triggerType: 'schedule',
		triggerConfig: {
			schedule: {
				frequency: 'daily',
				time: '10:00',
			},
		},
		actionType: 'send_email',
		actionConfig: {
			email: {
				to: ['customer.email'],
				subject: 'Invoice Overdue Reminder',
				template: 'overdue_reminder',
			},
		},
		conditions: [
			{
				field: 'invoice.status',
				operator: 'equals',
				value: 'overdue',
			},
			{
				field: 'invoice.due_date',
				operator: 'less_than',
				value: 'today',
			},
		],
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		lastRun: new Date(Date.now() - 3600000).toISOString(),
		nextRun: new Date(Date.now() + 82800000).toISOString(),
		runCount: 30,
		successCount: 28,
		errorCount: 2,
	},
];

export function InvoiceAutomation({ tenantId }: InvoiceAutomationProps) {
	const [rules, setRules] = useState<AutomationRule[]>(defaultRules);
	const [isLoading, setIsLoading] = useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [isEditing, setIsEditing] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
	const { toast } = useToast();

	// Form state
	const [formData, setFormData] = useState({
		name: '',
		description: '',
		isActive: true,
		triggerType: 'schedule' as const,
		triggerConfig: {
			schedule: {
				frequency: 'daily' as const,
				time: '09:00',
				dayOfWeek: 1,
				dayOfMonth: 1,
				month: 1,
			},
			event: {
				eventType: 'invoice_created' as const,
			},
			condition: {
				field: '',
				operator: 'equals' as const,
				value: '',
			},
		},
		actionType: 'send_email' as const,
		actionConfig: {
			email: {
				to: [],
				subject: '',
				template: '',
			},
			createInvoice: {
				templateId: 1,
				customerId: 0,
				amount: 0,
				description: '',
			},
			updateStatus: {
				status: '',
			},
			notification: {
				message: '',
				channels: [],
			},
			webhook: {
				url: '',
				method: 'POST' as const,
				headers: {},
				body: '',
			},
		},
		conditions: [] as { field: string; operator: string; value: string }[],
	});

	useEffect(() => {
		fetchRules();
	}, []);

	const fetchRules = async () => {
		try {
			setIsLoading(true);
			// In a real implementation, this would fetch from an API
			setRules(defaultRules);
		} catch (error) {
			console.error('Error fetching rules:', error);
			setError('Failed to load automation rules');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreate = async () => {
		if (!formData.name.trim()) {
			setError('Rule name is required');
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			// In a real implementation, this would save to an API
			const newRule: AutomationRule = {
				id: Date.now(),
				...formData,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				runCount: 0,
				successCount: 0,
				errorCount: 0,
			};

			setRules([...rules, newRule]);
			resetForm();
			setShowCreateForm(false);
			toast({
				title: 'Rule created',
				description: `Automation rule "${formData.name}" created successfully`,
			});
		} catch (error) {
			console.error('Error creating rule:', error);
			setError('Failed to create rule');
		} finally {
			setIsCreating(false);
		}
	};

	const handleUpdate = async (id: number) => {
		if (!formData.name.trim()) {
			setError('Rule name is required');
			return;
		}

		setIsCreating(true);
		setError(null);

		try {
			// In a real implementation, this would update via API
			const updatedRule: AutomationRule = {
				...formData,
				id,
				createdAt: rules.find(r => r.id === id)?.createdAt || new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				runCount: rules.find(r => r.id === id)?.runCount || 0,
				successCount: rules.find(r => r.id === id)?.successCount || 0,
				errorCount: rules.find(r => r.id === id)?.errorCount || 0,
			};

			setRules(rules.map(r => r.id === id ? updatedRule : r));
			resetForm();
			setIsEditing(null);
			setShowCreateForm(false);
			toast({
				title: 'Rule updated',
				description: `Automation rule "${formData.name}" updated successfully`,
			});
		} catch (error) {
			console.error('Error updating rule:', error);
			setError('Failed to update rule');
		} finally {
			setIsCreating(false);
		}
	};

	const handleDelete = async (id: number, ruleName: string) => {
		if (!confirm(`Are you sure you want to delete the rule "${ruleName}"?`)) {
			return;
		}

		try {
			// In a real implementation, this would delete via API
			setRules(rules.filter(r => r.id !== id));
			toast({
				title: 'Rule deleted',
				description: `Automation rule "${ruleName}" deleted successfully`,
			});
		} catch (error) {
			console.error('Error deleting rule:', error);
			setError('Failed to delete rule');
		}
	};

	const handleToggleActive = async (id: number) => {
		try {
			// In a real implementation, this would update via API
			setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
			toast({
				title: 'Rule updated',
				description: 'Rule status updated successfully',
			});
		} catch (error) {
			console.error('Error toggling rule:', error);
			setError('Failed to update rule status');
		}
	};

	const resetForm = () => {
		setFormData({
			name: '',
			description: '',
			isActive: true,
			triggerType: 'schedule',
			triggerConfig: {
				schedule: {
					frequency: 'daily',
					time: '09:00',
					dayOfWeek: 1,
					dayOfMonth: 1,
					month: 1,
				},
				event: {
					eventType: 'invoice_created',
				},
				condition: {
					field: '',
					operator: 'equals',
					value: '',
				},
			},
			actionType: 'send_email',
			actionConfig: {
				email: {
					to: [],
					subject: '',
					template: '',
				},
				createInvoice: {
					templateId: 1,
					customerId: 0,
					amount: 0,
					description: '',
				},
				updateStatus: {
					status: '',
				},
				notification: {
					message: '',
					channels: [],
				},
				webhook: {
					url: '',
					method: 'POST',
					headers: {},
					body: '',
				},
			},
			conditions: [],
		});
	};

	const startEdit = (rule: AutomationRule) => {
		setFormData({
			name: rule.name,
			description: rule.description,
			isActive: rule.isActive,
			triggerType: rule.triggerType,
			triggerConfig: rule.triggerConfig,
			actionType: rule.actionType,
			actionConfig: rule.actionConfig,
			conditions: rule.conditions,
		});
		setIsEditing(rule.id);
		setShowCreateForm(true);
	};

	const cancelEdit = () => {
		resetForm();
		setIsEditing(null);
		setShowCreateForm(false);
	};

	const addCondition = () => {
		setFormData({
			...formData,
			conditions: [...formData.conditions, { field: '', operator: 'equals', value: '' }],
		});
	};

	const removeCondition = (index: number) => {
		setFormData({
			...formData,
			conditions: formData.conditions.filter((_, i) => i !== index),
		});
	};

	const updateCondition = (index: number, field: string, value: string) => {
		const newConditions = [...formData.conditions];
		newConditions[index] = { ...newConditions[index], [field]: value };
		setFormData({ ...formData, conditions: newConditions });
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
					<h2 className="text-2xl font-bold text-foreground">Invoice Automation</h2>
					<p className="text-muted-foreground">
						Automate invoice creation, reminders, and notifications
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(true)}>
					<Plus className="mr-2 h-4 w-4" />
					New Rule
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
							{isEditing ? 'Edit Automation Rule' : 'Create New Automation Rule'}
						</CardTitle>
						<CardDescription>
							Configure automated actions for invoices
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Tabs defaultValue="basic" className="w-full">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="basic">Basic</TabsTrigger>
								<TabsTrigger value="trigger">Trigger</TabsTrigger>
								<TabsTrigger value="action">Action</TabsTrigger>
								<TabsTrigger value="conditions">Conditions</TabsTrigger>
							</TabsList>

							<TabsContent value="basic" className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<Label htmlFor="name">Rule Name</Label>
										<Input
											id="name"
											value={formData.name}
											onChange={(e) => setFormData({ ...formData, name: e.target.value })}
											placeholder="e.g., Monthly Recurring Invoices"
										/>
									</div>
									<div className="flex items-center justify-between">
										<div>
											<Label htmlFor="isActive">Active</Label>
											<p className="text-sm text-muted-foreground">
												Enable or disable this rule
											</p>
										</div>
										<Switch
											id="isActive"
											checked={formData.isActive}
											onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) => setFormData({ ...formData, description: e.target.value })}
										placeholder="Describe what this rule does..."
										rows={3}
									/>
								</div>
							</TabsContent>

							<TabsContent value="trigger" className="space-y-4">
								<div>
									<Label htmlFor="triggerType">Trigger Type</Label>
									<Select
										value={formData.triggerType}
										onValueChange={(value: string) => setFormData({ ...formData, triggerType: value as any })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="schedule">Schedule</SelectItem>
											<SelectItem value="event">Event</SelectItem>
											<SelectItem value="condition">Condition</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{formData.triggerType === 'schedule' && (
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="frequency">Frequency</Label>
												<Select
													value={formData.triggerConfig.schedule?.frequency}
													onValueChange={(value: string) => setFormData({
														...formData,
														triggerConfig: {
															...formData.triggerConfig,
															schedule: { ...formData.triggerConfig.schedule!, frequency: value as any }
														}
													})}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="daily">Daily</SelectItem>
														<SelectItem value="weekly">Weekly</SelectItem>
														<SelectItem value="monthly">Monthly</SelectItem>
														<SelectItem value="yearly">Yearly</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label htmlFor="time">Time</Label>
												<Input
													id="time"
													type="time"
													value={formData.triggerConfig.schedule?.time}
													onChange={(e) => setFormData({
														...formData,
														triggerConfig: {
															...formData.triggerConfig,
															schedule: { ...formData.triggerConfig.schedule!, time: e.target.value }
														}
													})}
												/>
											</div>
										</div>

										{formData.triggerConfig.schedule?.frequency === 'weekly' && (
											<div>
												<Label htmlFor="dayOfWeek">Day of Week</Label>
												<Select
													value={formData.triggerConfig.schedule?.dayOfWeek?.toString()}
													onValueChange={(value: string) => setFormData({
														...formData,
														triggerConfig: {
															...formData.triggerConfig,
															schedule: { ...formData.triggerConfig.schedule!, dayOfWeek: parseInt(value) }
														}
													})}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="1">Monday</SelectItem>
														<SelectItem value="2">Tuesday</SelectItem>
														<SelectItem value="3">Wednesday</SelectItem>
														<SelectItem value="4">Thursday</SelectItem>
														<SelectItem value="5">Friday</SelectItem>
														<SelectItem value="6">Saturday</SelectItem>
														<SelectItem value="0">Sunday</SelectItem>
													</SelectContent>
												</Select>
											</div>
										)}

										{formData.triggerConfig.schedule?.frequency === 'monthly' && (
											<div>
												<Label htmlFor="dayOfMonth">Day of Month</Label>
												<Input
													id="dayOfMonth"
													type="number"
													min="1"
													max="31"
													value={formData.triggerConfig.schedule?.dayOfMonth}
													onChange={(e) => setFormData({
														...formData,
														triggerConfig: {
															...formData.triggerConfig,
															schedule: { ...formData.triggerConfig.schedule!, dayOfMonth: parseInt(e.target.value) }
														}
													})}
												/>
											</div>
										)}
									</div>
								)}

								{formData.triggerType === 'event' && (
									<div>
										<Label htmlFor="eventType">Event Type</Label>
										<Select
											value={formData.triggerConfig.event?.eventType}
											onValueChange={(value: string) => setFormData({
												...formData,
												triggerConfig: {
													...formData.triggerConfig,
													event: { ...formData.triggerConfig.event!, eventType: value as any }
												}
											})}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="invoice_created">Invoice Created</SelectItem>
												<SelectItem value="invoice_paid">Invoice Paid</SelectItem>
												<SelectItem value="invoice_overdue">Invoice Overdue</SelectItem>
												<SelectItem value="customer_created">Customer Created</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}

								{formData.triggerType === 'condition' && (
									<div className="space-y-4">
										<div className="grid grid-cols-3 gap-4">
											<div>
												<Label htmlFor="conditionField">Field</Label>
												<Input
													id="conditionField"
													value={formData.triggerConfig.condition?.field}
													onChange={(e) => setFormData({
														...formData,
														triggerConfig: {
															...formData.triggerConfig,
															condition: { ...formData.triggerConfig.condition!, field: e.target.value }
														}
													})}
													placeholder="e.g., invoice.status"
												/>
											</div>
											<div>
												<Label htmlFor="conditionOperator">Operator</Label>
												<Select
													value={formData.triggerConfig.condition?.operator}
													onValueChange={(value: string) => setFormData({
														...formData,
														triggerConfig: {
															...formData.triggerConfig,
															condition: { ...formData.triggerConfig.condition!, operator: value as any }
														}
													})}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="equals">Equals</SelectItem>
														<SelectItem value="not_equals">Not Equals</SelectItem>
														<SelectItem value="greater_than">Greater Than</SelectItem>
														<SelectItem value="less_than">Less Than</SelectItem>
														<SelectItem value="contains">Contains</SelectItem>
													</SelectContent>
												</Select>
											</div>
											<div>
												<Label htmlFor="conditionValue">Value</Label>
												<Input
													id="conditionValue"
													value={formData.triggerConfig.condition?.value}
													onChange={(e) => setFormData({
														...formData,
														triggerConfig: {
															...formData.triggerConfig,
															condition: { ...formData.triggerConfig.condition!, value: e.target.value }
														}
													})}
													placeholder="e.g., overdue"
												/>
											</div>
										</div>
									</div>
								)}
							</TabsContent>

							<TabsContent value="action" className="space-y-4">
								<div>
									<Label htmlFor="actionType">Action Type</Label>
									<Select
										value={formData.actionType}
										onValueChange={(value: string) => setFormData({ ...formData, actionType: value as any })}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="send_email">Send Email</SelectItem>
											<SelectItem value="create_invoice">Create Invoice</SelectItem>
											<SelectItem value="update_status">Update Status</SelectItem>
											<SelectItem value="send_notification">Send Notification</SelectItem>
											<SelectItem value="webhook">Webhook</SelectItem>
										</SelectContent>
									</Select>
								</div>

								{formData.actionType === 'send_email' && (
									<div className="space-y-4">
										<div>
											<Label htmlFor="emailTo">To (comma-separated)</Label>
											<Input
												id="emailTo"
												value={formData.actionConfig.email?.to.join(', ')}
												onChange={(e) => setFormData({
													...formData,
													actionConfig: {
														...formData.actionConfig,
														email: { ...formData.actionConfig.email!, to: e.target.value.split(',').map(s => s.trim()) }
													}
												})}
												placeholder="customer.email, admin@company.com"
											/>
										</div>
										<div>
											<Label htmlFor="emailSubject">Subject</Label>
											<Input
												id="emailSubject"
												value={formData.actionConfig.email?.subject}
												onChange={(e) => setFormData({
													...formData,
													actionConfig: {
														...formData.actionConfig,
														email: { ...formData.actionConfig.email!, subject: e.target.value }
													}
												})}
												placeholder="Invoice {{invoice.number}} is overdue"
											/>
										</div>
										<div>
											<Label htmlFor="emailTemplate">Template</Label>
											<Input
												id="emailTemplate"
												value={formData.actionConfig.email?.template}
												onChange={(e) => setFormData({
													...formData,
													actionConfig: {
														...formData.actionConfig,
														email: { ...formData.actionConfig.email!, template: e.target.value }
													}
												})}
												placeholder="overdue_reminder"
											/>
										</div>
									</div>
								)}

								{formData.actionType === 'create_invoice' && (
									<div className="space-y-4">
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="invoiceTemplate">Template ID</Label>
												<Input
													id="invoiceTemplate"
													type="number"
													value={formData.actionConfig.createInvoice?.templateId}
													onChange={(e) => setFormData({
														...formData,
														actionConfig: {
															...formData.actionConfig,
															createInvoice: { ...formData.actionConfig.createInvoice!, templateId: parseInt(e.target.value) }
														}
													})}
												/>
											</div>
											<div>
												<Label htmlFor="invoiceAmount">Amount</Label>
												<Input
													id="invoiceAmount"
													type="number"
													step="0.01"
													value={formData.actionConfig.createInvoice?.amount}
													onChange={(e) => setFormData({
														...formData,
														actionConfig: {
															...formData.actionConfig,
															createInvoice: { ...formData.actionConfig.createInvoice!, amount: parseFloat(e.target.value) }
														}
													})}
												/>
											</div>
										</div>
										<div>
											<Label htmlFor="invoiceDescription">Description</Label>
											<Textarea
												id="invoiceDescription"
												value={formData.actionConfig.createInvoice?.description}
												onChange={(e) => setFormData({
													...formData,
													actionConfig: {
														...formData.actionConfig,
														createInvoice: { ...formData.actionConfig.createInvoice!, description: e.target.value }
													}
												})}
												placeholder="Monthly subscription fee"
											/>
										</div>
									</div>
								)}

								{formData.actionType === 'update_status' && (
									<div>
										<Label htmlFor="newStatus">New Status</Label>
										<Select
											value={formData.actionConfig.updateStatus?.status}
											onValueChange={(value: string) => setFormData({
												...formData,
												actionConfig: {
													...formData.actionConfig,
													updateStatus: { ...formData.actionConfig.updateStatus!, status: value }
												}
											})}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="draft">Draft</SelectItem>
												<SelectItem value="issued">Issued</SelectItem>
												<SelectItem value="paid">Paid</SelectItem>
												<SelectItem value="overdue">Overdue</SelectItem>
												<SelectItem value="cancelled">Cancelled</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}

								{formData.actionType === 'webhook' && (
									<div className="space-y-4">
										<div>
											<Label htmlFor="webhookUrl">Webhook URL</Label>
											<Input
												id="webhookUrl"
												value={formData.actionConfig.webhook?.url}
												onChange={(e) => setFormData({
													...formData,
													actionConfig: {
														...formData.actionConfig,
														webhook: { ...formData.actionConfig.webhook!, url: e.target.value }
													}
												})}
												placeholder="https://api.example.com/webhook"
											/>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="webhookMethod">Method</Label>
												<Select
													value={formData.actionConfig.webhook?.method}
													onValueChange={(value: string) => setFormData({
														...formData,
														actionConfig: {
															...formData.actionConfig,
															webhook: { ...formData.actionConfig.webhook!, method: value as any }
														}
													})}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="GET">GET</SelectItem>
														<SelectItem value="POST">POST</SelectItem>
														<SelectItem value="PUT">PUT</SelectItem>
														<SelectItem value="DELETE">DELETE</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</div>
								)}
							</TabsContent>

							<TabsContent value="conditions" className="space-y-4">
								<div className="flex items-center justify-between">
									<Label>Conditions</Label>
									<Button variant="outline" size="sm" onClick={addCondition}>
										<Plus className="h-4 w-4 mr-2" />
										Add Condition
									</Button>
								</div>

								{formData.conditions.map((condition, index) => (
									<div key={index} className="flex items-center gap-2 p-4 border rounded-lg">
										<div className="flex-1 grid grid-cols-3 gap-2">
											<Input
												placeholder="Field"
												value={condition.field}
												onChange={(e) => updateCondition(index, 'field', e.target.value)}
											/>
											<Select
												value={condition.operator}
												onValueChange={(value) => updateCondition(index, 'operator', value)}
											>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="equals">Equals</SelectItem>
													<SelectItem value="not_equals">Not Equals</SelectItem>
													<SelectItem value="greater_than">Greater Than</SelectItem>
													<SelectItem value="less_than">Less Than</SelectItem>
													<SelectItem value="contains">Contains</SelectItem>
												</SelectContent>
											</Select>
											<Input
												placeholder="Value"
												value={condition.value}
												onChange={(e) => updateCondition(index, 'value', e.target.value)}
											/>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => removeCondition(index)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								))}

								{formData.conditions.length === 0 && (
									<div className="text-center py-8 text-muted-foreground">
										No conditions added. Rules will trigger for all matching events.
									</div>
								)}
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

			<div className="grid grid-cols-1 gap-6">
				{rules.map((rule) => (
					<Card key={rule.id} className="relative">
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<CardTitle className="text-lg">{rule.name}</CardTitle>
									{rule.isActive ? (
										<Badge variant="default" className="bg-green-100 text-green-800">
											<Play className="h-3 w-3 mr-1" />
											Active
										</Badge>
									) : (
										<Badge variant="secondary">
											<Pause className="h-3 w-3 mr-1" />
											Inactive
										</Badge>
									)}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleToggleActive(rule.id)}
									>
										{rule.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => startEdit(rule)}
									>
										<Edit className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleDelete(rule.id, rule.name)}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
							<CardDescription>{rule.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Clock className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">Trigger</span>
									</div>
									<p className="text-sm text-muted-foreground">
										{rule.triggerType === 'schedule' && `Every ${rule.triggerConfig.schedule?.frequency} at ${rule.triggerConfig.schedule?.time}`}
										{rule.triggerType === 'event' && `On ${rule.triggerConfig.event?.eventType?.replace('_', ' ')}`}
										{rule.triggerType === 'condition' && 'Condition-based'}
									</p>
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Zap className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">Action</span>
									</div>
									<p className="text-sm text-muted-foreground">
										{rule.actionType.replace('_', ' ').toUpperCase()}
									</p>
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<CheckCircle className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">Success Rate</span>
									</div>
									<p className="text-sm text-muted-foreground">
										{rule.runCount > 0 ? `${Math.round((rule.successCount / rule.runCount) * 100)}%` : 'N/A'}
									</p>
								</div>

								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">Last Run</span>
									</div>
									<p className="text-sm text-muted-foreground">
										{rule.lastRun ? format(new Date(rule.lastRun), 'MMM dd, yyyy HH:mm') : 'Never'}
									</p>
								</div>
							</div>

							{rule.conditions.length > 0 && (
								<div className="mt-4">
									<div className="flex items-center gap-2 mb-2">
										<Settings className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm font-medium">Conditions</span>
									</div>
									<div className="flex flex-wrap gap-2">
										{rule.conditions.map((condition, index) => (
											<Badge key={index} variant="outline" className="text-xs">
												{condition.field} {condition.operator} {condition.value}
											</Badge>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
