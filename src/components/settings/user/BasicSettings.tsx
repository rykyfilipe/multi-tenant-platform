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
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
	user: User;
}

type EditableField = "firstName" | "lastName" | "email" | null;

export default function BasicSettings({ user }: Props) {
	const { token, showAlert, tenant, setUser } = useApp();
	const [editingField, setEditingField] = useState<EditableField>(null);
	const [editedValues, setEditedValues] = useState({
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		role: user.role,
	});
	const { t } = useLanguage();

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

			showAlert(t("settings.profileUpdated"), "success");
		} catch (error) {
			showAlert(t("settings.profileUpdateFailed"), "error");
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
			<Label className='text-sm font-medium text-foreground'>{label}</Label>
			{editingField === field ? (
				<div className='flex items-center gap-2 md:flex-col'>
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
							{t("common.save")}
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
							{t("common.cancel")}
						</Button>
					</div>
				</div>
			) : (
				<div
					className='p-3 bg-muted/30 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors'
					onClick={() => setEditingField(field)}>
					<span className='text-sm text-foreground'>
						{editedValues[field!]}
					</span>
					<p className='text-xs text-muted-foreground mt-1'>
						{t("settings.clickToEdit")}
					</p>
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
					showAlert(t("settings.cannotDeleteAccount"), "error");
			} else {
				const message =
					user.role === "ADMIN"
						? t("settings.accountAndTenantDeleted")
						: t("settings.accountDeleted");
				showAlert(message, "success");
				setTimeout(() => {
					signOut({ callbackUrl: "/" });
				}, 2000);
			}
		} catch (error) {
			showAlert(t("settings.deleteAccountFailed"), "error");
		}
	};

	return (
		<div className='space-y-6'>
			{/* Personal Information */}
			<div className='grid grid-cols-1 max-lg:grid-cols-2 gap-6'>
				{renderField(t("settings.firstName"), "firstName")}
				{renderField(t("settings.lastName"), "lastName")}
			</div>

			{renderField(t("settings.email"), "email")}

			<div className='space-y-1'>
				<Label className='text-sm font-medium text-foreground'>
					{t("settings.role")}
				</Label>
				<div className='mt-1 p-3 bg-muted/30 rounded-lg border border-border'>
					<span className='text-sm text-foreground font-medium'>
						{user.role}
					</span>
				</div>
			</div>

			{/* Account Actions */}
			<div className='pt-6 border-t'>
				<div className='flex items-center justify-between'>
					<div>
						<h3 className='text-lg font-medium text-foreground'>
							{t("settings.dangerZone")}
						</h3>
						<p className='text-sm text-muted-foreground'>
							{t("settings.dangerZoneDescription")}
						</p>
					</div>
					<DeleteAccountButton onDelete={handleDelete} user={user} />
				</div>
			</div>
		</div>
	);
}
