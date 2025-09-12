/** @format */

/**
 * Webhook System for Real-time Notifications
 * Handles webhook creation, delivery, and management
 */

import { logger } from "./error-logger";
import crypto from "crypto";

export enum WebhookEventType {
	// Database Events
	DATABASE_CREATED = "database.created",
	DATABASE_UPDATED = "database.updated",
	DATABASE_DELETED = "database.deleted",
	
	// Table Events
	TABLE_CREATED = "table.created",
	TABLE_UPDATED = "table.updated",
	TABLE_DELETED = "table.deleted",
	
	// Row Events
	ROW_CREATED = "row.created",
	ROW_UPDATED = "row.updated",
	ROW_DELETED = "row.deleted",
	ROW_BULK_CREATED = "row.bulk_created",
	ROW_BULK_UPDATED = "row.bulk_updated",
	ROW_BULK_DELETED = "row.bulk_deleted",
	
	// User Events
	USER_INVITED = "user.invited",
	USER_JOINED = "user.joined",
	USER_LEFT = "user.left",
	USER_ROLE_CHANGED = "user.role_changed",
	
	// System Events
	SYSTEM_MAINTENANCE = "system.maintenance",
	SYSTEM_UPGRADE = "system.upgrade",
	SYSTEM_ERROR = "system.error",
	
	// Billing Events
	SUBSCRIPTION_CREATED = "subscription.created",
	SUBSCRIPTION_UPDATED = "subscription.updated",
	SUBSCRIPTION_CANCELLED = "subscription.cancelled",
	PAYMENT_SUCCEEDED = "payment.succeeded",
	PAYMENT_FAILED = "payment.failed",
	
	// Analytics Events
	ANALYTICS_REPORT_GENERATED = "analytics.report_generated",
	USAGE_LIMIT_REACHED = "usage.limit_reached",
	USAGE_LIMIT_WARNING = "usage.limit_warning",
}

export enum WebhookStatus {
	ACTIVE = "active",
	INACTIVE = "inactive",
	FAILED = "failed",
	DISABLED = "disabled",
}

export enum DeliveryStatus {
	PENDING = "pending",
	DELIVERED = "delivered",
	FAILED = "failed",
	RETRYING = "retrying",
}

export interface WebhookEndpoint {
	id: string;
	tenantId: string;
	name: string;
	url: string;
	description?: string;
	events: WebhookEventType[];
	status: WebhookStatus;
	secret: string;
	headers?: Record<string, string>;
	retryPolicy: {
		maxRetries: number;
		retryDelay: number; // in milliseconds
		backoffMultiplier: number;
	};
	createdAt: string;
	updatedAt: string;
	lastDelivery?: {
		eventId: string;
		status: DeliveryStatus;
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

export interface WebhookEvent {
	id: string;
	tenantId: string;
	type: WebhookEventType;
	data: any;
	metadata: {
		timestamp: string;
		userId?: string;
		userAgent?: string;
		ipAddress?: string;
		requestId?: string;
	};
	deliveries: WebhookDelivery[];
	createdAt: string;
}

export interface WebhookDelivery {
	id: string;
	webhookId: string;
	eventId: string;
	status: DeliveryStatus;
	attempt: number;
	url: string;
	headers: Record<string, string>;
	payload: any;
	response?: {
		statusCode: number;
		headers: Record<string, string>;
		body: string;
		duration: number;
	};
	error?: {
		message: string;
		code?: string;
		stack?: string;
	};
	deliveredAt?: string;
	nextRetryAt?: string;
	createdAt: string;
}

export interface WebhookPayload {
	id: string;
	type: WebhookEventType;
	data: any;
	metadata: {
		timestamp: string;
		tenantId: string;
		userId?: string;
		requestId?: string;
	};
	signature: string;
}

class WebhookSystem {
	private endpoints: Map<string, WebhookEndpoint> = new Map();
	private events: Map<string, WebhookEvent> = new Map();
	private deliveries: Map<string, WebhookDelivery> = new Map();

	/**
	 * Create a new webhook endpoint
	 */
	async createEndpoint(
		tenantId: string,
		name: string,
		url: string,
		events: WebhookEventType[],
		options: {
			description?: string;
			headers?: Record<string, string>;
			retryPolicy?: Partial<WebhookEndpoint["retryPolicy"]>;
		} = {}
	): Promise<WebhookEndpoint> {
		const id = this.generateId();
		const secret = this.generateSecret();
		
		const endpoint: WebhookEndpoint = {
			id,
			tenantId,
			name,
			url,
			description: options.description,
			events,
			status: WebhookStatus.ACTIVE,
			secret,
			headers: options.headers || {},
			retryPolicy: {
				maxRetries: 3,
				retryDelay: 1000,
				backoffMultiplier: 2,
				...options.retryPolicy,
			},
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			statistics: {
				totalDeliveries: 0,
				successfulDeliveries: 0,
				failedDeliveries: 0,
			},
		};

		this.endpoints.set(id, endpoint);

		// Log webhook creation
		logger.info("Webhook endpoint created", {
			component: "WebhookSystem",
			webhookId: id,
			tenantId,
			url,
			events,
		});

		return endpoint;
	}

	/**
	 * Update an existing webhook endpoint
	 */
	async updateEndpoint(
		webhookId: string,
		updates: Partial<Pick<WebhookEndpoint, "name" | "url" | "description" | "events" | "status" | "headers" | "retryPolicy">>
	): Promise<WebhookEndpoint | null> {
		const endpoint = this.endpoints.get(webhookId);
		if (!endpoint) {
			return null;
		}

		const updatedEndpoint = {
			...endpoint,
			...updates,
			updatedAt: new Date().toISOString(),
		};

		this.endpoints.set(webhookId, updatedEndpoint);

		logger.info("Webhook endpoint updated", {
			component: "WebhookSystem",
			webhookId,
			updates,
		});

		return updatedEndpoint;
	}

	/**
	 * Delete a webhook endpoint
	 */
	async deleteEndpoint(webhookId: string): Promise<boolean> {
		const endpoint = this.endpoints.get(webhookId);
		if (!endpoint) {
			return false;
		}

		this.endpoints.delete(webhookId);

		logger.info("Webhook endpoint deleted", {
			component: "WebhookSystem",
			webhookId,
			tenantId: endpoint.tenantId,
		});

		return true;
	}

	/**
	 * Get webhook endpoints for a tenant
	 */
	async getEndpoints(tenantId: string): Promise<WebhookEndpoint[]> {
		return Array.from(this.endpoints.values()).filter(
			endpoint => endpoint.tenantId === tenantId
		);
	}

	/**
	 * Get a specific webhook endpoint
	 */
	async getEndpoint(webhookId: string): Promise<WebhookEndpoint | null> {
		return this.endpoints.get(webhookId) || null;
	}

	/**
	 * Trigger a webhook event
	 */
	async triggerEvent(
		tenantId: string,
		type: WebhookEventType,
		data: any,
		metadata: {
			userId?: string;
			userAgent?: string;
			ipAddress?: string;
			requestId?: string;
		} = {}
	): Promise<WebhookEvent> {
		const eventId = this.generateId();
		
		const event: WebhookEvent = {
			id: eventId,
			tenantId,
			type,
			data,
			metadata: {
				timestamp: new Date().toISOString(),
				...metadata,
			},
			deliveries: [],
			createdAt: new Date().toISOString(),
		};

		this.events.set(eventId, event);

		// Find matching webhook endpoints
		const matchingEndpoints = Array.from(this.endpoints.values()).filter(
			endpoint => 
				endpoint.tenantId === tenantId &&
				endpoint.status === WebhookStatus.ACTIVE &&
				endpoint.events.includes(type)
		);

		// Create deliveries for each matching endpoint
		for (const endpoint of matchingEndpoints) {
			await this.createDelivery(event, endpoint);
		}

		logger.info("Webhook event triggered", {
			component: "WebhookSystem",
			eventId,
			tenantId,
			type,
			endpointCount: matchingEndpoints.length,
		});

		return event;
	}

	/**
	 * Create a delivery for a webhook event
	 */
	private async createDelivery(event: WebhookEvent, endpoint: WebhookEndpoint): Promise<WebhookDelivery> {
		const deliveryId = this.generateId();
		
		const payload = this.createPayload(event, endpoint);
		const signature = this.createSignature(payload, endpoint.secret);

		const delivery: WebhookDelivery = {
			id: deliveryId,
			webhookId: endpoint.id,
			eventId: event.id,
			status: DeliveryStatus.PENDING,
			attempt: 1,
			url: endpoint.url,
			headers: {
				"Content-Type": "application/json",
				"X-Webhook-Signature": signature,
				"X-Webhook-Event": event.type,
				"X-Webhook-Id": event.id,
				"User-Agent": "MultiTenantPlatform-Webhook/1.0",
				...endpoint.headers,
			},
			payload,
			createdAt: new Date().toISOString(),
		};

		this.deliveries.set(deliveryId, delivery);
		event.deliveries.push(delivery);

		// Update endpoint statistics
		endpoint.statistics.totalDeliveries++;
		this.endpoints.set(endpoint.id, endpoint);

		// Attempt delivery
		await this.attemptDelivery(delivery);

		return delivery;
	}

	/**
	 * Attempt to deliver a webhook
	 */
	private async attemptDelivery(delivery: WebhookDelivery): Promise<void> {
		const startTime = Date.now();

		try {
			// Create AbortController for timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			const response = await fetch(delivery.url, {
				method: "POST",
				headers: delivery.headers,
				body: JSON.stringify(delivery.payload),
				signal: controller.signal,
			});

			// Clear timeout if request completes successfully
			clearTimeout(timeoutId);

			const duration = Date.now() - startTime;
			const responseBody = await response.text();

			// Update delivery with response
			delivery.response = {
				statusCode: response.status,
				headers: Object.fromEntries(response.headers.entries()),
				body: responseBody,
				duration,
			};

			if (response.ok) {
				delivery.status = DeliveryStatus.DELIVERED;
				delivery.deliveredAt = new Date().toISOString();

				// Update endpoint statistics
				const endpoint = this.endpoints.get(delivery.webhookId);
				if (endpoint) {
					endpoint.statistics.successfulDeliveries++;
					endpoint.statistics.lastDeliveryAt = delivery.deliveredAt;
					endpoint.lastDelivery = {
						eventId: delivery.eventId,
						status: DeliveryStatus.DELIVERED,
						timestamp: delivery.deliveredAt,
						responseCode: response.status,
						responseBody,
					};
					this.endpoints.set(endpoint.id, endpoint);
				}

				logger.info("Webhook delivered successfully", {
					component: "WebhookSystem",
					deliveryId: delivery.id,
					webhookId: delivery.webhookId,
					statusCode: response.status,
					duration,
				});
			} else {
				throw new Error(`HTTP ${response.status}: ${responseBody}`);
			}
		} catch (error) {
			const duration = Date.now() - startTime;
			
			// Handle timeout specifically
			const isTimeout = error instanceof Error && error.name === 'AbortError';
			const errorMessage = isTimeout 
				? "Request timeout after 30 seconds"
				: error instanceof Error ? error.message : "Unknown error";
			
			delivery.error = {
				message: errorMessage,
				code: isTimeout ? "TIMEOUT" : (error instanceof Error && "code" in error ? String(error.code) : undefined),
				stack: error instanceof Error ? error.stack : undefined,
			};

			// Check if we should retry
			const endpoint = this.endpoints.get(delivery.webhookId);
			if (endpoint && delivery.attempt < endpoint.retryPolicy.maxRetries) {
				delivery.status = DeliveryStatus.RETRYING;
				delivery.attempt++;
				
				// Calculate next retry time with exponential backoff
				const retryDelay = endpoint.retryPolicy.retryDelay * 
					Math.pow(endpoint.retryPolicy.backoffMultiplier, delivery.attempt - 1);
				delivery.nextRetryAt = new Date(Date.now() + retryDelay).toISOString();

				// Schedule retry
				setTimeout(() => {
					this.attemptDelivery(delivery);
				}, retryDelay);

				logger.warn("Webhook delivery failed, retrying", {
					component: "WebhookSystem",
					deliveryId: delivery.id,
					webhookId: delivery.webhookId,
					attempt: delivery.attempt,
					nextRetryAt: delivery.nextRetryAt,
					error: delivery.error,
				});
			} else {
				delivery.status = DeliveryStatus.FAILED;

				// Update endpoint statistics
				if (endpoint) {
					endpoint.statistics.failedDeliveries++;
					endpoint.lastDelivery = {
						eventId: delivery.eventId,
						status: DeliveryStatus.FAILED,
						timestamp: new Date().toISOString(),
						responseCode: delivery.response?.statusCode,
						responseBody: delivery.response?.body,
					};
					this.endpoints.set(endpoint.id, endpoint);
				}

				logger.error("Webhook delivery failed permanently", undefined, {
					component: "WebhookSystem",
					deliveryId: delivery.id,
					webhookId: delivery.webhookId,
					attempts: delivery.attempt,
				}, {
					error: delivery.error,
				});
			}
		}

		this.deliveries.set(delivery.id, delivery);
	}

	/**
	 * Create webhook payload
	 */
	private createPayload(event: WebhookEvent, endpoint: WebhookEndpoint): WebhookPayload {
		return {
			id: event.id,
			type: event.type,
			data: event.data,
			metadata: {
				timestamp: event.metadata.timestamp,
				tenantId: event.tenantId,
				userId: event.metadata.userId,
				requestId: event.metadata.requestId,
			},
			signature: "", // Will be set by createSignature
		};
	}

	/**
	 * Create webhook signature for verification
	 */
	private createSignature(payload: WebhookPayload, secret: string): string {
		const payloadString = JSON.stringify(payload);
		return crypto
			.createHmac("sha256", secret)
			.update(payloadString)
			.digest("hex");
	}

	/**
	 * Verify webhook signature
	 */
	verifySignature(payload: string, signature: string, secret: string): boolean {
		const expectedSignature = crypto
			.createHmac("sha256", secret)
			.update(payload)
			.digest("hex");
		
		return crypto.timingSafeEqual(
			Buffer.from(signature, "hex"),
			Buffer.from(expectedSignature, "hex")
		);
	}

	/**
	 * Get delivery history for a webhook
	 */
	async getDeliveryHistory(webhookId: string, limit: number = 50): Promise<WebhookDelivery[]> {
		return Array.from(this.deliveries.values())
			.filter(delivery => delivery.webhookId === webhookId)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, limit);
	}

	/**
	 * Get event history for a tenant
	 */
	async getEventHistory(tenantId: string, limit: number = 50): Promise<WebhookEvent[]> {
		return Array.from(this.events.values())
			.filter(event => event.tenantId === tenantId)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, limit);
	}

	/**
	 * Test a webhook endpoint
	 */
	async testEndpoint(webhookId: string): Promise<{ success: boolean; response?: any; error?: string }> {
		const endpoint = this.endpoints.get(webhookId);
		if (!endpoint) {
			return { success: false, error: "Webhook endpoint not found" };
		}

		const testEvent = await this.triggerEvent(
			endpoint.tenantId,
			WebhookEventType.SYSTEM_MAINTENANCE,
			{
				message: "This is a test webhook delivery",
				test: true,
			},
			{
				userId: "system",
				requestId: "test-" + Date.now(),
			}
		);

		// Wait for delivery to complete
		await new Promise(resolve => setTimeout(resolve, 5000));

		const delivery = testEvent.deliveries.find(d => d.webhookId === webhookId);
		if (!delivery) {
			return { success: false, error: "No delivery found" };
		}

		return {
			success: delivery.status === DeliveryStatus.DELIVERED,
			response: delivery.response,
			error: delivery.error?.message,
		};
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Generate webhook secret
	 */
	private generateSecret(): string {
		return crypto.randomBytes(32).toString("hex");
	}
}

// Singleton instance
export const webhookSystem = new WebhookSystem();

// Convenience exports
export default webhookSystem;
