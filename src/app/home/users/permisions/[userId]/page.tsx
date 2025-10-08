/** @format */

"use client";

import React from "react";
import { useParams } from "next/navigation";
import {
	usePermissions,
	useTables,
	usePermissionUpdates,
} from "@/hooks/usePermissions";
import { PermissionsHeader } from "@/components/permissions/PermissionsHeader";
import { TablePermissionCard } from "@/components/permissions/TablePermissionCard";
import { EmptyState } from "@/components/permissions/EmptyState";
import { LoadingState } from "@/components/permissions/LoadingState";
import {
	TableInfo,
	TablePermission,
	ColumnPermission,
} from "@/types/permissions";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertCircle, Lock, Database } from "lucide-react";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { useApp } from "@/contexts/AppContext";
import { Skeleton } from "@/components/ui/skeleton";

const PermissionsLoadingSkeleton = () => (
	<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
		<div className="max-w-[1400px] mx-auto p-6 space-y-8">
			{/* Header Skeleton */}
			<div className="flex items-start justify-between gap-6">
				<div className="flex items-start gap-4">
					<Skeleton className="h-14 w-14 rounded-2xl" />
					<div className="space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-96" />
					</div>
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			{/* Cards Skeleton */}
			<div className="space-y-6">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-48 rounded-xl" />
				))}
			</div>
		</div>
	</div>
);

export default function PermissionsManager() {
	const { user } = useApp();
	const { canManagePermissions } = usePlanPermissions();
	const params = useParams();
	const userId = Array.isArray(params.userId)
		? params.userId[0]
		: params.userId;

	// All hooks must be called before any early returns
	const {
		permissions,
		setPermissions,
		loading: permissionsLoading,
		error: permissionsError,
		savePermissions,
	} = usePermissions(userId || "");

	const { tables, loading: tablesLoading } = useTables();

	const {
		hasChanges,
		updateTablePermission,
		updateColumnPermission,
		resetChanges,
	} = usePermissionUpdates(permissions, setPermissions);

	// Check if user is admin and has permission to manage permissions
	if (user?.role !== "ADMIN" || !canManagePermissions()) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
				<div className='max-w-[1400px] mx-auto px-6 py-16'>
					<Card className='max-w-xl mx-auto bg-card border-destructive/20 shadow-lg'>
						<CardHeader className='text-center pb-4'>
							<div className='mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4 border border-destructive/20'>
								<Lock className='w-8 h-8 text-destructive' />
							</div>
							<CardTitle className='text-2xl font-bold text-foreground'>
								Access Denied
							</CardTitle>
							<CardDescription className='text-base mt-2'>
								{user?.role !== "ADMIN"
									? "Only administrators can manage user permissions."
									: "Permission management is not available in your current plan. Upgrade to Pro or Enterprise to manage user permissions."}
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</div>
		);
	}

	if (!userId) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
				<div className='max-w-[1400px] mx-auto px-6 py-16'>
					<Card className='max-w-xl mx-auto bg-card border-border shadow-lg'>
						<CardHeader className='text-center pb-4'>
							<div className='mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4 border border-border'>
								<AlertCircle className='w-8 h-8 text-muted-foreground' />
							</div>
							<CardTitle className='text-2xl font-bold text-foreground'>
								User Not Found
							</CardTitle>
							<CardDescription className='text-base mt-2'>
								Please provide a valid user ID to manage permissions.
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</div>
		);
	}

	const handleSave = async () => {
		const success = await savePermissions();
		if (success) {
			resetChanges();
		}
	};

	const loading = permissionsLoading || tablesLoading;

	// Handle error state
	if (permissionsError) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
				<div className='max-w-[1400px] mx-auto px-6 py-16'>
					<Card className='max-w-xl mx-auto bg-card border-destructive/20 shadow-lg'>
						<CardHeader className='text-center pb-4'>
							<div className='mx-auto w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4 border border-destructive/20'>
								<AlertCircle className='w-8 h-8 text-destructive' />
							</div>
							<CardTitle className='text-2xl font-bold text-foreground'>
								Error Loading Permissions
							</CardTitle>
							<CardDescription className='text-base mt-2'>
								{permissionsError}
							</CardDescription>
						</CardHeader>
					</Card>
				</div>
			</div>
		);
	}

	if (loading) {
		return <PermissionsLoadingSkeleton />;
	}

	const tablesWithPermissions = tables?.filter((table: TableInfo) => {
		const tablePermission = permissions?.tablePermissions.find(
			(tp) => tp.tableId === table.id,
		);
		return tablePermission?.canRead || tablePermission?.canEdit || tablePermission?.canDelete;
	}).length || 0;

	return (
		<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
			<div className='max-w-[1400px] mx-auto p-6 space-y-8'>
				{/* Header */}
				<div className='flex flex-col sm:flex-row sm:items-start justify-between gap-6'>
					<div className='flex items-start gap-4'>
						<div className='relative'>
							<div className='w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20'>
								<Shield className='w-7 h-7 text-primary' />
							</div>
							{hasChanges && (
								<div className='absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-background'>
									<div className='w-2 h-2 bg-white rounded-full' />
								</div>
							)}
						</div>
						<div className='space-y-1'>
							<h1 className='text-3xl font-bold text-foreground tracking-tight'>
								User Permissions
							</h1>
							<p className='text-muted-foreground text-base'>
								Manage granular access controls for tables and columns
							</p>
							<div className='flex items-center gap-4 mt-2'>
								<Badge variant="outline" className='bg-primary/10 text-primary border-primary/20 font-semibold'>
									<Database className='w-3 h-3 mr-1.5' />
									{tables?.length || 0} {tables?.length === 1 ? 'Table' : 'Tables'}
								</Badge>
								{tablesWithPermissions > 0 && (
									<Badge variant="outline" className='bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-semibold'>
										<Shield className='w-3 h-3 mr-1.5' />
										{tablesWithPermissions} With Access
									</Badge>
								)}
							</div>
						</div>
					</div>

					<PermissionsHeader
						hasChanges={hasChanges}
						onSave={handleSave}
						loading={permissionsLoading}
					/>
				</div>

				{/* Permission Cards */}
				<div className='space-y-6'>
					{tables?.map((table: TableInfo) => {
						const tablePermission: TablePermission | undefined =
							permissions?.tablePermissions.find(
								(tp) => tp.tableId === table.id,
							);
						const columnPermissions: ColumnPermission[] =
							permissions?.columnsPermissions.filter(
								(cp) => cp.tableId === table.id,
							) || [];

						return (
							<TablePermissionCard
								key={table.id}
								table={table}
								tablePermission={tablePermission}
								columnPermissions={columnPermissions}
								onUpdateTablePermission={updateTablePermission}
								onUpdateColumnPermission={onUpdateColumnPermission}
							/>
						);
					})}
				</div>

				{tables?.length === 0 && <EmptyState />}
			</div>
		</div>
	);
}
