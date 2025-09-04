/** @format */

import prisma from './prisma';
import { DigitalSignatureService } from './digital-signature';
import { ANAFIntegrationService } from './anaf-integration';

export interface CancellationReason {
	id: string;
	name: string;
	description: string;
	requiresApproval: boolean;
	requiresANAFNotification: boolean;
	requiresCustomerNotification: boolean;
}

export interface CancellationRequest {
	id: string;
	invoiceId: string;
	tenantId: string;
	requestedBy: string;
	reason: string;
	reasonId: string;
	description: string;
	requestedAt: string;
	status: 'pending' | 'approved' | 'rejected' | 'cancelled';
	approvedBy?: string;
	approvedAt?: string;
	rejectedBy?: string;
	rejectedAt?: string;
	rejectionReason?: string;
	anafNotificationSent?: boolean;
	customerNotificationSent?: boolean;
	cancellationDocument?: string;
}

export interface CancellationDocument {
	id: string;
	invoiceId: string;
	originalInvoiceNumber: string;
	cancellationNumber: string;
	cancellationSeries: string;
	cancellationDate: string;
	reason: string;
	description: string;
	originalAmount: number;
	cancelledAmount: number;
	currency: string;
	status: 'draft' | 'issued' | 'sent' | 'acknowledged';
	createdBy: string;
	createdAt: string;
	digitalSignature?: string;
	anafId?: string;
}

export class InvoiceCancellationService {
	private static instance: InvoiceCancellationService;
	private digitalSignatureService: DigitalSignatureService;
	private anafService: ANAFIntegrationService;

	constructor() {
		this.digitalSignatureService = DigitalSignatureService.getInstance();
		this.anafService = ANAFIntegrationService.getInstance();
	}

	static getInstance(): InvoiceCancellationService {
		if (!InvoiceCancellationService.instance) {
			InvoiceCancellationService.instance = new InvoiceCancellationService();
		}
		return InvoiceCancellationService.instance;
	}

	/**
	 * Get available cancellation reasons
	 */
	getCancellationReasons(): CancellationReason[] {
		return [
			{
				id: 'customer-request',
				name: 'Customer Request',
				description: 'Invoice cancelled at customer request',
				requiresApproval: false,
				requiresANAFNotification: true,
				requiresCustomerNotification: true,
			},
			{
				id: 'duplicate',
				name: 'Duplicate Invoice',
				description: 'Invoice was issued in error (duplicate)',
				requiresApproval: true,
				requiresANAFNotification: true,
				requiresCustomerNotification: true,
			},
			{
				id: 'incorrect-data',
				name: 'Incorrect Data',
				description: 'Invoice contains incorrect data',
				requiresApproval: true,
				requiresANAFNotification: true,
				requiresCustomerNotification: true,
			},
			{
				id: 'payment-issue',
				name: 'Payment Issue',
				description: 'Payment processing issue',
				requiresApproval: false,
				requiresANAFNotification: false,
				requiresCustomerNotification: true,
			},
			{
				id: 'system-error',
				name: 'System Error',
				description: 'Technical error in invoice generation',
				requiresApproval: true,
				requiresANAFNotification: true,
				requiresCustomerNotification: false,
			},
		];
	}

	/**
	 * Request invoice cancellation
	 */
	async requestCancellation(
		invoiceId: string,
		tenantId: string,
		requestedBy: string,
		reasonId: string,
		description: string
	): Promise<CancellationRequest> {
		try {
			// Validate invoice exists and is cancellable
			const invoice = await this.getInvoiceForCancellation(invoiceId, tenantId);
			if (!invoice) {
				throw new Error('Invoice not found or not cancellable');
			}

			// Get cancellation reason
			const reasons = this.getCancellationReasons();
			const reason = reasons.find(r => r.id === reasonId);
			if (!reason) {
				throw new Error('Invalid cancellation reason');
			}

			// Check if cancellation already exists
			const existingRequest = await prisma.cancellationRequest.findFirst({
				where: {
					invoiceId,
					status: { in: ['pending', 'approved'] },
				},
			});

			if (existingRequest) {
				throw new Error('Cancellation request already exists for this invoice');
			}

			// Create cancellation request
			const cancellationRequest: CancellationRequest = {
				id: crypto.randomUUID(),
				invoiceId,
				tenantId,
				requestedBy,
				reason: reason.name,
				reasonId,
				description,
				requestedAt: new Date().toISOString(),
				status: reason.requiresApproval ? 'pending' : 'approved',
			};

			// Save to database
			await prisma.cancellationRequest.create({
				data: {
					id: cancellationRequest.id,
					invoiceId: cancellationRequest.invoiceId,
					tenantId: cancellationRequest.tenantId,
					requestedBy: cancellationRequest.requestedBy,
					reason: cancellationRequest.reason,
					reasonId: cancellationRequest.reasonId,
					description: cancellationRequest.description,
					requestedAt: new Date(cancellationRequest.requestedAt),
					status: cancellationRequest.status,
				},
			});

			// If no approval required, process cancellation immediately
			if (!reason.requiresApproval) {
				await this.processCancellation(cancellationRequest.id);
			}

			return cancellationRequest;
		} catch (error) {
			console.error('Cancellation request error:', error);
			throw new Error(`Failed to request cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Approve cancellation request
	 */
	async approveCancellation(
		requestId: string,
		approvedBy: string
	): Promise<CancellationRequest> {
		try {
			const request = await prisma.cancellationRequest.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				throw new Error('Cancellation request not found');
			}

			if (request.status !== 'pending') {
				throw new Error('Cancellation request is not pending');
			}

			// Update request status
			const updatedRequest = await prisma.cancellationRequest.update({
				where: { id: requestId },
				data: {
					status: 'approved',
					approvedBy,
					approvedAt: new Date(),
				},
			});

			// Process cancellation
			await this.processCancellation(requestId);

			return {
				id: updatedRequest.id,
				invoiceId: updatedRequest.invoiceId,
				tenantId: updatedRequest.tenantId,
				requestedBy: updatedRequest.requestedBy,
				reason: updatedRequest.reason,
				reasonId: updatedRequest.reasonId,
				description: updatedRequest.description,
				requestedAt: updatedRequest.requestedAt.toISOString(),
				status: updatedRequest.status as any,
				approvedBy: updatedRequest.approvedBy,
				approvedAt: updatedRequest.approvedAt?.toISOString(),
			};
		} catch (error) {
			console.error('Cancellation approval error:', error);
			throw new Error(`Failed to approve cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Reject cancellation request
	 */
	async rejectCancellation(
		requestId: string,
		rejectedBy: string,
		rejectionReason: string
	): Promise<CancellationRequest> {
		try {
			const request = await prisma.cancellationRequest.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				throw new Error('Cancellation request not found');
			}

			if (request.status !== 'pending') {
				throw new Error('Cancellation request is not pending');
			}

			// Update request status
			const updatedRequest = await prisma.cancellationRequest.update({
				where: { id: requestId },
				data: {
					status: 'rejected',
					rejectedBy,
					rejectedAt: new Date(),
					rejectionReason,
				},
			});

			return {
				id: updatedRequest.id,
				invoiceId: updatedRequest.invoiceId,
				tenantId: updatedRequest.tenantId,
				requestedBy: updatedRequest.requestedBy,
				reason: updatedRequest.reason,
				reasonId: updatedRequest.reasonId,
				description: updatedRequest.description,
				requestedAt: updatedRequest.requestedAt.toISOString(),
				status: updatedRequest.status as any,
				rejectedBy: updatedRequest.rejectedBy,
				rejectedAt: updatedRequest.rejectedAt?.toISOString(),
				rejectionReason: updatedRequest.rejectionReason,
			};
		} catch (error) {
			console.error('Cancellation rejection error:', error);
			throw new Error(`Failed to reject cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Process cancellation (internal method)
	 */
	private async processCancellation(requestId: string): Promise<void> {
		try {
			const request = await prisma.cancellationRequest.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				throw new Error('Cancellation request not found');
			}

			// Get invoice details
			const invoice = await this.getInvoiceForCancellation(request.invoiceId, request.tenantId);
			if (!invoice) {
				throw new Error('Invoice not found');
			}

			// Get cancellation reason
			const reasons = this.getCancellationReasons();
			const reason = reasons.find(r => r.id === request.reasonId);
			if (!reason) {
				throw new Error('Cancellation reason not found');
			}

			// Generate cancellation document
			const cancellationDocument = await this.generateCancellationDocument(
				request.invoiceId,
				request.tenantId,
				request.reason,
				request.description,
				request.requestedBy
			);

			// Notify ANAF if required
			if (reason.requiresANAFNotification) {
				await this.notifyANAF(cancellationDocument);
			}

			// Notify customer if required
			if (reason.requiresCustomerNotification) {
				await this.notifyCustomer(cancellationDocument, invoice.customerEmail);
			}

			// Update invoice status
			await prisma.invoice.update({
				where: { id: request.invoiceId },
				data: {
					status: 'cancelled',
					cancelledAt: new Date(),
					cancellationReason: request.reason,
					cancellationDescription: request.description,
				},
			});

			// Update request status
			await prisma.cancellationRequest.update({
				where: { id: requestId },
				data: {
					status: 'cancelled',
					cancellationDocument: cancellationDocument.id,
				},
			});
		} catch (error) {
			console.error('Cancellation processing error:', error);
			throw new Error(`Failed to process cancellation: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Generate cancellation document
	 */
	private async generateCancellationDocument(
		invoiceId: string,
		tenantId: string,
		reason: string,
		description: string,
		createdBy: string
	): Promise<CancellationDocument> {
		try {
			// Get invoice details
			const invoice = await this.getInvoiceForCancellation(invoiceId, tenantId);
			if (!invoice) {
				throw new Error('Invoice not found');
			}

			// Generate cancellation number
			const cancellationNumber = await this.generateCancellationNumber(tenantId);

			const cancellationDocument: CancellationDocument = {
				id: crypto.randomUUID(),
				invoiceId,
				originalInvoiceNumber: invoice.invoiceNumber,
				cancellationNumber,
				cancellationSeries: 'CANC',
				cancellationDate: new Date().toISOString(),
				reason,
				description,
				originalAmount: invoice.totalAmount,
				cancelledAmount: invoice.totalAmount,
				currency: invoice.currency,
				status: 'draft',
				createdBy,
				createdAt: new Date().toISOString(),
			};

			// Save to database
			await prisma.cancellationDocument.create({
				data: {
					id: cancellationDocument.id,
					invoiceId: cancellationDocument.invoiceId,
					originalInvoiceNumber: cancellationDocument.originalInvoiceNumber,
					cancellationNumber: cancellationDocument.cancellationNumber,
					cancellationSeries: cancellationDocument.cancellationSeries,
					cancellationDate: new Date(cancellationDocument.cancellationDate),
					reason: cancellationDocument.reason,
					description: cancellationDocument.description,
					originalAmount: cancellationDocument.originalAmount,
					cancelledAmount: cancellationDocument.cancelledAmount,
					currency: cancellationDocument.currency,
					status: cancellationDocument.status,
					createdBy: cancellationDocument.createdBy,
					createdAt: new Date(cancellationDocument.createdAt),
				},
			});

			return cancellationDocument;
		} catch (error) {
			console.error('Cancellation document generation error:', error);
			throw new Error(`Failed to generate cancellation document: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Generate cancellation number
	 */
	private async generateCancellationNumber(tenantId: string): Promise<string> {
		try {
			// Get the last cancellation number for this tenant
			const lastCancellation = await prisma.cancellationDocument.findFirst({
				where: { tenantId },
				orderBy: { createdAt: 'desc' },
			});

			let nextNumber = 1;
			if (lastCancellation) {
				const lastNumber = parseInt(lastCancellation.cancellationNumber.split('-').pop() || '0');
				nextNumber = lastNumber + 1;
			}

			return `CANC-${new Date().getFullYear()}-${nextNumber.toString().padStart(6, '0')}`;
		} catch (error) {
			console.error('Cancellation number generation error:', error);
			throw new Error(`Failed to generate cancellation number: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Notify ANAF about cancellation
	 */
	private async notifyANAF(cancellationDocument: CancellationDocument): Promise<void> {
		try {
			// This would integrate with ANAF API to notify about cancellation
			console.log('Notifying ANAF about cancellation:', cancellationDocument.id);
			// Implementation would go here
		} catch (error) {
			console.error('ANAF notification error:', error);
			// Don't throw error as this is not critical
		}
	}

	/**
	 * Notify customer about cancellation
	 */
	private async notifyCustomer(cancellationDocument: CancellationDocument, customerEmail: string): Promise<void> {
		try {
			// This would send email notification to customer
			console.log('Notifying customer about cancellation:', cancellationDocument.id, customerEmail);
			// Implementation would go here
		} catch (error) {
			console.error('Customer notification error:', error);
			// Don't throw error as this is not critical
		}
	}

	/**
	 * Get invoice for cancellation (helper method)
	 */
	private async getInvoiceForCancellation(invoiceId: string, tenantId: string): Promise<any> {
		try {
			// This would fetch invoice from database
			// For now, return mock data
			return {
				id: invoiceId,
				invoiceNumber: 'INV-2024-000001',
				totalAmount: 1000,
				currency: 'RON',
				customerEmail: 'customer@example.com',
				status: 'issued',
			};
		} catch (error) {
			console.error('Get invoice error:', error);
			return null;
		}
	}

	/**
	 * Get cancellation requests for invoice
	 */
	async getCancellationRequests(invoiceId: string): Promise<CancellationRequest[]> {
		try {
			const requests = await prisma.cancellationRequest.findMany({
				where: { invoiceId },
				orderBy: { requestedAt: 'desc' },
			});

			return requests.map(request => ({
				id: request.id,
				invoiceId: request.invoiceId,
				tenantId: request.tenantId,
				requestedBy: request.requestedBy,
				reason: request.reason,
				reasonId: request.reasonId,
				description: request.description,
				requestedAt: request.requestedAt.toISOString(),
				status: request.status as any,
				approvedBy: request.approvedBy,
				approvedAt: request.approvedAt?.toISOString(),
				rejectedBy: request.rejectedBy,
				rejectedAt: request.rejectedAt?.toISOString(),
				rejectionReason: request.rejectionReason,
				anafNotificationSent: request.anafNotificationSent || false,
				customerNotificationSent: request.customerNotificationSent || false,
				cancellationDocument: request.cancellationDocument,
			}));
		} catch (error) {
			console.error('Get cancellation requests error:', error);
			throw new Error(`Failed to get cancellation requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Get cancellation document
	 */
	async getCancellationDocument(documentId: string): Promise<CancellationDocument | null> {
		try {
			const document = await prisma.cancellationDocument.findUnique({
				where: { id: documentId },
			});

			if (!document) {
				return null;
			}

			return {
				id: document.id,
				invoiceId: document.invoiceId,
				originalInvoiceNumber: document.originalInvoiceNumber,
				cancellationNumber: document.cancellationNumber,
				cancellationSeries: document.cancellationSeries,
				cancellationDate: document.cancellationDate.toISOString(),
				reason: document.reason,
				description: document.description,
				originalAmount: document.originalAmount,
				cancelledAmount: document.cancelledAmount,
				currency: document.currency,
				status: document.status as any,
				createdBy: document.createdBy,
				createdAt: document.createdAt.toISOString(),
				digitalSignature: document.digitalSignature || undefined,
				anafId: document.anafId || undefined,
			};
		} catch (error) {
			console.error('Get cancellation document error:', error);
			throw new Error(`Failed to get cancellation document: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}
}

export default InvoiceCancellationService;
