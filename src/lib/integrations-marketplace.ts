/** @format */

/**
 * Integrations Marketplace System
 * Manages third-party service integrations and marketplace
 */

import { logger } from "./error-logger";
import prisma from "./prisma";

export enum IntegrationCategory {
	ANALYTICS = "analytics",
	COMMUNICATION = "communication",
	PRODUCTIVITY = "productivity",
	MARKETING = "marketing",
	DEVELOPMENT = "development",
	SECURITY = "security",
	PAYMENT = "payment",
	STORAGE = "storage",
	AI_ML = "ai_ml",
	OTHER = "other",
}

export enum IntegrationStatus {
	ACTIVE = "active",
	INACTIVE = "inactive",
	PENDING = "pending",
	ERROR = "error",
	DISABLED = "disabled",
}

export enum IntegrationType {
	WEBHOOK = "webhook",
	API = "api",
	OAUTH = "oauth",
	SSH = "ssh",
	FTP = "ftp",
	EMAIL = "email",
	SDK = "sdk",
}

export interface IntegrationProvider {
	id: string;
	name: string;
	description: string;
	logo: string;
	category: IntegrationCategory;
	type: IntegrationType;
	website: string;
	documentation: string;
	features: string[];
	pricing: {
		free: boolean;
		paid: boolean;
		price?: string;
	};
	rating: number;
	reviewCount: number;
	popularity: number;
	isVerified: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface IntegrationConfig {
	id: string;
	tenantId: string;
	providerId: string;
	name: string;
	description?: string;
	status: IntegrationStatus;
	config: Record<string, any>;
	credentials: Record<string, string>;
	webhooks?: {
		url: string;
		events: string[];
		secret: string;
	}[];
	lastSync?: string;
	errorMessage?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export interface IntegrationTemplate {
	id: string;
	providerId: string;
	name: string;
	description: string;
	category: string;
	icon: string;
	configSchema: {
		type: "object";
		properties: Record<string, any>;
		required: string[];
	};
	credentialsSchema: {
		type: "object";
		properties: Record<string, any>;
		required: string[];
	};
	webhookEvents?: string[];
	documentation: string;
	examples: Array<{
		title: string;
		description: string;
		code: string;
		language: string;
	}>;
	popularity: number;
	createdAt: string;
	updatedAt: string;
}

class IntegrationsMarketplace {
	private providers: Map<string, IntegrationProvider> = new Map();
	private templates: Map<string, IntegrationTemplate> = new Map();
	private integrations: Map<string, IntegrationConfig> = new Map();

	constructor() {
		this.initializeDefaultProviders();
	}

	/**
	 * Initialize default integration providers
	 */
	private initializeDefaultProviders(): void {
		const defaultProviders: IntegrationProvider[] = [
			{
				id: "slack",
				name: "Slack",
				description: "Team communication and collaboration platform",
				logo: "/integrations/slack.png",
				category: IntegrationCategory.COMMUNICATION,
				type: IntegrationType.OAUTH,
				website: "https://slack.com",
				documentation: "https://api.slack.com",
				features: ["Real-time messaging", "File sharing", "Bot integration", "Workflow automation"],
				pricing: { free: true, paid: true, price: "From $6.67/user/month" },
				rating: 4.5,
				reviewCount: 1250,
				popularity: 95,
				isVerified: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: "google-analytics",
				name: "Google Analytics",
				description: "Web analytics service to track and report website traffic",
				logo: "/integrations/google-analytics.png",
				category: IntegrationCategory.ANALYTICS,
				type: IntegrationType.OAUTH,
				website: "https://analytics.google.com",
				documentation: "https://developers.google.com/analytics",
				features: ["Website analytics", "User behavior tracking", "Custom reports", "Real-time data"],
				pricing: { free: true, paid: true, price: "From $150/month" },
				rating: 4.3,
				reviewCount: 890,
				popularity: 88,
				isVerified: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: "stripe",
				name: "Stripe",
				description: "Online payment processing for internet businesses",
				logo: "/integrations/stripe.png",
				category: IntegrationCategory.PAYMENT,
				type: IntegrationType.API,
				website: "https://stripe.com",
				documentation: "https://stripe.com/docs",
				features: ["Payment processing", "Subscription management", "Fraud protection", "Global payments"],
				pricing: { free: false, paid: true, price: "2.9% + 30¢ per transaction" },
				rating: 4.7,
				reviewCount: 2100,
				popularity: 92,
				isVerified: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: "zapier",
				name: "Zapier",
				description: "Automation platform that connects your favorite apps",
				logo: "/integrations/zapier.png",
				category: IntegrationCategory.PRODUCTIVITY,
				type: IntegrationType.WEBHOOK,
				website: "https://zapier.com",
				documentation: "https://zapier.com/developer",
				features: ["App automation", "Workflow triggers", "Data synchronization", "Multi-step workflows"],
				pricing: { free: true, paid: true, price: "From $19.99/month" },
				rating: 4.4,
				reviewCount: 1560,
				popularity: 85,
				isVerified: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: "openai",
				name: "OpenAI",
				description: "AI platform for building and deploying AI applications",
				logo: "/integrations/openai.png",
				category: IntegrationCategory.AI_ML,
				type: IntegrationType.API,
				website: "https://openai.com",
				documentation: "https://platform.openai.com/docs",
				features: ["GPT models", "Embeddings", "Fine-tuning", "Image generation"],
				pricing: { free: false, paid: true, price: "Pay per use" },
				rating: 4.6,
				reviewCount: 780,
				popularity: 90,
				isVerified: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: "aws-s3",
				name: "AWS S3",
				description: "Object storage service for storing and retrieving data",
				logo: "/integrations/aws-s3.png",
				category: IntegrationCategory.STORAGE,
				type: IntegrationType.API,
				website: "https://aws.amazon.com/s3",
				documentation: "https://docs.aws.amazon.com/s3",
				features: ["Object storage", "File backup", "CDN integration", "Versioning"],
				pricing: { free: true, paid: true, price: "From $0.023/GB/month" },
				rating: 4.5,
				reviewCount: 1200,
				popularity: 87,
				isVerified: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		];

		defaultProviders.forEach(provider => {
			this.providers.set(provider.id, provider);
		});

		this.initializeTemplates();
	}

	/**
	 * Initialize integration templates
	 */
	private initializeTemplates(): void {
		const templates: IntegrationTemplate[] = [
			{
				id: "slack-notifications",
				providerId: "slack",
				name: "Slack Notifications",
				description: "Send notifications to Slack channels when events occur",
				category: "notifications",
				icon: "bell",
				configSchema: {
					type: "object",
					properties: {
						channel: {
							type: "string",
							title: "Channel",
							description: "Slack channel to send notifications to",
						},
						username: {
							type: "string",
							title: "Bot Username",
							description: "Username for the bot",
						},
						icon_emoji: {
							type: "string",
							title: "Icon Emoji",
							description: "Emoji to use as bot icon",
						},
					},
					required: ["channel"],
				},
				credentialsSchema: {
					type: "object",
					properties: {
						webhook_url: {
							type: "string",
							title: "Webhook URL",
							description: "Slack webhook URL for sending messages",
						},
					},
					required: ["webhook_url"],
				},
				webhookEvents: ["database.created", "user.joined", "error.occurred"],
				documentation: "https://api.slack.com/messaging/webhooks",
				examples: [
					{
						title: "Basic Notification",
						description: "Send a simple notification to Slack",
						code: `{
  "text": "New user joined the platform!",
  "channel": "#general",
  "username": "Platform Bot"
}`,
						language: "json",
					},
				],
				popularity: 95,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			{
				id: "google-analytics-tracking",
				providerId: "google-analytics",
				name: "Google Analytics Tracking",
				description: "Track user interactions and events in Google Analytics",
				category: "analytics",
				icon: "bar-chart",
				configSchema: {
					type: "object",
					properties: {
						measurement_id: {
							type: "string",
							title: "Measurement ID",
							description: "Google Analytics 4 measurement ID",
						},
						track_events: {
							type: "boolean",
							title: "Track Events",
							description: "Enable event tracking",
						},
						track_pageviews: {
							type: "boolean",
							title: "Track Page Views",
							description: "Enable page view tracking",
						},
					},
					required: ["measurement_id"],
				},
				credentialsSchema: {
					type: "object",
					properties: {
						api_key: {
							type: "string",
							title: "API Key",
							description: "Google Analytics API key",
						},
					},
					required: ["api_key"],
				},
				documentation: "https://developers.google.com/analytics/devguides/collection/ga4",
				examples: [
					{
						title: "Track Custom Event",
						description: "Track a custom event in Google Analytics",
						code: `gtag('event', 'custom_event', {
  'event_category': 'engagement',
  'event_label': 'button_click',
  'value': 1
});`,
						language: "javascript",
					},
				],
				popularity: 88,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		];

		templates.forEach(template => {
			this.templates.set(template.id, template);
		});
	}

	/**
	 * Get all available integration providers
	 */
	async getProviders(category?: IntegrationCategory): Promise<IntegrationProvider[]> {
		let providers = Array.from(this.providers.values());

		if (category) {
			providers = providers.filter(provider => provider.category === category);
		}

		return providers.sort((a, b) => b.popularity - a.popularity);
	}

	/**
	 * Get integration provider by ID
	 */
	async getProvider(providerId: string): Promise<IntegrationProvider | null> {
		return this.providers.get(providerId) || null;
	}

	/**
	 * Get integration templates for a provider
	 */
	async getTemplates(providerId?: string): Promise<IntegrationTemplate[]> {
		let templates = Array.from(this.templates.values());

		if (providerId) {
			templates = templates.filter(template => template.providerId === providerId);
		}

		return templates.sort((a, b) => b.popularity - a.popularity);
	}

	/**
	 * Get integration template by ID
	 */
	async getTemplate(templateId: string): Promise<IntegrationTemplate | null> {
		return this.templates.get(templateId) || null;
	}

	/**
	 * Create a new integration
	 */
	async createIntegration(
		tenantId: string,
		providerId: string,
		templateId: string,
		name: string,
		config: Record<string, any>,
		credentials: Record<string, string>,
		createdBy: string
	): Promise<IntegrationConfig> {
		const integration: IntegrationConfig = {
			id: this.generateId(),
			tenantId,
			providerId,
			name,
			status: IntegrationStatus.PENDING,
			config,
			credentials,
			createdBy,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};

		this.integrations.set(integration.id, integration);

		// Store in database
		try {
			await prisma.integrationConfig.create({
				data: {
					id: integration.id,
					tenantId: parseInt(tenantId),
					providerId: providerId,
					name: name,
					status: integration.status,
					config: JSON.stringify(config),
					credentials: JSON.stringify(credentials),
					createdBy: createdBy,
				},
			});
		} catch (error) {
			logger.error("Failed to create integration", error as Error, {
				component: "IntegrationsMarketplace",
				integrationId: integration.id,
				tenantId,
			});
		}

		// Test the integration
		await this.testIntegration(integration.id);

		logger.info("Integration created", {
			component: "IntegrationsMarketplace",
			integrationId: integration.id,
			tenantId,
			providerId,
		});

		return integration;
	}

	/**
	 * Test an integration
	 */
	async testIntegration(integrationId: string): Promise<{ success: boolean; error?: string }> {
		const integration = this.integrations.get(integrationId);
		if (!integration) {
			return { success: false, error: "Integration not found" };
		}

		try {
			// Simulate testing different integration types
			switch (integration.providerId) {
				case "slack":
					await this.testSlackIntegration(integration);
					break;
				case "google-analytics":
					await this.testGoogleAnalyticsIntegration(integration);
					break;
				case "stripe":
					await this.testStripeIntegration(integration);
					break;
				default:
					// Generic test
					await this.testGenericIntegration(integration);
			}

			integration.status = IntegrationStatus.ACTIVE;
			integration.lastSync = new Date().toISOString();
			integration.errorMessage = undefined;
			this.integrations.set(integrationId, integration);

			return { success: true };
		} catch (error) {
			integration.status = IntegrationStatus.ERROR;
			integration.errorMessage = error instanceof Error ? error.message : "Unknown error";
			this.integrations.set(integrationId, integration);

			return { 
				success: false, 
				error: error instanceof Error ? error.message : "Unknown error" 
			};
		}
	}

	/**
	 * Test Slack integration
	 */
	private async testSlackIntegration(integration: IntegrationConfig): Promise<void> {
		const webhookUrl = integration.credentials.webhook_url;
		if (!webhookUrl) {
			throw new Error("Slack webhook URL is required");
		}

		// Simulate sending a test message
		const testMessage = {
			text: "Test message from Multi-Tenant Platform",
			channel: integration.config.channel || "#general",
			username: integration.config.username || "Platform Bot",
		};

		// In a real implementation, you would make an HTTP request to Slack
		logger.info("Slack integration test", {
			component: "IntegrationsMarketplace",
			integrationId: integration.id,
			webhookUrl,
			testMessage,
		});
	}

	/**
	 * Test Google Analytics integration
	 */
	private async testGoogleAnalyticsIntegration(integration: IntegrationConfig): Promise<void> {
		const apiKey = integration.credentials.api_key;
		const measurementId = integration.config.measurement_id;

		if (!apiKey || !measurementId) {
			throw new Error("Google Analytics API key and measurement ID are required");
		}

		// Simulate testing the connection
		logger.info("Google Analytics integration test", {
			component: "IntegrationsMarketplace",
			integrationId: integration.id,
			measurementId,
		});
	}

	/**
	 * Test Stripe integration
	 */
	private async testStripeIntegration(integration: IntegrationConfig): Promise<void> {
		const apiKey = integration.credentials.api_key;
		if (!apiKey) {
			throw new Error("Stripe API key is required");
		}

		// Simulate testing the connection
		logger.info("Stripe integration test", {
			component: "IntegrationsMarketplace",
			integrationId: integration.id,
		});
	}

	/**
	 * Test generic integration
	 */
	private async testGenericIntegration(integration: IntegrationConfig): Promise<void> {
		// Generic test logic
		logger.info("Generic integration test", {
			component: "IntegrationsMarketplace",
			integrationId: integration.id,
			providerId: integration.providerId,
		});
	}

	/**
	 * Get integrations for a tenant
	 */
	async getIntegrations(tenantId: string): Promise<IntegrationConfig[]> {
		try {
			const dbIntegrations = await prisma.integrationConfig.findMany({
				where: { tenantId: parseInt(tenantId) },
				orderBy: { updatedAt: "desc" },
			});

			return dbIntegrations.map(integration => ({
				id: integration.id,
				tenantId: integration.tenantId.toString(),
				providerId: integration.providerId,
				name: integration.name,
				description: integration.description || "",
				status: integration.status as IntegrationStatus,
				config: JSON.parse(integration.config || "{}"),
				credentials: JSON.parse(integration.credentials || "{}"),
				webhooks: integration.webhooks ? JSON.parse(integration.webhooks) : undefined,
				lastSync: integration.lastSync?.toISOString(),
				errorMessage: integration.errorMessage || undefined,
				createdBy: integration.createdBy,
				createdAt: integration.createdAt.toISOString(),
				updatedAt: integration.updatedAt.toISOString(),
			}));
		} catch (error) {
			logger.error("Failed to get integrations", error as Error, {
				component: "IntegrationsMarketplace",
				tenantId,
			});
			return [];
		}
	}

	/**
	 * Get integration by ID
	 */
	async getIntegration(integrationId: string): Promise<IntegrationConfig | null> {
		const integration = this.integrations.get(integrationId);
		if (integration) {
			return integration;
		}

		// Try to load from database
		try {
			const dbIntegration = await prisma.integrationConfig.findUnique({
				where: { id: integrationId },
			});

			if (dbIntegration) {
				const integrationConfig: IntegrationConfig = {
					id: dbIntegration.id,
					tenantId: dbIntegration.tenantId.toString(),
					providerId: dbIntegration.providerId,
					name: dbIntegration.name,
					description: dbIntegration.description || "",
					status: dbIntegration.status as IntegrationStatus,
					config: JSON.parse(dbIntegration.config || "{}"),
					credentials: JSON.parse(dbIntegration.credentials || "{}"),
					webhooks: dbIntegration.webhooks ? JSON.parse(dbIntegration.webhooks) : undefined,
					lastSync: dbIntegration.lastSync?.toISOString(),
					errorMessage: dbIntegration.errorMessage || undefined,
					createdBy: dbIntegration.createdBy,
					createdAt: dbIntegration.createdAt.toISOString(),
					updatedAt: dbIntegration.updatedAt.toISOString(),
				};

				this.integrations.set(integrationId, integrationConfig);
				return integrationConfig;
			}
		} catch (error) {
			logger.error("Failed to get integration", error as Error, {
				component: "IntegrationsMarketplace",
				integrationId,
			});
		}

		return null;
	}

	/**
	 * Update integration
	 */
	async updateIntegration(
		integrationId: string,
		updates: Partial<Pick<IntegrationConfig, "name" | "description" | "config" | "credentials">>
	): Promise<IntegrationConfig | null> {
		const integration = this.integrations.get(integrationId);
		if (!integration) {
			return null;
		}

		const updatedIntegration = {
			...integration,
			...updates,
			updatedAt: new Date().toISOString(),
		};

		this.integrations.set(integrationId, updatedIntegration);

		// Update in database
		try {
			await prisma.integrationConfig.update({
				where: { id: integrationId },
				data: {
					name: updatedIntegration.name,
					description: updatedIntegration.description,
					config: JSON.stringify(updatedIntegration.config),
					credentials: JSON.stringify(updatedIntegration.credentials),
				},
			});
		} catch (error) {
			logger.error("Failed to update integration", error as Error, {
				component: "IntegrationsMarketplace",
				integrationId,
			});
		}

		// Test the updated integration
		await this.testIntegration(integrationId);

		return updatedIntegration;
	}

	/**
	 * Delete integration
	 */
	async deleteIntegration(integrationId: string): Promise<boolean> {
		const integration = this.integrations.get(integrationId);
		if (!integration) {
			return false;
		}

		try {
			await prisma.integrationConfig.delete({
				where: { id: integrationId },
			});

			this.integrations.delete(integrationId);

			logger.info("Integration deleted", {
				component: "IntegrationsMarketplace",
				integrationId,
				tenantId: integration.tenantId,
			});

			return true;
		} catch (error) {
			logger.error("Failed to delete integration", error as Error, {
				component: "IntegrationsMarketplace",
				integrationId,
			});
			return false;
		}
	}

	/**
	 * Search integrations
	 */
	async searchIntegrations(query: string, category?: IntegrationCategory): Promise<IntegrationProvider[]> {
		let providers = Array.from(this.providers.values());

		// Filter by category if specified
		if (category) {
			providers = providers.filter(provider => provider.category === category);
		}

		// Filter by search query
		if (query) {
			const searchTerm = query.toLowerCase();
			providers = providers.filter(provider => 
				provider.name.toLowerCase().includes(searchTerm) ||
				provider.description.toLowerCase().includes(searchTerm) ||
				provider.features.some(feature => feature.toLowerCase().includes(searchTerm))
			);
		}

		return providers.sort((a, b) => b.popularity - a.popularity);
	}

	/**
	 * Get popular integrations
	 */
	async getPopularIntegrations(limit: number = 10): Promise<IntegrationProvider[]> {
		const providers = Array.from(this.providers.values());
		return providers
			.sort((a, b) => b.popularity - a.popularity)
			.slice(0, limit);
	}

	/**
	 * Get integrations by category
	 */
	async getIntegrationsByCategory(category: IntegrationCategory): Promise<IntegrationProvider[]> {
		return Array.from(this.providers.values())
			.filter(provider => provider.category === category)
			.sort((a, b) => b.popularity - a.popularity);
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `integration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Singleton instance
export const integrationsMarketplace = new IntegrationsMarketplace();

// Convenience exports
export default integrationsMarketplace;
