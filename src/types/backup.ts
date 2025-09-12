/** @format */

/**
 * Backup & Restore System Types
 * Client-safe types that can be imported in React components
 */

export enum BackupType {
	FULL = "full",
	SCHEMA_ONLY = "schema_only",
	DATA_ONLY = "data_only",
	INCREMENTAL = "incremental",
}

export enum BackupStatus {
	PENDING = "pending",
	IN_PROGRESS = "in_progress",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled",
}

export interface BackupJob {
	id: string;
	tenantId: string;
	type: BackupType;
	status: BackupStatus;
	description?: string;
	filePath?: string;
	fileSize?: number;
	checksum?: string;
	startedAt: string;
	completedAt?: string;
	error?: string;
	metadata: {
		databaseCount: number;
		tableCount: number;
		rowCount: number;
		compressionRatio?: number;
	};
	createdBy: string;
}

export interface RestoreJob {
	id: string;
	tenantId: string;
	backupId: string;
	status: BackupStatus;
	startedAt: string;
	completedAt?: string;
	error?: string;
	restoredBy: string;
}

export interface BackupStats {
	totalBackups: number;
	totalSize: number;
	lastBackup?: string;
	successRate: number;
}

export interface BackupVerification {
	valid: boolean;
	error?: string;
}
