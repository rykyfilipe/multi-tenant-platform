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
import { Shield } from "lucide-react";
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { useApp } from "@/contexts/AppContext";

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
			<div className='h-full bg-background'>
				<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='text-center py-12'>
						<Card className='max-w-md mx-auto'>
							<CardHeader>
								<div className='mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4 border border-destructive/30'>
									<Shield className='w-6 h-6 text-destructive' />
								</div>
								<CardTitle className='text-destructive'>
									Access Denied
								</CardTitle>
								<CardDescription>
									{user?.role !== "ADMIN"
										? "Only administrators can manage user permissions."
										: "Permission management is not available in your current plan. Upgrade to Pro or Enterprise to manage user permissions."}
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	if (!userId) {
		return (
			<div className='h-full bg-background'>
				<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='text-center py-12'>
						<h3 className='text-lg font-medium text-foreground mb-2'>
							User ID not found
						</h3>
						<p className='text-muted-foreground'>
							Please provide a valid user ID to manage permissions.
						</p>
					</div>
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
			<div className='h-full bg-background'>
				<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='text-center py-12'>
						<Card className='max-w-md mx-auto'>
							<CardHeader>
								<div className='mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4 border border-destructive/30'>
									<Shield className='w-6 h-6 text-destructive' />
								</div>
								<CardTitle className='text-destructive'>
									Error Loading Permissions
								</CardTitle>
								<CardDescription>
									{permissionsError}
								</CardDescription>
							</CardHeader>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='h-full bg-background'>
			{/* Header */}
			<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
				<div className='flex items-center justify-between px-6 py-4'>
					<div className='flex items-center space-x-4'>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								User Permissions
							</h1>
							<p className='text-sm text-muted-foreground'>
								Manage access controls and permissions for team members
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-6 max-w-6xl mx-auto'>
				<PermissionsHeader
					hasChanges={hasChanges}
					onSave={handleSave}
					loading={loading}
				/>

				{loading ? (
					<LoadingState />
				) : (
					<>
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
										onUpdateColumnPermission={updateColumnPermission}
									/>
								);
							})}
						</div>

						{tables?.length === 0 && <EmptyState />}
					</>
				)}
			</div>
		</div>
	);
}
