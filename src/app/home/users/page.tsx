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
import { Shield, Users, Plus, Search, Filter, Mail } from "lucide-react";
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
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-primary/10 rounded-lg'>
								<Users className='w-6 h-6 text-primary' />
							</div>
							<div>
								<h1 className='text-2xl font-semibold text-foreground'>
									Teams
								</h1>
								<p className='text-sm text-muted-foreground'>
									Manage and collaborate within your organization's teams.
								</p>
							</div>
						</div>
						<div className='flex items-center space-x-2'>
							{currentUser?.role === "ADMIN" && (
								<Button
									variant='default'
									size='sm'
									onClick={() => setShowInviteForm(!showInviteForm)}
									className='flex items-center gap-2'>
									<Plus className='w-4 h-4' />
									{showInviteForm ? "Cancel" : "Invite User"}
								</Button>
							)}
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-6 max-w-7xl mx-auto'>
					<div className='space-y-6'>
						{/* Members Section Header */}
						<div className='members-header-section'>
							<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
								<div>
									<h2 className='text-xl font-semibold text-foreground'>
										Members
									</h2>
									<p className='text-sm text-muted-foreground'>
										Display all the team members and essential details.
									</p>
								</div>
								<div className='flex items-center gap-3'>
									<div className='relative'>
										<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
										<Input
											placeholder='Search..'
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className='pl-10 w-64 bg-background border-border'
										/>
									</div>
								</div>
							</div>
						</div>

						{/* Invitation Creation Form - Only for Admins */}
						{showInviteForm && tenant && currentUser?.role === "ADMIN" && (
							<div className='invitation-creation-section'>
								<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Plus className='w-5 h-5' />
											Invite New Team Member
										</CardTitle>
									</CardHeader>
									<CardContent>
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
							<UserManagementGrid
								users={filteredUsers as User[]}
								onDeleteRow={deleteUser}
							/>
						</div>

						{/* Invitations List - Only for Admins */}
						{tenant && currentUser?.role === "ADMIN" && (
							<div className='invitations-section'>
								<Card className='border-border/20 bg-card/50 backdrop-blur-sm'>
									<CardHeader>
										<CardTitle className='flex items-center gap-2'>
											<Mail className='w-5 h-5' />
											Pending Invitations
										</CardTitle>
									</CardHeader>
									<CardContent>
										<InvitationManagementList tenantId={tenant.id} />
									</CardContent>
								</Card>
							</div>
						)}
					</div>
				</div>
			</div>
		</TourProv>
	);
};

export default UsersPage;
