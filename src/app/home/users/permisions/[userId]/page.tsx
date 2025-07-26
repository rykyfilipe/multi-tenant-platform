/** @format */

"use client";

import { useState, useEffect, use } from "react";
import {
	ChevronDown,
	ChevronRight,
	Save,
	User,
	Table,
	Shield,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useParams } from "next/navigation";
import { he } from "date-fns/locale";
import { set } from "date-fns";
import { Column } from "@/types/database";

// Interfețe TypeScript
interface TablePermission {
	id: number;
	userId: number;
	tableId: number;
	tenantId: number;
	canRead: boolean;
	canEdit: boolean;
	canDelete: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface ColumnPermission {
	id: number;
	userId: number;
	tableId: number;
	tenantId: number;
	columnId: number;
	canRead: boolean;
	canEdit: boolean;
	createdAt: Date;
	updatedAt: Date;
}

interface Permissions {
	tablePermissions: TablePermission[];
	columnsPermissions: ColumnPermission[];
}

interface TableInfo {
	id: number;
	name: string;
	description: string;
	columns?: Column[];
}

type PermissionVariant = "read" | "edit" | "delete" | "default";

// Mock data pentru demonstrație
const mockPermissions: Permissions = {
	tablePermissions: [
		{
			id: 1,
			userId: 1,
			tableId: 1,
			tenantId: 1,
			canRead: true,
			canEdit: false,
			canDelete: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 2,
			userId: 1,
			tableId: 2,
			tenantId: 1,
			canRead: true,
			canEdit: true,
			canDelete: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 3,
			userId: 1,
			tableId: 3,
			tenantId: 1,
			canRead: false,
			canEdit: false,
			canDelete: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	],
	columnsPermissions: [
		{
			id: 1,
			userId: 1,
			tableId: 1,
			tenantId: 1,
			columnId: 1,
			canRead: true,
			canEdit: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
		{
			id: 2,
			userId: 1,
			tableId: 1,
			tenantId: 1,
			columnId: 2,
			canRead: true,
			canEdit: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	],
};

const mockTables: TableInfo[] = [
	{ id: 1, name: "Users", description: "User management table" },
	{ id: 2, name: "Posts", description: "Blog posts and articles" },
	{ id: 3, name: "Settings", description: "System configuration" },
];

interface PermissionToggleProps {
	enabled: boolean;
	onChange: (value: boolean) => void;
	label: string;
	variant?: PermissionVariant;
}

function PermissionToggle({
	enabled,
	onChange,
	label,
	variant = "default",
}: PermissionToggleProps) {
	const baseClasses: string =
		"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
	const variantClasses: Record<PermissionVariant, string> = {
		read: enabled ? "bg-blue-600 focus:ring-blue-500" : "bg-gray-200",
		edit: enabled ? "bg-amber-600 focus:ring-amber-500" : "bg-gray-200",
		delete: enabled ? "bg-red-600 focus:ring-red-500" : "bg-gray-200",
		default: enabled ? "bg-green-600 focus:ring-green-500" : "bg-gray-200",
	};

	return (
		<div className='flex items-center space-x-2'>
			<button
				type='button'
				className={`${baseClasses} ${variantClasses[variant]}`}
				onClick={() => onChange(!enabled)}
				aria-label={`Toggle ${label}`}>
				<span
					className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
						enabled ? "translate-x-6" : "translate-x-1"
					}`}
				/>
			</button>
			<span className='text-sm font-medium text-gray-700'>{label}</span>
		</div>
	);
}

interface TablePermissionCardProps {
	table: TableInfo;
	tablePermission: TablePermission | undefined;
	columnPermissions: ColumnPermission[];
	onUpdateTablePermission: (
		tableId: number,
		field: keyof Pick<TablePermission, "canRead" | "canEdit" | "canDelete">,
		value: boolean,
	) => void;
	onUpdateColumnPermission: (
		tableId: number,
		columnId: number,
		field: keyof Pick<ColumnPermission, "canRead" | "canEdit">,
		value: boolean,
	) => void;
}

function TablePermissionCard({
	table,
	tablePermission,
	columnPermissions,
	onUpdateTablePermission,
	onUpdateColumnPermission,
}: TablePermissionCardProps) {
	const [isExpanded, setIsExpanded] = useState<boolean>(false);
	const [hasChanges, setHasChanges] = useState<boolean>(false);

	const handleTablePermissionChange = (
		field: keyof Pick<TablePermission, "canRead" | "canEdit" | "canDelete">,
		value: boolean,
	): void => {
		onUpdateTablePermission(table.id, field, value);
		setHasChanges(true);
	};

	const handleColumnPermissionChange = (
		columnId: number,
		field: keyof Pick<ColumnPermission, "canRead" | "canEdit">,
		value: boolean,
	): void => {
		onUpdateColumnPermission(table.id, columnId, field, value);
		setHasChanges(true);
	};

	const tableColumns: ColumnPermission[] = columnPermissions.filter(
		(cp) => cp.tableId === table.id,
	);
	const hasTableAccess: boolean =
		tablePermission?.canRead ||
		tablePermission?.canEdit ||
		tablePermission?.canDelete ||
		false;

	return (
		<div className='bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow'>
			<div className='p-6'>
				<div className='flex items-center justify-between'>
					<div className='flex items-center space-x-3'>
						<div
							className={`p-2 rounded-lg ${
								hasTableAccess ? "bg-green-100" : "bg-gray-100"
							}`}>
							<Table
								className={`h-5 w-5 ${
									hasTableAccess ? "text-green-600" : "text-gray-400"
								}`}
							/>
						</div>
						<div>
							<h3 className='text-lg font-semibold text-gray-900'>
								{table.name}
							</h3>
							<p className='text-sm text-gray-500'>{table.description}</p>
						</div>
					</div>
					<div className='flex items-center space-x-4'>
						{hasChanges && (
							<div className='flex items-center space-x-2 text-amber-600'>
								<div className='h-2 w-2 bg-amber-400 rounded-full'></div>
								<span className='text-xs font-medium'>Unsaved changes</span>
							</div>
						)}
						<button
							onClick={() => setIsExpanded(!isExpanded)}
							className='flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors'>
							{isExpanded ? (
								<ChevronDown className='h-4 w-4' />
							) : (
								<ChevronRight className='h-4 w-4' />
							)}
							<span className='text-sm font-medium'>
								{tableColumns.length} columns
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

				{isExpanded && tableColumns.length > 0 && (
					<div className='mt-6 pt-6 border-t border-gray-200'>
						<h4 className='text-md font-medium text-gray-900 mb-4 flex items-center'>
							<Shield className='h-4 w-4 mr-2 text-gray-600' />
							Column Permissions
						</h4>
						<div className='space-y-4'>
							{tableColumns.map((columnPermission) => (
								<div
									key={columnPermission.id}
									className='bg-gray-50 rounded-lg p-4'>
									<div className='flex items-center justify-between mb-3'>
										<span className='font-medium text-gray-900 text-sm'>
											{table.columns?.find(
												(c) => c.id === columnPermission.columnId,
											)?.name || `Column ${columnPermission.columnId}`}
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
				)}
			</div>
		</div>
	);
}

export default function PermissionsManager() {
	const [permissions, setPermissions] = useState<Permissions>(mockPermissions);
	const [tables, setTables] = useState<TableInfo[]>(mockTables);
	const [hasGlobalChanges, setHasGlobalChanges] = useState<boolean>(false);

	const { tenant, token, user, showAlert } = useApp();
	const params = useParams();
	const userId = Array.isArray(params.userId)
		? params.userId[0]
		: params.userId;

	if (!userId) return;

	useEffect(() => {
		const fetchPermissions = async () => {
			// Aici ai implementa logica de fetch pentru permisiuni
			const response = await fetch(
				`/api/tenants/${tenant?.id}/users/${userId}/permisions`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);
			if (response.ok) {
				const data = await response.json();
				setPermissions({
					tablePermissions: data.tablePermissions || [],
					columnsPermissions: data.columnsPermissions || [],
				});
				console.log("Permissions fetched:", data);
				showAlert("Permissions loaded successfully", "success");
			} else {
				showAlert("Failed to load permissions", "error");
			}
		};

		const fetchTables = async () => {
			const response = await fetch(
				`/api/tenants/${tenant?.id}/database/tables`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				},
			);
			if (response.ok) {
				const data = await response.json();
				setTables(data || []);
				showAlert("Permissions loaded successfully", "success");
			} else {
				showAlert("Failed to load permissions", "error");
			}
		};

		fetchTables();
		fetchPermissions();
	}, [token, user, tenant]);

	const updateTablePermission = (
		tableId: number,
		field: keyof Pick<TablePermission, "canRead" | "canEdit" | "canDelete">,
		value: boolean,
	): void => {
		setPermissions((prev) => {
			const existingPermission: TablePermission | undefined =
				prev.tablePermissions.find((tp) => tp.tableId === tableId);

			if (existingPermission) {
				return {
					...prev,
					tablePermissions: prev.tablePermissions.map((tp) =>
						tp.tableId === tableId ? { ...tp, [field]: value } : tp,
					),
				};
			} else {
				const newPermission: TablePermission = {
					id: Date.now(),
					userId: 1,
					tableId,
					tenantId: 1,
					canRead: field === "canRead" ? value : false,
					canEdit: field === "canEdit" ? value : false,
					canDelete: field === "canDelete" ? value : false,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				return {
					...prev,
					tablePermissions: [...prev.tablePermissions, newPermission],
				};
			}
		});
		setHasGlobalChanges(true);
	};

	const updateColumnPermission = (
		tableId: number,
		columnId: number,
		field: keyof Pick<ColumnPermission, "canRead" | "canEdit">,
		value: boolean,
	): void => {
		setPermissions((prev) => ({
			...prev,
			columnsPermissions: prev.columnsPermissions.map((cp) =>
				cp.tableId === tableId && cp.columnId === columnId
					? { ...cp, [field]: value }
					: cp,
			),
		}));
		setHasGlobalChanges(true);
	};

	const savePermissions = async (): Promise<void> => {
		// Aici ai implementa logica de salvare
		console.log("Saving permissions:", permissions);
		setHasGlobalChanges(false);
		
	};

	return (
		<div className='min-h-screen bg-gray-50 py-8'>
			<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='mb-8'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center space-x-3'>
							<div className='p-3 bg-blue-100 rounded-lg'>
								<User className='h-6 w-6 text-blue-600' />
							</div>
							<div>
								<h1 className='text-3xl font-bold text-gray-900'>
									User Permissions
								</h1>
								<p className='text-gray-600 mt-1'>
									Manage table and column access permissions
								</p>
							</div>
						</div>

						{hasGlobalChanges && (
							<button
								onClick={savePermissions}
								className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm'>
								<Save className='h-4 w-4' />
								<span>Save Changes</span>
							</button>
						)}
					</div>
				</div>

				<div className='space-y-6'>
					{tables.map((table: TableInfo) => {
						const tablePermission: TablePermission | undefined =
							permissions.tablePermissions.find(
								(tp) => tp.tableId === table.id,
							);
						const columnPermissions: ColumnPermission[] =
							permissions.columnsPermissions.filter(
								(cp) => cp.tableId === table.id,
							);

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

				{tables.length === 0 && (
					<div className='text-center py-12'>
						<Table className='h-12 w-12 text-gray-400 mx-auto mb-4' />
						<h3 className='text-lg font-medium text-gray-900 mb-2'>
							No tables found
						</h3>
						<p className='text-gray-500'>
							There are no tables available to manage permissions for.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
