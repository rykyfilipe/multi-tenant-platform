/** @format */

"use client";

import { User } from "@/types/user";
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { useApp } from "./AppContext";

interface UsersContextType {
	users: User[] | null;
	setUsers: (users: User[] | null) => void;
	handleAddUser: () => void;
	handleUpdateUser: (user: User) => void;
}

const UsersContext = createContext<UsersContextType | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
	const { tenant, token, loading, showAlert, setLoading } = useApp();
	const tenantId = tenant?.id;

	const [users, setUsers] = useState<User[] | null>(null);

	useEffect(() => {
		if (loading || !token || !tenantId) return;

		const fetchUsers = async () => {
			setLoading(true);
			try {
				const response = await fetch(`/api/tenants/${tenantId}/users`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!response.ok) throw new Error("Could not fetch users");
				const data = await response.json();

				setUsers(data);
				showAlert("Users data loaded", "success");
			} catch (e) {
				setLoading(false);
				showAlert("Failed to load users", "error");
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, [token, tenantId]);

	const handleAddUser = async () => {};
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
				throw new Error(errorData.error || "Failed to update user");
			}

			const data: User = await response.json();
			const updatedUsers = users?.filter((u) => u.id !== data.id);
			setUsers([...(updatedUsers || []), data]);

			showAlert(`User ${data.firstName} ${data.lastName} updated`, "success");
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "An unknown error occurred";
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
