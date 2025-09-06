/** @format */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Settings2,
	Trash2,
	Mail,
	User as UserIcon,
	Crown,
	Eye,
	Edit,
	ChevronUp,
	MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { User, Role } from "@/types/user";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Link from "next/link";
import { useState } from "react";

interface Props {
	users: User[];
	editingCell?: { userId: string; fieldName: string } | null;
	onEditCell?: (userId: string, fieldName: string) => void;
	onSaveCell?: (userId: string, fieldName: keyof User, value: any) => void;
	onCancelEdit?: () => void;
	onDeleteRow: (userId: string) => void;
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
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteRow,
}: Props) {
	const { user: currentUser } = useApp();
	const { t } = useLanguage();
	const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
	const [sortField, setSortField] = useState<keyof User>('firstName');
	const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
	const [hoveredRow, setHoveredRow] = useState<string | null>(null);

	// Handle select all
	const handleSelectAll = (checked: boolean) => {
		if (checked) {
			setSelectedUsers(new Set(users.map(user => user.id.toString())));
		} else {
			setSelectedUsers(new Set());
		}
	};

	// Handle individual user selection
	const handleUserSelection = (userId: string, checked: boolean) => {
		const newSelected = new Set(selectedUsers);
		if (checked) {
			newSelected.add(userId);
		} else {
			newSelected.delete(userId);
		}
		setSelectedUsers(newSelected);
	};

	// Handle sorting
	const handleSort = (field: keyof User) => {
		if (sortField === field) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
		} else {
			setSortField(field);
			setSortDirection('asc');
		}
	};

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
			{/* Modern Table Header */}
			<div className='bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600'>
				<div className='flex items-center gap-4'>
					<Checkbox
						checked={selectedUsers.size === users.length && users.length > 0}
						onCheckedChange={handleSelectAll}
						className='data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md'
					/>
					<div className='flex-1 grid grid-cols-12 gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300'>
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
						<div className='col-span-3'>Contact</div>
						<div className='col-span-2 text-center'>Actions</div>
					</div>
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
						<div className='flex items-center gap-4'>
							<Checkbox
								checked={selectedUsers.has(user.id.toString())}
								onCheckedChange={(checked) => handleUserSelection(user.id.toString(), checked as boolean)}
								className='data-[state=checked]:bg-primary data-[state=checked]:border-primary rounded-md'
							/>
							<div className='flex-1 grid grid-cols-12 gap-6 items-center'>
								{/* Member Info */}
								<div className='col-span-4 flex items-center gap-4'>
									<div className='relative'>
										<Avatar className='w-12 h-12 border-2 border-white dark:border-slate-800 shadow-lg'>
											<AvatarImage src={user.profileImage} className='object-cover' />
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
											<div className='w-2 h-2 bg-green-500 rounded-full' />
											Active • Joined {new Date(user.createdAt).toLocaleDateString('en-US', { 
												month: 'short', 
												day: 'numeric', 
												year: 'numeric' 
											})}
										</div>
									</div>
								</div>

								{/* Role */}
								<div className='col-span-3'>
									<Badge className={`${getRoleColor(user.role)} border-0 text-xs font-semibold px-4 py-2 rounded-lg shadow-sm`}>
										<div className='flex items-center gap-2'>
											{getRoleIcon(user.role)}
											{getRoleDisplayName(user.role)}
										</div>
									</Badge>
								</div>

								{/* Contact */}
								<div className='col-span-3'>
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
										<Button
											variant='ghost'
											size='sm'
											onClick={() => onDeleteRow(user.id.toString())}
											className={`h-9 w-9 rounded-lg transition-all duration-200 ${
												hoveredRow === user.id.toString() 
													? 'opacity-100 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' 
													: 'opacity-0 group-hover:opacity-100'
											}`}>
											<Trash2 className='w-4 h-4' />
										</Button>
									)}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Premium Bulk Actions */}
			{selectedUsers.size > 0 && (
				<div className='bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-t border-primary/20 px-6 py-4'>
					<div className='flex items-center justify-between'>
						<div className='flex items-center gap-3'>
							<div className='w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center'>
								<UserIcon className='w-4 h-4 text-primary' />
							</div>
							<div>
								<div className='font-semibold text-primary'>
									{selectedUsers.size} member{selectedUsers.size > 1 ? 's' : ''} selected
								</div>
								<div className='text-sm text-slate-600 dark:text-slate-400'>
									Choose an action to perform on selected members
								</div>
							</div>
						</div>
						<div className='flex items-center gap-3'>
							<Button 
								variant='outline' 
								size='sm' 
								className='border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 rounded-lg'>
								<Settings2 className='w-4 h-4 mr-2' />
								Manage Permissions
							</Button>
							<Button 
								variant='outline' 
								size='sm' 
								className='border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 rounded-lg'>
								<Trash2 className='w-4 h-4 mr-2' />
								Remove Members
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}