/** @format */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Settings2,
	Trash2,
	Mail,
	User as UserIcon,
	Crown,
	Eye,
	Edit,
	ChevronUp,
	Check,
	X,
	UserX,
	UserCheck,
	Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Role } from "@/types/user";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PermissionTemplateSelector } from "@/components/permissions/PermissionTemplateSelector";
import Link from "next/link";
import { useState } from "react";

interface Props {
	users: User[];
	onDeleteRow: (userId: string) => void;
	onUpdateUserRole?: (userId: string, newRole: Role) => void;
	onDeactivateUser?: (userId: string) => void;
	onActivateUser?: (userId: string) => void;
	onRefresh?: () => void;
}

const getRoleIcon = (role: Role) => {
	switch (role) {
		case Role.ADMIN:
			return <Crown className='w-4 h-4' />;
		case Role.EDITOR:
			return <Edit className='w-4 h-4' />;
		case Role.VIEWER:
			return <Eye className='w-4 h-4' />;
		default:
			return <UserIcon className='w-4 h-4' />;
	}
};

const getRoleColor = (role: Role) => {
	switch (role) {
		case Role.ADMIN:
			return "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25";
		case Role.EDITOR:
			return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25";
		case Role.VIEWER:
			return "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25";
		default:
			return "bg-slate-100 text-slate-700";
	}
};

const getInitials = (firstName: string, lastName: string) => {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getRoleDisplayName = (role: Role) => {
	switch (role) {
		case Role.ADMIN:
			return "Administrator";
		case Role.EDITOR:
			return "Editor";
		case Role.VIEWER:
			return "Viewer";
		default:
			return "User";
	}
};

export function UserManagementGrid({
	users,
	onDeleteRow,
	onUpdateUserRole,
	onDeactivateUser,
	onActivateUser,
	onRefresh,
}: Props) {
	const { user: currentUser } = useApp();
	const { t } = useLanguage();
	const [sortField, setSortField] = useState<keyof User>('firstName');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [hoveredRow, setHoveredRow] = useState<string | null>(null);
	const [editingRole, setEditingRole] = useState<string | null>(null);
	const [tempRole, setTempRole] = useState<Role | null>(null);
	const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
	const [showTemplateSelector, setShowTemplateSelector] = useState(false);

	// Handle sorting
	const handleSort = (field: keyof User) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('asc');
		}
	};

	// Handle role editing
	const handleEditRole = (userId: string, currentRole: Role) => {
		setEditingRole(userId);
		setTempRole(currentRole);
	};

	const handleSaveRole = (userId: string) => {
		if (tempRole && onUpdateUserRole) {
			onUpdateUserRole(userId, tempRole);
		}
		setEditingRole(null);
		setTempRole(null);
	};

	const handleCancelEdit = () => {
		setEditingRole(null);
		setTempRole(null);
	};

	// Bulk selection handlers
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			const allIds = new Set(users.map(u => u.id));
			setSelectedUsers(allIds);
		} else {
			setSelectedUsers(new Set());
		}
	};

	const handleSelectUser = (userId: number, checked: boolean) => {
		const newSelected = new Set(selectedUsers);
		if (checked) {
			newSelected.add(userId);
		} else {
			newSelected.delete(userId);
		}
		setSelectedUsers(newSelected);
	};

	const allSelected = users.length > 0 && selectedUsers.size === users.length;
	const someSelected = selectedUsers.size > 0 && selectedUsers.size < users.length;

	// Sort users
	const sortedUsers = [...users].sort((a, b) => {
		const aValue = a[sortField];
		const bValue = b[sortField];
		
		// Handle null/undefined values
		if (aValue == null && bValue == null) return 0;
		if (aValue == null) return 1;
		if (bValue == null) return -1;
		
		if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
		if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
		return 0;
	});

	if (users.length === 0) {
		return (
			<div className='text-center py-16'>
				<div className='w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6'>
					<UserIcon className='w-10 h-10 text-slate-400' />
				</div>
				<h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-2'>No team members yet</h3>
				<p className='text-slate-500 dark:text-slate-400 max-w-md mx-auto'>
					Start building your team by inviting members to join your organization.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-0'>
			{/* Bulk Actions Toolbar */}
			{selectedUsers.size > 0 && (
				<div className='bg-primary/10 border-b border-primary/20 px-6 py-3'>
					<div className='flex items-center justify-between'>
						<span className='text-sm font-medium text-primary'>
							{selectedUsers.size} user(s) selected
						</span>
						<div className='flex items-center gap-2'>
							<Button
								size='sm'
								variant='default'
								onClick={() => setShowTemplateSelector(true)}
								className='gap-2'
							>
								<Sparkles className='w-4 h-4' />
								Apply Template
							</Button>
							<Button
								size='sm'
								variant='ghost'
								onClick={() => setSelectedUsers(new Set())}
							>
								Clear Selection
							</Button>
						</div>
					</div>
				</div>
			)}

			{/* Modern Table Header */}
			<div className='bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600'>
				<div className='grid grid-cols-12 gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300'>
					<div className='col-span-1 flex items-center'>
						<Checkbox
							checked={allSelected}
							onCheckedChange={handleSelectAll}
							className={someSelected ? 'opacity-50' : ''}
						/>
					</div>
					<div className='col-span-4 flex items-center gap-2'>
						<span>Team Member</span>
						<button
							onClick={() => handleSort('firstName')}
							className='hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600'>
							<ChevronUp className={`w-4 h-4 transition-transform ${sortField === 'firstName' && sortDirection === 'asc' ? 'rotate-180' : ''}`} />
						</button>
					</div>
					<div className='col-span-3 flex items-center gap-2'>
						<span>Role</span>
						<button
							onClick={() => handleSort('role')}
							className='hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600'>
							<ChevronUp className={`w-4 h-4 transition-transform ${sortField === 'role' && sortDirection === 'asc' ? 'rotate-180' : ''}`} />
						</button>
					</div>
					<div className='col-span-2'>Contact</div>
					<div className='col-span-2 text-center'>Actions</div>
				</div>
			</div>

			{/* Modern Table Body */}
			<div className='divide-y divide-slate-200 dark:divide-slate-700'>
				{sortedUsers.map((user, index) => (
					<div
						key={user.id}
						className={`px-6 py-5 transition-all duration-200 group ${
							hoveredRow === user.id.toString() 
								? 'bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20' 
								: 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
						} ${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'}`}
						onMouseEnter={() => setHoveredRow(user.id.toString())}
						onMouseLeave={() => setHoveredRow(null)}>
						<div className='grid grid-cols-12 gap-6 items-center'>
							{/* Selection Checkbox */}
							<div className='col-span-1'>
								<Checkbox
									checked={selectedUsers.has(user.id)}
									onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
								/>
							</div>

							{/* Member Info */}
							<div className='col-span-4 flex items-center gap-4'>
								<div className='relative'>
									<Avatar className='w-12 h-12 border-2 border-white dark:border-slate-800 shadow-lg'>
										<AvatarFallback className='bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-lg'>
											{getInitials(user.firstName, user.lastName)}
										</AvatarFallback>
									</Avatar>
									{user.role === 'ADMIN' && (
										<div className='absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg'>
											<Crown className='w-3 h-3 text-white' />
										</div>
									)}
								</div>
								<div className='min-w-0 flex-1'>
									<div className='font-semibold text-slate-900 dark:text-white text-base'>
										{user.firstName} {user.lastName}
									</div>
									<div className='text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2'>
										<div className={`w-2 h-2 rounded-full ${(user as any).isActive !== false ? 'bg-green-500' : 'bg-red-500'}`} />
										{(user as any).isActive !== false ? 'Active' : 'Inactive'} • Member
									</div>
								</div>
							</div>

							{/* Role - Editable for non-admin users */}
							<div className='col-span-3'>
								{editingRole === user.id.toString() ? (
									<div className='flex items-center gap-2'>
										<Select
											value={tempRole || user.role}
											onValueChange={(value) => setTempRole(value as Role)}>
											<SelectTrigger className='w-32 h-8'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value={Role.EDITOR}>Editor</SelectItem>
												<SelectItem value={Role.VIEWER}>Viewer</SelectItem>
											</SelectContent>
										</Select>
										<Button
											size='sm'
											variant='ghost'
											onClick={() => handleSaveRole(user.id.toString())}
											className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50'>
											<Check className='w-4 h-4' />
										</Button>
										<Button
											size='sm'
											variant='ghost'
											onClick={handleCancelEdit}
											className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'>
											<X className='w-4 h-4' />
										</Button>
									</div>
								) : (
									<div className='flex items-center gap-2'>
										<Badge className={`${getRoleColor(user.role)} border-0 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm`}>
											<div className='flex items-center gap-2'>
												{getRoleIcon(user.role)}
												{getRoleDisplayName(user.role)}
											</div>
										</Badge>
										{currentUser?.role === 'ADMIN' && user.role !== 'ADMIN' && (
											<Button
												size='sm'
												variant='ghost'
												onClick={() => handleEditRole(user.id.toString(), user.role)}
												className={`h-8 w-8 p-0 ${
													hoveredRow === user.id.toString() 
														? 'opacity-100 text-slate-600 hover:text-slate-900' 
														: 'opacity-0 group-hover:opacity-100'
												}`}>
												<Edit className='w-4 h-4' />
											</Button>
										)}
									</div>
								)}
							</div>

							{/* Contact */}
							<div className='col-span-2'>
								<div className='flex items-center gap-3 text-slate-600 dark:text-slate-300'>
									<div className='w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center'>
										<Mail className='w-4 h-4' />
									</div>
									<div className='min-w-0 flex-1'>
										<div className='text-sm font-medium text-slate-900 dark:text-white truncate'>
											{user.email}
										</div>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className='col-span-2 flex items-center justify-center gap-2'>
								<Button
									variant='ghost'
									size='sm'
									asChild
									className={`h-9 w-9 rounded-lg transition-all duration-200 ${
										hoveredRow === user.id.toString() 
											? 'opacity-100 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' 
											: 'opacity-0 group-hover:opacity-100'
									}`}>
									<Link href={`/home/users/permisions/${user.id}`}>
										<Settings2 className='w-4 h-4' />
									</Link>
								</Button>
								{currentUser?.role === 'ADMIN' && currentUser?.id !== user.id && (
									<>
										{/* Activate/Deactivate Button */}
										{(user as any).isActive !== false ? (
											<Button
												variant='ghost'
												size='sm'
												onClick={() => onDeactivateUser?.(user.id.toString())}
												className={`h-9 w-9 rounded-lg transition-all duration-200 ${
													hoveredRow === user.id.toString() 
														? 'opacity-100 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30' 
														: 'opacity-0 group-hover:opacity-100'
												}`}
												title="Deactivate user">
												<UserX className='w-4 h-4' />
											</Button>
										) : (
											<Button
												variant='ghost'
												size='sm'
												onClick={() => onActivateUser?.(user.id.toString())}
												className={`h-9 w-9 rounded-lg transition-all duration-200 ${
													hoveredRow === user.id.toString() 
														? 'opacity-100 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30' 
														: 'opacity-0 group-hover:opacity-100'
												}`}
												title="Activate user">
												<UserCheck className='w-4 h-4' />
											</Button>
										)}
										{/* Delete Button */}
										<Button
											variant='ghost'
											size='sm'
											onClick={() => onDeleteRow(user.id.toString())}
											className={`h-9 w-9 rounded-lg transition-all duration-200 ${
												hoveredRow === user.id.toString() 
													? 'opacity-100 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' 
													: 'opacity-0 group-hover:opacity-100'
											}`}
											title="Delete user">
											<Trash2 className='w-4 h-4' />
										</Button>
									</>
								)}
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Permission Template Selector */}
			<PermissionTemplateSelector
				open={showTemplateSelector}
				onOpenChange={setShowTemplateSelector}
				selectedUserIds={Array.from(selectedUsers)}
				onSuccess={() => {
					setSelectedUsers(new Set());
					if (onRefresh) onRefresh();
				}}
			/>
		</div>
	);
}