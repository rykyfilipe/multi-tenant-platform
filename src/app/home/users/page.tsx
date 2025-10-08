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
import { Shield, Users, Plus, Search, Mail, RefreshCw, UserPlus } from "lucide-react";
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
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
				<div className='max-w-[1600px] mx-auto p-6 space-y-8'>
					{/* Header */}
					<div className='flex flex-col sm:flex-row sm:items-start justify-between gap-6'>
						<div className='flex items-start gap-4'>
							<div className='relative'>
								<div className='w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20'>
									<Users className='w-7 h-7 text-primary' />
								</div>
								<div className='absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-background'>
									<div className='w-2 h-2 bg-white rounded-full' />
								</div>
							</div>
							<div className='space-y-1'>
								<h1 className='text-3xl font-bold text-foreground tracking-tight'>
									Team Management
								</h1>
								<p className='text-muted-foreground text-base'>
									Manage your team members, roles, and permissions
								</p>
								<div className='flex items-center gap-4 mt-2'>
									<Badge variant="outline" className='bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 font-semibold'>
										<div className='w-2 h-2 bg-green-500 rounded-full mr-2' />
										{users.length} Active {users.length === 1 ? 'Member' : 'Members'}
									</Badge>
									{invitations.length > 0 && (
										<Badge variant="outline" className='bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 font-semibold'>
											<div className='w-2 h-2 bg-amber-500 rounded-full mr-2' />
											{invitations.length} Pending {invitations.length === 1 ? 'Invite' : 'Invites'}
										</Badge>
									)}
								</div>
							</div>
						</div>

						{/* Action Buttons */}
						<div className='flex items-center gap-3'>
							<Button
								onClick={refreshData}
								variant="outline"
								size="default"
								disabled={isRefreshing}
								className='gap-2'
							>
								<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
								<span className="hidden sm:inline">Refresh</span>
							</Button>
							{currentUser?.role === "ADMIN" && (
								<Button
									onClick={() => setShowInviteForm(!showInviteForm)}
									className='gap-2 shadow-sm'>
									{showInviteForm ? (
										<>
											<span>Cancel</span>
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

					{/* Search and Stats */}
					<div className='flex flex-col lg:flex-row lg:items-center gap-6'>
						<div className='flex-1 max-w-md'>
							<div className='relative group'>
								<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors' />
								<Input
									placeholder='Search by name or email...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='pl-10 h-11 bg-card border-border focus:border-primary/50 rounded-lg shadow-sm'
								/>
							</div>
						</div>
						
						{/* Role Distribution Stats */}
						<div className='flex items-center gap-6 flex-wrap'>
							<div className='text-center'>
								<div className='text-2xl font-bold text-foreground'>{users.length}</div>
								<div className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>Total</div>
							</div>
							{adminCount > 0 && (
								<>
									<div className='w-px h-8 bg-border' />
									<div className='text-center'>
										<div className='text-2xl font-bold text-primary'>{adminCount}</div>
										<div className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>Admins</div>
									</div>
								</>
							)}
							{editorCount > 0 && (
								<>
									<div className='w-px h-8 bg-border' />
									<div className='text-center'>
										<div className='text-2xl font-bold text-blue-600 dark:text-blue-400'>{editorCount}</div>
										<div className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>Editors</div>
									</div>
								</>
							)}
							{viewerCount > 0 && (
								<>
									<div className='w-px h-8 bg-border' />
									<div className='text-center'>
										<div className='text-2xl font-bold text-green-600 dark:text-green-400'>{viewerCount}</div>
										<div className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>Viewers</div>
									</div>
								</>
							)}
						</div>
					</div>

					{/* Invitation Creation Form - Only for Admins */}
					{showInviteForm && tenant && currentUser?.role === "ADMIN" && (
						<div className='invitation-creation-section'>
							<Card className='bg-card border-border shadow-sm'>
								<CardHeader className='border-b border-border/50 pb-4'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center'>
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
					<div className='users-table'>
						<Card className='bg-card border-border shadow-sm'>
							<CardHeader className='border-b border-border/50 pb-4'>
								<div className='flex items-center justify-between'>
									<div>
										<CardTitle className='text-lg font-bold text-foreground'>Team Members</CardTitle>
										<p className='text-sm text-muted-foreground mt-0.5'>
											Manage roles and permissions for your team
										</p>
									</div>
									<Badge variant="secondary" className='font-semibold'>
										{filteredUsers.length} {filteredUsers.length !== users.length && `of ${users.length}`}
									</Badge>
								</div>
							</CardHeader>
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
							<Card className='bg-card border-border shadow-sm'>
								<CardHeader className='border-b border-border/50 pb-4'>
									<div className='flex items-center gap-3'>
										<div className='w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center'>
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
