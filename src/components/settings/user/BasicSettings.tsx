/** @format */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User } from "@/types/user";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import DeleteAccountButton from "./DeleteAccountButton";
import { signOut } from "next-auth/react";

interface Props {
	user: User;
}

type EditableField = "firstName" | "lastName" | "email" | null;

function BasicSettings({ user }: Props) {
	const { token, showAlert, tenant, setUser } = useApp();
	const [editingField, setEditingField] = useState<EditableField>(null);
	const [editedValues, setEditedValues] = useState({
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		role: user.role,
	});

	const [password, stPassword] = useState(null);

	const updateField = async (field: EditableField, value: string) => {
		if (!field) return;
		try {
			const response = await fetch(
				`/api/tenants/${tenant?.id}/users/${user.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ [field]: value }),
				},
			);

			if (!response.ok) {
				throw new Error("Update failed");
			}

			showAlert("Profile information updated successfully!", "success");
		} catch (error) {
			showAlert(
				"Failed to update profile information. Please try again.",
				"error",
			);
		}
	};

	const handleChange = (field: EditableField, value: string) => {
		if (field) {
			setEditedValues((prev) => ({ ...prev, [field]: value }));
		}
	};

	const handleSave = async (field: EditableField) => {
		if (field) {
			await updateField(field, editedValues[field]);
			setUser({
				...user,
				[field]: editedValues[field],
			});
			setEditingField(null);
		}
	};

	const handleKeyDown = async (
		e: React.KeyboardEvent<HTMLInputElement>,
		field: EditableField,
	) => {
		if (e.key === "Enter") {
			await handleSave(field);
		}
	};

	const renderField = (label: string, field: EditableField) => (
		<div className='space-y-2'>
			<Label className='text-sm font-medium text-gray-700'>{label}</Label>
			{editingField === field ? (
				<div className='flex items-center gap-2'>
					<Input
						autoFocus
						value={editedValues[field!]}
						onChange={(e) => handleChange(field, e.target.value)}
						onKeyDown={(e) => handleKeyDown(e, field)}
						className='flex-1'
					/>
					<div className='flex gap-2'>
						<Button
							variant='default'
							size='sm'
							onClick={() => handleSave(field)}
							className='px-4'>
							Save
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() => {
								setEditingField(null);
								setEditedValues({
									firstName: user.firstName,
									lastName: user.lastName,
									email: user.email,
									role: user.role,
								});
							}}
							className='px-4'>
							Cancel
						</Button>
					</div>
				</div>
			) : (
				<div
					className='p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors'
					onClick={() => setEditingField(field)}>
					<span className='text-sm text-gray-900'>{editedValues[field!]}</span>
					<p className='text-xs text-gray-500 mt-1'>Click to edit</p>
				</div>
			)}
		</div>
	);
	const handleDelete = async () => {
		try {
			const response = await fetch(
				`/api/tenants/${tenant?.id}/users/${user.id}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				},
			);

			if (!response.ok) {
				if (response.status === 409)
					showAlert(
						"Cannot delete account while you still have active data. Please contact support.",
						"error",
					);
			} else {
				const message =
					user.role === "ADMIN"
						? "Account and tenant deleted successfully. You will be logged out."
						: "Account deleted successfully. You will be logged out.";
				showAlert(message, "success");
				setTimeout(() => {
					signOut({ callbackUrl: "/" });
				}, 2000);
			}
		} catch (error) {
			showAlert(
				"Failed to delete account. Please try again or contact support.",
				"error",
			);
		}
	};

	return (
		<div className='space-y-6'>
			{/* Personal Information */}
			<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
				{renderField("First Name", "firstName")}
				{renderField("Last Name", "lastName")}
			</div>

			{renderField("Email", "email")}

			<div className='space-y-1'>
				<Label className='text-sm font-medium text-gray-700'>Role</Label>
				<div className='mt-1 p-3 bg-gray-50 rounded-lg border'>
					<span className='text-sm text-gray-900 font-medium'>{user.role}</span>
				</div>
			</div>

			{/* Account Actions */}
			<div className='pt-6 border-t'>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='text-lg font-medium text-gray-900'>Danger Zone</h3>
						<p className='text-sm text-gray-600'>
							Permanently delete your account and all associated data.
						</p>
					</div>
					<DeleteAccountButton onDelete={handleDelete} user={user} />
				</div>
			</div>
		</div>
	);
}

export default BasicSettings;
