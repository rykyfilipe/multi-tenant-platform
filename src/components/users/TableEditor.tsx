/** @format */
"use client";

import { FormEvent, useState, useEffect } from "react";
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
	onInvitationSent?: () => void;
}

export default function TableEditor({
	users,
	setUsers,
	onInvitationSent,
}: Props) {
	if (!users) return;

	const { showAlert, token, user, tenant } = useApp();
	const { handleApiError } = usePlanLimitError();
	const [showForm, setShowForm] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
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

	// Clear server error when user data changes (user starts typing)
	useEffect(() => {
		if (serverError && newUser) {
			// Only clear error if user is actively typing (not on initial load)
			const hasUserData =
				newUser.email || newUser.firstName || newUser.lastName;
			if (hasUserData) {
				// Add a small delay to allow user to see the error first
				const timer = setTimeout(() => {
					setServerError(null);
				}, 5000); // 5 seconds delay

				return () => clearTimeout(timer);
			}
		}
	}, [newUser?.email, newUser?.firstName, newUser?.lastName, serverError]);

	async function handleAdd(e: FormEvent) {
		e.preventDefault();

		if (!token) return console.error("No token available");

		// Clear any previous server errors
		setServerError(null);

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
				// Try to parse the error response
				let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

				try {
					const errorData = await response.json();
					errorMessage =
						errorData.error ||
						errorData.message ||
						errorData.details ||
						errorMessage;
				} catch (parseError) {
					try {
						const textError = await response.text();
						errorMessage = textError || errorMessage;
					} catch (textParseError) {
						console.error("Could not parse error response:", textParseError);
					}
				}

				// Set server error to show validation errors
				setServerError(errorMessage);
				// Don't call handleApiError here as we want to show errors in the form
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
			// Clear server error on success
			setServerError(null);

			// Trigger refresh of invitations list
			if (onInvitationSent) {
				onInvitationSent();
			}
		} catch (error) {
			let errorMessage =
				"Failed to add user. Please check the information and try again.";

			if (error instanceof Error) {
				errorMessage = error.message;
			} else if (typeof error === "string") {
				errorMessage = error;
			} else if (error && typeof error === "object" && "message" in error) {
				errorMessage = (error as any).message;
			}

			// Set server error if not already set
			if (!serverError) {
				setServerError(errorMessage);
			}
			showAlert(errorMessage, "error");
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
							onClick={() => {
								setShowForm((prev) => !prev);
								// Clear server error when toggling form
								setServerError(null);
							}}
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
						serverError={serverError}
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
