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
			return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
		case Role.EDITOR:
			return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
		case Role.VIEWER:
			return "bg-gradient-to-r from-gray-500 to-slate-500 text-white";
		default:
			return "bg-gray-100 text-gray-700";
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

	// Get current date for "Since" display
	const getCurrentDate = () => {
		const now = new Date();
		const month = now.toLocaleString('en-US', { month: 'short' });
		const year = now.getFullYear();
		return `Since ${month}, ${year}`;
	};

	return (
		<div className='space-y-6'>
			{/* Table */}
			<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
				<CardContent className='p-0'>
					<div className='overflow-x-auto'>
						<table className='w-full'>
							<thead>
								<tr className='border-b border-border/20 bg-muted/30'>
									<th className='px-6 py-4 text-left'>
										<Checkbox
											checked={selectedUsers.size === users.length && users.length > 0}
											onCheckedChange={handleSelectAll}
											className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
										/>
									</th>
									<th 
										className='px-6 py-4 text-left font-medium text-foreground cursor-pointer hover:text-primary transition-colors'
										onClick={() => handleSort('firstName')}
									>
										<div className='flex items-center gap-2'>
											Member Name
											<ChevronUp className={`w-4 h-4 transition-transform ${sortField === 'firstName' ? (sortDirection === 'asc' ? 'rotate-0' : 'rotate-180') : 'opacity-30'}`} />
										</div>
									</th>
									<th 
										className='px-6 py-4 text-left font-medium text-foreground cursor-pointer hover:text-primary transition-colors'
										onClick={() => handleSort('role')}
									>
										<div className='flex items-center gap-2'>
											Title
											<ChevronUp className={`w-4 h-4 transition-transform ${sortField === 'role' ? (sortDirection === 'asc' ? 'rotate-0' : 'rotate-180') : 'opacity-30'}`} />
										</div>
									</th>
									<th className='px-6 py-4 text-left font-medium text-foreground'>
										Project
									</th>
									<th className='px-6 py-4 text-left font-medium text-foreground'>
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{sortedUsers.map((user, index) => (
									<tr 
										key={user.id} 
										className='border-b border-border/10 hover:bg-muted/20 transition-colors group'
									>
										<td className='px-6 py-4'>
											<Checkbox
												checked={selectedUsers.has(user.id.toString())}
												onCheckedChange={(checked) => handleUserSelection(user.id.toString(), checked as boolean)}
												className='data-[state=checked]:bg-primary data-[state=checked]:border-primary'
											/>
										</td>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-3'>
												<Avatar className='w-10 h-10'>
													<AvatarImage src={user.profileImage} />
													<AvatarFallback className='bg-primary/10 text-primary font-medium'>
														{getInitials(user.firstName, user.lastName)}
													</AvatarFallback>
												</Avatar>
												<div>
													<div className='font-medium text-foreground'>
														{user.firstName} {user.lastName}
													</div>
													<div className='text-sm text-muted-foreground'>
														{user.email}
													</div>
													<div className='text-xs text-muted-foreground'>
														{getCurrentDate()}
													</div>
												</div>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-2'>
												{getRoleIcon(user.role)}
												<span className='text-foreground'>
													{getRoleDisplayName(user.role)}
												</span>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-2'>
												<div className='w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center'>
													<span className='text-white text-xs font-bold'>P</span>
												</div>
												<div>
													<div className='font-medium text-foreground'>
														Platform
													</div>
													<div className='text-sm text-muted-foreground'>
														Team collaboration and management
													</div>
												</div>
											</div>
										</td>
										<td className='px-6 py-4'>
											<div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
												{currentUser?.role === Role.ADMIN && (
													<>
														<Button
															variant='ghost'
															size='sm'
															onClick={() => onEditCell?.(user.id.toString(), 'firstName')}
															className='h-8 w-8 p-0 hover:bg-muted'
														>
															<Edit className='w-4 h-4' />
														</Button>
														<Button
															variant='ghost'
															size='sm'
															onClick={() => onDeleteRow(user.id.toString())}
															className='h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground'
														>
															<Trash2 className='w-4 h-4' />
														</Button>
													</>
												)}
												<Button
													variant='ghost'
													size='sm'
													className='h-8 w-8 p-0 hover:bg-muted'
												>
													<MoreHorizontal className='w-4 h-4' />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>

			{/* Pagination */}
			{users.length > 0 && (
				<div className='flex items-center justify-between'>
					<div className='text-sm text-muted-foreground'>
						Showing {users.length} of {users.length} members
					</div>
					<div className='flex items-center gap-2'>
						<Button variant='outline' size='sm' disabled>
							&lt;&lt;
						</Button>
						<Button variant='outline' size='sm' disabled>
							&lt;
						</Button>
						<Button variant='default' size='sm'>
							1
						</Button>
						<Button variant='outline' size='sm' disabled>
							&gt;
						</Button>
						<Button variant='outline' size='sm' disabled>
							&gt;&gt;
						</Button>
					</div>
				</div>
			)}

			{/* Empty State */}
			{users.length === 0 && (
				<Card className='border-dashed border-2 border-muted-foreground/20'>
					<CardContent className='text-center py-16'>
						<div className='p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4'>
							<UserIcon className='w-8 h-8 text-muted-foreground' />
						</div>
						<h3 className='text-lg font-medium text-foreground mb-2'>
							{t("user.management.noMembers")}
						</h3>
						<p className='text-muted-foreground mb-4'>
							{t("user.management.noMembersDescription")}
						</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
