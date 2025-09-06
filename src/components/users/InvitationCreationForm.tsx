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
	Send,
	Sparkles,
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
		firstName: "",
		lastName: "",
		email: "",
		role: "VIEWER" as Role,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const { showAlert, token } = useApp();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const response = await fetch(`/api/tenants/${tenantId}/invitations`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to send invitation");
			}

			setSuccess(true);
			showAlert("Invitation sent successfully!", "success");
			
			// Reset form
			setFormData({
				firstName: "",
				lastName: "",
				email: "",
				role: "VIEWER",
			});

			// Call callback
			onInvitationCreated?.();

			// Reset success state after 3 seconds
			setTimeout(() => setSuccess(false), 3000);
		} catch (err: any) {
			setError(err.message);
			showAlert(err.message, "error");
		} finally {
			setLoading(false);
		}
	};

	const getRoleInfo = (role: Role) => {
		switch (role) {
			case Role.ADMIN:
				return {
					icon: <Crown className='w-4 h-4' />,
					color: "from-purple-500 to-pink-500",
					description: "Full access to all features and settings",
					permissions: ["Manage users", "System settings", "All data access"]
				};
			case Role.EDITOR:
				return {
					icon: <Edit className='w-4 h-4' />,
					color: "from-blue-500 to-cyan-500",
					description: "Can create and edit content",
					permissions: ["Create content", "Edit data", "View analytics"]
				};
			case Role.VIEWER:
				return {
					icon: <Eye className='w-4 h-4' />,
					color: "from-slate-500 to-slate-600",
					description: "Read-only access to content",
					permissions: ["View data", "Read reports", "Basic features"]
				};
			default:
				return {
					icon: <UserPlus className='w-4 h-4' />,
					color: "from-gray-500 to-gray-600",
					description: "Basic user access",
					permissions: ["Basic features"]
				};
		}
	};

	const roleInfo = getRoleInfo(formData.role);

	return (
		<div className='space-y-6'>
			{/* Success Message */}
			{success && (
				<Alert className='border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'>
					<CheckCircle className='h-4 w-4 text-green-600 dark:text-green-400' />
					<AlertDescription className='text-green-800 dark:text-green-200'>
						Invitation sent successfully! The recipient will receive an email with instructions to join your team.
					</AlertDescription>
				</Alert>
			)}

			{/* Error Message */}
			{error && (
				<Alert className='border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'>
					<AlertCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
					<AlertDescription className='text-red-800 dark:text-red-200'>
						{error}
					</AlertDescription>
				</Alert>
			)}

			<form onSubmit={handleSubmit} className='space-y-6'>
				{/* Personal Information */}
				<div className='space-y-4'>
					<div className='flex items-center gap-2 mb-4'>
						<div className='w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center'>
							<UserPlus className='w-4 h-4 text-primary' />
						</div>
						<h4 className='text-lg font-semibold text-slate-900 dark:text-white'>Personal Information</h4>
					</div>
					
					<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label htmlFor='firstName' className='text-sm font-medium text-slate-700 dark:text-slate-300'>
								First Name *
							</Label>
							<Input
								id='firstName'
								type='text'
								value={formData.firstName}
								onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
								placeholder='Enter first name'
								required
								className='h-11 border-2 border-slate-200 dark:border-slate-700 focus:border-primary/50 rounded-xl transition-all duration-200'
							/>
						</div>
						
						<div className='space-y-2'>
							<Label htmlFor='lastName' className='text-sm font-medium text-slate-700 dark:text-slate-300'>
								Last Name *
							</Label>
							<Input
								id='lastName'
								type='text'
								value={formData.lastName}
								onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
								placeholder='Enter last name'
								required
								className='h-11 border-2 border-slate-200 dark:border-slate-700 focus:border-primary/50 rounded-xl transition-all duration-200'
							/>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='email' className='text-sm font-medium text-slate-700 dark:text-slate-300'>
							Email Address *
						</Label>
						<div className='relative'>
							<Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400' />
							<Input
								id='email'
								type='email'
								value={formData.email}
								onChange={(e) => setFormData({ ...formData, email: e.target.value })}
								placeholder='Enter email address'
								required
								className='h-11 pl-10 border-2 border-slate-200 dark:border-slate-700 focus:border-primary/50 rounded-xl transition-all duration-200'
							/>
						</div>
					</div>
				</div>

				{/* Role Selection */}
				<div className='space-y-4'>
					<div className='flex items-center gap-2 mb-4'>
						<div className='w-8 h-8 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-lg flex items-center justify-center'>
							<Sparkles className='w-4 h-4 text-amber-600' />
						</div>
						<h4 className='text-lg font-semibold text-slate-900 dark:text-white'>Role & Permissions</h4>
					</div>

					<div className='space-y-2'>
						<Label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
							Select Role *
						</Label>
						<Select
							value={formData.role}
							onValueChange={(value) => setFormData({ ...formData, role: value as Role })}
						>
							<SelectTrigger className='h-11 border-2 border-slate-200 dark:border-slate-700 focus:border-primary/50 rounded-xl transition-all duration-200'>
								<SelectValue placeholder='Select a role' />
							</SelectTrigger>
							<SelectContent className='rounded-xl border-2 border-slate-200 dark:border-slate-700'>
								<SelectItem value={Role.ADMIN} className='rounded-lg'>
									<div className='flex items-center gap-3 py-2'>
										<Crown className='w-4 h-4 text-purple-600' />
										<div>
											<div className='font-medium'>Administrator</div>
											<div className='text-xs text-slate-500'>Full system access</div>
										</div>
									</div>
								</SelectItem>
								<SelectItem value={Role.EDITOR} className='rounded-lg'>
									<div className='flex items-center gap-3 py-2'>
										<Edit className='w-4 h-4 text-blue-600' />
										<div>
											<div className='font-medium'>Editor</div>
											<div className='text-xs text-slate-500'>Create and edit content</div>
										</div>
									</div>
								</SelectItem>
								<SelectItem value={Role.VIEWER} className='rounded-lg'>
									<div className='flex items-center gap-3 py-2'>
										<Eye className='w-4 h-4 text-slate-600' />
										<div>
											<div className='font-medium'>Viewer</div>
											<div className='text-xs text-slate-500'>Read-only access</div>
										</div>
									</div>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Role Preview */}
					<div className='bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600'>
						<div className='flex items-center gap-3 mb-3'>
							<Badge className={`bg-gradient-to-r ${roleInfo.color} text-white border-0 px-3 py-1 rounded-lg shadow-sm`}>
								<div className='flex items-center gap-2'>
									{roleInfo.icon}
									{formData.role}
								</div>
							</Badge>
						</div>
						<p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
							{roleInfo.description}
						</p>
						<div className='space-y-1'>
							<p className='text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide'>Permissions:</p>
							<div className='flex flex-wrap gap-2'>
								{roleInfo.permissions.map((permission, index) => (
									<span
										key={index}
										className='text-xs bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-600'
									>
										{permission}
									</span>
								))}
							</div>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className='flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700'>
					<Button
						type='button'
						variant='outline'
						onClick={() => {
							setFormData({
								firstName: "",
								lastName: "",
								email: "",
								role: "VIEWER",
							});
							setError("");
							setSuccess(false);
						}}
						className='h-11 px-6 border-2 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-xl transition-all duration-200'
					>
						<X className='w-4 h-4 mr-2' />
						Clear Form
					</Button>
					<Button
						type='submit'
						disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
						className='h-11 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200 rounded-xl font-medium'
					>
						{loading ? (
							<>
								<div className='w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin' />
								Sending...
							</>
						) : (
							<>
								<Send className='w-4 h-4 mr-2' />
								Send Invitation
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}