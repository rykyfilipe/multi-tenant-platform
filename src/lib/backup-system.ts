/** @format */

/**
 * Backup & Restore System using Prisma with PostgreSQL
 * Leverages Prisma's built-in database management capabilities
 */

import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "./error-logger";
import prisma from "./prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const execAsync = promisify(exec);

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

class BackupSystem {
	private backups: Map<string, BackupJob> = new Map();
	private restores: Map<string, RestoreJob> = new Map();
	private readonly backupDir = path.join(process.cwd(), "backups");

	constructor() {
		this.ensureBackupDirectory();
	}

	/**
	 * Ensure backup directory exists
	 */
	private async ensureBackupDirectory(): Promise<void> {
		try {
			await fs.access(this.backupDir);
		} catch {
			await fs.mkdir(this.backupDir, { recursive: true });
		}
	}

	/**
	 * Create a full database backup using Prisma and pg_dump
	 */
	async createBackup(
		tenantId: string,
		type: BackupType = BackupType.FULL,
		description?: string,
		createdBy: string = "system"
	): Promise<BackupJob> {
		const backupId = this.generateId();
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const fileName = `backup_${tenantId}_${type}_${timestamp}.sql`;
		const filePath = path.join(this.backupDir, fileName);

		const backupJob: BackupJob = {
			id: backupId,
			tenantId,
			type,
			status: BackupStatus.PENDING,
			description,
			filePath,
			startedAt: new Date().toISOString(),
			metadata: {
				databaseCount: 0,
				tableCount: 0,
				rowCount: 0,
			},
			createdBy,
		};

		this.backups.set(backupId, backupJob);

		// Start backup process asynchronously
		this.performBackup(backupJob).catch(error => {
			logger.error("Backup process failed", error as Error, {
				component: "BackupSystem",
				backupId,
				tenantId,
			});
		});

		return backupJob;
	}

	/**
	 * Perform the actual backup operation
	 */
	private async performBackup(backupJob: BackupJob): Promise<void> {
		try {
			backupJob.status = BackupStatus.IN_PROGRESS;
			this.backups.set(backupJob.id, backupJob);

			logger.info("Starting backup process", {
				component: "BackupSystem",
				backupId: backupJob.id,
				tenantId: backupJob.tenantId,
				type: backupJob.type,
			});

			// Get database connection details from Prisma
			const databaseUrl = process.env.DATABASE_URL;
			if (!databaseUrl) {
				throw new Error("DATABASE_URL not configured");
			}

			// Parse database URL to get connection details
			const url = new URL(databaseUrl);
			const host = url.hostname;
			const port = url.port || "5432";
			const database = url.pathname.slice(1);
			const username = url.username;
			const password = url.password;

			// Build pg_dump command based on backup type
			let pgDumpCommand = `pg_dump`;
			
			// Add connection parameters
			pgDumpCommand += ` -h ${host} -p ${port} -U ${username} -d ${database}`;
			
			// Add backup type specific options
			switch (backupJob.type) {
				case BackupType.SCHEMA_ONLY:
					pgDumpCommand += ` --schema-only`;
					break;
				case BackupType.DATA_ONLY:
					pgDumpCommand += ` --data-only`;
					break;
				case BackupType.FULL:
				default:
					pgDumpCommand += ` --verbose --clean --no-owner --no-privileges`;
					break;
			}

			// Add output file
			pgDumpCommand += ` -f "${backupJob.filePath}"`;

			// Set password environment variable
			const env = { ...process.env, PGPASSWORD: password };

			// Execute backup command
			const { stdout, stderr } = await execAsync(pgDumpCommand, { env });

			// Get file size
			const stats = await fs.stat(backupJob.filePath!);
			backupJob.fileSize = stats.size;

			// Calculate checksum
			const fileContent = await fs.readFile(backupJob.filePath!);
			backupJob.checksum = crypto.createHash("sha256").update(fileContent).digest("hex");

			// Get metadata about the backup
			await this.updateBackupMetadata(backupJob);

			// Mark as completed
			backupJob.status = BackupStatus.COMPLETED;
			backupJob.completedAt = new Date().toISOString();
			this.backups.set(backupJob.id, backupJob);

			logger.info("Backup completed successfully", {
				component: "BackupSystem",
				backupId: backupJob.id,
				tenantId: backupJob.tenantId,
				fileSize: backupJob.fileSize,
				checksum: backupJob.checksum,
			});

		} catch (error) {
			backupJob.status = BackupStatus.FAILED;
			backupJob.error = error instanceof Error ? error.message : "Unknown error";
			backupJob.completedAt = new Date().toISOString();
			this.backups.set(backupJob.id, backupJob);

			logger.error("Backup failed", error as Error, {
				component: "BackupSystem",
				backupId: backupJob.id,
				tenantId: backupJob.tenantId,
			});
		}
	}

	/**
	 * Update backup metadata by analyzing the backup file
	 */
	private async updateBackupMetadata(backupJob: BackupJob): Promise<void> {
		try {
			// Count databases, tables, and rows from the backup file
			const backupContent = await fs.readFile(backupJob.filePath!, "utf8");
			
			// Count CREATE TABLE statements
			const tableMatches = backupContent.match(/CREATE TABLE/g);
			backupJob.metadata.tableCount = tableMatches ? tableMatches.length : 0;

			// Count INSERT statements (approximate row count)
			const insertMatches = backupContent.match(/INSERT INTO/g);
			backupJob.metadata.rowCount = insertMatches ? insertMatches.length : 0;

			// For tenant-specific backups, we might want to filter by tenant
			if (backupJob.tenantId !== "all") {
				// This would require more sophisticated parsing for tenant-specific data
				// For now, we'll use the full counts
			}

			// Calculate compression ratio if applicable
			if (backupJob.type === BackupType.FULL) {
				// This is a rough estimate - in production you might want to use actual compression
				backupJob.metadata.compressionRatio = 1.0; // No compression for SQL dumps
			}

		} catch (error) {
			logger.warn("Failed to update backup metadata", {
				component: "BackupSystem",
				backupId: backupJob.id,
				error: error instanceof Error ? error.message : "Unknown error",
			});
		}
	}

	/**
	 * Restore from a backup file
	 */
	async restoreFromBackup(
		backupId: string,
		tenantId: string,
		restoredBy: string = "system"
	): Promise<RestoreJob> {
		const backup = this.backups.get(backupId);
		if (!backup) {
			throw new Error("Backup not found");
		}

		if (backup.status !== BackupStatus.COMPLETED) {
			throw new Error("Backup is not completed");
		}

		const restoreId = this.generateId();
		const restoreJob: RestoreJob = {
			id: restoreId,
			tenantId,
			backupId,
			status: BackupStatus.PENDING,
			startedAt: new Date().toISOString(),
			restoredBy,
		};

		this.restores.set(restoreId, restoreJob);

		// Start restore process asynchronously
		this.performRestore(restoreJob, backup).catch(error => {
			logger.error("Restore process failed", error as Error, {
				component: "BackupSystem",
				restoreId,
				backupId,
				tenantId,
			});
		});

		return restoreJob;
	}

	/**
	 * Perform the actual restore operation
	 */
	private async performRestore(restoreJob: RestoreJob, backup: BackupJob): Promise<void> {
		try {
			restoreJob.status = BackupStatus.IN_PROGRESS;
			this.restores.set(restoreJob.id, restoreJob);

			logger.info("Starting restore process", {
				component: "BackupSystem",
				restoreId: restoreJob.id,
				backupId: restoreJob.backupId,
				tenantId: restoreJob.tenantId,
			});

			// Get database connection details
			const databaseUrl = process.env.DATABASE_URL;
			if (!databaseUrl) {
				throw new Error("DATABASE_URL not configured");
			}

			const url = new URL(databaseUrl);
			const host = url.hostname;
			const port = url.port || "5432";
			const database = url.pathname.slice(1);
			const username = url.username;
			const password = url.password;

			// Build psql command for restore
			let psqlCommand = `psql`;
			psqlCommand += ` -h ${host} -p ${port} -U ${username} -d ${database}`;
			psqlCommand += ` -f "${backup.filePath}"`;

			// Set password environment variable
			const env = { ...process.env, PGPASSWORD: password };

			// Execute restore command
			const { stdout, stderr } = await execAsync(psqlCommand, { env });

			// Mark as completed
			restoreJob.status = BackupStatus.COMPLETED;
			restoreJob.completedAt = new Date().toISOString();
			this.restores.set(restoreJob.id, restoreJob);

			logger.info("Restore completed successfully", {
				component: "BackupSystem",
				restoreId: restoreJob.id,
				backupId: restoreJob.backupId,
				tenantId: restoreJob.tenantId,
			});

		} catch (error) {
			restoreJob.status = BackupStatus.FAILED;
			restoreJob.error = error instanceof Error ? error.message : "Unknown error";
			restoreJob.completedAt = new Date().toISOString();
			this.restores.set(restoreJob.id, restoreJob);

			logger.error("Restore failed", error as Error, {
				component: "BackupSystem",
				restoreId: restoreJob.id,
				backupId: restoreJob.backupId,
				tenantId: restoreJob.tenantId,
			});
		}
	}

	/**
	 * List all backups for a tenant
	 */
	async listBackups(tenantId: string): Promise<BackupJob[]> {
		return Array.from(this.backups.values())
			.filter(backup => backup.tenantId === tenantId)
			.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
	}

	/**
	 * Get a specific backup
	 */
	async getBackup(backupId: string): Promise<BackupJob | null> {
		return this.backups.get(backupId) || null;
	}

	/**
	 * List all restore jobs for a tenant
	 */
	async listRestores(tenantId: string): Promise<RestoreJob[]> {
		return Array.from(this.restores.values())
			.filter(restore => restore.tenantId === tenantId)
			.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
	}

	/**
	 * Get a specific restore job
	 */
	async getRestore(restoreId: string): Promise<RestoreJob | null> {
		return this.restores.get(restoreId) || null;
	}

	/**
	 * Delete a backup and its file
	 */
	async deleteBackup(backupId: string): Promise<boolean> {
		const backup = this.backups.get(backupId);
		if (!backup) {
			return false;
		}

		try {
			// Delete the backup file
			if (backup.filePath) {
				await fs.unlink(backup.filePath);
			}

			// Remove from memory
			this.backups.delete(backupId);

			logger.info("Backup deleted", {
				component: "BackupSystem",
				backupId,
				tenantId: backup.tenantId,
			});

			return true;
		} catch (error) {
			logger.error("Failed to delete backup", error as Error, {
				component: "BackupSystem",
				backupId,
			});
			return false;
		}
	}

	/**
	 * Create a schema-only backup using Prisma
	 */
	async createSchemaBackup(tenantId: string, createdBy: string = "system"): Promise<BackupJob> {
		return this.createBackup(tenantId, BackupType.SCHEMA_ONLY, "Schema-only backup", createdBy);
	}

	/**
	 * Create a data-only backup using Prisma
	 */
	async createDataBackup(tenantId: string, createdBy: string = "system"): Promise<BackupJob> {
		return this.createBackup(tenantId, BackupType.DATA_ONLY, "Data-only backup", createdBy);
	}

	/**
	 * Verify backup integrity
	 */
	async verifyBackup(backupId: string): Promise<{ valid: boolean; error?: string }> {
		const backup = this.backups.get(backupId);
		if (!backup) {
			return { valid: false, error: "Backup not found" };
		}

		if (!backup.filePath) {
			return { valid: false, error: "Backup file not found" };
		}

		try {
			// Check if file exists
			await fs.access(backup.filePath);

			// Verify checksum if available
			if (backup.checksum) {
				const fileContent = await fs.readFile(backup.filePath);
				const currentChecksum = crypto.createHash("sha256").update(fileContent).digest("hex");
				
				if (currentChecksum !== backup.checksum) {
					return { valid: false, error: "Checksum mismatch" };
				}
			}

			// Basic SQL syntax validation
			const content = await fs.readFile(backup.filePath, "utf8");
			if (!content.includes("PostgreSQL database dump")) {
				return { valid: false, error: "Invalid backup format" };
			}

			return { valid: true };
		} catch (error) {
			return { 
				valid: false, 
				error: error instanceof Error ? error.message : "Unknown error" 
			};
		}
	}

	/**
	 * Get backup statistics
	 */
	async getBackupStats(tenantId: string): Promise<{
		totalBackups: number;
		totalSize: number;
		lastBackup?: string;
		successRate: number;
	}> {
		const backups = await this.listBackups(tenantId);
		
		const totalBackups = backups.length;
		const totalSize = backups.reduce((sum, backup) => sum + (backup.fileSize || 0), 0);
		const lastBackup = backups[0]?.startedAt;
		const successfulBackups = backups.filter(b => b.status === BackupStatus.COMPLETED).length;
		const successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 0;

		return {
			totalBackups,
			totalSize,
			lastBackup,
			successRate,
		};
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Singleton instance
export const backupSystem = new BackupSystem();

// Convenience exports
export default backupSystem;
