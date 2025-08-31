/** @format */

"use client";

import { User } from "@/types/user";
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { useApp } from "./AppContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface UsersContextType {
	users: User[] | null;
	setUsers: (users: User[] | null) => void;
	handleAddUser: () => void;
	handleUpdateUser: (user: User) => void;
}

const UsersContext = createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
	const { tenant, token, loading, showAlert, setLoading } = useApp();
	const { t } = useLanguage();
	const tenantId = tenant?.id;

	const [users, setUsers] = useState<User[] | null>(null);

	const fetchUsers = useCallback(async () => {
		if (!tenantId || !token) {
			setLoading(false);
			return;
		}

		// Prevent duplicate requests if users are already loaded
		if (users && users.length >= 0) {
			setLoading(false);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(`/api/tenants/${tenantId}/users`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			if (!response.ok) throw new Error(t("users.errors.couldNotFetch"));
			const data = await response.json();

			setUsers(data);
			// Remove success alert - it's unnecessary and creates noise
		} catch (e) {
			console.error("Error fetching users:", e);
			setUsers([]);
			showAlert(t("users.errors.failedToLoad"), "error");
		} finally {
			setLoading(false);
		}
	}, [tenantId, token, users, showAlert, t]); // Add t to prevent unnecessary calls

	useEffect(() => {
		if (token && tenantId && !loading && !users) {
			fetchUsers();
		} else if (!token || !tenantId) {
			setLoading(false);
		}
	}, [token, tenantId, loading, fetchUsers, users]);

	const handleAddUser = async () => {
		// TODO: Implement user addition functionality
		showAlert(t("users.info.additionNotImplemented"), "info");
	};
	const handleUpdateUser = async (user: User) => {
		if (loading || !token || !tenantId) return;

		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/users/${user.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(user),
				},
			);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || t("users.errors.failedToUpdate"));
			}

			const data: User = await response.json();
			const updatedUsers = users?.filter((u) => u.id !== data.id);
			setUsers([...(updatedUsers || []), data]);

			showAlert(
				t("users.success.updatedSuccessfully", {
					firstName: data.firstName,
					lastName: data.lastName,
				}),
				"success",
			);
		} catch (error) {
			const errorMessage =
				error instanceof Error
					? error.message
					: t("users.errors.failedToUpdateGeneric");
			showAlert(errorMessage, "error");
		}
	};

	return (
		<UsersContext.Provider
			value={{
				users,
				setUsers,
				handleAddUser,
				handleUpdateUser,
			}}>
			{children}
		</UsersContext.Provider>
	);
}

export function useUsers() {
	const context = useContext(UsersContext);
	if (!context)
		throw new Error("useDatabase must be used within DatabaseProvider");
	return context;
}
