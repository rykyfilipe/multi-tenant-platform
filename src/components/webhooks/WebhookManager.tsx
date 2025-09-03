/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	Plus, 
	Settings, 
	Play, 
	Trash2, 
	Copy, 
	Check,
	AlertCircle,
	CheckCircle,
	Clock,
	ExternalLink,
	Activity,
	Zap,
	Eye,
	EyeOff
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";
import { WebhookEventType } from "@/lib/webhook-system";

interface WebhookEndpoint {
	id: string;
	tenantId: string;
	name: string;
	url: string;
	description?: string;
	events: WebhookEventType[];
	status: "active" | "inactive" | "failed" | "disabled";
	secret: string;
	headers?: Record<string, string>;
	retryPolicy: {
		maxRetries: number;
		retryDelay: number;
		backoffMultiplier: number;
	};
	createdAt: string;
	updatedAt: string;
	lastDelivery?: {
		eventId: string;
		status: string;
		timestamp: string;
		responseCode?: number;
		responseBody?: string;
	};
	statistics: {
		totalDeliveries: number;
		successfulDeliveries: number;
		failedDeliveries: number;
		lastDeliveryAt?: string;
	};
}

interface WebhookManagerProps {
	tenantId: string;
}

/**
 * Webhook Manager Component
 * Manages webhook endpoints for a tenant
 */
export function WebhookManager({ tenantId }: WebhookManagerProps) {
	const { t } = useLanguage();
	const { user } = useApp();
	const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
	const [loading, setLoading] = useState(true);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [editingWebhook, setEditingWebhook] = useState<WebhookEndpoint | null>(null);
	const [testingWebhook, setTestingWebhook] = useState<string | null>(null);
	const [testResult, setTestResult] = useState<any>(null);

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		url: "",
		description: "",
		events: [] as WebhookEventType[],
		headers: {} as Record<string, string>,
		retryPolicy: {
			maxRetries: 3,
			retryDelay: 1000,
			backoffMultiplier: 2,
		},
	});

	// Available webhook events
	const availableEvents = [
		{ value: WebhookEventType.DATABASE_CREATED, label: "Database Created" },
		{ value: WebhookEventType.DATABASE_UPDATED, label: "Database Updated" },
		{ value: WebhookEventType.DATABASE_DELETED, label: "Database Deleted" },
		{ value: WebhookEventType.TABLE_CREATED, label: "Table Created" },
		{ value: WebhookEventType.TABLE_UPDATED, label: "Table Updated" },
		{ value: WebhookEventType.TABLE_DELETED, label: "Table Deleted" },
		{ value: WebhookEventType.ROW_CREATED, label: "Row Created" },
		{ value: WebhookEventType.ROW_UPDATED, label: "Row Updated" },
		{ value: WebhookEventType.ROW_DELETED, label: "Row Deleted" },
		{ value: WebhookEventType.USER_INVITED, label: "User Invited" },
		{ value: WebhookEventType.USER_JOINED, label: "User Joined" },
		{ value: WebhookEventType.USER_LEFT, label: "User Left" },
		{ value: WebhookEventType.SUBSCRIPTION_CREATED, label: "Subscription Created" },
		{ value: WebhookEventType.SUBSCRIPTION_UPDATED, label: "Subscription Updated" },
		{ value: WebhookEventType.SUBSCRIPTION_CANCELLED, label: "Subscription Cancelled" },
		{ value: WebhookEventType.PAYMENT_SUCCEEDED, label: "Payment Succeeded" },
		{ value: WebhookEventType.PAYMENT_FAILED, label: "Payment Failed" },
		{ value: WebhookEventType.USAGE_LIMIT_REACHED, label: "Usage Limit Reached" },
		{ value: WebhookEventType.USAGE_LIMIT_WARNING, label: "Usage Limit Warning" },
	];

	// Load webhooks
	useEffect(() => {
		loadWebhooks();
	}, [tenantId]);

	const loadWebhooks = async () => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/webhooks`);
			if (response.ok) {
				const data = await response.json();
				setWebhooks(data.data || []);
			} else {
				logger.error("Failed to load webhooks", new Error("API error"), {
					component: "WebhookManager",
					status: response.status,
				});
			}
		} catch (error) {
			logger.error("Failed to load webhooks", error as Error, {
				component: "WebhookManager",
			});
		} finally {
			setLoading(false);
		}
	};

	const createWebhook = async () => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/webhooks`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				const data = await response.json();
				setWebhooks(prev => [data.data, ...prev]);
				setShowCreateForm(false);
				resetForm();
				
				logger.info("Webhook created successfully", {
					component: "WebhookManager",
					webhookId: data.data.id,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to create webhook", new Error(errorData.error), {
					component: "WebhookManager",
				});
			}
		} catch (error) {
			logger.error("Failed to create webhook", error as Error, {
				component: "WebhookManager",
			});
		}
	};

	const updateWebhook = async (webhookId: string, updates: any) => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/webhooks/${webhookId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(updates),
			});

			if (response.ok) {
				const data = await response.json();
				setWebhooks(prev => prev.map(w => w.id === webhookId ? data.data : w));
				setEditingWebhook(null);
				
				logger.info("Webhook updated successfully", {
					component: "WebhookManager",
					webhookId,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to update webhook", new Error(errorData.error), {
					component: "WebhookManager",
				});
			}
		} catch (error) {
			logger.error("Failed to update webhook", error as Error, {
				component: "WebhookManager",
			});
		}
	};

	const deleteWebhook = async (webhookId: string) => {
		if (!confirm("Are you sure you want to delete this webhook?")) {
			return;
		}

		try {
			const response = await fetch(`/api/tenants/${tenantId}/webhooks/${webhookId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setWebhooks(prev => prev.filter(w => w.id !== webhookId));
				
				logger.info("Webhook deleted successfully", {
					component: "WebhookManager",
					webhookId,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to delete webhook", new Error(errorData.error), {
					component: "WebhookManager",
				});
			}
		} catch (error) {
			logger.error("Failed to delete webhook", error as Error, {
				component: "WebhookManager",
			});
		}
	};

	const testWebhook = async (webhookId: string) => {
		setTestingWebhook(webhookId);
		setTestResult(null);

		try {
			const response = await fetch(`/api/tenants/${tenantId}/webhooks/${webhookId}/test`, {
				method: "POST",
			});

			if (response.ok) {
				const data = await response.json();
				setTestResult(data.data);
			} else {
				const errorData = await response.json();
				setTestResult({ success: false, error: errorData.error });
			}
		} catch (error) {
			setTestResult({ success: false, error: "Network error" });
		} finally {
			setTestingWebhook(null);
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			url: "",
			description: "",
			events: [],
			headers: {},
			retryPolicy: {
				maxRetries: 3,
				retryDelay: 1000,
				backoffMultiplier: 2,
			},
		});
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active": return "bg-green-100 text-green-800";
			case "inactive": return "bg-gray-100 text-gray-800";
			case "failed": return "bg-red-100 text-red-800";
			case "disabled": return "bg-yellow-100 text-yellow-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "active": return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "inactive": return <Clock className="h-4 w-4 text-gray-600" />;
			case "failed": return <AlertCircle className="h-4 w-4 text-red-600" />;
			case "disabled": return <EyeOff className="h-4 w-4 text-yellow-600" />;
			default: return <Clock className="h-4 w-4 text-gray-600" />;
		}
	};

	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardContent className="p-6">
							<div className="animate-pulse space-y-4">
								<div className="h-4 bg-muted rounded w-1/4"></div>
								<div className="h-3 bg-muted rounded w-1/2"></div>
								<div className="h-3 bg-muted rounded w-1/3"></div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Webhook Endpoints</h2>
					<p className="text-muted-foreground">
						Configure webhooks to receive real-time notifications
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(true)}>
					<Plus className="h-4 w-4 mr-2" />
					Create Webhook
				</Button>
			</div>

			{/* Create/Edit Form */}
			{(showCreateForm || editingWebhook) && (
				<Card>
					<CardHeader>
						<CardTitle>
							{editingWebhook ? "Edit Webhook" : "Create New Webhook"}
						</CardTitle>
						<CardDescription>
							Configure your webhook endpoint to receive real-time notifications
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
									placeholder="My Webhook"
								/>
							</div>
							<div>
								<Label htmlFor="url">Webhook URL</Label>
								<Input
									id="url"
									value={formData.url}
									onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
									placeholder="https://example.com/webhook"
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								value={formData.description}
								onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
								placeholder="Optional description for this webhook"
							/>
						</div>

						<div>
							<Label>Events to Subscribe To</Label>
							<div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 mt-2">
								{availableEvents.map((event) => (
									<label key={event.value} className="flex items-center space-x-2">
										<input
											type="checkbox"
											checked={formData.events.includes(event.value)}
											onChange={(e) => {
												if (e.target.checked) {
													setFormData(prev => ({
														...prev,
														events: [...prev.events, event.value]
													}));
												} else {
													setFormData(prev => ({
														...prev,
														events: prev.events.filter(ev => ev !== event.value)
													}));
												}
											}}
											className="rounded"
										/>
										<span className="text-sm">{event.label}</span>
									</label>
								))}
							</div>
						</div>

						<div className="flex gap-4">
							<Button
								onClick={editingWebhook ? () => updateWebhook(editingWebhook.id, formData) : createWebhook}
								disabled={!formData.name || !formData.url || formData.events.length === 0}
							>
								{editingWebhook ? "Update Webhook" : "Create Webhook"}
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									setShowCreateForm(false);
									setEditingWebhook(null);
									resetForm();
								}}
							>
								Cancel
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Webhooks List */}
			<div className="space-y-4">
				{webhooks.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center">
							<Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
							<h3 className="text-lg font-medium mb-2">No Webhooks Yet</h3>
							<p className="text-muted-foreground mb-4">
								Create your first webhook to receive real-time notifications
							</p>
							<Button onClick={() => setShowCreateForm(true)}>
								<Plus className="h-4 w-4 mr-2" />
								Create Your First Webhook
							</Button>
						</CardContent>
					</Card>
				) : (
					webhooks.map((webhook) => (
						<Card key={webhook.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-3">
										{getStatusIcon(webhook.status)}
										<div>
											<CardTitle className="text-lg">{webhook.name}</CardTitle>
											<CardDescription className="flex items-center gap-2">
												<code className="text-xs bg-muted px-2 py-1 rounded">
													{webhook.url}
												</code>
												<Badge className={getStatusColor(webhook.status)}>
													{webhook.status}
												</Badge>
											</CardDescription>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => testWebhook(webhook.id)}
											disabled={testingWebhook === webhook.id}
										>
											{testingWebhook === webhook.id ? (
												<Clock className="h-4 w-4 animate-spin" />
											) : (
												<Play className="h-4 w-4" />
											)}
											Test
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setEditingWebhook(webhook);
												setFormData({
													name: webhook.name,
													url: webhook.url,
													description: webhook.description || "",
													events: webhook.events,
													headers: webhook.headers || {},
													retryPolicy: webhook.retryPolicy,
												});
											}}
										>
											<Settings className="h-4 w-4" />
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => deleteWebhook(webhook.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{webhook.description && (
									<p className="text-sm text-muted-foreground">
										{webhook.description}
									</p>
								)}

								<div className="grid gap-4 md:grid-cols-3">
									<div>
										<h4 className="font-medium text-sm mb-2">Events</h4>
										<div className="flex flex-wrap gap-1">
											{webhook.events.map((event) => (
												<Badge key={event} variant="outline" className="text-xs">
													{availableEvents.find(e => e.value === event)?.label || event}
												</Badge>
											))}
										</div>
									</div>
									<div>
										<h4 className="font-medium text-sm mb-2">Statistics</h4>
										<div className="text-sm text-muted-foreground space-y-1">
											<div>Total: {webhook.statistics.totalDeliveries}</div>
											<div>Success: {webhook.statistics.successfulDeliveries}</div>
											<div>Failed: {webhook.statistics.failedDeliveries}</div>
										</div>
									</div>
									<div>
										<h4 className="font-medium text-sm mb-2">Last Delivery</h4>
										{webhook.lastDelivery ? (
											<div className="text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													{webhook.lastDelivery.status === "delivered" ? (
														<CheckCircle className="h-3 w-3 text-green-600" />
													) : (
														<AlertCircle className="h-3 w-3 text-red-600" />
													)}
													{webhook.lastDelivery.status}
												</div>
												<div>
													{new Date(webhook.lastDelivery.timestamp).toLocaleString()}
												</div>
											</div>
										) : (
											<div className="text-sm text-muted-foreground">
												No deliveries yet
											</div>
										)}
									</div>
								</div>

								{/* Test Result */}
								{testResult && testingWebhook === webhook.id && (
									<div className={`p-3 rounded-lg border ${
										testResult.success 
											? "border-green-200 bg-green-50" 
											: "border-red-200 bg-red-50"
									}`}>
										<div className="flex items-center gap-2">
											{testResult.success ? (
												<CheckCircle className="h-4 w-4 text-green-600" />
											) : (
												<AlertCircle className="h-4 w-4 text-red-600" />
											)}
											<span className="font-medium">
												{testResult.success ? "Test Successful" : "Test Failed"}
											</span>
										</div>
										{testResult.error && (
											<p className="text-sm text-red-600 mt-1">
												{testResult.error}
											</p>
										)}
										{testResult.response && (
											<div className="text-sm text-muted-foreground mt-2">
												<div>Status: {testResult.response.statusCode}</div>
												<div>Duration: {testResult.response.duration}ms</div>
											</div>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					))
				)}
			</div>
		</div>
	);
}
