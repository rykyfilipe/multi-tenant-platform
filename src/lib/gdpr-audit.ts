/** @format */

/**
 * GDPR Audit Logging System
 * Tracks all data processing activities for compliance
 */

import { logger } from "./error-logger";

export enum GDPRActivityType {
	DATA_EXPORT = "data_export",
	DATA_DELETION = "data_deletion",
	DATA_ACCESS = "data_access",
	DATA_MODIFICATION = "data_modification",
	CONSENT_GIVEN = "consent_given",
	CONSENT_WITHDRAWN = "consent_withdrawn",
	COOKIE_PREFERENCES_CHANGED = "cookie_preferences_changed",
	ACCOUNT_DELETION = "account_deletion",
	DATA_RECTIFICATION = "data_rectification",
	DATA_PORTABILITY = "data_portability",
}

export interface GDPRAuditEntry {
	id: string;
	timestamp: string;
	userId: string;
	userEmail: string;
	activityType: GDPRActivityType;
	description: string;
	dataSubject: string; // Who the data belongs to
	dataCategories: string[]; // Types of data involved
	legalBasis: string; // Legal basis for processing
	retentionPeriod: string; // How long data is kept
	thirdPartySharing: boolean; // Whether data was shared with third parties
	ipAddress: string;
	userAgent: string;
	additionalData?: Record<string, unknown>;
}

class GDPRAuditLogger {
	private auditEntries: GDPRAuditEntry[] = [];

	/**
	 * Log a GDPR-related activity
	 */
	logActivity(
		userId: string,
		userEmail: string,
		activityType: GDPRActivityType,
		description: string,
		dataSubject: string,
		dataCategories: string[],
		legalBasis: string,
		retentionPeriod: string,
		thirdPartySharing: boolean = false,
		additionalData?: Record<string, unknown>
	): void {
		const auditEntry: GDPRAuditEntry = {
			id: this.generateId(),
			timestamp: new Date().toISOString(),
			userId,
			userEmail,
			activityType,
			description,
			dataSubject,
			dataCategories,
			legalBasis,
			retentionPeriod,
			thirdPartySharing,
			ipAddress: this.getClientIP(),
			userAgent: this.getUserAgent(),
			additionalData,
		};

		// Store in memory (in production, this would go to a secure audit database)
		this.auditEntries.push(auditEntry);

		// Log to centralized logging system
		logger.info("GDPR audit activity logged", {
			component: "GDPRAudit",
			auditEntry,
		});

		// Store in browser localStorage for client-side access
		if (typeof window !== "undefined") {
			try {
				const existingAudit = JSON.parse(localStorage.getItem("gdpr_audit_log") || "[]");
				existingAudit.push(auditEntry);
				
				// Keep only last 100 entries
				if (existingAudit.length > 100) {
					existingAudit.splice(0, existingAudit.length - 100);
				}
				
				localStorage.setItem("gdpr_audit_log", JSON.stringify(existingAudit));
			} catch (err) {
				// Storage might be full or unavailable
				logger.warn("Failed to store GDPR audit log in localStorage", {
					component: "GDPRAudit",
					error: err,
				});
			}
		}
	}

	/**
	 * Log data export activity
	 */
	logDataExport(
		userId: string,
		userEmail: string,
		exportedDataTypes: string[],
		recordCounts: Record<string, number>
	): void {
		this.logActivity(
			userId,
			userEmail,
			GDPRActivityType.DATA_EXPORT,
			`User requested data export containing: ${exportedDataTypes.join(", ")}`,
			userEmail,
			exportedDataTypes,
			"Article 20 - Right to data portability",
			"7 years (audit trail)",
			false,
			{ recordCounts }
		);
	}

	/**
	 * Log account deletion activity
	 */
	logAccountDeletion(
		userId: string,
		userEmail: string,
		deletedDataTypes: string[],
		reason?: string
	): void {
		this.logActivity(
			userId,
			userEmail,
			GDPRActivityType.ACCOUNT_DELETION,
			`User account and all associated data permanently deleted${reason ? ` - Reason: ${reason}` : ""}`,
			userEmail,
			deletedDataTypes,
			"Article 17 - Right to erasure",
			"30 days (audit trail only)",
			false,
			{ reason }
		);
	}

	/**
	 * Log consent changes
	 */
	logConsentChange(
		userId: string,
		userEmail: string,
		consentType: string,
		given: boolean,
		previousPreferences?: Record<string, boolean>
	): void {
		this.logActivity(
			userId,
			userEmail,
			given ? GDPRActivityType.CONSENT_GIVEN : GDPRActivityType.CONSENT_WITHDRAWN,
			`User ${given ? "granted" : "withdrew"} consent for ${consentType}`,
			userEmail,
			["consent_data"],
			"Article 6(1)(a) - Consent",
			"Until consent is withdrawn",
			false,
			{ consentType, given, previousPreferences }
		);
	}

	/**
	 * Log cookie preferences changes
	 */
	logCookiePreferencesChange(
		userId: string,
		userEmail: string,
		preferences: Record<string, boolean>,
		previousPreferences?: Record<string, boolean>
	): void {
		this.logActivity(
			userId,
			userEmail,
			GDPRActivityType.COOKIE_PREFERENCES_CHANGED,
			"User updated cookie preferences",
			userEmail,
			["cookie_preferences"],
			"Article 6(1)(a) - Consent",
			"Until preferences are changed",
			false,
			{ preferences, previousPreferences }
		);
	}

	/**
	 * Log data access
	 */
	logDataAccess(
		userId: string,
		userEmail: string,
		dataType: string,
		accessMethod: string,
		recordCount?: number
	): void {
		this.logActivity(
			userId,
			userEmail,
			GDPRActivityType.DATA_ACCESS,
			`User accessed ${dataType} via ${accessMethod}`,
			userEmail,
			[dataType],
			"Article 6(1)(b) - Contract performance",
			"7 years (audit trail)",
			false,
			{ accessMethod, recordCount }
		);
	}

	/**
	 * Log data modification
	 */
	logDataModification(
		userId: string,
		userEmail: string,
		dataType: string,
		modificationType: string,
		recordCount?: number
	): void {
		this.logActivity(
			userId,
			userEmail,
			GDPRActivityType.DATA_MODIFICATION,
			`User ${modificationType} ${dataType}`,
			userEmail,
			[dataType],
			"Article 6(1)(b) - Contract performance",
			"7 years (audit trail)",
			false,
			{ modificationType, recordCount }
		);
	}

	/**
	 * Get audit trail for a user
	 */
	getUserAuditTrail(userId: string): GDPRAuditEntry[] {
		return this.auditEntries.filter(entry => entry.userId === userId);
	}

	/**
	 * Get all audit entries
	 */
	getAllAuditEntries(): GDPRAuditEntry[] {
		return [...this.auditEntries];
	}

	/**
	 * Export audit trail for compliance reporting
	 */
	exportAuditTrail(userId?: string): GDPRAuditEntry[] {
		const entries = userId ? this.getUserAuditTrail(userId) : this.getAllAuditEntries();
		
		// Log the export itself
		if (userId) {
			const userEmail = entries[0]?.userEmail || "unknown";
			this.logActivity(
				userId,
				userEmail,
				GDPRActivityType.DATA_EXPORT,
				"Audit trail exported for compliance reporting",
				userEmail,
				["audit_logs"],
				"Article 6(1)(c) - Legal obligation",
				"7 years (legal requirement)",
				false,
				{ exportType: "audit_trail" }
			);
		}

		return entries;
	}

	/**
	 * Generate unique ID for audit entry
	 */
	private generateId(): string {
		return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Get client IP address
	 */
	private getClientIP(): string {
		if (typeof window === "undefined") return "server";
		
		// In a real implementation, this would come from the request headers
		return "client_ip_placeholder";
	}

	/**
	 * Get user agent
	 */
	private getUserAgent(): string {
		if (typeof window === "undefined") return "server";
		
		return navigator.userAgent;
	}
}

// Singleton instance
export const gdprAuditLogger = new GDPRAuditLogger();

// Convenience exports
export default gdprAuditLogger;
