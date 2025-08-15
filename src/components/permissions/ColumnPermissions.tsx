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

	// Verificăm dacă tabelul are coloane
	if (!table.columns || table.columns.length === 0) {
		return (
			<div className='mt-6 pt-6 border-t border-gray-200'>
				<h4 className='text-md font-medium text-gray-900 mb-4 flex items-center'>
					<Shield className='h-4 w-4 mr-2 text-gray-600' />
					Column Permissions
				</h4>
				<div className='text-sm text-gray-500 italic'>
					No columns found for this table.
				</div>
			</div>
		);
	}

	return (
		<div className='mt-6 pt-6 border-t border-gray-200'>
			<h4 className='text-md font-medium text-gray-900 mb-4 flex items-center'>
				<Shield className='h-4 w-4 mr-2 text-gray-600' />
				Column Permissions ({table.columns.length} columns)
			</h4>
			<div className='space-y-4'>
				{table.columns.map((column) => {
					// Găsim permisiunea existentă pentru această coloană
					const existingPermission = columnPermissions.find(
						(cp) => cp.columnId === column.id && cp.tableId === table.id
					);

					// Dacă nu există permisiune, o creăm cu valori implicite
					const columnPermission: ColumnPermission = existingPermission || {
						id: Date.now() + column.id, // ID temporar
						userId: 0, // Va fi setat când se salvează
						tableId: table.id,
						tenantId: 0, // Va fi setat când se salvează
						columnId: column.id,
						canRead: false,
						canEdit: false,
						createdAt: new Date(),
						updatedAt: new Date(),
					};

					return (
						<div key={column.id} className='bg-gray-50 rounded-lg p-4'>
							<div className='flex items-center justify-between mb-3'>
								<div>
									<span className='font-medium text-gray-900 text-sm'>
										{column.name}
									</span>
									<span className='ml-2 text-xs text-gray-500'>
										({column.type})
									</span>
								</div>
							</div>
							<div className='grid grid-cols-2 gap-4'>
								<PermissionToggle
									enabled={columnPermission.canRead}
									onChange={(value) =>
										handleColumnPermissionChange(
											column.id,
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
											column.id,
											"canEdit",
											value,
										)
									}
									label='Edit'
									variant='edit'
								/>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};
