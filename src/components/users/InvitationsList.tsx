/** @format */

"use client";

import { useState, useEffect } from "react";
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
import { Mail, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

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

interface InvitationsListProps {
	tenantId: number;
}

export function InvitationsList({ tenantId }: InvitationsListProps) {
	const [invitations, setInvitations] = useState<Invitation[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { showAlert, token } = useApp();

	useEffect(() => {
		fetchInvitations();
	}, [tenantId]);

	const fetchInvitations = async () => {
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
	};

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

	const getStatusBadge = (invitation: Invitation) => {
		if (invitation.accepted) {
			return (
				<Badge variant='default' className='bg-green-100 text-green-800'>
					<CheckCircle className='w-3 h-3 mr-1' />
					Accepted
				</Badge>
			);
		}

		if (new Date(invitation.expiresAt) < new Date()) {
			return (
				<Badge variant='destructive'>
					<XCircle className='w-3 h-3 mr-1' />
					Expired
				</Badge>
			);
		}

		return (
			<Badge variant='outline'>
				<Clock className='w-3 h-3 mr-1' />
				Pending
			</Badge>
		);
	};

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Pending Invitations</CardTitle>
					<CardDescription>Loading invitations...</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (error) {
		return (
			<Alert variant='destructive'>
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		);
	}

	if (invitations.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Pending Invitations</CardTitle>
					<CardDescription>No pending invitations</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className='flex items-center gap-2'>
					<Mail className='w-5 h-5' />
					Pending Invitations
				</CardTitle>
				<CardDescription>
					Manage invitations sent to team members
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className='space-y-4'>
					{invitations.map((invitation) => (
						<div
							key={invitation.id}
							className='flex items-center justify-between p-4 border rounded-lg'>
							<div className='flex-1'>
								<div className='flex items-center gap-3 mb-2'>
									<div>
										<p className='font-medium'>
											{invitation.firstName} {invitation.lastName}
										</p>
										<p className='text-sm text-muted-foreground'>
											{invitation.email}
										</p>
									</div>
									<Badge variant='outline'>{invitation.role}</Badge>
									{getStatusBadge(invitation)}
								</div>
								<div className='flex items-center gap-4 text-xs text-muted-foreground'>
									<span>
										Sent: {new Date(invitation.createdAt).toLocaleDateString()}
									</span>
									<span>
										Expires:{" "}
										{new Date(invitation.expiresAt).toLocaleDateString()}
									</span>
								</div>
							</div>
							{!invitation.accepted &&
								new Date(invitation.expiresAt) > new Date() && (
									<Button
										variant='outline'
										size='sm'
										onClick={() => deleteInvitation(invitation.id)}
										className='text-red-600 hover:text-red-700'>
										<Trash2 className='w-4 h-4' />
									</Button>
								)}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
