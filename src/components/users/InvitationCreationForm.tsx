/** @format */

"use client";

import { useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
			case Role.EDITOR:
				return "Can create, edit, and delete data";
			case Role.VIEWER:
				return "Can only view data and reports";
			default:
				return "";
		}
	};

	return (
		<Card className='w-full max-w-lg border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50'>
			<CardHeader className='text-center pb-6'>
				<div className='mx-auto w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mb-4'>
					<UserPlus className='w-6 h-6 text-primary' />
				</div>
				<CardTitle className='text-xl font-semibold'>
					Invite Team Member
				</CardTitle>
				<CardDescription className='text-base'>
					Send an invitation to join your team
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-6'>
					{/* Email */}
					<div className='space-y-2'>
						<Label htmlFor='email' className='text-sm font-medium'>
							Email Address
						</Label>
						<Input
							id='email'
							type='email'
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
							placeholder='colleague@company.com'
							required
							className='h-11'
						/>
					</div>

					{/* Role Selection */}
					<div className='space-y-3'>
						<Label htmlFor='role' className='text-sm font-medium'>
							Role
						</Label>
						<Select
							value={formData.role}
							onValueChange={(value: Role) =>
								setFormData({ ...formData, role: value })
							}>
							<SelectTrigger className='h-11'>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={Role.VIEWER}>
									<div className='flex items-center gap-3'>
										<Eye className='w-4 h-4' />
										<div>
											<span className='font-medium'>Viewer</span>
											<p className='text-xs text-muted-foreground'>
												Can only view data and reports
											</p>
										</div>
									</div>
								</SelectItem>
								<SelectItem value={Role.EDITOR}>
									<div className='flex items-center gap-3'>
										<Edit className='w-4 h-4' />
										<div>
											<span className='font-medium'>Editor</span>
											<p className='text-xs text-muted-foreground'>
												Can create, edit, and delete data
											</p>
										</div>
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Role Preview */}
					<div className='p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20'>
						<div className='flex items-center gap-3'>
							<div className='p-2 bg-primary/10 rounded-lg'>
								{getRoleIcon(formData.role)}
							</div>
							<div>
								<p className='font-semibold text-primary'>{formData.role}</p>
								<p className='text-sm text-muted-foreground'>
									{getRoleDescription(formData.role)}
								</p>
							</div>
						</div>
					</div>

					{/* Submit Button */}
					<Button
						type='submit'
						disabled={loading}
						className='w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium'>
						{loading ? (
							<>
								<div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
								Sending Invitation...
							</>
						) : (
							<>
								<Mail className='w-5 h-5 mr-2' />
								Send Invitation
							</>
						)}
					</Button>

					{/* Success Message */}
					{success && (
						<Alert className='border-green-200 bg-green-50'>
							<CheckCircle className='w-4 h-4 text-green-600' />
							<AlertDescription className='text-green-800'>
								Invitation sent successfully! The recipient will receive an
								email with instructions.
							</AlertDescription>
						</Alert>
					)}

					{/* Error Message */}
					{error && (
						<Alert variant='destructive'>
							<AlertCircle className='w-4 h-4' />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
