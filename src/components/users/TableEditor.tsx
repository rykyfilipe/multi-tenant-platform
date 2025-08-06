/** @format */
"use client";

import { FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { usePlanLimitError } from "@/hooks/usePlanLimitError";

import { Role, User, UserSchema } from "@/types/user";
import useUsersEditor from "@/hooks/useUsersEditor";
import { TableView } from "./TableView";
import { AddRowForm } from "./AddRowForm";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface Props {
	users: User[] | null;
	setUsers: (users: User[]) => void;
}

export default function TableEditor({ users, setUsers }: Props) {
	if (!users) return;

	const { showAlert, token, user, tenant } = useApp();
	const { handleApiError } = usePlanLimitError();
	const [showForm, setShowForm] = useState(false);
	const tenantId = tenant?.id;
	const [newUser, setNewUser] = useState<UserSchema | null>({
		email: "",
		firstName: "",
		lastName: "",
		role: Role.VIEWER,
	});

	if (!token || !user || !users) return;

	const { editingCell, handleCancelEdit, handleEditCell, handleSaveCell } =
		useUsersEditor();

	async function handleAdd(e: FormEvent) {
		e.preventDefault();

		if (!token) return console.error("No token available");
		try {
			const response = await fetch(`/api/tenants/${tenantId}/users`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(newUser),
			});

			if (!response.ok) {
				handleApiError(response);
				return;
			}

			const data = await response.json();
			showAlert(
				"Invitation sent successfully! The user will receive an email to complete their account setup.",
				"success",
			);
			// Don't add to users list since it's just an invitation
			setNewUser({
				email: "",
				firstName: "",
				lastName: "",
				role: Role.VIEWER,
			});
			setShowForm(false);
		} catch (error) {
			showAlert(
				"Failed to add user. Please check the information and try again.",
				"error",
			);
		}
	}

	const handleDelete = async (userId: string) => {
		try {
			const response = await fetch(`/api/tenants/${tenantId}/users/${userId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) throw new Error("Failed to delete row");

			const updatedUsers: User[] = users.filter(
				(user) => user.id !== Number(userId),
			);
			setUsers(updatedUsers);
			showAlert("User removed successfully", "success");
		} catch (error) {
			showAlert("Failed to remove user. Please try again.", "error");
		}
	};

	const handleSaveCellWrapper = (
		userId: string,
		fieldName: keyof User,
		value: any,
	) => {
		handleSaveCell(userId, fieldName, users, setUsers, value, token, showAlert);
	};

	return (
		<div className='space-y-6'>
			{/* Header Actions */}
			<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
				<div className='flex items-center space-x-3'>
					{user.role === "ADMIN" && (
						<Button
							onClick={() => setShowForm((prev) => !prev)}
							className='flex items-center space-x-2'>
							{showForm ? <X className='w-4 h-4' /> : <span>Add User</span>}
						</Button>
					)}
					{showForm && (
						<span className='text-sm text-muted-foreground'>
							Fill in the form below to add a new team member...
						</span>
					)}
				</div>
			</div>

			{/* Add User Form */}
			{showForm && (
				<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg p-6'>
					<AddRowForm
						newUser={newUser}
						setNewUser={setNewUser}
						onAdd={handleAdd}
					/>
				</div>
			)}

			{/* Users Table */}
			<div className='table-content'>
				<TableView
					users={users}
					editingCell={editingCell}
					onEditCell={handleEditCell}
					onSaveCell={handleSaveCellWrapper}
					onCancelEdit={handleCancelEdit}
					onDeleteRow={handleDelete}
				/>
			</div>
		</div>
	);
}
