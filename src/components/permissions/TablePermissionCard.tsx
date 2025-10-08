/** @format */

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Table, Lock } from "lucide-react";
import { PermissionToggle } from "./PermissionToggle";
import { ColumnPermissions } from "./ColumnPermissions";
import { TablePermissionCardProps, TablePermission } from "@/types/permissions";
import { Badge } from "@/components/ui/badge";

export const TablePermissionCard: React.FC<TablePermissionCardProps> = ({
	table,
	tablePermission,
	columnPermissions,
	onUpdateTablePermission,
	onUpdateColumnPermission,
}) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const handleTablePermissionChange = (
		field: keyof Pick<TablePermission, "canRead" | "canEdit" | "canDelete">,
		value: boolean,
	) => {
		onUpdateTablePermission(table.id, field, value);
	};

	const hasTableAccess =
		tablePermission?.canRead ||
		tablePermission?.canEdit ||
		tablePermission?.canDelete ||
		false;

	const actualColumnCount = table.columns?.length || 0;

	// Count active permissions
	const activePermissionsCount = [
		tablePermission?.canRead,
		tablePermission?.canEdit,
		tablePermission?.canDelete,
	].filter(Boolean).length;

	return (
		<div className='bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200'>
			<div className='p-6'>
				<div className='flex items-center justify-between mb-6'>
					<div className='flex items-center gap-3 flex-1 min-w-0'>
						<div
							className={`p-2.5 rounded-xl flex-shrink-0 ${
								hasTableAccess
									? "bg-green-500/10 border border-green-500/20"
									: "bg-muted border border-border"
							}`}>
							<Table
								className={`h-5 w-5 ${
									hasTableAccess
										? "text-green-600 dark:text-green-400"
										: "text-muted-foreground"
								}`}
							/>
						</div>
						<div className='flex-1 min-w-0'>
							<div className='flex items-center gap-2 mb-1'>
								<h3 className='text-lg font-semibold text-foreground truncate'>
									{table.name}
								</h3>
								{hasTableAccess && (
									<Badge variant="secondary" className='text-xs font-medium px-2 py-0.5'>
										{activePermissionsCount} {activePermissionsCount === 1 ? 'permission' : 'permissions'}
									</Badge>
								)}
							</div>
							{table.description && (
								<p className='text-sm text-muted-foreground line-clamp-1'>
									{table.description}
								</p>
							)}
						</div>
					</div>
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className='flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200 ml-4 flex-shrink-0'>
						{isExpanded ? (
							<ChevronDown className='h-4 w-4' />
						) : (
							<ChevronRight className='h-4 w-4' />
						)}
						<span className='text-sm font-medium'>
							{actualColumnCount} {actualColumnCount === 1 ? 'column' : 'columns'}
						</span>
					</button>
				</div>

				{/* Table-level permissions */}
				<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
					<PermissionToggle
						enabled={tablePermission?.canRead || false}
						onChange={(value) => handleTablePermissionChange("canRead", value)}
						label='Read'
						variant='read'
					/>
					<PermissionToggle
						enabled={tablePermission?.canEdit || false}
						onChange={(value) => handleTablePermissionChange("canEdit", value)}
						label='Edit'
						variant='edit'
					/>
					<PermissionToggle
						enabled={tablePermission?.canDelete || false}
						onChange={(value) =>
							handleTablePermissionChange("canDelete", value)
						}
						label='Delete'
						variant='delete'
					/>
				</div>

				{/* Column-level permissions (expanded) */}
				{isExpanded && (
					<div className='mt-6 pt-6 border-t border-border'>
						<ColumnPermissions
							table={table}
							columnPermissions={columnPermissions}
							onUpdateColumnPermission={onUpdateColumnPermission}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
