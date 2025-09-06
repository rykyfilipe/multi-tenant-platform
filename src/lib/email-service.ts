/** @format */

import nodemailer from 'nodemailer';
import { EmailOptions } from './pdf-enhanced-generator';
import prisma from './prisma';

export interface EmailTemplate {
	id: string;
	name: string;
	subject: string;
	body: string;
	variables: string[];
}

export interface EmailQueueItem {
	id: string;
	tenantId: string;
	to: string[];
	cc?: string[];
	bcc?: string[];
	subject: string;
	body: string;
	attachments?: Array<{
		filename: string;
		content: Buffer;
		mimeType: string;
	}>;
	templateId?: string;
	templateVariables?: Record<string, any>;
	priority: 'low' | 'normal' | 'high';
	status: 'pending' | 'sending' | 'sent' | 'failed';
	retryCount: number;
	maxRetries: number;
	scheduledAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export class EmailService {
	private static transporter: nodemailer.Transporter | null = null;
	private static isInitialized = false;

	/**
	 * Initialize email service
	 */
	static async initialize(): Promise<void> {
		if (this.isInitialized) return;

		try {
			// Configure email transporter based on environment
			const emailConfig = {
				host: process.env.SMTP_HOST || 'smtp.gmail.com',
				port: parseInt(process.env.SMTP_PORT || '587'),
				secure: process.env.SMTP_SECURE === 'true',
				auth: {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				},
			};

			this.transporter = nodemailer.createTransport(emailConfig);

			// Verify connection
			await this.transporter.verify();
			this.isInitialized = true;

			console.log('Email service initialized successfully');
		} catch (error) {
			console.error('Failed to initialize email service:', error);
			throw error;
		}
	}

	/**
	 * Send email immediately
	 */
	static async sendEmail(emailOptions: EmailOptions): Promise<boolean> {
		try {
			await this.initialize();

			if (!this.transporter) {
				throw new Error('Email service not initialized');
			}

			const mailOptions = {
				from: process.env.SMTP_FROM || process.env.SMTP_USER,
				to: emailOptions.to.join(', '),
				cc: emailOptions.cc?.join(', '),
				bcc: emailOptions.bcc?.join(', '),
				subject: emailOptions.subject,
				text: emailOptions.body,
				html: this.convertToHTML(emailOptions.body),
				attachments: emailOptions.attachments?.map(attachment => ({
					filename: attachment.filename,
					content: attachment.content,
					contentType: attachment.mimeType,
				})),
			};

			const result = await this.transporter.sendMail(mailOptions);
			console.log('Email sent successfully:', result.messageId);
			return true;
		} catch (error) {
			console.error('Error sending email:', error);
			return false;
		}
	}

	/**
	 * Queue email for sending
	 */
	static async queueEmail(
		tenantId: string,
		emailOptions: EmailOptions,
		options: {
			templateId?: string;
			templateVariables?: Record<string, any>;
			priority?: 'low' | 'normal' | 'high';
			scheduledAt?: Date;
			maxRetries?: number;
		} = {}
	): Promise<string> {
		try {
			const queueItem = await prisma.emailQueue.create({
				data: {
					tenantId: parseInt(tenantId),
					to: emailOptions.to,
					cc: emailOptions.cc,
					bcc: emailOptions.bcc,
					subject: emailOptions.subject,
					body: emailOptions.body,
					attachments: emailOptions.attachments,
					templateId: options.templateId,
					templateVariables: options.templateVariables,
					priority: options.priority || 'normal',
					status: 'pending',
					retryCount: 0,
					maxRetries: options.maxRetries || 3,
					scheduledAt: options.scheduledAt || new Date(),
				},
			});

			// Start processing queue if not already running
			this.processQueue();

			return queueItem.id;
		} catch (error) {
			console.error('Error queuing email:', error);
			throw error;
		}
	}

	/**
	 * Process email queue
	 */
	static async processQueue(): Promise<void> {
		try {
			// Get pending emails ordered by priority and creation time
			const pendingEmails = await prisma.emailQueue.findMany({
				where: {
					status: 'pending',
					scheduledAt: {
						lte: new Date(),
					},
					retryCount: {
						lt: prisma.emailQueue.fields.maxRetries,
					},
				},
				orderBy: [
					{ priority: 'desc' },
					{ createdAt: 'asc' },
				],
				take: 10, // Process 10 emails at a time
			});

			for (const email of pendingEmails) {
				await this.processEmail(email);
			}
		} catch (error) {
			console.error('Error processing email queue:', error);
		}
	}

	/**
	 * Process individual email
	 */
	private static async processEmail(email: any): Promise<void> {
		try {
			// Update status to sending
			await prisma.emailQueue.update({
				where: { id: email.id },
				data: { status: 'sending' },
			});

			// Prepare email options
			const emailOptions: EmailOptions = {
				to: email.to,
				cc: email.cc,
				bcc: email.bcc,
				subject: email.subject,
				body: email.body,
				attachments: email.attachments,
			};

			// Apply template if specified
			if (email.templateId && email.templateVariables) {
				const template = await this.getEmailTemplate(email.templateId);
				if (template) {
					emailOptions.subject = this.applyTemplate(template.subject, email.templateVariables);
					emailOptions.body = this.applyTemplate(template.body, email.templateVariables);
				}
			}

			// Send email
			const success = await this.sendEmail(emailOptions);

			// Update status
			await prisma.emailQueue.update({
				where: { id: email.id },
				data: {
					status: success ? 'sent' : 'failed',
					retryCount: email.retryCount + 1,
					updatedAt: new Date(),
				},
			});

			// Log email result
			await prisma.invoiceAuditLog.create({
				data: {
					tenantId: email.tenantId,
					action: 'email_sent',
					status: success ? 'success' : 'error',
					metadata: {
						emailId: email.id,
						recipients: email.to,
						subject: email.subject,
						retryCount: email.retryCount + 1,
					},
				},
			});

		} catch (error) {
			console.error('Error processing email:', error);
			
			// Update status to failed
			await prisma.emailQueue.update({
				where: { id: email.id },
				data: {
					status: 'failed',
					retryCount: email.retryCount + 1,
					updatedAt: new Date(),
				},
			});
		}
	}

	/**
	 * Get email template
	 */
	static async getEmailTemplate(templateId: string): Promise<EmailTemplate | null> {
		try {
			const template = await prisma.emailTemplate.findUnique({
				where: { id: templateId },
			});

			return template ? {
				id: template.id,
				name: template.name,
				subject: template.subject,
				body: template.body,
				variables: template.variables || [],
			} : null;
		} catch (error) {
			console.error('Error getting email template:', error);
			return null;
		}
	}

	/**
	 * Create email template
	 */
	static async createEmailTemplate(
		tenantId: string,
		template: Omit<EmailTemplate, 'id'>
	): Promise<string> {
		try {
			const created = await prisma.emailTemplate.create({
				data: {
					tenantId: parseInt(tenantId),
					name: template.name,
					subject: template.subject,
					body: template.body,
					variables: template.variables,
				},
			});

			return created.id;
		} catch (error) {
			console.error('Error creating email template:', error);
			throw error;
		}
	}

	/**
	 * Update email template
	 */
	static async updateEmailTemplate(
		templateId: string,
		updates: Partial<EmailTemplate>
	): Promise<void> {
		try {
			await prisma.emailTemplate.update({
				where: { id: templateId },
				data: {
					name: updates.name,
					subject: updates.subject,
					body: updates.body,
					variables: updates.variables,
				},
			});
		} catch (error) {
			console.error('Error updating email template:', error);
			throw error;
		}
	}

	/**
	 * Delete email template
	 */
	static async deleteEmailTemplate(templateId: string): Promise<void> {
		try {
			await prisma.emailTemplate.delete({
				where: { id: templateId },
			});
		} catch (error) {
			console.error('Error deleting email template:', error);
			throw error;
		}
	}

	/**
	 * Get email queue status
	 */
	static async getQueueStatus(tenantId: string): Promise<{
		pending: number;
		sending: number;
		sent: number;
		failed: number;
	}> {
		try {
			const counts = await prisma.emailQueue.groupBy({
				by: ['status'],
				where: { tenantId: parseInt(tenantId) },
				_count: { status: true },
			});

			const statusCounts = {
				pending: 0,
				sending: 0,
				sent: 0,
				failed: 0,
			};

			counts.forEach((count: any) => {
				statusCounts[count.status as keyof typeof statusCounts] = count._count.status;
			});

			return statusCounts;
		} catch (error) {
			console.error('Error getting queue status:', error);
			return { pending: 0, sending: 0, sent: 0, failed: 0 };
		}
	}

	/**
	 * Retry failed emails
	 */
	static async retryFailedEmails(tenantId: string): Promise<number> {
		try {
			const result = await prisma.emailQueue.updateMany({
				where: {
					tenantId: parseInt(tenantId),
					status: 'failed',
					retryCount: {
						lt: prisma.emailQueue.fields.maxRetries,
					},
				},
				data: {
					status: 'pending',
					scheduledAt: new Date(),
				},
			});

			// Start processing queue
			this.processQueue();

			return result.count;
		} catch (error) {
			console.error('Error retrying failed emails:', error);
			return 0;
		}
	}

	/**
	 * Clean up old emails
	 */
	static async cleanupOldEmails(daysOld: number = 30): Promise<number> {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - daysOld);

			const result = await prisma.emailQueue.deleteMany({
				where: {
					status: 'sent',
					updatedAt: {
						lt: cutoffDate,
					},
				},
			});

			return result.count;
		} catch (error) {
			console.error('Error cleaning up old emails:', error);
			return 0;
		}
	}

	/**
	 * Apply template variables
	 */
	private static applyTemplate(template: string, variables: Record<string, any>): string {
		let result = template;
		
		Object.entries(variables).forEach(([key, value]) => {
			const placeholder = `{{${key}}}`;
			result = result.replace(new RegExp(placeholder, 'g'), String(value));
		});

		return result;
	}

	/**
	 * Convert text to HTML
	 */
	private static convertToHTML(text: string): string {
		// Simple text to HTML conversion
		return text
			.replace(/\n/g, '<br>')
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
			.replace(/\*(.*?)\*/g, '<em>$1</em>');
	}

	/**
	 * Get email statistics
	 */
	static async getEmailStatistics(tenantId: string, days: number = 30): Promise<{
		totalSent: number;
		totalFailed: number;
		successRate: number;
		averageDeliveryTime: number;
		topRecipients: Array<{ email: string; count: number }>;
	}> {
		try {
			const cutoffDate = new Date();
			cutoffDate.setDate(cutoffDate.getDate() - days);

			const [sentCount, failedCount, emails] = await Promise.all([
				prisma.emailQueue.count({
					where: {
						tenantId: parseInt(tenantId),
						status: 'sent',
						createdAt: { gte: cutoffDate },
					},
				}),
				prisma.emailQueue.count({
					where: {
						tenantId: parseInt(tenantId),
						status: 'failed',
						createdAt: { gte: cutoffDate },
					},
				}),
				prisma.emailQueue.findMany({
					where: {
						tenantId: parseInt(tenantId),
						status: 'sent',
						createdAt: { gte: cutoffDate },
					},
					select: {
						to: true,
						createdAt: true,
						updatedAt: true,
					},
				}),
			]);

			const totalSent = sentCount;
			const totalFailed = failedCount;
			const successRate = totalSent + totalFailed > 0 ? (totalSent / (totalSent + totalFailed)) * 100 : 0;

			// Calculate average delivery time
			const deliveryTimes = emails
				.map((email: any) => email.updatedAt.getTime() - email.createdAt.getTime())
				.filter((time: any) => time > 0);
			const averageDeliveryTime = deliveryTimes.length > 0 
				? deliveryTimes.reduce((sum: any, time: any) => sum + time, 0) / deliveryTimes.length 
				: 0;

			// Get top recipients
			const recipientCounts: Record<string, number> = {};
			emails.forEach((email: any) => {
				email.to.forEach((recipient: any) => {
					recipientCounts[recipient] = (recipientCounts[recipient] || 0) + 1;
				});
			});

			const topRecipients = Object.entries(recipientCounts)
				.map(([email, count]) => ({ email, count }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 10);

			return {
				totalSent,
				totalFailed,
				successRate,
				averageDeliveryTime,
				topRecipients,
			};
		} catch (error) {
			console.error('Error getting email statistics:', error);
			return {
				totalSent: 0,
				totalFailed: 0,
				successRate: 0,
				averageDeliveryTime: 0,
				topRecipients: [],
			};
		}
	}
}
