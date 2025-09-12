/** @format */

import prisma from './prisma';
import { DigitalSignatureService } from './digital-signature';
import { ANAFIntegrationService } from './anaf-integration';

export interface ApprovalRule {
	id: string;
	name: string;
	description: string;
	conditions: ApprovalCondition[];
	approvers: string[];
	requiredApprovals: number;
	timeoutHours: number;
	priority: 'low' | 'medium' | 'high' | 'critical';
	active: boolean;
}

export interface ApprovalCondition {
	field: string;
	operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
	value: any;
}

export interface ApprovalRequest {
	id: string;
	invoiceId: string;
	tenantId: string;
	requestedBy: string;
	requestedAt: string;
	status: 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
	ruleId: string;
	ruleName: string;
	priority: 'low' | 'medium' | 'high' | 'critical';
	requiredApprovals: number;
	currentApprovals: number;
	approvers: string[];
	approvals: Approval[];
	rejections: Rejection[];
	expiresAt: string;
	completedAt?: string;
	completedBy?: string;
}

export interface Approval {
	id: string;
	requestId: string;
	approverId: string;
	approverName: string;
	approverEmail: string;
	approvedAt: string;
	comments?: string;
	digitalSignature?: string;
}

export interface Rejection {
	id: string;
	requestId: string;
	rejectorId: string;
	rejectorName: string;
	rejectorEmail: string;
	rejectedAt: string;
	reason: string;
	comments?: string;
}

export interface ApprovalWorkflow {
	id: string;
	name: string;
	description: string;
	rules: ApprovalRule[];
	active: boolean;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export class InvoiceApprovalService {
	private static instance: InvoiceApprovalService;
	private digitalSignatureService: DigitalSignatureService;
	private anafService: ANAFIntegrationService;

	constructor() {
		this.digitalSignatureService = DigitalSignatureService.getInstance();
		this.anafService = ANAFIntegrationService.getInstance();
	}

	static getInstance(): InvoiceApprovalService {
		if (!InvoiceApprovalService.instance) {
			InvoiceApprovalService.instance = new InvoiceApprovalService();
		}
		return InvoiceApprovalService.instance;
	}

	/**
	 * Create approval workflow
	 */
	async createWorkflow(
		name: string,
		description: string,
		rules: Omit<ApprovalRule, 'id'>[],
		createdBy: string
	): Promise<ApprovalWorkflow> {
		try {
			const workflowId = crypto.randomUUID();
			const now = new Date().toISOString();

			const workflow: ApprovalWorkflow = {
				id: workflowId,
				name,
				description,
				rules: rules.map(rule => ({
					...rule,
					id: crypto.randomUUID(),
				})),
				active: true,
				createdBy,
				createdAt: now,
				updatedAt: now,
			};

			// Save to database
			await prisma.approvalWorkflow.create({
				data: {
					id: workflow.id,
					name: workflow.name,
					description: workflow.description,
					active: workflow.active,
					createdBy: workflow.createdBy,
					createdAt: new Date(workflow.createdAt),
					updatedAt: new Date(workflow.updatedAt),
				},
			});

			// Save rules
			for (const rule of workflow.rules) {
				await prisma.approvalRule.create({
					data: {
						id: rule.id,
						workflowId: workflow.id,
						name: rule.name,
						description: rule.description,
						conditions: JSON.stringify(rule.conditions),
						approvers: JSON.stringify(rule.approvers),
						requiredApprovals: rule.requiredApprovals,
						timeoutHours: rule.timeoutHours,
						priority: rule.priority,
						active: rule.active,
					},
				});
			}

			return workflow;
		} catch (error) {
			console.error('Create workflow error:', error);
			throw new Error(`Failed to create approval workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Request invoice approval
	 */
	async requestApproval(
		invoiceId: string,
		tenantId: string,
		requestedBy: string
	): Promise<ApprovalRequest> {
		try {
			// Get invoice details
			const invoice = await this.getInvoiceForApproval(invoiceId, tenantId);
			if (!invoice) {
				throw new Error('Invoice not found');
			}

			// Find applicable approval rules
			const applicableRules = await this.findApplicableRules(invoice, tenantId);
			if (applicableRules.length === 0) {
				throw new Error('No approval rules found for this invoice');
			}

			// Get the highest priority rule
			const rule = applicableRules.sort((a, b) => {
				const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
				return priorityOrder[b.priority] - priorityOrder[a.priority];
			})[0];

			// Check if approval request already exists
			const existingRequest = await prisma.approvalRequest.findFirst({
				where: {
					invoiceId,
					status: { in: ['pending', 'approved'] },
				},
			});

			if (existingRequest) {
				throw new Error('Approval request already exists for this invoice');
			}

			// Create approval request
			const requestId = crypto.randomUUID();
			const now = new Date();
			const expiresAt = new Date(now.getTime() + rule.timeoutHours * 60 * 60 * 1000);

			const approvalRequest: ApprovalRequest = {
				id: requestId,
				invoiceId,
				tenantId,
				requestedBy,
				requestedAt: now.toISOString(),
				status: 'pending',
				ruleId: rule.id,
				ruleName: rule.name,
				priority: rule.priority,
				requiredApprovals: rule.requiredApprovals,
				currentApprovals: 0,
				approvers: rule.approvers,
				approvals: [],
				rejections: [],
				expiresAt: expiresAt.toISOString(),
			};

			// Save to database
			await prisma.approvalRequest.create({
				data: {
					id: approvalRequest.id,
					invoiceId: approvalRequest.invoiceId,
					tenantId: approvalRequest.tenantId,
					requestedBy: approvalRequest.requestedBy,
					requestedAt: new Date(approvalRequest.requestedAt),
					status: approvalRequest.status,
					ruleId: approvalRequest.ruleId,
					ruleName: approvalRequest.ruleName,
					priority: approvalRequest.priority,
					requiredApprovals: approvalRequest.requiredApprovals,
					currentApprovals: approvalRequest.currentApprovals,
					approvers: JSON.stringify(approvalRequest.approvers),
					expiresAt: new Date(approvalRequest.expiresAt),
				},
			});

			// Notify approvers
			await this.notifyApprovers(approvalRequest);

			return approvalRequest;
		} catch (error) {
			console.error('Request approval error:', error);
			throw new Error(`Failed to request approval: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Approve invoice
	 */
	async approveInvoice(
		requestId: string,
		approverId: string,
		approverName: string,
		approverEmail: string,
		comments?: string
	): Promise<ApprovalRequest> {
		try {
			const request = await prisma.approvalRequest.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				throw new Error('Approval request not found');
			}

			if (request.status !== 'pending') {
				throw new Error('Approval request is not pending');
			}

			// Check if approver is authorized
			const approvers = JSON.parse(request.approvers);
			if (!approvers.includes(approverId)) {
				throw new Error('User is not authorized to approve this invoice');
			}

			// Check if already approved by this user
			const existingApproval = await prisma.approval.findFirst({
				where: {
					requestId,
					approverId,
				},
			});

			if (existingApproval) {
				throw new Error('Invoice already approved by this user');
			}

			// Create approval
			const approvalId = crypto.randomUUID();
			const approval: Approval = {
				id: approvalId,
				requestId,
				approverId,
				approverName,
				approverEmail,
				approvedAt: new Date().toISOString(),
				comments,
			};

			// Add digital signature if required
			if (process.env.REQUIRE_DIGITAL_SIGNATURE === 'true') {
				const signature = await this.digitalSignatureService.signInvoice(
					JSON.stringify(approval),
					approverId,
					approverName,
					approverEmail
				);
				approval.digitalSignature = signature.id;
			}

			// Save approval
			await prisma.approval.create({
				data: {
					id: approval.id,
					requestId: approval.requestId,
					approverId: approval.approverId,
					approverName: approval.approverName,
					approverEmail: approval.approverEmail,
					approvedAt: new Date(approval.approvedAt),
					comments: approval.comments,
					digitalSignature: approval.digitalSignature,
				},
			});

			// Update request
			const newCurrentApprovals = request.currentApprovals + 1;
			const isFullyApproved = newCurrentApprovals >= request.requiredApprovals;

			await prisma.approvalRequest.update({
				where: { id: requestId },
				data: {
					currentApprovals: newCurrentApprovals,
					status: isFullyApproved ? 'approved' : 'pending',
					completedAt: isFullyApproved ? new Date() : undefined,
					completedBy: isFullyApproved ? approverId : undefined,
				},
			});

			// If fully approved, process the invoice
			if (isFullyApproved) {
				await this.processApprovedInvoice(requestId);
			}

			// Get updated request
			const updatedRequest = await this.getApprovalRequest(requestId);
			return updatedRequest!;
		} catch (error) {
			console.error('Approve invoice error:', error);
			throw new Error(`Failed to approve invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Reject invoice
	 */
	async rejectInvoice(
		requestId: string,
		rejectorId: string,
		rejectorName: string,
		rejectorEmail: string,
		reason: string,
		comments?: string
	): Promise<ApprovalRequest> {
		try {
			const request = await prisma.approvalRequest.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				throw new Error('Approval request not found');
			}

			if (request.status !== 'pending') {
				throw new Error('Approval request is not pending');
			}

			// Check if rejector is authorized
			const approvers = JSON.parse(request.approvers);
			if (!approvers.includes(rejectorId)) {
				throw new Error('User is not authorized to reject this invoice');
			}

			// Create rejection
			const rejectionId = crypto.randomUUID();
			const rejection: Rejection = {
				id: rejectionId,
				requestId,
				rejectorId,
				rejectorName,
				rejectorEmail,
				rejectedAt: new Date().toISOString(),
				reason,
				comments,
			};

			// Save rejection
			await prisma.rejection.create({
				data: {
					id: rejection.id,
					requestId: rejection.requestId,
					rejectorId: rejection.rejectorId,
					rejectorName: rejection.rejectorName,
					rejectorEmail: rejection.rejectorEmail,
					rejectedAt: new Date(rejection.rejectedAt),
					reason: rejection.reason,
					comments: rejection.comments,
				},
			});

			// Update request status
			await prisma.approvalRequest.update({
				where: { id: requestId },
				data: {
					status: 'rejected',
					completedAt: new Date(),
					completedBy: rejectorId,
				},
			});

			// Get updated request
			const updatedRequest = await this.getApprovalRequest(requestId);
			return updatedRequest!;
		} catch (error) {
			console.error('Reject invoice error:', error);
			throw new Error(`Failed to reject invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	/**
	 * Process approved invoice
	 */
	private async processApprovedInvoice(requestId: string): Promise<void> {
		try {
			const request = await prisma.approvalRequest.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				throw new Error('Approval request not found');
			}

			// Update invoice status
			await prisma.invoice.update({
				where: { id: request.invoiceId },
				data: {
					status: 'approved',
					approvedAt: new Date(),
					approvedBy: request.completedBy,
				},
			});

			// Notify stakeholders
			await this.notifyApprovalCompletion(request);

			// Submit to ANAF if required
			if (process.env.REQUIRE_ANAF_SUBMISSION === 'true') {
				await this.submitToANAF(request.invoiceId, request.tenantId);
			}
		} catch (error) {
			console.error('Process approved invoice error:', error);
			// Don't throw error as this is not critical
		}
	}

	/**
	 * Find applicable approval rules
	 */
	private async findApplicableRules(invoice: any, tenantId: string): Promise<ApprovalRule[]> {
		try {
			const rules = await prisma.approvalRule.findMany({
				where: {
					workflow: {
						tenantId,
						active: true,
					},
					active: true,
				},
			});

			const applicableRules: ApprovalRule[] = [];

			for (const rule of rules) {
				const conditions = JSON.parse(rule.conditions);
				const approvers = JSON.parse(rule.approvers);

				if (this.evaluateConditions(invoice, conditions)) {
					applicableRules.push({
						id: rule.id,
						name: rule.name,
						description: rule.description,
						conditions,
						approvers,
						requiredApprovals: rule.requiredApprovals,
						timeoutHours: rule.timeoutHours,
						priority: rule.priority as any,
						active: rule.active,
					});
				}
			}

			return applicableRules;
		} catch (error) {
			console.error('Find applicable rules error:', error);
			return [];
		}
	}

	/**
	 * Evaluate approval conditions
	 */
	private evaluateConditions(invoice: any, conditions: ApprovalCondition[]): boolean {
		for (const condition of conditions) {
			const fieldValue = this.getFieldValue(invoice, condition.field);
			
			if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Get field value from invoice
	 */
	private getFieldValue(invoice: any, field: string): any {
		const fields = field.split('.');
		let value = invoice;

		for (const fieldName of fields) {
			value = value?.[fieldName];
		}

		return value;
	}

	/**
	 * Evaluate single condition
	 */
	private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
		switch (operator) {
			case 'equals':
				return fieldValue === expectedValue;
			case 'not_equals':
				return fieldValue !== expectedValue;
			case 'greater_than':
				return Number(fieldValue) > Number(expectedValue);
			case 'less_than':
				return Number(fieldValue) < Number(expectedValue);
			case 'contains':
				return String(fieldValue).includes(String(expectedValue));
			case 'not_contains':
				return !String(fieldValue).includes(String(expectedValue));
			default:
				return false;
		}
	}

	/**
	 * Get approval request
	 */
	async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
		try {
			const request = await prisma.approvalRequest.findUnique({
				where: { id: requestId },
			});

			if (!request) {
				return null;
			}

			const approvals = await prisma.approval.findMany({
				where: { requestId },
				orderBy: { approvedAt: 'asc' },
			});

			const rejections = await prisma.rejection.findMany({
				where: { requestId },
				orderBy: { rejectedAt: 'asc' },
			});

			return {
				id: request.id,
				invoiceId: request.invoiceId,
				tenantId: request.tenantId,
				requestedBy: request.requestedBy,
				requestedAt: request.requestedAt.toISOString(),
				status: request.status as any,
				ruleId: request.ruleId,
				ruleName: request.ruleName,
				priority: request.priority as any,
				requiredApprovals: request.requiredApprovals,
				currentApprovals: request.currentApprovals,
				approvers: JSON.parse(request.approvers),
				approvals: approvals.map((approval : any) => ({
					id: approval.id,
					requestId: approval.requestId,
					approverId: approval.approverId,
					approverName: approval.approverName,
					approverEmail: approval.approverEmail,
					approvedAt: approval.approvedAt.toISOString(),
					comments: approval.comments || undefined,
					digitalSignature: approval.digitalSignature || undefined,
				})),
				rejections: rejections.map((rejection : any) => ({
					id: rejection.id,
					requestId: rejection.requestId,
					rejectorId: rejection.rejectorId,
					rejectorName: rejection.rejectorName,
					rejectorEmail: rejection.rejectorEmail,
					rejectedAt: rejection.rejectedAt.toISOString(),
					reason: rejection.reason,
					comments: rejection.comments || undefined,
				})),
				expiresAt: request.expiresAt.toISOString(),
				completedAt: request.completedAt?.toISOString(),
				completedBy: request.completedBy,
			};
		} catch (error) {
			console.error('Get approval request error:', error);
			return null;
		}
	}

	/**
	 * Get invoice for approval (helper method)
	 */
	private async getInvoiceForApproval(invoiceId: string, tenantId: string): Promise<any> {
		try {
			// This would fetch invoice from database
			// For now, return mock data
			return {
				id: invoiceId,
				totalAmount: 1000,
				currency: 'RON',
				customerId: 'customer-1',
				status: 'draft',
			};
		} catch (error) {
			console.error('Get invoice error:', error);
			return null;
		}
	}

	/**
	 * Notify approvers
	 */
	private async notifyApprovers(request: ApprovalRequest): Promise<void> {
		try {
			// This would send notifications to approvers
			console.log('Notifying approvers for request:', request.id);
			// Implementation would go here
		} catch (error) {
			console.error('Notify approvers error:', error);
			// Don't throw error as this is not critical
		}
	}

	/**
	 * Notify approval completion
	 */
	private async notifyApprovalCompletion(request: any): Promise<void> {
		try {
			// This would send notifications about approval completion
			console.log('Notifying approval completion for request:', request.id);
			// Implementation would go here
		} catch (error) {
			console.error('Notify approval completion error:', error);
			// Don't throw error as this is not critical
		}
	}

	/**
	 * Submit to ANAF
	 */
	private async submitToANAF(invoiceId: string, tenantId: string): Promise<void> {
		try {
			// This would submit invoice to ANAF
			console.log('Submitting invoice to ANAF:', invoiceId);
			// Implementation would go here
		} catch (error) {
			console.error('Submit to ANAF error:', error);
			// Don't throw error as this is not critical
		}
	}
}

export default InvoiceApprovalService;
