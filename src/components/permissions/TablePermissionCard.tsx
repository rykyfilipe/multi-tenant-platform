/** @format */

// components/TablePermissionCard.tsx
import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Table } from "lucide-react";
import { PermissionToggle } from "./PermissionToggle";
import { ColumnPermissions } from "./ColumnPermissions";
import { TablePermissionCardProps, TablePermission } from "@/types/permissions";

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

	// Numărul real de coloane din tabel
	const actualColumnCount = table.columns?.length || 0;

	return (
		<div className='bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow'>
			<div className='p-6'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-3'>
						<div
							className={`p-2 rounded-lg ${
								hasTableAccess
									? "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
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
						<div>
							<h3 className='text-lg font-semibold text-foreground'>
								{table.name}
							</h3>
							<p className='text-sm text-muted-foreground'>
								{table.description}
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-4'>
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className='flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors'>
							{isExpanded ? (
								<ChevronDown className='h-4 w-4' />
							) : (
								<ChevronRight className='h-4 w-4' />
							)}
							<span className='text-sm font-medium'>
								{actualColumnCount} column{actualColumnCount !== 1 ? "s" : ""}
							</span>
						</button>
					</div>
				</div>

				<div className='mt-6 grid grid-cols-3 gap-4'>
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

				{isExpanded && (
					<ColumnPermissions
						table={table}
						columnPermissions={columnPermissions}
						onUpdateColumnPermission={onUpdateColumnPermission}
					/>
				)}
			</div>
		</div>
	);
};
