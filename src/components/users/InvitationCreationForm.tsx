/** @format */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	Mail,
	UserPlus,
	CheckCircle,
	AlertCircle,
	Crown,
	Edit,
	Eye,
	X,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { Role } from "@/types/user";

interface InvitationCreationFormProps {
	tenantId: number;
	onInvitationCreated?: () => void;
}

export function InvitationCreationForm({
	tenantId,
	onInvitationCreated,
}: InvitationCreationFormProps) {
	const [formData, setFormData] = useState({
		email: "",
		firstName: "",
		lastName: "",
		role: "VIEWER" as Role,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const { showAlert, token } = useApp();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const response = await fetch(`/api/tenants/${tenantId}/invitations`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to create invitation");
			}

			setSuccess(true);
			setFormData({
				email: "",
				firstName: "",
				lastName: "",
				role: "VIEWER" as Role,
			});

			showAlert("Invitation sent successfully!", "success");

			// Call the callback if provided
			if (onInvitationCreated) {
				onInvitationCreated();
			}

			// Reset success state after 3 seconds
			setTimeout(() => {
				setSuccess(false);
			}, 3000);
		} catch (err: any) {
			setError(err.message || "Failed to create invitation");
			showAlert(err.message || "Failed to create invitation", "error");
		} finally {
			setLoading(false);
		}
	};

	const getRoleIcon = (role: Role) => {
		switch (role) {
			case Role.ADMIN:
				return <Crown className='w-4 h-4' />;
			case Role.EDITOR:
				return <Edit className='w-4 h-4' />;
			case Role.VIEWER:
				return <Eye className='w-4 h-4' />;
			default:
				return <UserPlus className='w-4 h-4' />;
		}
	};

	const getRoleDescription = (role: Role) => {
		switch (role) {
			case Role.ADMIN:
				return "Full access to all features and user management";
			case Role.EDITOR:
				return "Can create, edit, and manage content";
			case Role.VIEWER:
				return "Read-only access to view content";
			default:
				return "Basic user access";
		}
	};

	if (success) {
		return (
			<div className="text-center py-8">
				<div className="p-4 bg-green-500/10 rounded-full w-fit mx-auto mb-4">
					<CheckCircle className="w-8 h-8 text-green-600" />
				</div>
				<h3 className="text-lg font-medium text-foreground mb-2">
					Invitation Sent Successfully!
				</h3>
				<p className="text-muted-foreground mb-4">
					The invitation has been sent to {formData.email}
				</p>
				<Button
					variant="outline"
					onClick={() => setSuccess(false)}
					className="flex items-center gap-2"
				>
					<X className="w-4 h-4" />
					Send Another Invitation
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="firstName">First Name</Label>
						<Input
							id="firstName"
							value={formData.firstName}
							onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
							placeholder="Enter first name"
							required
							className="bg-background border-border"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							id="lastName"
							value={formData.lastName}
							onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
							placeholder="Enter last name"
							required
							className="bg-background border-border"
						/>
					</div>
				</div>

				<div className="space-y-2">
					<Label htmlFor="email">Email Address</Label>
					<Input
						id="email"
						type="email"
						value={formData.email}
						onChange={(e) => setFormData({ ...formData, email: e.target.value })}
						placeholder="Enter email address"
						required
						className="bg-background border-border"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="role">Role</Label>
					<Select
						value={formData.role}
						onValueChange={(value: Role) => setFormData({ ...formData, role: value })}
					>
						<SelectTrigger className="bg-background border-border">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={Role.VIEWER}>
								<div className="flex items-center gap-2">
									<Eye className="w-4 h-4" />
									Viewer
								</div>
							</SelectItem>
							<SelectItem value={Role.EDITOR}>
								<div className="flex items-center gap-2">
									<Edit className="w-4 h-4" />
									Editor
								</div>
							</SelectItem>
							<SelectItem value={Role.ADMIN}>
								<div className="flex items-center gap-2">
									<Crown className="w-4 h-4" />
									Administrator
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
					<div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
						{getRoleIcon(formData.role)}
						<div>
							<div className="text-sm font-medium text-foreground">
								{formData.role.charAt(0) + formData.role.slice(1).toLowerCase()}
							</div>
							<div className="text-xs text-muted-foreground">
								{getRoleDescription(formData.role)}
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3 pt-4">
					<Button
						type="submit"
						disabled={loading}
						className="flex items-center gap-2"
					>
						{loading ? (
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
						) : (
							<Mail className="w-4 h-4" />
						)}
						{loading ? "Sending..." : "Send Invitation"}
					</Button>
				</div>
			</form>
		</div>
	);
}
