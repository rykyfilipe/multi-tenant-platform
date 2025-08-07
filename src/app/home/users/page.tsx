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
import { Shield, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

	// Delete user
	const deleteUser = async (userId: string) => {
		if (!tenant) return;

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

	if (loading && users.length === 0) {
		return <UsersLoadingState />;
	}

	// Check if user has permission to view this page
	if (currentUser?.role !== "ADMIN") {
		return (
			<div className='h-full bg-background'>
				<div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
					<div className='text-center py-12'>
						<div className='max-w-md mx-auto'>
							<div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
								<Shield className='w-8 h-8 text-red-600' />
							</div>
							<h3 className='text-lg font-semibold text-foreground mb-2'>
								Access Denied
							</h3>
							<p className='text-muted-foreground'>
								Only administrators can access user management.
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

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
			<div className='h-full bg-background'>
				{/* Header */}
				<div className='users-header border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-4'>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								User Management
							</h1>
							<p className='text-sm text-muted-foreground'>
								Manage team members and invitations
							</p>
						</div>
						<div className='flex items-center space-x-2'>
							<Button
								variant='outline'
								size='sm'
								onClick={refreshData}
								className='flex items-center gap-2'>
								<Users className='w-4 h-4' />
								Refresh
							</Button>
							<Button
								variant='default'
								size='sm'
								onClick={() => setShowInviteForm(!showInviteForm)}
								className='flex items-center gap-2'>
								<Plus className='w-4 h-4' />
								{showInviteForm ? "Cancel" : "Invite User"}
							</Button>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-6 max-w-7xl mx-auto'>
					<div className='space-y-6'>
						{/* Users Header Component */}
						<div className='users-header-section'>
							<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
								<CardHeader>
									<CardTitle className='flex items-center gap-2'>
										<Users className='w-5 h-5' />
										Team Overview
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<div className='text-center p-4 bg-primary/10 rounded-lg'>
											<div className='text-2xl font-bold text-primary'>
												{users.length + 1}
											</div>
											<div className='text-sm text-muted-foreground'>
												Team Members
											</div>
										</div>
										<div className='text-center p-4 bg-green-500/10 rounded-lg'>
											<div className='text-2xl font-bold text-green-600'>
												{invitations.filter((inv) => !inv.accepted).length}
											</div>
											<div className='text-sm text-muted-foreground'>
												Pending Invitations
											</div>
										</div>
										<div className='text-center p-4 bg-blue-500/10 rounded-lg'>
											<div className='text-2xl font-bold text-blue-600'>
												{users.filter((user) => user.role === Role.ADMIN)
													.length + (currentUser?.role === Role.ADMIN ? 1 : 0)}
											</div>
											<div className='text-sm text-muted-foreground'>
												Administrators
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Invitation Creation Form */}
						{showInviteForm && tenant && (
							<div className='invitation-creation-section flex justify-center py-8'>
								<InvitationCreationForm
									tenantId={tenant.id}
									onInvitationCreated={() => {
										fetchInvitations();
										setShowInviteForm(false);
									}}
								/>
							</div>
						)}

						{/* Users Table */}
						<div className='users-table'>
							<UserManagementGrid
								users={users as User[]}
								onDeleteRow={deleteUser}
							/>
						</div>

						{/* Invitations List */}
						{tenant && (
							<div className='invitations-section'>
								<InvitationManagementList tenantId={tenant.id} />
							</div>
						)}
					</div>
				</div>
			</div>
		</TourProv>
	);
};

export default UsersPage;
