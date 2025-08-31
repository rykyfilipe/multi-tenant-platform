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

export const InvitationManagementList = forwardRef<
	InvitationManagementListRef,
	InvitationManagementListProps
>(function InvitationManagementList({ tenantId }, ref) {
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { showAlert, token } = useApp();

	const fetchInvitations = useCallback(async () => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/invitations`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch invitations");
			}

			const data = await response.json();
			setInvitations(data);
		} catch (error) {
			setError("Failed to load invitations");
		} finally {
			setLoading(false);
		}
	}, [tenantId, token]);

	useEffect(() => {
		fetchInvitations();
	}, [fetchInvitations]);

	// Expose refresh function to parent component
	useImperativeHandle(ref, () => ({
		refresh: fetchInvitations,
	}));

	const deleteInvitation = async (invitationId: string) => {
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/invitations?id=${invitationId}`,
				{
					method: "DELETE",
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				throw new Error("Failed to delete invitation");
			}

			showAlert("Invitation deleted successfully", "success");
			setInvitations(invitations.filter((inv) => inv.id !== invitationId));
		} catch (error) {
			showAlert("Failed to delete invitation", "error");
		}
	};

	const getInitials = (firstName: string, lastName: string) => {
		return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
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

	const getRoleColor = (role: string) => {
		switch (role) {
			case "ADMIN":
				return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
			case "EDITOR":
				return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
			case "VIEWER":
				return "bg-gradient-to-r from-gray-500 to-slate-500 text-white";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const isExpired = (expiresAt: string) => {
		return new Date(expiresAt) < new Date();
	};

	if (loading) {
		return (
			<div className='flex items-center justify-center py-8'>
				<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
			</div>
		);
	}

	if (error) {
		return (
			<Alert variant='destructive'>
				<XCircle className='h-4 w-4' />
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	if (invitations.length === 0) {
		return (
			<div className='text-center py-8'>
				<div className='p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4'>
					<Mail className='w-8 h-8 text-muted-foreground' />
				</div>
				<h3 className='text-lg font-medium text-foreground mb-2'>
					No pending invitations
				</h3>
				<p className='text-muted-foreground'>
					All invitations have been processed or there are no pending invites.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-4'>
			{invitations.map((invitation) => (
				<div
					key={invitation.id}
					className='flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border/20 hover:bg-muted/30 transition-colors'>
					<div className='flex items-center gap-4'>
						<Avatar className='w-12 h-12'>
							<AvatarFallback className='bg-primary/10 text-primary font-medium'>
								{getInitials(invitation.firstName, invitation.lastName)}
							</AvatarFallback>
						</Avatar>
						<div>
							<div className='flex items-center gap-2'>
								<h4 className='font-medium text-foreground'>
									{invitation.firstName} {invitation.lastName}
								</h4>
								<Badge
									variant='secondary'
									className={`${getRoleColor(
										invitation.role,
									)} border-0 text-xs`}>
									{getRoleDisplayName(invitation.role)}
								</Badge>
							</div>
							<div className='text-sm text-muted-foreground'>
								{invitation.email}
							</div>
							<div className='flex items-center gap-4 text-xs text-muted-foreground mt-1'>
								<div className='flex items-center gap-1'>
									<UserPlus className='w-3 h-3' />
									Invited {formatDate(invitation.createdAt)}
								</div>
								<div className='flex items-center gap-1'>
									<Clock className='w-3 h-3' />
									Expires {formatDate(invitation.expiresAt)}
								</div>
							</div>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						{isExpired(invitation.expiresAt) && (
							<Badge variant='destructive' className='text-xs'>
								Expired
							</Badge>
						)}
						<Button
							variant='ghost'
							size='sm'
							onClick={() => deleteInvitation(invitation.id)}
							className='h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground'>
							<Trash2 className='w-4 h-4' />
						</Button>
					</div>
				</div>
			))}
		</div>
	);
});
