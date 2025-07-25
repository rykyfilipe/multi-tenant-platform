/** @format */
"use client";

import { FormEvent, useState } from "react";
import { useApp } from "@/contexts/AppContext";

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
	const [showForm, setShowForm] = useState(false);
	const tenantId = tenant?.id;
	const [newUser, setNewUser] = useState<UserSchema | null>({
		email: "",
		firstName: "",
		lastName: "",
		role: Role.VIEWER,
		password: "",
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

			if (!response.ok) throw new Error("Failed to add row");

			const data = await response.json();
			showAlert("Row added successfully", "success");
			setUsers([...(users || []), data.user as User]);
			setNewUser({
				email: "",
				firstName: "",
				lastName: "",
				role: Role.VIEWER,
				password: "",
			});
		} catch (error) {
			showAlert("Error adding row", "error");
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
			showAlert("Row deleted successfully", "success");
		} catch (error) {
			showAlert("Error deleting row", "error");
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
			{user.role === "ADMIN" && (
				<Button onClick={() => setShowForm((prev) => !prev)}>
					{showForm ? <X /> : "Add new user"}
				</Button>
			)}
			{showForm && (
				<AddRowForm
					newUser={newUser}
					setNewUser={setNewUser}
					onAdd={handleAdd}
				/>
			)}
			<TableView
				users={users}
				editingCell={editingCell}
				onEditCell={handleEditCell}
				onSaveCell={handleSaveCellWrapper}
				onCancelEdit={handleCancelEdit}
				onDeleteRow={handleDelete}
			/>
		</div>
	);
}
