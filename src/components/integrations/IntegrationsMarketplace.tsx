/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
	Search, 
	Plus, 
	Star, 
	ExternalLink, 
	CheckCircle,
	AlertCircle,
	Clock,
	X,
	Settings,
	Play,
	Pause,
	Trash2,
	Eye,
	Filter,
	TrendingUp,
	Users,
	Zap,
	Shield,
	CreditCard,
	Database,
	Brain,
	MessageSquare,
	BarChart3
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";
import { 
	IntegrationCategory, 
	IntegrationStatus,
	IntegrationProvider,
	IntegrationConfig 
} from "@/lib/integrations-marketplace";

interface IntegrationsMarketplaceProps {
	tenantId: string;
}

/**
 * Integrations Marketplace Component
 * Browse and manage third-party service integrations
 */
export function IntegrationsMarketplace({ tenantId }: IntegrationsMarketplaceProps) {
	const { t } = useLanguage();
	const { user } = useApp();
	const [providers, setProviders] = useState<IntegrationProvider[]>([]);
	const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | "all">("all");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);

	// Load data
	useEffect(() => {
		loadData();
	}, [tenantId]);

	const loadData = async () => {
		try {
			const [providersResponse, integrationsResponse] = await Promise.all([
				fetch("/api/marketplace/integrations"),
				fetch(`/api/tenants/${tenantId}/integrations`),
			]);

			if (providersResponse.ok) {
				const data = await providersResponse.json();
				setProviders(data.data || []);
			}

			if (integrationsResponse.ok) {
				const data = await integrationsResponse.json();
				setIntegrations(data.data || []);
			}
		} catch (error) {
			logger.error("Failed to load integrations data", error as Error, {
				component: "IntegrationsMarketplace",
			});
		} finally {
			setLoading(false);
		}
	};

	const createIntegration = async (provider: IntegrationProvider) => {
		try {
			// This would open a configuration modal in a real implementation
			// For now, we'll create a basic integration
			const response = await fetch(`/api/tenants/${tenantId}/integrations`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					providerId: provider.id,
					templateId: `${provider.id}-basic`,
					name: `${provider.name} Integration`,
					config: {},
					credentials: {},
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setIntegrations(prev => [data.data, ...prev]);
				
				logger.info("Integration created successfully", {
					component: "IntegrationsMarketplace",
					integrationId: data.data.id,
					providerId: provider.id,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to create integration", new Error(errorData.error), {
					component: "IntegrationsMarketplace",
				});
			}
		} catch (error) {
			logger.error("Failed to create integration", error as Error, {
				component: "IntegrationsMarketplace",
			});
		}
	};

	const deleteIntegration = async (integrationId: string) => {
		if (!confirm("Are you sure you want to delete this integration?")) {
			return;
		}

		try {
			const response = await fetch(`/api/tenants/${tenantId}/integrations/${integrationId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				setIntegrations(prev => prev.filter(i => i.id !== integrationId));
				
				logger.info("Integration deleted successfully", {
					component: "IntegrationsMarketplace",
					integrationId,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to delete integration", new Error(errorData.error), {
					component: "IntegrationsMarketplace",
				});
			}
		} catch (error) {
			logger.error("Failed to delete integration", error as Error, {
				component: "IntegrationsMarketplace",
			});
		}
	};

	const getCategoryIcon = (category: IntegrationCategory) => {
		switch (category) {
			case IntegrationCategory.ANALYTICS: return <BarChart3 className="h-4 w-4" />;
			case IntegrationCategory.COMMUNICATION: return <MessageSquare className="h-4 w-4" />;
			case IntegrationCategory.PRODUCTIVITY: return <Zap className="h-4 w-4" />;
			case IntegrationCategory.MARKETING: return <TrendingUp className="h-4 w-4" />;
			case IntegrationCategory.DEVELOPMENT: return <Settings className="h-4 w-4" />;
			case IntegrationCategory.SECURITY: return <Shield className="h-4 w-4" />;
			case IntegrationCategory.PAYMENT: return <CreditCard className="h-4 w-4" />;
			case IntegrationCategory.STORAGE: return <Database className="h-4 w-4" />;
			case IntegrationCategory.AI_ML: return <Brain className="h-4 w-4" />;
			default: return <Settings className="h-4 w-4" />;
		}
	};

	const getStatusIcon = (status: IntegrationStatus) => {
		switch (status) {
			case IntegrationStatus.ACTIVE: return <CheckCircle className="h-4 w-4 text-green-600" />;
			case IntegrationStatus.ERROR: return <AlertCircle className="h-4 w-4 text-red-600" />;
			case IntegrationStatus.PENDING: return <Clock className="h-4 w-4 text-yellow-600" />;
			case IntegrationStatus.INACTIVE: return <Pause className="h-4 w-4 text-gray-600" />;
			default: return <Clock className="h-4 w-4 text-gray-600" />;
		}
	};

	const getStatusColor = (status: IntegrationStatus) => {
		switch (status) {
			case IntegrationStatus.ACTIVE: return "bg-green-100 text-green-800";
			case IntegrationStatus.ERROR: return "bg-red-100 text-red-800";
			case IntegrationStatus.PENDING: return "bg-yellow-100 text-yellow-800";
			case IntegrationStatus.INACTIVE: return "bg-gray-100 text-gray-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	const filteredProviders = providers.filter(provider => {
		const matchesCategory = selectedCategory === "all" || provider.category === selectedCategory;
		const matchesSearch = !searchQuery || 
			provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			provider.description.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(6)].map((_, i) => (
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
					<h2 className="text-2xl font-bold">Integrations Marketplace</h2>
					<p className="text-muted-foreground">
						Connect your platform with third-party services
					</p>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="flex gap-4">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search integrations..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
				<Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as IntegrationCategory | "all")}>
					<SelectTrigger className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Categories</SelectItem>
						<SelectItem value={IntegrationCategory.ANALYTICS}>Analytics</SelectItem>
						<SelectItem value={IntegrationCategory.COMMUNICATION}>Communication</SelectItem>
						<SelectItem value={IntegrationCategory.PRODUCTIVITY}>Productivity</SelectItem>
						<SelectItem value={IntegrationCategory.MARKETING}>Marketing</SelectItem>
						<SelectItem value={IntegrationCategory.DEVELOPMENT}>Development</SelectItem>
						<SelectItem value={IntegrationCategory.SECURITY}>Security</SelectItem>
						<SelectItem value={IntegrationCategory.PAYMENT}>Payment</SelectItem>
						<SelectItem value={IntegrationCategory.STORAGE}>Storage</SelectItem>
						<SelectItem value={IntegrationCategory.AI_ML}>AI/ML</SelectItem>
					</SelectContent>
				</Select>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="marketplace" className="space-y-4">
				<TabsList>
					<TabsTrigger value="marketplace">Marketplace</TabsTrigger>
					<TabsTrigger value="installed">Installed ({integrations.length})</TabsTrigger>
				</TabsList>

				{/* Marketplace Tab */}
				<TabsContent value="marketplace" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
						{filteredProviders.map((provider) => (
							<Card key={provider.id} className="relative">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
												{getCategoryIcon(provider.category)}
											</div>
											<div>
												<CardTitle className="text-lg">{provider.name}</CardTitle>
												<div className="flex items-center gap-2">
													<Badge variant="outline" className="text-xs">
														{provider.category}
													</Badge>
													{provider.isVerified && (
														<Badge variant="secondary" className="text-xs">
															<CheckCircle className="h-3 w-3 mr-1" />
															Verified
														</Badge>
													)}
												</div>
											</div>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-4">
									<p className="text-sm text-muted-foreground">
										{provider.description}
									</p>

									{/* Features */}
									<div className="space-y-2">
										<h4 className="text-sm font-medium">Key Features</h4>
										<div className="flex flex-wrap gap-1">
											{provider.features.slice(0, 3).map((feature, index) => (
												<Badge key={index} variant="outline" className="text-xs">
													{feature}
												</Badge>
											))}
											{provider.features.length > 3 && (
												<Badge variant="outline" className="text-xs">
													+{provider.features.length - 3} more
												</Badge>
											)}
										</div>
									</div>

									{/* Rating and Pricing */}
									<div className="flex items-center justify-between text-sm">
										<div className="flex items-center gap-1">
											<Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
											<span>{provider.rating}</span>
											<span className="text-muted-foreground">({provider.reviewCount})</span>
										</div>
										<div className="text-right">
											<div className="font-medium">
												{provider.pricing.free ? "Free" : "Paid"}
											</div>
											{provider.pricing.price && (
												<div className="text-xs text-muted-foreground">
													{provider.pricing.price}
												</div>
											)}
										</div>
									</div>

									{/* Actions */}
									<div className="flex gap-2">
										<Button 
											className="flex-1"
											onClick={() => createIntegration(provider)}
										>
											<Plus className="h-4 w-4 mr-2" />
											Install
										</Button>
										<Button variant="outline" size="sm">
											<ExternalLink className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>

					{filteredProviders.length === 0 && (
						<Card>
							<CardContent className="p-8 text-center">
								<Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">No Integrations Found</h3>
								<p className="text-muted-foreground">
									Try adjusting your search or filter criteria
								</p>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Installed Tab */}
				<TabsContent value="installed" className="space-y-4">
					{integrations.length === 0 ? (
						<Card>
							<CardContent className="p-8 text-center">
								<Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<h3 className="text-lg font-medium mb-2">No Integrations Installed</h3>
								<p className="text-muted-foreground mb-4">
									Browse the marketplace to find integrations for your platform
								</p>
								<Button onClick={() => setSelectedCategory("all")}>
									<Plus className="h-4 w-4 mr-2" />
									Browse Marketplace
								</Button>
							</CardContent>
						</Card>
					) : (
						<div className="space-y-4">
							{integrations.map((integration) => {
								const provider = providers.find(p => p.id === integration.providerId);
								return (
									<Card key={integration.id}>
										<CardContent className="p-6">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-4">
													<div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
														{provider && getCategoryIcon(provider.category)}
													</div>
													<div>
														<h3 className="font-medium">{integration.name}</h3>
														<p className="text-sm text-muted-foreground">
															{provider?.name || integration.providerId}
														</p>
														<div className="flex items-center gap-2 mt-1">
															{getStatusIcon(integration.status)}
															<Badge className={getStatusColor(integration.status)}>
																{integration.status}
															</Badge>
															{integration.lastSync && (
																<span className="text-xs text-muted-foreground">
																	Last sync: {new Date(integration.lastSync).toLocaleDateString()}
																</span>
															)}
														</div>
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Button variant="outline" size="sm">
														<Settings className="h-4 w-4" />
													</Button>
													<Button variant="outline" size="sm">
														<Eye className="h-4 w-4" />
													</Button>
													<Button 
														variant="outline" 
														size="sm"
														onClick={() => deleteIntegration(integration.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</div>
											{integration.errorMessage && (
												<div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
													<div className="flex items-center gap-2 text-red-800">
														<AlertCircle className="h-4 w-4" />
														<span className="font-medium">Error</span>
													</div>
													<p className="text-sm text-red-700 mt-1">
														{integration.errorMessage}
													</p>
												</div>
											)}
										</CardContent>
									</Card>
								);
							})}
						</div>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
}
