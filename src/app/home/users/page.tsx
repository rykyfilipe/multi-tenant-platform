/** @format */

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePlanLimitError } from "@/hooks/usePlanLimitError";
import { UserManagementGrid } from "@/components/users/UserManagementGrid";
import { InvitationManagementList } from "@/components/users/InvitationManagementList";
import { InvitationCreationForm } from "@/components/users/InvitationCreationForm";
import { UsersLoadingState } from "@/components/ui/loading-states";
import TourProvider from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { tourUtils } from "@/lib/tour-config";
import { Shield, Users, Plus, Search, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, Role } from "@/types/user";

type UserWithCreatedAt = User & {
	createdAt: string;
};

// Extend the User type for TableView compatibility
type ExtendedUser = UserWithCreatedAt;

type Invitation = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	expiresAt: string;
	createdAt: string;
	accepted: boolean;
};

const UsersPage = () => {
	const [users, setUsers] = useState<ExtendedUser[]>([]);
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(false);
	const [invitationsLoading, setInvitationsLoading] = useState(false);
	const [showInviteForm, setShowInviteForm] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const hasFetched = useRef(false);

	const { token, showAlert, user: currentUser, tenant } = useApp();
	const { handleApiError } = usePlanLimitError();
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = useCallback(() => {
		setCurrentStep(0);
		setIsOpen(true);
	}, []);

	useEffect(() => {
		const hasSeenTour = tourUtils.isTourSeen("users");
		if (!hasSeenTour && !loading && users.length > 0) {
			// Start tour after data is loaded
			const timer = setTimeout(() => {
				startTour();
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [loading, users.length, startTour]);

	// Fetch users
	const fetchUsers = useCallback(async () => {
		if (hasFetched.current || !tenant) return;

		setLoading(true);
		try {
			const res = await fetch(`/api/tenants/${tenant.id}/users`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			const data = await res.json();
			// Add createdAt field to each user for compatibility
			const currentTime = new Date().toISOString();
			const usersWithCreatedAt = data.map((user: any) => ({
				...user,
				createdAt: currentTime, // Default value since API doesn't return this
			}));
			setUsers(usersWithCreatedAt);
			hasFetched.current = true;
		} catch (err: any) {
			showAlert(err.message || "Failed to load users", "error");
		} finally {
			setLoading(false);
		}
	}, [token, tenant]);

	// Fetch invitations
	const fetchInvitations = useCallback(async () => {
		if (!tenant) return;

		setInvitationsLoading(true);
		try {
			const res = await fetch(`/api/tenants/${tenant.id}/invitations`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			const data = await res.json();
			setInvitations(data || []);
		} catch (err: any) {
			showAlert(err.message || "Failed to load invitations", "error");
		} finally {
			setInvitationsLoading(false);
		}
	}, [token, tenant]);

	useEffect(() => {
		if (token && tenant && !hasFetched.current) {
			fetchUsers();
			fetchInvitations();
		} else if (!token) {
			setUsers([]);
			setInvitations([]);
			hasFetched.current = false;
		}
	}, [token, tenant, fetchUsers, fetchInvitations]);

	// Refresh data
	const refreshData = useCallback(() => {
		if (tenant) {
			hasFetched.current = false;
			fetchUsers();
			fetchInvitations();
		}
	}, [tenant]);

	// Delete user with confirmation
	const deleteUser = async (userId: string) => {
		if (!tenant) return;

		// Find the user to get their name for confirmation
		const userToDelete = users.find(user => user.id.toString() === userId);
		const userName = userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : 'this user';

		// Show confirmation dialog
		const confirmed = window.confirm(
			`Are you sure you want to delete ${userName}? This action cannot be undone and will remove all their data and permissions.`
		);

		if (!confirmed) return;

		try {
			const res = await fetch(`/api/tenants/${tenant.id}/users/${userId}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			setUsers((prev) => prev.filter((user) => user.id.toString() !== userId));
			showAlert("User removed successfully", "success");
		} catch (err: any) {
			showAlert(err.message || "Failed to remove user", "error");
		}
	};

	// Update user role
	const updateUserRole = async (userId: string, newRole: Role) => {
		if (!tenant) return;

		try {
			const res = await fetch(`/api/tenants/${tenant.id}/users/${userId}`, {
				method: "PATCH",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ role: newRole }),
			});

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			// Update the user in the local state
			setUsers((prev) => 
				prev.map((user) => 
					user.id.toString() === userId 
						? { ...user, role: newRole }
						: user
				)
			);

			showAlert("User role updated successfully", "success");
		} catch (err: any) {
			showAlert(err.message || "Failed to update user role", "error");
		}
	};

	// Cancel invitation
	const cancelInvitation = async (invitationId: string) => {
		if (!tenant) return;

		try {
			const res = await fetch(
				`/api/tenants/${tenant.id}/invitations?id=${invitationId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
			showAlert("Invitation cancelled successfully", "success");
		} catch (err: any) {
			showAlert(err.message || "Failed to cancel invitation", "error");
		}
	};

	// Filter users based on search term
	const filteredUsers = users.filter(
		(user) =>
			user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	if (loading && users.length === 0) {
		return <UsersLoadingState />;
	}

	// All authenticated users can view coworkers, but only admins can manage them

	return (
		<TourProvider
			steps={tourUtils.getUsersTourSteps(
				users.length > 0,
				invitations.length > 0,
			)}
			onTourComplete={() => {
				tourUtils.markTourSeen("users");
			}}
			onTourSkip={() => {
				tourUtils.markTourSeen("users");
			}}>
			<div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800'>
				{/* Mobile-First Header */}
				<div className='relative overflow-hidden'>
					<div className='absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5' />
					<div className='relative border-b border-border/20 bg-background/95 backdrop-blur-xl'>
						<div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
							<div className='space-y-6'>
								{/* Mobile Header Content */}
								<div className='flex items-start gap-3 sm:gap-4'>
									<div className='relative'>
										<div className='w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25'>
											<Users className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
										</div>
										<div className='absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center'>
											<div className='w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full' />
										</div>
									</div>
									<div className='space-y-2 flex-1 min-w-0'>
										<h1 className='text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent'>
											Team Management
										</h1>
										<p className='text-slate-600 dark:text-slate-400 text-sm sm:text-base lg:text-lg'>
											Manage your team members, roles, and permissions with precision and ease.
										</p>
										<div className='flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400'>
											<div className='flex items-center gap-2'>
												<div className='w-2 h-2 bg-green-500 rounded-full' />
												<span>{users.length} Active Members</span>
											</div>
											{invitations.length > 0 && (
												<div className='flex items-center gap-2'>
													<div className='w-2 h-2 bg-amber-500 rounded-full' />
													<span>{invitations.length} Pending Invites</span>
												</div>
											)}
										</div>
									</div>
								</div>

								{/* Mobile Action Buttons */}
								<div className='flex flex-col sm:flex-row gap-3'>
									{currentUser?.role === "ADMIN" && (
										<Button
											onClick={() => setShowInviteForm(!showInviteForm)}
											className='w-full sm:w-auto h-12 px-6 mobile-touch-feedback bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 rounded-xl font-medium'>
											<Plus className='w-5 h-5 mr-2' />
											{showInviteForm ? "Cancel Invite" : "Invite Member"}
										</Button>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content - Mobile Optimized */}
				<div className='max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8'>
					<div className='space-y-6 sm:space-y-8'>
						{/* Mobile Search and Stats */}
						<div className='space-y-4'>
							{/* Search Bar */}
							<div className='w-full'>
								<div className='relative group'>
									<Search className='absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-primary transition-colors' />
									<Input
										placeholder='Search team members...'
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className='pl-10 sm:pl-12 h-11 sm:h-12 mobile-touch-feedback bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 focus:border-primary/50 rounded-xl text-sm sm:text-base shadow-sm hover:shadow-md transition-all duration-200'
									/>
								</div>
							</div>
							
							{/* Mobile Stats Grid */}
							<div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
								<div className='text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm'>
									<div className='text-xl sm:text-2xl font-bold text-slate-900 dark:text-white'>{users.length}</div>
									<div className='text-xs sm:text-sm text-slate-500 dark:text-slate-400'>Total Members</div>
								</div>
								<div className='text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm'>
									<div className='text-xl sm:text-2xl font-bold text-green-600'>{users.filter(u => u.role === 'ADMIN').length}</div>
									<div className='text-xs sm:text-sm text-slate-500 dark:text-slate-400'>Administrators</div>
								</div>
								<div className='text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm'>
									<div className='text-xl sm:text-2xl font-bold text-blue-600'>{users.filter(u => u.role === 'EDITOR').length}</div>
									<div className='text-xs sm:text-sm text-slate-500 dark:text-slate-400'>Editors</div>
								</div>
								<div className='text-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm sm:col-span-1 col-span-2'>
									<div className='text-xl sm:text-2xl font-bold text-amber-600'>{invitations.length}</div>
									<div className='text-xs sm:text-sm text-slate-500 dark:text-slate-400'>Pending Invites</div>
								</div>
							</div>
						</div>

						{/* Invitation Creation Form - Only for Admins */}
						{showInviteForm && tenant && currentUser?.role === "ADMIN" && (
							<div className='invitation-creation-section'>
								<Card className='border-0 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden'>
									<div className='bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-6 border-b border-slate-200 dark:border-slate-700'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center'>
												<Plus className='w-5 h-5 text-primary' />
											</div>
											<div>
												<h3 className='text-xl font-semibold text-slate-900 dark:text-white'>Invite New Team Member</h3>
												<p className='text-slate-600 dark:text-slate-400'>Send an invitation to join your team</p>
											</div>
										</div>
									</div>
									<CardContent className='p-6'>
										<InvitationCreationForm
											tenantId={tenant.id}
											onInvitationCreated={() => {
												fetchInvitations();
												setShowInviteForm(false);
											}}
										/>
									</CardContent>
								</Card>
							</div>
						)}

						{/* Users Table */}
						<div className='users-table'>
							<Card className='border-0 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden'>
								<div className='bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-6 border-b border-slate-200 dark:border-slate-700'>
									<div className='flex items-center justify-between'>
										<div>
											<h3 className='text-xl font-semibold text-slate-900 dark:text-white'>Team Members</h3>
											<p className='text-slate-600 dark:text-slate-400 mt-1'>Manage your team members and their permissions</p>
										</div>
										<div className='text-sm text-slate-500 dark:text-slate-400'>
											{filteredUsers.length} of {users.length} members
										</div>
									</div>
								</div>
								<CardContent className='p-0'>
									<UserManagementGrid
										users={filteredUsers as User[]}
										onDeleteRow={deleteUser}
										onUpdateUserRole={updateUserRole}
									/>
								</CardContent>
							</Card>
						</div>

						{/* Invitations List - Only for Admins */}
						{tenant && currentUser?.role === "ADMIN" && (
							<div className='invitations-section'>
								<Card className='border-0 shadow-xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden'>
									<div className='bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 border-b border-amber-200 dark:border-amber-800'>
										<div className='flex items-center gap-3'>
											<div className='w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center'>
												<Mail className='w-5 h-5 text-amber-600 dark:text-amber-400' />
											</div>
											<div>
												<h3 className='text-xl font-semibold text-slate-900 dark:text-white'>Pending Invitations</h3>
												<p className='text-slate-600 dark:text-slate-400 mt-1'>Invitations waiting for acceptance</p>
											</div>
										</div>
									</div>
									<CardContent className='p-6'>
										<InvitationManagementList tenantId={tenant.id} />
									</CardContent>
								</Card>
							</div>
						)}
					</div>
					
				</div>
			</div>
		</TourProvider>
	);
};

export default UsersPage;
