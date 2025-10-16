/** @format */

"use client";

import {
	useState,
	useEffect,
	useImperativeHandle,
	forwardRef,
	useCallback,
} from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	Mail,
	Clock,
	CheckCircle,
	XCircle,
	Trash2,
	UserPlus,
	Crown,
	Edit,
	Eye,
	Calendar,
	RefreshCw,
	Send,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Invitation {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	role: string;
	createdAt: string;
	expiresAt: string;
	accepted: boolean;
}

interface InvitationManagementListProps {
	tenantId: number;
}

export interface InvitationManagementListRef {
	refresh: () => void;
}

const getRoleIcon = (role: string) => {
	switch (role) {
		case "ADMIN":
			return <Crown className='w-4 h-4' />;
		case "EDITOR":
			return <Edit className='w-4 h-4' />;
		case "VIEWER":
			return <Eye className='w-4 h-4' />;
		default:
			return <UserPlus className='w-4 h-4' />;
	}
};

const getRoleColor = (role: string) => {
	switch (role) {
		case "ADMIN":
			return "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25";
		case "EDITOR":
			return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25";
		case "VIEWER":
			return "bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-lg shadow-slate-500/25";
		default:
			return "bg-slate-100 text-slate-700";
	}
};

const getRoleDisplayName = (role: string) => {
	switch (role) {
		case "ADMIN":
			return "Administrator";
		case "EDITOR":
			return "Editor";
		case "VIEWER":
			return "Viewer";
		default:
			return "User";
	}
};

const getInitials = (firstName: string, lastName: string) => {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
};

const isExpired = (expiresAt: string) => {
	return new Date(expiresAt) < new Date();
};

const getTimeUntilExpiry = (expiresAt: string) => {
	const now = new Date();
	const expiry = new Date(expiresAt);
	const diffInHours = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));
	
	if (diffInHours < 0) return "Expired";
	if (diffInHours < 24) return `${diffInHours}h left`;
	const diffInDays = Math.floor(diffInHours / 24);
	return `${diffInDays}d left`;
};

export const InvitationManagementList = forwardRef<
	InvitationManagementListRef,
	InvitationManagementListProps
>(({ tenantId }, ref) => {
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const { showAlert, token } = useApp();

	const fetchInvitations = useCallback(async () => {
		if (!token) return;

		setLoading(true);
		setError("");
		try {
			const response = await fetch(`/api/tenants/${tenantId}/invitations`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error("Failed to fetch invitations");
			}

			const data = await response.json();
			setInvitations(data || []);
		} catch (err: any) {
			setError(err.message);
			showAlert(err.message, "error");
		} finally {
			setLoading(false);
		}
	}, [token, tenantId, showAlert]);

	const cancelInvitation = async (invitationId: string) => {
		if (!token) return;

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/invitations?id=${invitationId}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				throw new Error("Failed to cancel invitation");
			}

			setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
			showAlert("Invitation cancelled successfully", "success");
		} catch (err: any) {
			showAlert(err.message || "Failed to cancel invitation", "error");
		}
	};

	const resendInvitation = async (invitationId: string) => {
		if (!token) return;

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/invitations/${invitationId}/resend`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to resend invitation");
			}

			showAlert("Invitation resent successfully! Check your email.", "success");
			// Refresh invitations list to show updated expiry
			fetchInvitations();
		} catch (err: any) {
			showAlert(err.message || "Failed to resend invitation", "error");
		}
	};

	useEffect(() => {
		fetchInvitations();
	}, [fetchInvitations]);

	useImperativeHandle(ref, () => ({
		refresh: fetchInvitations,
	}));

	if (loading) {
		return (
			<div className='space-y-4'>
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className='animate-pulse'>
						<div className='bg-slate-100 dark:bg-slate-800 rounded-xl p-6'>
							<div className='flex items-center gap-4'>
								<div className='w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full' />
								<div className='flex-1 space-y-2'>
									<div className='h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3' />
									<div className='h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4' />
								</div>
								<div className='w-20 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg' />
							</div>
						</div>
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<Alert className='border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'>
				<XCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
				<AlertDescription className='text-red-800 dark:text-red-200'>
					{error}
				</AlertDescription>
			</Alert>
		);
	}

	if (invitations.length === 0) {
		return (
			<div className='text-center py-12'>
				<div className='w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4'>
					<Mail className='w-8 h-8 text-amber-600 dark:text-amber-400' />
				</div>
				<h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-2'>No pending invitations</h3>
				<p className='text-slate-500 dark:text-slate-400 max-w-md mx-auto'>
					All invitations have been accepted or there are no pending invites at the moment.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{/* Header */}
			<div className='flex items-center justify-between mb-6'>
				<div>
					<h4 className='text-lg font-semibold text-slate-900 dark:text-white'>
						Pending Invitations ({invitations.length})
					</h4>
					<p className='text-sm text-slate-500 dark:text-slate-400 mt-1'>
						Invitations waiting for acceptance
					</p>
				</div>
				<Button
					variant='outline'
					size='sm'
					onClick={fetchInvitations}
					className='h-9 px-4 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg transition-all duration-200'
				>
					<RefreshCw className='w-4 h-4 mr-2' />
					Refresh
				</Button>
			</div>

			{/* Invitations List */}
			<div className='space-y-3'>
				{invitations.map((invitation) => {
					const expired = isExpired(invitation.expiresAt);
					const timeLeft = getTimeUntilExpiry(invitation.expiresAt);
					
					return (
						<Card
							key={invitation.id}
							className={`border-0 shadow-sm transition-all duration-200 hover:shadow-md ${
								expired 
									? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' 
									: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
							}`}
						>
							<CardContent className='p-6'>
								<div className='flex items-center justify-between'>
									{/* User Info */}
									<div className='flex items-center gap-4'>
										<div className='relative'>
											<Avatar className='w-12 h-12 border-2 border-white dark:border-slate-800 shadow-lg'>
												<AvatarFallback className={`${
													expired 
														? 'bg-gradient-to-br from-red-100 to-red-200 text-red-700' 
														: 'bg-gradient-to-br from-primary/20 to-primary/10 text-primary'
												} font-bold text-lg`}>
													{getInitials(invitation.firstName, invitation.lastName)}
												</AvatarFallback>
											</Avatar>
											{expired && (
												<div className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg'>
													<XCircle className='w-3 h-3 text-white' />
												</div>
											)}
										</div>
										
										<div className='min-w-0 flex-1'>
											<div className='flex items-center gap-3 mb-1'>
												<h5 className='font-semibold text-slate-900 dark:text-white text-base'>
													{invitation.firstName} {invitation.lastName}
												</h5>
												<Badge className={`${getRoleColor(invitation.role)} border-0 text-xs font-semibold px-3 py-1 rounded-lg shadow-sm`}>
													<div className='flex items-center gap-1.5'>
														{getRoleIcon(invitation.role)}
														{getRoleDisplayName(invitation.role)}
													</div>
												</Badge>
											</div>
											
											<div className='flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400'>
												<div className='flex items-center gap-2'>
													<Mail className='w-4 h-4' />
													<span className='truncate max-w-[200px]'>{invitation.email}</span>
												</div>
												<div className='flex items-center gap-2'>
													<Calendar className='w-4 h-4' />
													<span>Sent {formatDate(invitation.createdAt)}</span>
												</div>
											</div>
										</div>
									</div>

									{/* Status and Actions */}
									<div className='flex items-center gap-3'>
										{/* Status Badge */}
										<div className='text-right'>
											{expired ? (
												<Badge className='bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 px-3 py-1 rounded-lg'>
													<XCircle className='w-3 h-3 mr-1' />
													Expired
												</Badge>
											) : (
												<Badge className='bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 px-3 py-1 rounded-lg'>
													<Clock className='w-3 h-3 mr-1' />
													{timeLeft}
												</Badge>
											)}
										</div>

										{/* Actions */}
										<div className='flex items-center gap-2'>
											{/* Resend Button - shown for expired or near-expiry invitations */}
											{(expired || getTimeUntilExpiry(invitation.expiresAt).includes('h')) && (
												<Button
													variant='outline'
													size='sm'
													onClick={() => resendInvitation(invitation.id)}
													className='h-9 px-3 border-primary/30 text-primary hover:bg-primary/10 rounded-lg transition-all duration-200'
												>
													<Send className='w-3 h-3 mr-1' />
													Resend
												</Button>
											)}
											
											{/* Cancel Button */}
											<Button
												variant='ghost'
												size='sm'
												onClick={() => cancelInvitation(invitation.id)}
												className={`h-9 w-9 rounded-lg transition-all duration-200 ${
													expired
														? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
														: 'text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
												}`}
											>
												<Trash2 className='w-4 h-4' />
											</Button>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
});

InvitationManagementList.displayName = "InvitationManagementList";