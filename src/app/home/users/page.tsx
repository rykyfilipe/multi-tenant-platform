/** @format */

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePlanLimitError } from "@/hooks/usePlanLimitError";
import { UserManagementGrid } from "@/components/users/UserManagementGrid";
import { InvitationManagementList } from "@/components/users/InvitationManagementList";
import { InvitationCreationForm } from "@/components/users/InvitationCreationForm";
import { UsersLoadingState } from "@/components/ui/loading-states";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { tourUtils } from "@/lib/tour-config";
import { Shield, Users, Plus, Search, Mail, RefreshCw, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [showInviteForm, setShowInviteForm] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const hasFetched = useRef(false);

	const { token, showAlert, user: currentUser, tenant } = useApp();
	const { handleApiError } = usePlanLimitError();
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = useCallback(() => {
		setCurrentStep(0);
		setIsOpen(true);
	}, [setCurrentStep, setIsOpen]);

	useEffect(() => {
		const hasSeenTour = tourUtils.isTourSeen("users");
		if (!hasSeenTour && !loading && users.length > 0) {
			const timer = setTimeout(() => {
				startTour();
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [loading, users.length, startTour]);

	// Fetch users
	const fetchUsers = useCallback(async (showRefreshIndicator = false) => {
		if (!tenant) return;
		if (!showRefreshIndicator && hasFetched.current) return;

		if (showRefreshIndicator) setIsRefreshing(true);
		else setLoading(true);

		try {
			const res = await fetch(`/api/tenants/${tenant.id}/users`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			const data = await res.json();
			const currentTime = new Date().toISOString();
			const usersWithCreatedAt = data.map((user: any) => ({
				...user,
				createdAt: currentTime,
			}));
			setUsers(usersWithCreatedAt);
			hasFetched.current = true;
		} catch (err: any) {
			showAlert(err.message || "Failed to load users", "error");
		} finally {
			setLoading(false);
			setIsRefreshing(false);
		}
	}, [token, tenant, handleApiError, showAlert]);

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
	}, [token, tenant, handleApiError, showAlert]);

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
			fetchUsers(true);
			fetchInvitations();
		}
	}, [tenant, fetchUsers, fetchInvitations]);

	// Delete user with confirmation
	const deleteUser = async (userId: string) => {
		if (!tenant) return;

		const userToDelete = users.find(user => user.id.toString() === userId);
		const userName = userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : 'this user';

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

	// Deactivate user
	const deactivateUser = async (userId: string) => {
		if (!tenant) return;

		const userToDeactivate = users.find(user => user.id.toString() === userId);
		const userName = userToDeactivate ? `${userToDeactivate.firstName} ${userToDeactivate.lastName}` : 'this user';

		const confirmed = window.confirm(
			`Are you sure you want to deactivate ${userName}? They will be logged out and won't be able to access the system until reactivated.`
		);

		if (!confirmed) return;

		try {
			const res = await fetch(`/api/tenants/${tenant.id}/users/${userId}/deactivate`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			showAlert("User deactivated successfully", "success");
			fetchUsers(true); // Refresh users list
		} catch (err: any) {
			showAlert(err.message || "Failed to deactivate user", "error");
		}
	};

	// Activate user
	const activateUser = async (userId: string) => {
		if (!tenant) return;

		try {
			const res = await fetch(`/api/tenants/${tenant.id}/users/${userId}/activate`, {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				handleApiError(res);
				return;
			}

			showAlert("User activated successfully", "success");
			fetchUsers(true); // Refresh users list
		} catch (err: any) {
			showAlert(err.message || "Failed to activate user", "error");
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

	const adminCount = users.filter(u => u.role === 'ADMIN').length;
	const editorCount = users.filter(u => u.role === 'EDITOR').length;
	const viewerCount = users.filter(u => u.role === 'VIEWER').length;

	return (
		<TourProv
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
			<div className='min-h-screen bg-background'>
				<div className='max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12'>
					
					{/* Modern Header */}
					<div className='mb-8 sm:mb-10'>
						<div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
							<div className='flex items-start gap-4 sm:gap-5'>
								<div className='relative flex-shrink-0'>
									<div className='w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl sm:rounded-3xl flex items-center justify-center border-2 border-border shadow-sm'>
										<Users className='w-8 h-8 sm:w-10 sm:h-10 text-primary' />
									</div>
									<div className='absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-3 border-background shadow-lg'>
										<div className='w-2 h-2 bg-white rounded-full animate-pulse' />
									</div>
								</div>
								<div className='space-y-2'>
									<h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight'>
										Team Management
									</h1>
									<p className='text-sm sm:text-base text-muted-foreground max-w-2xl'>
										Manage your team members, assign roles, and control permissions across your organization
									</p>
								</div>
							</div>

							{/* Action Buttons */}
							<div className='flex items-center gap-3 flex-shrink-0'>
								<Button
									onClick={refreshData}
									variant="outline"
									size="default"
									disabled={isRefreshing}
									className='gap-2 h-10 px-4 border-border bg-card hover:bg-muted/50 transition-all duration-200'
								>
									<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
									<span className="hidden sm:inline">Refresh</span>
								</Button>
								{currentUser?.role === "ADMIN" && (
									<Button
										onClick={() => setShowInviteForm(!showInviteForm)}
										className={`gap-2 h-10 px-5 transition-all duration-200 ${
											showInviteForm 
												? 'bg-destructive hover:bg-destructive/90' 
												: 'bg-primary hover:bg-primary/90 shadow-sm'
										}`}>
										{showInviteForm ? (
											<>
												<X className='w-4 h-4' />
												<span className="hidden sm:inline">Cancel</span>
											</>
										) : (
											<>
												<UserPlus className='w-4 h-4' />
												<span>Invite Member</span>
											</>
										)}
									</Button>
								)}
							</div>
						</div>
					</div>

					{/* Stats Dashboard */}
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8'>
						{/* Total Members */}
						<Card className='bg-card border-border hover:border-primary/30 transition-all duration-300 group'>
							<CardContent className='p-5 sm:p-6'>
								<div className='flex items-center justify-between mb-3'>
									<div className='w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
										<Users className='w-6 h-6 text-primary' />
									</div>
									<Badge variant="outline" className='bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-medium px-2 py-0.5 text-xs'>
										Active
									</Badge>
								</div>
								<div className='space-y-1'>
									<p className='text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider'>
										Total Members
									</p>
									<div className='flex items-baseline gap-2'>
										<p className='text-3xl sm:text-4xl font-bold text-foreground'>
											{users.length}
										</p>
										{invitations.length > 0 && (
											<span className='text-xs text-muted-foreground'>
												+{invitations.length} pending
											</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Admins */}
						<Card className='bg-card border-border hover:border-purple-500/30 transition-all duration-300 group'>
							<CardContent className='p-5 sm:p-6'>
								<div className='flex items-center justify-between mb-3'>
									<div className='w-12 h-12 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
										<Shield className='w-6 h-6 text-purple-600 dark:text-purple-400' />
									</div>
									<div className='w-2 h-2 bg-purple-500 rounded-full' />
								</div>
								<div className='space-y-1'>
									<p className='text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider'>
										Administrators
									</p>
									<div className='flex items-baseline gap-2'>
										<p className='text-3xl sm:text-4xl font-bold text-foreground'>
											{adminCount}
										</p>
										{users.length > 0 && (
											<span className='text-xs text-muted-foreground'>
												{Math.round((adminCount / users.length) * 100)}%
											</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Editors */}
						<Card className='bg-card border-border hover:border-blue-500/30 transition-all duration-300 group'>
							<CardContent className='p-5 sm:p-6'>
								<div className='flex items-center justify-between mb-3'>
									<div className='w-12 h-12 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
										<Mail className='w-6 h-6 text-blue-600 dark:text-blue-400' />
									</div>
									<div className='w-2 h-2 bg-blue-500 rounded-full' />
								</div>
								<div className='space-y-1'>
									<p className='text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider'>
										Editors
									</p>
									<div className='flex items-baseline gap-2'>
										<p className='text-3xl sm:text-4xl font-bold text-foreground'>
											{editorCount}
										</p>
										{users.length > 0 && (
											<span className='text-xs text-muted-foreground'>
												{Math.round((editorCount / users.length) * 100)}%
											</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Viewers */}
						<Card className='bg-card border-border hover:border-green-500/30 transition-all duration-300 group'>
							<CardContent className='p-5 sm:p-6'>
								<div className='flex items-center justify-between mb-3'>
									<div className='w-12 h-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
										<Plus className='w-6 h-6 text-green-600 dark:text-green-400' />
									</div>
									<div className='w-2 h-2 bg-green-500 rounded-full' />
								</div>
								<div className='space-y-1'>
									<p className='text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider'>
										Viewers
									</p>
									<div className='flex items-baseline gap-2'>
										<p className='text-3xl sm:text-4xl font-bold text-foreground'>
											{viewerCount}
										</p>
										{users.length > 0 && (
											<span className='text-xs text-muted-foreground'>
												{Math.round((viewerCount / users.length) * 100)}%
											</span>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Search Bar */}
					<div className='mb-6'>
						<div className='relative max-w-md'>
							<Search className='absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors duration-200 peer-focus:text-primary' />
							<Input
								placeholder='Search members by name or email...'
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className='pl-12 h-12 bg-card border-border focus:border-primary/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 peer'
							/>
							{searchTerm && (
								<button
									onClick={() => setSearchTerm('')}
									className='absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'>
									<X className='w-4 h-4' />
								</button>
							)}
						</div>
					</div>

					{/* Invitation Creation Form - Only for Admins */}
					{showInviteForm && tenant && currentUser?.role === "ADMIN" && (
						<div className='invitation-creation-section mb-6 animate-in slide-in-from-top-4 duration-300'>
							<Card className='bg-card border-border shadow-lg'>
								<CardHeader className='border-b border-border/50 pb-5'>
									<div className='flex items-center gap-3'>
										<div className='w-11 h-11 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center'>
											<UserPlus className='w-5 h-5 text-primary' />
										</div>
										<div>
											<CardTitle className='text-lg font-bold text-foreground'>Invite New Team Member</CardTitle>
											<p className='text-sm text-muted-foreground mt-0.5'>Send an invitation to join your team</p>
										</div>
									</div>
								</CardHeader>
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
					<div className='users-table mb-6'>
						<Card className='bg-card border-border shadow-lg overflow-hidden'>
							<CardHeader className='border-b border-border/50 pb-5 bg-muted/30'>
								<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
									<div>
										<CardTitle className='text-lg font-bold text-foreground flex items-center gap-2'>
											<Users className='w-5 h-5' />
											Team Members
										</CardTitle>
										<p className='text-sm text-muted-foreground mt-1'>
											Manage roles and permissions for your team
										</p>
									</div>
									{searchTerm && (
										<Badge variant="secondary" className='font-semibold self-start sm:self-center'>
											{filteredUsers.length} of {users.length} members
										</Badge>
									)}
								</div>
							</CardHeader>
							<CardContent className='p-0'>
								<UserManagementGrid
									users={filteredUsers as User[]}
									onDeleteRow={deleteUser}
									onUpdateUserRole={updateUserRole}
									onDeactivateUser={deactivateUser}
									onActivateUser={activateUser}
									onRefresh={() => fetchUsers(true)}
								/>
							</CardContent>
						</Card>
					</div>

					{/* Invitations List - Only for Admins */}
					{tenant && currentUser?.role === "ADMIN" && (
						<div className='invitations-section'>
							<Card className='bg-card border-border shadow-lg overflow-hidden'>
								<CardHeader className='border-b border-border/50 pb-5 bg-muted/30'>
									<div className='flex items-center gap-3'>
										<div className='w-11 h-11 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl flex items-center justify-center'>
											<Mail className='w-5 h-5 text-amber-600 dark:text-amber-400' />
										</div>
										<div>
											<CardTitle className='text-lg font-bold text-foreground'>Pending Invitations</CardTitle>
											<p className='text-sm text-muted-foreground mt-0.5'>
												Invitations waiting for acceptance
											</p>
										</div>
									</div>
								</CardHeader>
								<CardContent className='p-6'>
									<InvitationManagementList tenantId={tenant.id} />
								</CardContent>
							</Card>
						</div>
					)}
				</div>
			</div>
		</TourProv>
	);
};

export default UsersPage;
