/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
	Plus, 
	Upload, 
	Shield, 
	Clock,
	CheckCircle,
	AlertCircle,
	Database,
	RefreshCw
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useApp } from "@/contexts/AppContext";
import { logger } from "@/lib/error-logger";
import { BackupType, BackupStatus } from "@/types/backup";

interface BackupJob {
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

interface RestoreJob {
	id: string;
	tenantId: string;
	backupId: string;
	status: BackupStatus;
	startedAt: string;
	completedAt?: string;
	error?: string;
	restoredBy: string;
}

interface BackupManagerProps {
	tenantId: string;
}

/**
 * Backup Manager Component
 * Manages database backups and restores for a tenant
 */
export function BackupManager({ tenantId }: BackupManagerProps) {
	const { t } = useLanguage();
	const { user, token } = useApp();
	const [backups, setBackups] = useState<BackupJob[]>([]);
	const [restores, setRestores] = useState<RestoreJob[]>([]);
	const [loading, setLoading] = useState(true);
	const [creatingBackup, setCreatingBackup] = useState(false);
	const [restoringBackup, setRestoringBackup] = useState<string | null>(null);

	// Load backups and restores
	useEffect(() => {
		loadData();
	}, [tenantId, token]);

	const loadData = async () => {
		if (!token) return;
		
		try {
			const [backupsResponse, restoresResponse] = await Promise.all([
				fetch(`/api/tenants/${tenantId}/backups`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
				fetch(`/api/tenants/${tenantId}/restores`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
			]);

			if (backupsResponse.ok) {
				const data = await backupsResponse.json();
				setBackups(data.data.backups || []);
			}

			if (restoresResponse.ok) {
				const data = await restoresResponse.json();
				setRestores(data.data || []);
			}
		} catch (error) {
			logger.error("Failed to load backup data", error as Error, {
				component: "BackupManager",
			});
		} finally {
			setLoading(false);
		}
	};

	const createBackup = async () => {
		if (!token) return;
		
		setCreatingBackup(true);
		try {
			const response = await fetch(`/api/tenants/${tenantId}/backups`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					type: BackupType.FULL,
					description: "Full database backup"
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setBackups(prev => [data.data, ...prev]);
				
				logger.info("Backup created successfully", {
					component: "BackupManager",
					backupId: data.data.id,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to create backup", new Error(errorData.error), {
					component: "BackupManager",
				});
			}
		} catch (error) {
			logger.error("Failed to create backup", error as Error, {
				component: "BackupManager",
			});
		} finally {
			setCreatingBackup(false);
		}
	};

	const restoreBackup = async (backupId: string) => {
		if (!token) return;
		
		if (!confirm("Are you sure you want to restore from this backup? This will overwrite your current data.")) {
			return;
		}

		setRestoringBackup(backupId);

		try {
			const response = await fetch(`/api/tenants/${tenantId}/backups/${backupId}/restore`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setRestores(prev => [data.data, ...prev]);
				
				logger.info("Restore process started", {
					component: "BackupManager",
					backupId,
					restoreId: data.data.id,
				});
			} else {
				const errorData = await response.json();
				logger.error("Failed to start restore", new Error(errorData.error), {
					component: "BackupManager",
				});
			}
		} catch (error) {
			logger.error("Failed to start restore", error as Error, {
				component: "BackupManager",
			});
		} finally {
			setRestoringBackup(null);
		}
	};

	const getStatusColor = (status: BackupStatus) => {
		switch (status) {
			case BackupStatus.COMPLETED:
				return "bg-green-100 text-green-800";
			case BackupStatus.IN_PROGRESS:
				return "bg-blue-100 text-blue-800";
			case BackupStatus.FAILED:
				return "bg-red-100 text-red-800";
			case BackupStatus.PENDING:
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return "0 B";
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed": return <CheckCircle className="h-4 w-4 text-green-600" />;
			case "in_progress": return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
			case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
			case "failed": return <AlertCircle className="h-4 w-4 text-red-600" />;
			default: return <Clock className="h-4 w-4 text-gray-600" />;
		}
	};

	if (loading) {
		return (
			<div className="space-y-4">
				<Card>
					<CardContent className="p-6">
						<div className="animate-pulse space-y-4">
							<div className="h-4 bg-muted rounded w-1/4"></div>
							<div className="h-3 bg-muted rounded w-1/2"></div>
							<div className="h-3 bg-muted rounded w-1/3"></div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Get the latest backup
	const latestBackup = backups.length > 0 ? backups[0] : null;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-2xl font-bold">Backup & Restore</h2>
					<p className="text-muted-foreground">
						Manage database backups and restore from previous states
					</p>
				</div>
			</div>

			{/* Main Actions */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Create Backup */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Database className="h-5 w-5" />
							Create Backup
						</CardTitle>
						<CardDescription>
							Create a full backup of your database
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button 
							onClick={createBackup} 
							disabled={creatingBackup}
							className="w-full"
						>
							{creatingBackup ? (
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Plus className="h-4 w-4 mr-2" />
							)}
							{creatingBackup ? "Creating Backup..." : "Create Backup"}
						</Button>
					</CardContent>
				</Card>

				{/* Restore Backup */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5" />
							Restore Backup
						</CardTitle>
						<CardDescription>
							Restore from the latest backup
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button 
							variant="outline"
							onClick={() => latestBackup && restoreBackup(latestBackup.id)} 
							disabled={!latestBackup || latestBackup.status !== "completed" || restoringBackup === latestBackup.id}
							className="w-full"
						>
							{restoringBackup === latestBackup?.id ? (
								<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Upload className="h-4 w-4 mr-2" />
							)}
							{restoringBackup === latestBackup?.id ? "Restoring..." : "Restore from Latest"}
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Latest Backup Info */}
			{latestBackup ? (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{getStatusIcon(latestBackup.status)}
							Latest Backup Information
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<h4 className="font-medium text-sm mb-2">Created</h4>
								<p className="text-sm text-muted-foreground">
									{latestBackup.startedAt ? new Date(latestBackup.startedAt).toLocaleString() : 'Unknown date'}
								</p>
							</div>
							<div>
								<h4 className="font-medium text-sm mb-2">Status</h4>
								<Badge className={getStatusColor(latestBackup.status)}>
									{latestBackup.status}
								</Badge>
							</div>
							<div>
								<h4 className="font-medium text-sm mb-2">File Size</h4>
								<p className="text-sm text-muted-foreground">
									{formatFileSize(latestBackup.fileSize)}
								</p>
							</div>
						</div>
						
						{latestBackup.error && (
							<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
								<div className="flex items-center gap-2 text-red-800">
									<AlertCircle className="h-4 w-4" />
									<span className="font-medium">Error</span>
								</div>
								<p className="text-sm text-red-700 mt-1">{latestBackup.error}</p>
							</div>
						)}
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardContent className="p-8 text-center">
						<Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
						<h4 className="text-lg font-medium mb-2">No Backups Yet</h4>
						<p className="text-muted-foreground mb-4">
							Create your first backup to protect your data
						</p>
					</CardContent>
				</Card>
			)}

			{/* Tenant Isolation Info */}
			<Card className="border-blue-200 bg-blue-50">
				<CardContent className="p-4">
					<div className="flex items-start gap-3">
						<Shield className="h-5 w-5 text-blue-600 mt-0.5" />
						<div>
							<h4 className="font-semibold text-blue-900">Tenant-Isolated Backups</h4>
							<p className="text-sm text-blue-700 mt-1">
								Each backup contains only data belonging to your tenant. No other tenant data is included, 
								ensuring complete data isolation and security.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
