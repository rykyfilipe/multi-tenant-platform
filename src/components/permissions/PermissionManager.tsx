/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUserPermissions } from "@/hooks/useCurrentUserPermissions";
import { useTablePermissions } from "@/hooks/useTablePermissions";
import { useApp } from "@/contexts/AppContext";
import { TablePermission, ColumnPermission } from "@/types/permissions";
import { Table, Column } from "@/types/database";
import { Shield, Eye, Edit, Trash, Save, X } from "lucide-react";

interface PermissionManagerProps {
	table: Table;
	columns: Column[];
	onPermissionsUpdate?: (permissions: {
		tablePermissions: TablePermission[];
		columnPermissions: ColumnPermission[];
	}) => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
	table,
	columns,
	onPermissionsUpdate,
}) => {
	const { user, tenant } = useApp();
	const { permissions: userPermissions } = useCurrentUserPermissions();
	const tablePermissions = useTablePermissions(
		table.id,
		userPermissions?.tablePermissions || [],
		userPermissions?.columnsPermissions || [],
	);

	const [editingPermissions, setEditingPermissions] = useState<{
		tablePermissions: TablePermission[];
		columnPermissions: ColumnPermission[];
	} | null>(null);

	const [hasChanges, setHasChanges] = useState(false);

	useEffect(() => {
		if (userPermissions) {
			setEditingPermissions({
				tablePermissions: [...userPermissions.tablePermissions],
				columnPermissions: [...userPermissions.columnsPermissions],
			});
		}
	}, [userPermissions]);

	const handleTablePermissionChange = (
		field: keyof Pick<TablePermission, "canRead" | "canEdit" | "canDelete">,
		value: boolean,
	) => {
		if (!editingPermissions) return;

		const updatedPermissions = { ...editingPermissions };
		const existingPermission = updatedPermissions.tablePermissions.find(
			(tp) => tp.tableId === table.id,
		);

		if (existingPermission) {
			existingPermission[field] = value;
		} else {
			// Create new permission if it doesn't exist
			const newPermission: TablePermission = {
				id: Date.now(),
				userId: user?.id || 0,
				tableId: table.id,
				tenantId: tenant?.id || 0,
				canRead: field === "canRead" ? value : false,
				canEdit: field === "canEdit" ? value : false,
				canDelete: field === "canDelete" ? value : false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			updatedPermissions.tablePermissions.push(newPermission);
		}

		setEditingPermissions(updatedPermissions);
		setHasChanges(true);
	};

	const handleColumnPermissionChange = (
		columnId: number,
		field: keyof Pick<ColumnPermission, "canRead" | "canEdit">,
		value: boolean,
	) => {
		if (!editingPermissions) return;

		const updatedPermissions = { ...editingPermissions };
		const existingPermission = updatedPermissions.columnPermissions.find(
			(cp) => cp.columnId === columnId && cp.tableId === table.id,
		);

		if (existingPermission) {
			existingPermission[field] = value;
		} else {
			// Create new permission if it doesn't exist
			const newPermission: ColumnPermission = {
				id: Date.now(),
				userId: user?.id || 0,
				columnId,
				tableId: table.id,
				tenantId: tenant?.id || 0,
				canRead: field === "canRead" ? value : false,
				canEdit: field === "canEdit" ? value : false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			updatedPermissions.columnPermissions.push(newPermission);
		}

		setEditingPermissions(updatedPermissions);
		setHasChanges(true);
	};

	const handleSave = async () => {
		if (!editingPermissions) return;

		try {
			// Here you would save the permissions to the backend
			// For now, we'll just call the callback
			if (onPermissionsUpdate) {
				onPermissionsUpdate(editingPermissions);
			}
			setHasChanges(false);
		} catch (error) {
			console.error("Failed to save permissions:", error);
		}
	};

	const handleCancel = () => {
		if (userPermissions) {
			setEditingPermissions({
				tablePermissions: [...userPermissions.tablePermissions],
				columnPermissions: [...userPermissions.columnsPermissions],
			});
		}
		setHasChanges(false);
	};

	if (!tablePermissions.canEditTable()) {
		return (
			<Card>
				<CardContent className='p-6 text-center'>
					<div className='text-muted-foreground'>
						<Shield className='w-8 h-8 mx-auto mb-2 opacity-50' />
						<p className='text-sm'>
							You don't have permission to manage permissions for this table.
						</p>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Table Permissions */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='w-5 h-5' />
						Table Permissions
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-3 gap-4'>
						<div className='space-y-2'>
							<Label className='flex items-center gap-2'>
								<Eye className='w-4 h-4' />
								Read
							</Label>
							<Button
								variant={
									editingPermissions?.tablePermissions.find(
										(tp) => tp.tableId === table.id,
									)?.canRead
										? "default"
										: "outline"
								}
								size='sm'
								onClick={() =>
									handleTablePermissionChange(
										"canRead",
										!editingPermissions?.tablePermissions.find(
											(tp) => tp.tableId === table.id,
										)?.canRead,
									)
								}
								className='w-full'>
								{editingPermissions?.tablePermissions.find(
									(tp) => tp.tableId === table.id,
								)?.canRead
									? "Enabled"
									: "Disabled"}
							</Button>
						</div>
						<div className='space-y-2'>
							<Label className='flex items-center gap-2'>
								<Edit className='w-4 h-4' />
								Edit
							</Label>
							<Button
								variant={
									editingPermissions?.tablePermissions.find(
										(tp) => tp.tableId === table.id,
									)?.canEdit
										? "default"
										: "outline"
								}
								size='sm'
								onClick={() =>
									handleTablePermissionChange(
										"canEdit",
										!editingPermissions?.tablePermissions.find(
											(tp) => tp.tableId === table.id,
										)?.canEdit,
									)
								}
								className='w-full'>
								{editingPermissions?.tablePermissions.find(
									(tp) => tp.tableId === table.id,
								)?.canEdit
									? "Enabled"
									: "Disabled"}
							</Button>
						</div>
						<div className='space-y-2'>
							<Label className='flex items-center gap-2'>
								<Trash className='w-4 h-4' />
								Delete
							</Label>
							<Button
								variant={
									editingPermissions?.tablePermissions.find(
										(tp) => tp.tableId === table.id,
									)?.canDelete
										? "default"
										: "outline"
								}
								size='sm'
								onClick={() =>
									handleTablePermissionChange(
										"canDelete",
										!editingPermissions?.tablePermissions.find(
											(tp) => tp.tableId === table.id,
										)?.canDelete,
									)
								}
								className='w-full'>
								{editingPermissions?.tablePermissions.find(
									(tp) => tp.tableId === table.id,
								)?.canDelete
									? "Enabled"
									: "Disabled"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Column Permissions */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Shield className='w-5 h-5' />
						Column Permissions
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className='space-y-4'>
						{columns.map((column) => (
							<div key={column.id} className='border rounded-lg p-4'>
								<div className='flex items-center justify-between mb-3'>
									<Label className='font-medium'>{column.name}</Label>
									<span className='text-xs text-muted-foreground'>
										{column.type}
									</span>
								</div>
								<div className='grid grid-cols-2 gap-4'>
									<div className='space-y-2'>
										<Label className='flex items-center gap-2 text-sm'>
											<Eye className='w-3 h-3' />
											Read
										</Label>
										<Button
											variant={
												editingPermissions?.columnPermissions.find(
													(cp) =>
														cp.columnId === column.id &&
														cp.tableId === table.id,
												)?.canRead
													? "default"
													: "outline"
											}
											size='sm'
											onClick={() =>
												handleColumnPermissionChange(
													column.id,
													"canRead",
													!editingPermissions?.columnPermissions.find(
														(cp) =>
															cp.columnId === column.id &&
															cp.tableId === table.id,
													)?.canRead,
												)
											}
											className='w-full'>
											{editingPermissions?.columnPermissions.find(
												(cp) =>
													cp.columnId === column.id && cp.tableId === table.id,
											)?.canRead
												? "Enabled"
												: "Disabled"}
										</Button>
									</div>
									<div className='space-y-2'>
										<Label className='flex items-center gap-2 text-sm'>
											<Edit className='w-3 h-3' />
											Edit
										</Label>
										<Button
											variant={
												editingPermissions?.columnPermissions.find(
													(cp) =>
														cp.columnId === column.id &&
														cp.tableId === table.id,
												)?.canEdit
													? "default"
													: "outline"
											}
											size='sm'
											onClick={() =>
												handleColumnPermissionChange(
													column.id,
													"canEdit",
													!editingPermissions?.columnPermissions.find(
														(cp) =>
															cp.columnId === column.id &&
															cp.tableId === table.id,
													)?.canEdit,
												)
											}
											className='w-full'>
											{editingPermissions?.columnPermissions.find(
												(cp) =>
													cp.columnId === column.id && cp.tableId === table.id,
											)?.canEdit
												? "Enabled"
												: "Disabled"}
										</Button>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			{hasChanges && (
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={handleCancel}>
						<X className='w-4 h-4 mr-2' />
						Cancel
					</Button>
					<Button onClick={handleSave}>
						<Save className='w-4 h-4 mr-2' />
						Save Changes
					</Button>
				</div>
			)}
		</div>
	);
};
