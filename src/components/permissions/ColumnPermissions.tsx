/** @format */

// components/ColumnPermissions.tsx
import React from "react";
import { Shield } from "lucide-react";
import { PermissionToggle } from "./PermissionToggle";
import { ColumnPermission, TableInfo } from "@/types/permissions";

interface ColumnPermissionsProps {
	table: TableInfo;
	columnPermissions: ColumnPermission[];
	onUpdateColumnPermission: (
		tableId: number,
		columnId: number,
		field: keyof Pick<ColumnPermission, "canRead" | "canEdit">,
		value: boolean,
	) => void;
}

export const ColumnPermissions: React.FC<ColumnPermissionsProps> = ({
	table,
	columnPermissions,
	onUpdateColumnPermission,
}) => {
	const handleColumnPermissionChange = (
		columnId: number,
		field: keyof Pick<ColumnPermission, "canRead" | "canEdit">,
		value: boolean,
	) => {
		onUpdateColumnPermission(table.id, columnId, field, value);
	};

	if (columnPermissions.length === 0) {
		return null;
	}

	return (
		<div className='mt-6 pt-6 border-t border-gray-200'>
			<h4 className='text-md font-medium text-gray-900 mb-4 flex items-center'>
				<Shield className='h-4 w-4 mr-2 text-gray-600' />
				Column Permissions
			</h4>
			<div className='space-y-4'>
				{columnPermissions.map((columnPermission) => (
					<div key={columnPermission.id} className='bg-gray-50 rounded-lg p-4'>
						<div className='flex items-center justify-between mb-3'>
							<span className='font-medium text-gray-900 text-sm'>
								{table.columns?.find((c) => c.id === columnPermission.columnId)
									?.name || `Column ${columnPermission.columnId}`}
							</span>
						</div>
						<div className='grid grid-cols-2 gap-4'>
							<PermissionToggle
								enabled={columnPermission.canRead}
								onChange={(value) =>
									handleColumnPermissionChange(
										columnPermission.columnId,
										"canRead",
										value,
									)
								}
								label='Read'
								variant='read'
							/>
							<PermissionToggle
								enabled={columnPermission.canEdit}
								onChange={(value) =>
									handleColumnPermissionChange(
										columnPermission.columnId,
										"canEdit",
										value,
									)
								}
								label='Edit'
								variant='edit'
							/>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
