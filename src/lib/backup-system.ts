/** @format */

/**
 * Backup & Restore System using Prisma with PostgreSQL
 * Server-side implementation only - use API routes for client access
 */

import { exec } from "child_process";
import { promisify } from "util";
import { logger } from "./error-logger";
import prisma from "./prisma";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { 
	BackupType, 
	BackupStatus, 
	BackupJob, 
	RestoreJob, 
	BackupStats, 
	BackupVerification 
} from "@/types/backup";

const execAsync = promisify(exec);

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
	 * Create a database backup using DIRECT_URL and pg_dump (Prisma recommended approach)
	 */
	async createBackup(
		tenantId: string,
		type: BackupType = BackupType.FULL,
		description?: string,
		createdBy: string = "system"
	): Promise<BackupJob> {
		// Validate DIRECT_URL is configured
		if (!process.env.DIRECT_URL) {
			throw new Error("DIRECT_URL not configured - required for backup operations");
		}

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

		logger.info("Backup job created", {
			component: "BackupSystem",
			backupId,
			tenantId,
			type,
			createdBy,
		});

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
	 * Perform the actual backup operation using DIRECT_URL with tenant-specific filtering
	 */
	private async performBackup(backupJob: BackupJob): Promise<void> {
		try {
			backupJob.status = BackupStatus.IN_PROGRESS;
			this.backups.set(backupJob.id, backupJob);

			logger.info("Starting tenant-specific backup process", {
				component: "BackupSystem",
				backupId: backupJob.id,
				tenantId: backupJob.tenantId,
				type: backupJob.type,
			});

			// Use DIRECT_URL for direct database connection (recommended by Prisma)
			const directUrl = process.env.DIRECT_URL;
			if (!directUrl) {
				throw new Error("DIRECT_URL not configured - required for pg_dump");
			}

			// Create tenant-specific backup using custom SQL approach
			await this.createTenantSpecificBackup(backupJob.tenantId, backupJob.filePath!, backupJob.type);

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
	 * Perform the actual restore operation using DIRECT_URL with tenant-specific handling
	 */
	private async performRestore(restoreJob: RestoreJob, backup: BackupJob): Promise<void> {
		try {
			restoreJob.status = BackupStatus.IN_PROGRESS;
			this.restores.set(restoreJob.id, restoreJob);

			logger.info("Starting tenant-specific restore process", {
				component: "BackupSystem",
				restoreId: restoreJob.id,
				backupId: restoreJob.backupId,
				tenantId: restoreJob.tenantId,
			});

			// Use DIRECT_URL for direct database connection (recommended by Prisma)
			const directUrl = process.env.DIRECT_URL;
			if (!directUrl) {
				throw new Error("DIRECT_URL not configured - required for restore operations");
			}

			// For tenant-specific backups, we need to handle conflicts carefully
			// First, check if this is a tenant-specific backup
			const backupContent = await fs.readFile(backup.filePath!, "utf8");
			const isTenantSpecific = backupContent.includes("TENANT-SPECIFIC BACKUP");

			if (isTenantSpecific) {
				// Handle tenant-specific restore
				await this.performTenantSpecificRestore(restoreJob, backup, directUrl);
			} else {
				// Handle regular restore
				const psqlCommand = `psql --dbname="${directUrl}" -f "${backup.filePath}"`;
				const { stdout, stderr } = await execAsync(psqlCommand);
			}

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
	 * Verify backup integrity using checksum
	 */
	async verifyBackup(backupId: string): Promise<BackupVerification> {
		const backup = this.backups.get(backupId);
		if (!backup) {
			return { valid: false, error: "Backup not found" };
		}

		if (!backup.filePath) {
			return { valid: false, error: "Backup file not found" };
		}

		try {
			const fileContent = await fs.readFile(backup.filePath);
			const currentChecksum = crypto.createHash("sha256").update(fileContent).digest("hex");
			
			if (backup.checksum && currentChecksum !== backup.checksum) {
				return { valid: false, error: "Checksum mismatch - backup may be corrupted" };
			}

			return { valid: true };
		} catch (error) {
			return { 
				valid: false, 
				error: error instanceof Error ? error.message : "Unknown error during verification" 
			};
		}
	}

	/**
	 * Compress backup file to save space
	 */
	private async compressBackup(filePath: string): Promise<string> {
		const compressedPath = `${filePath}.gz`;
		
		try {
			await execAsync(`gzip -c "${filePath}" > "${compressedPath}"`);
			await fs.unlink(filePath); // Remove original file
			return compressedPath;
		} catch (error) {
			logger.error("Failed to compress backup", error as Error, {
				component: "BackupSystem",
				filePath,
			});
			return filePath; // Return original if compression fails
		}
	}

	/**
	 * Create a scheduled backup (for future implementation)
	 */
	async scheduleBackup(
		tenantId: string,
		type: BackupType,
		schedule: string, // cron expression
		description?: string
	): Promise<string> {
		// TODO: Implement scheduled backups using node-cron or similar
		logger.info("Scheduled backup requested", {
			component: "BackupSystem",
			tenantId,
			type,
			schedule,
		});
		
		throw new Error("Scheduled backups not yet implemented");
	}

	/**
	 * Get tenant-specific data and tables for backup
	 */
	private async getTenantSpecificData(tenantId: string): Promise<{
		tables: string[];
		tenantInfo: any;
		relatedTables: string[];
	}> {
		try {
			// Core tables that should always be included for tenant context
			const coreTables = [
				'Tenant',           // Tenant information
				'User',             // Users (filtered by tenantId)
				'Database',         // Tenant databases
				'ColumnPermission', // Tenant permissions
				'TablePermission',  // Tenant permissions
				'Invitation',       // Tenant invitations
			];

			// Tables with tenantId that should be filtered
			const tenantSpecificTables = [
				'UserActivity',
				'DatabaseActivity', 
				'SystemMetrics',
				'TenantUsage',
				'ApiUsage',
				'ErrorLog',
				'PerformanceAlert',
				'InvoiceSeries',
				'InvoiceAuditLog',
				'UserPreferences',
				'PDFAnalytics',
				'PDFTemplateConfig',
			];

			// Get tenant information
			const tenantInfo = await prisma.tenant.findUnique({
				where: { id: parseInt(tenantId) },
				include: {
					admin: true,
					users: true,
					databases: true,
				}
			});

			if (!tenantInfo) {
				throw new Error(`Tenant ${tenantId} not found`);
			}

			// For now, we'll include all tables but filter data during restore
			// In a more advanced implementation, we could create custom SQL queries
			const allTables = [...coreTables, ...tenantSpecificTables];

			logger.info("Tenant-specific data identified", {
				component: "BackupSystem",
				tenantId,
				tablesCount: allTables.length,
				tenantName: tenantInfo.name,
			});

			return {
				tables: allTables,
				tenantInfo,
				relatedTables: tenantSpecificTables,
			};

		} catch (error) {
			logger.error("Failed to get tenant-specific data", error as Error, {
				component: "BackupSystem",
				tenantId,
			});
			
			// Fallback to basic tables if tenant lookup fails
			return {
				tables: ['Tenant', 'User', 'Database'],
				tenantInfo: null,
				relatedTables: [],
			};
		}
	}

	/**
	 * Create tenant-specific backup with SQL filtering
	 */
	private async createTenantSpecificBackup(tenantId: string, filePath: string, type: BackupType): Promise<void> {
		try {
			const tenantData = await this.getTenantSpecificData(tenantId);
			
			// Create a comprehensive tenant-specific backup
			let sqlScript = `-- =============================================
-- TENANT-SPECIFIC BACKUP
-- =============================================
-- Tenant ID: ${tenantId}
-- Generated at: ${new Date().toISOString()}
-- Backup type: ${type}
-- Tenant name: ${tenantData.tenantInfo?.name || 'Unknown'}

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =============================================
-- TENANT INFORMATION
-- =============================================
`;

			// Add tenant information
			if (tenantData.tenantInfo) {
				sqlScript += `-- Tenant: ${tenantData.tenantInfo.name}
-- Admin: ${tenantData.tenantInfo.admin?.email || 'Unknown'}
-- Created: ${tenantData.tenantInfo.createdAt}
-- Users count: ${tenantData.tenantInfo.users?.length || 0}
-- Databases count: ${tenantData.tenantInfo.databases?.length || 0}

`;
			}

			// Add schema definitions if not data-only
			if (type !== BackupType.DATA_ONLY) {
				sqlScript += `-- =============================================
-- SCHEMA DEFINITIONS
-- =============================================

`;

				// Get schema for each table
				for (const tableName of tenantData.tables) {
					try {
						const schemaQuery = `SELECT pg_get_tabledef('${tableName}') as definition;`;
						const result = await prisma.$queryRawUnsafe(schemaQuery);
						if (result && Array.isArray(result) && result.length > 0) {
							sqlScript += `-- Table: ${tableName}
${(result[0] as any).definition}

`;
						}
					} catch (error) {
						logger.warn(`Failed to get schema for table ${tableName}`, {
							component: "BackupSystem",
							tenantId,
							tableName,
							error: error instanceof Error ? error.message : 'Unknown error'
						});
					}
				}
			}

			// Add data if not schema-only
			if (type !== BackupType.SCHEMA_ONLY) {
				sqlScript += `-- =============================================
-- TENANT-SPECIFIC DATA
-- =============================================

`;

				// Add tenant record
				if (tenantData.tenantInfo) {
					sqlScript += `-- Tenant record
INSERT INTO "Tenant" VALUES (
    ${tenantData.tenantInfo.id},
    '${tenantData.tenantInfo.name}',
    ${tenantData.tenantInfo.adminId},
    ${tenantData.tenantInfo.address ? `'${tenantData.tenantInfo.address}'` : 'NULL'},
    ${tenantData.tenantInfo.companyEmail ? `'${tenantData.tenantInfo.companyEmail}'` : 'NULL'},
    '${tenantData.tenantInfo.createdAt.toISOString()}',
    ${tenantData.tenantInfo.language ? `'${tenantData.tenantInfo.language}'` : 'NULL'},
    ${tenantData.tenantInfo.logoUrl ? `'${tenantData.tenantInfo.logoUrl}'` : 'NULL'},
    ${tenantData.tenantInfo.phone ? `'${tenantData.tenantInfo.phone}'` : 'NULL'},
    ${tenantData.tenantInfo.theme ? `'${tenantData.tenantInfo.theme}'` : 'NULL'},
    ${tenantData.tenantInfo.timezone ? `'${tenantData.tenantInfo.timezone}'` : 'NULL'},
    '${tenantData.tenantInfo.updatedAt.toISOString()}',
    ${tenantData.tenantInfo.website ? `'${tenantData.tenantInfo.website}'` : 'NULL'},
    ${tenantData.tenantInfo.lastMemoryUpdate ? `'${tenantData.tenantInfo.lastMemoryUpdate.toISOString()}'` : 'NULL'},
    ${tenantData.tenantInfo.memoryLimitGB},
    ${tenantData.tenantInfo.memoryUsedGB},
    ${tenantData.tenantInfo.defaultCurrency ? `'${tenantData.tenantInfo.defaultCurrency}'` : 'NULL'},
    ${tenantData.tenantInfo.companyBank ? `'${tenantData.tenantInfo.companyBank}'` : 'NULL'},
    ${tenantData.tenantInfo.companyCity ? `'${tenantData.tenantInfo.companyCity}'` : 'NULL'},
    ${tenantData.tenantInfo.companyCountry ? `'${tenantData.tenantInfo.companyCountry}'` : 'NULL'},
    ${tenantData.tenantInfo.companyIban ? `'${tenantData.tenantInfo.companyIban}'` : 'NULL'},
    ${tenantData.tenantInfo.companyPostalCode ? `'${tenantData.tenantInfo.companyPostalCode}'` : 'NULL'},
    ${tenantData.tenantInfo.companyStreet ? `'${tenantData.tenantInfo.companyStreet}'` : 'NULL'},
    ${tenantData.tenantInfo.companyStreetNumber ? `'${tenantData.tenantInfo.companyStreetNumber}'` : 'NULL'},
    ${tenantData.tenantInfo.companyTaxId ? `'${tenantData.tenantInfo.companyTaxId}'` : 'NULL'},
    ${tenantData.tenantInfo.registrationNumber ? `'${tenantData.tenantInfo.registrationNumber}'` : 'NULL'},
    ${tenantData.tenantInfo.invoiceStartNumber || 'NULL'},
    ${tenantData.tenantInfo.invoiceSeriesPrefix ? `'${tenantData.tenantInfo.invoiceSeriesPrefix}'` : 'NULL'},
    ${tenantData.tenantInfo.invoiceIncludeYear},
    '${JSON.stringify(tenantData.tenantInfo.enabledModules || [])}'
);

`;
				}

				// Add tenant-specific data for each table
				for (const tableName of tenantData.relatedTables) {
					try {
						const dataQuery = `SELECT * FROM "${tableName}" WHERE "tenantId" = ${tenantId};`;
						const data = await prisma.$queryRawUnsafe(dataQuery);
						
						if (Array.isArray(data) && data.length > 0) {
							sqlScript += `-- Data for table: ${tableName}
`;
							
							// Add INSERT statements for each row
							for (const row of data) {
								const columns = Object.keys(row);
								const values = Object.values(row).map(v => 
									v === null ? 'NULL' : 
									typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
									v instanceof Date ? `'${v.toISOString()}'` :
									JSON.stringify(v)
								);
								
								sqlScript += `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});

`;
							}
						}
					} catch (error) {
						logger.warn(`Failed to get data for table ${tableName}`, {
							component: "BackupSystem",
							tenantId,
							tableName,
							error: error instanceof Error ? error.message : 'Unknown error'
						});
					}
				}
			}

			// Write the complete SQL script
			await fs.writeFile(filePath, sqlScript);
			
			logger.info("Tenant-specific backup created successfully", {
				component: "BackupSystem",
				tenantId,
				filePath,
				type,
				tablesIncluded: tenantData.tables.length,
			});

		} catch (error) {
			logger.error("Failed to create tenant-specific backup", error as Error, {
				component: "BackupSystem",
				tenantId,
				filePath,
				type,
			});
			throw error;
		}
	}

	/**
	 * Perform tenant-specific restore with conflict handling
	 */
	private async performTenantSpecificRestore(restoreJob: RestoreJob, backup: BackupJob, directUrl: string): Promise<void> {
		try {
			logger.info("Performing tenant-specific restore", {
				component: "BackupSystem",
				restoreId: restoreJob.id,
				tenantId: restoreJob.tenantId,
				backupId: backup.id,
			});

			// For tenant-specific restore, we need to be careful about conflicts
			// We'll use a transaction to ensure atomicity
			const restoreScript = `
-- Tenant-specific restore for Tenant ID: ${restoreJob.tenantId}
-- Backup ID: ${backup.id}
-- Restore ID: ${restoreJob.id}

BEGIN;

-- First, clean up existing tenant data (optional - could be made configurable)
-- DELETE FROM "UserActivity" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "DatabaseActivity" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "SystemMetrics" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "TenantUsage" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "ApiUsage" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "ErrorLog" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "PerformanceAlert" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "InvoiceSeries" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "InvoiceAuditLog" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "UserPreferences" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "PDFAnalytics" WHERE "tenantId" = ${restoreJob.tenantId};
-- DELETE FROM "PDFTemplateConfig" WHERE "tenantId" = ${restoreJob.tenantId};

-- Now execute the backup file
\\i ${backup.filePath}

COMMIT;
`;

			// Write the restore script to a temporary file
			const tempRestoreFile = `/tmp/restore_${restoreJob.id}.sql`;
			await fs.writeFile(tempRestoreFile, restoreScript);

			// Execute the restore
			const psqlCommand = `psql --dbname="${directUrl}" -f "${tempRestoreFile}"`;
			const { stdout, stderr } = await execAsync(psqlCommand);

			// Clean up temporary file
			await fs.unlink(tempRestoreFile);

			logger.info("Tenant-specific restore completed successfully", {
				component: "BackupSystem",
				restoreId: restoreJob.id,
				tenantId: restoreJob.tenantId,
				backupId: backup.id,
			});

		} catch (error) {
			logger.error("Tenant-specific restore failed", error as Error, {
				component: "BackupSystem",
				restoreId: restoreJob.id,
				tenantId: restoreJob.tenantId,
				backupId: backup.id,
			});
			throw error;
		}
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
