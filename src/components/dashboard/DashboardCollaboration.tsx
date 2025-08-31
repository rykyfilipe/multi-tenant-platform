/** @format */

"use client";

import React, { useState, useEffect } from "react";
import {
	Users,
	UserPlus,
	Mail,
	Link,
	Copy,
	Check,
	Trash2,
	Eye,
	Edit,
	Settings,
	Lock,
	Globe,
	Shield,
	Calendar,
	Search,
	Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Dashboard } from "@/types/dashboard";

interface DashboardCollaborationProps {
	isOpen: boolean;
	onClose: () => void;
	currentDashboard: Dashboard | null;
}

interface Collaborator {
	id: number;
	email: string;
	name: string;
	avatar?: string;
	role: "viewer" | "editor" | "admin";
	permissions: string[];
	addedAt: string;
	lastAccess?: string;
	status: "active" | "pending" | "revoked";
}

interface ShareLink {
	id: string;
	url: string;
	permissions: string[];
	expiresAt?: string;
	createdAt: string;
	createdBy: string;
	accessCount: number;
	isActive: boolean;
}

interface Invitation {
	id: string;
	email: string;
	role: "viewer" | "editor" | "admin";
	permissions: string[];
	invitedAt: string;
	expiresAt: string;
	status: "pending" | "accepted" | "expired";
	invitedBy: string;
}

export function DashboardCollaboration({
	isOpen,
	onClose,
	currentDashboard,
}: DashboardCollaborationProps) {
	const { toast } = useToast();
	const [activeTab, setActiveTab] = useState("collaborators");
	const [newCollaboratorEmail, setNewCollaboratorEmail] = useState("");
	const [newCollaboratorRole, setNewCollaboratorRole] = useState<
		"viewer" | "editor" | "admin"
	>("viewer");
	const [newCollaboratorPermissions, setNewCollaboratorPermissions] = useState<
		string[]
	>([]);
	const [invitationMessage, setInvitationMessage] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [filterRole, setFilterRole] = useState<string>("all");
	const [copiedLink, setCopiedLink] = useState<string | null>(null);

	// Mock data - replace with actual API calls
	const [collaborators, setCollaborators] = useState<Collaborator[]>([
		{
			id: 1,
			email: "john.doe@example.com",
			name: "John Doe",
			role: "admin",
			permissions: ["read", "write", "delete", "share"],
			addedAt: "2024-01-15T10:00:00Z",
			lastAccess: "2024-01-20T14:30:00Z",
			status: "active",
		},
		{
			id: 2,
			email: "jane.smith@example.com",
			name: "Jane Smith",
			role: "editor",
			permissions: ["read", "write"],
			addedAt: "2024-01-16T09:00:00Z",
			lastAccess: "2024-01-19T16:45:00Z",
			status: "active",
		},
		{
			id: 3,
			email: "bob.wilson@example.com",
			name: "Bob Wilson",
			role: "viewer",
			permissions: ["read"],
			addedAt: "2024-01-17T11:00:00Z",
			status: "pending",
		},
	]);

	const [shareLinks, setShareLinks] = useState<ShareLink[]>([
		{
			id: "1",
			url: "https://app.example.com/dashboard/shared/abc123",
			permissions: ["read"],
			expiresAt: "2024-02-15T23:59:59Z",
			createdAt: "2024-01-15T10:00:00Z",
			createdBy: "Current User",
			accessCount: 12,
			isActive: true,
		},
	]);

	const [invitations, setInvitations] = useState<Invitation[]>([
		{
			id: "1",
			email: "alice.johnson@example.com",
			role: "viewer",
			permissions: ["read"],
			invitedAt: "2024-01-18T10:00:00Z",
			expiresAt: "2024-01-25T23:59:59Z",
			status: "pending",
			invitedBy: "Current User",
		},
	]);

	const availablePermissions = {
		viewer: ["read"],
		editor: ["read", "write"],
		admin: ["read", "write", "delete", "share"],
	};

	const handleAddCollaborator = () => {
		if (!newCollaboratorEmail.trim()) {
			toast({
				title: "Error",
				description: "Please enter an email address",
				variant: "destructive",
			});
			return;
		}

		const newCollaborator: Collaborator = {
			id: Date.now(),
			email: newCollaboratorEmail.trim(),
			name: newCollaboratorEmail.split("@")[0],
			role: newCollaboratorRole,
			permissions: availablePermissions[newCollaboratorRole],
			addedAt: new Date().toISOString(),
			status: "pending",
		};

		setCollaborators((prev) => [...prev, newCollaborator]);
		setNewCollaboratorEmail("");
		setNewCollaboratorRole("viewer");
		setNewCollaboratorPermissions([]);

		toast({
			title: "Success",
			description: `Invitation sent to ${newCollaborator.email}`,
		});
	};

	const handleRemoveCollaborator = (collaboratorId: number) => {
		setCollaborators((prev) => prev.filter((c) => c.id !== collaboratorId));
		toast({
			title: "Success",
			description: "Collaborator removed",
		});
	};

	const handleUpdateRole = (
		collaboratorId: number,
		newRole: "viewer" | "editor" | "admin",
	) => {
		setCollaborators((prev) =>
			prev.map((c) =>
				c.id === collaboratorId
					? { ...c, role: newRole, permissions: availablePermissions[newRole] }
					: c,
			),
		);
		toast({
			title: "Success",
			description: "Role updated successfully",
		});
	};

	const handleCreateShareLink = () => {
		const newLink: ShareLink = {
			id: Date.now().toString(),
			url: `https://app.example.com/dashboard/shared/${Math.random()
				.toString(36)
				.substr(2, 9)}`,
			permissions: ["read"],
			expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
			createdAt: new Date().toISOString(),
			createdBy: "Current User",
			accessCount: 0,
			isActive: true,
		};

		setShareLinks((prev) => [...prev, newLink]);
		toast({
			title: "Success",
			description: "Share link created",
		});
	};

	const handleCopyLink = async (url: string) => {
		try {
			await navigator.clipboard.writeText(url);
			setCopiedLink(url);
			setTimeout(() => setCopiedLink(null), 2000);
			toast({
				title: "Success",
				description: "Link copied to clipboard",
			});
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to copy link",
				variant: "destructive",
			});
		}
	};

	const handleRevokeLink = (linkId: string) => {
		setShareLinks((prev) =>
			prev.map((link) =>
				link.id === linkId ? { ...link, isActive: false } : link,
			),
		);
		toast({
			title: "Success",
			description: "Share link revoked",
		});
	};

	const filteredCollaborators = collaborators.filter((collaborator) => {
		const matchesSearch =
			collaborator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			collaborator.email.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesRole =
			filterRole === "all" || collaborator.role === filterRole;
		return matchesSearch && matchesRole;
	});

	const getRoleColor = (role: string) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			case "editor":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "viewer":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "pending":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "revoked":
				return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
		}
	};

	if (!isOpen || !currentDashboard) return null;

	return (
		<div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
			<div className='bg-card border rounded-lg shadow-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto'>
				{/* Header */}
				<div className='flex items-center justify-between p-6 border-b'>
					<div className='flex items-center gap-3'>
						<Users className='w-6 h-6' />
						<div>
							<h2 className='text-xl font-semibold'>Dashboard Collaboration</h2>
							<p className='text-sm text-muted-foreground'>
								Manage access and sharing for {currentDashboard.name}
							</p>
						</div>
					</div>
					<Button variant='ghost' size='sm' onClick={onClose}>
						✕
					</Button>
				</div>

				{/* Content */}
				<div className='p-6'>
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className='w-full'>
						<TabsList className='grid w-full grid-cols-4'>
							<TabsTrigger
								value='collaborators'
								className='flex items-center gap-2'>
								<Users className='w-4 h-4' />
								Collaborators
							</TabsTrigger>
							<TabsTrigger
								value='share-links'
								className='flex items-center gap-2'>
								<Link className='w-4 h-4' />
								Share Links
							</TabsTrigger>
							<TabsTrigger
								value='invitations'
								className='flex items-center gap-2'>
								<Mail className='w-4 h-4' />
								Invitations
							</TabsTrigger>
							<TabsTrigger value='settings' className='flex items-center gap-2'>
								<Settings className='w-4 h-4' />
								Settings
							</TabsTrigger>
						</TabsList>

						{/* Collaborators Tab */}
						<TabsContent value='collaborators' className='space-y-6'>
							{/* Add New Collaborator */}
							<Card>
								<CardHeader>
									<CardTitle>Add New Collaborator</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
										<div>
											<Label htmlFor='collaboratorEmail'>Email Address</Label>
											<Input
												id='collaboratorEmail'
												type='email'
												value={newCollaboratorEmail}
												onChange={(e) =>
													setNewCollaboratorEmail(e.target.value)
												}
												placeholder='user@example.com'
											/>
										</div>
										<div>
											<Label htmlFor='collaboratorRole'>Role</Label>
											<Select
												value={newCollaboratorRole}
												onValueChange={(value: "viewer" | "editor" | "admin") =>
													setNewCollaboratorRole(value)
												}>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value='viewer'>Viewer</SelectItem>
													<SelectItem value='editor'>Editor</SelectItem>
													<SelectItem value='admin'>Admin</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className='flex items-end'>
											<Button
												onClick={handleAddCollaborator}
												className='w-full'>
												<UserPlus className='w-4 h-4 mr-2' />
												Invite
											</Button>
										</div>
									</div>
									<div>
										<Label htmlFor='invitationMessage'>
											Personal Message (optional)
										</Label>
										<Textarea
											id='invitationMessage'
											value={invitationMessage}
											onChange={(e) => setInvitationMessage(e.target.value)}
											placeholder='Add a personal message to your invitation...'
											rows={2}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Collaborators List */}
							<Card>
								<CardHeader>
									<CardTitle>Current Collaborators</CardTitle>
									<div className='flex gap-4 mt-4'>
										<div className='flex-1'>
											<Input
												placeholder='Search collaborators...'
												value={searchQuery}
												onChange={(e) => setSearchQuery(e.target.value)}
												className='max-w-sm'
											/>
										</div>
										<Select value={filterRole} onValueChange={setFilterRole}>
											<SelectTrigger className='w-32'>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='all'>All Roles</SelectItem>
												<SelectItem value='admin'>Admin</SelectItem>
												<SelectItem value='editor'>Editor</SelectItem>
												<SelectItem value='viewer'>Viewer</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										{filteredCollaborators.map((collaborator) => (
											<div
												key={collaborator.id}
												className='flex items-center justify-between p-3 bg-muted rounded-lg'>
												<div className='flex items-center gap-3'>
													<div className='w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center'>
														<span className='text-sm font-medium'>
															{collaborator.name.charAt(0).toUpperCase()}
														</span>
													</div>
													<div>
														<div className='font-medium'>
															{collaborator.name}
														</div>
														<div className='text-sm text-muted-foreground'>
															{collaborator.email}
														</div>
													</div>
												</div>
												<div className='flex items-center gap-3'>
													<Badge className={getRoleColor(collaborator.role)}>
														{collaborator.role}
													</Badge>
													<Badge
														className={getStatusColor(collaborator.status)}>
														{collaborator.status}
													</Badge>
													<div className='flex gap-2'>
														<Select
															value={collaborator.role}
															onValueChange={(
																value: "viewer" | "editor" | "admin",
															) => handleUpdateRole(collaborator.id, value)}>
															<SelectTrigger className='w-24'>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value='viewer'>Viewer</SelectItem>
																<SelectItem value='editor'>Editor</SelectItem>
																<SelectItem value='admin'>Admin</SelectItem>
															</SelectContent>
														</Select>
														<Button
															variant='outline'
															size='sm'
															onClick={() =>
																handleRemoveCollaborator(collaborator.id)
															}>
															<Trash2 className='w-4 h-4' />
														</Button>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Share Links Tab */}
						<TabsContent value='share-links' className='space-y-6'>
							<Card>
								<CardHeader>
									<div className='flex items-center justify-between'>
										<CardTitle>Share Links</CardTitle>
										<Button onClick={handleCreateShareLink}>
											<Link className='w-4 h-4 mr-2' />
											Create Link
										</Button>
									</div>
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										{shareLinks.map((link) => (
											<div
												key={link.id}
												className='flex items-center justify-between p-3 bg-muted rounded-lg'>
												<div className='flex-1'>
													<div className='font-medium text-sm'>{link.url}</div>
													<div className='text-xs text-muted-foreground mt-1'>
														Created{" "}
														{new Date(link.createdAt).toLocaleDateString()} •{" "}
														{link.accessCount} accesses
													</div>
												</div>
												<div className='flex items-center gap-2'>
													<Button
														variant='outline'
														size='sm'
														onClick={() => handleCopyLink(link.url)}>
														{copiedLink === link.url ? (
															<Check className='w-4 h-4' />
														) : (
															<Copy className='w-4 h-4' />
														)}
													</Button>
													<Button
														variant='outline'
														size='sm'
														onClick={() => handleRevokeLink(link.id)}>
														<Trash2 className='w-4 h-4' />
													</Button>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Invitations Tab */}
						<TabsContent value='invitations' className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Pending Invitations</CardTitle>
								</CardHeader>
								<CardContent>
									<div className='space-y-3'>
										{invitations.map((invitation) => (
											<div
												key={invitation.id}
												className='flex items-center justify-between p-3 bg-muted rounded-lg'>
												<div>
													<div className='font-medium'>{invitation.email}</div>
													<div className='text-sm text-muted-foreground'>
														Invited{" "}
														{new Date(
															invitation.invitedAt,
														).toLocaleDateString()}
													</div>
												</div>
												<div className='flex items-center gap-3'>
													<Badge className={getRoleColor(invitation.role)}>
														{invitation.role}
													</Badge>
													<Badge className={getStatusColor(invitation.status)}>
														{invitation.status}
													</Badge>
													<Button variant='outline' size='sm'>
														<Mail className='w-4 h-4 mr-2' />
														Resend
													</Button>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						</TabsContent>

						{/* Settings Tab */}
						<TabsContent value='settings' className='space-y-6'>
							<Card>
								<CardHeader>
									<CardTitle>Collaboration Settings</CardTitle>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='allowPublicAccess'>
												Allow Public Access
											</Label>
											<p className='text-sm text-muted-foreground'>
												Anyone with the link can view this dashboard
											</p>
										</div>
										<Switch id='allowPublicAccess' />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='allowComments'>Allow Comments</Label>
											<p className='text-sm text-muted-foreground'>
												Collaborators can add comments to widgets
											</p>
										</div>
										<Switch id='allowComments' />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='requireApproval'>Require Approval</Label>
											<p className='text-sm text-muted-foreground'>
												New collaborators must be approved by an admin
											</p>
										</div>
										<Switch id='requireApproval' />
									</div>
									<div className='flex items-center justify-between'>
										<div>
											<Label htmlFor='autoExpire'>Auto-expire Access</Label>
											<p className='text-sm text-muted-foreground'>
												Automatically revoke access after 90 days of inactivity
											</p>
										</div>
										<Switch id='autoExpire' />
									</div>
								</CardContent>
							</Card>
						</TabsContent>
					</Tabs>
				</div>

				{/* Footer */}
				<div className='flex items-center justify-end gap-3 p-6 border-t'>
					<Button variant='outline' onClick={onClose}>
						Close
					</Button>
				</div>
			</div>
		</div>
	);
}
