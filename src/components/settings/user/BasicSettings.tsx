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

			showAlert("Succes la update user data", "success");
		} catch (error) {
			showAlert("Erroare la update user data", "error");
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
			setUser((prev: any) => ({
				...prev,
				[field]: editedValues[field],
			}));
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
		<div className='space-y-1'>
			<Label>{label}</Label>
			{editingField === field ? (
				<div className='flex items-center gap-2 mt-1'>
					<Input
						autoFocus
						value={editedValues[field!]}
						onChange={(e) => handleChange(field, e.target.value)}
						onKeyDown={(e) => handleKeyDown(e, field)}
						className='w-max'
					/>
					<div className='flex gap-1'>
						<Button
							variant='default'
							size='sm'
							onClick={() => handleSave(field)}>
							Save
						</Button>
					</div>
				</div>
			) : (
				<p
					className='mt-1 cursor-pointer hover:underline'
					onDoubleClick={() => setEditingField(field)}>
					{editedValues[field!]}
				</p>
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
					showAlert("User still has a tenant", "error");
			} else showAlert("Account deleted successfully", "success");
		} catch (error) {
			showAlert("Error deleting user", "error");
		}
	};

	return (
		<div className='w-full max-w-xl'>
			<Card className='w-full'>
				<CardHeader>
					<CardTitle className='text-xl'>Basic Settings</CardTitle>
				</CardHeader>
				<CardContent className='space-y-5'>
					{renderField("First Name", "firstName")}
					{renderField("Last Name", "lastName")}
					{renderField("Email", "email")}
					<div className='space-y-1'>
						<Label>Role</Label>
						<p className='mt-1 cursor-pointer hover:underline'>{user.role}</p>
					</div>
					<div className='w-full flex justify-end'>
						<DeleteAccountButton onDelete={handleDelete} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default BasicSettings;
