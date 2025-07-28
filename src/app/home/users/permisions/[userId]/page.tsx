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

export default function PermissionsManager() {
	const params = useParams();
	const userId = Array.isArray(params.userId)
		? params.userId[0]
		: params.userId;

	if (!userId) {
		return (
			<div className='min-h-screen bg-gray-50 py-8'>
				<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='text-center py-12'>
						<h3 className='text-lg font-medium text-gray-900 mb-2'>
							User ID not found
						</h3>
						<p className='text-gray-500'>
							Please provide a valid user ID to manage permissions.
						</p>
					</div>
				</div>
			</div>
		);
	}

	const {
		permissions,
		setPermissions,
		loading: permissionsLoading,
		savePermissions,
	} = usePermissions(userId);

	const { tables, loading: tablesLoading } = useTables();

	const {
		hasChanges,
		updateTablePermission,
		updateColumnPermission,
		resetChanges,
	} = usePermissionUpdates(permissions, setPermissions);

	const handleSave = async () => {
		const success = await savePermissions();
		if (success) {
			resetChanges();
		}
	};

	const loading = permissionsLoading || tablesLoading;

	return (
		<div className='min-h-screen bg-gray-50 py-8'>
			<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
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
