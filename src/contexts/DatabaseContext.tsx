/** @format */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Table } from "@/types/database";
import { useApp } from "./AppContext";

interface DatabaseContextType {
	token: string | null;

	databaseInfo: string | null;

	tables: Table[];
	setTables: (tables: Table[]) => void;

	showAddTableModal: boolean;
	setShowAddTableModal: (state: boolean) => void;

	name: string;
	setName: (name: string) => void;

	handleAddTable: (e: React.FormEvent) => void;
	handleDeleteTable: (id: string) => void;

	loading: boolean;

	validateTableName: (name: string) => boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(
	undefined,
);

export const DatabaseProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { token, user, loading, showAlert } = useApp();
	const tenantId = user?.tenantId;

	const [databaseInfo, setDatabaseInfo] = useState<string | null>(null);
	const [tables, setTables] = useState<Table[]>([]);

	const [name, setName] = useState("");

	const [showAddTableModal, setShowAddTableModal] = useState(false);

	useEffect(() => {
		fetchDatabase();
	}, [token, user, loading, tenantId]);

	const fetchDatabase = async () => {
		if (!tenantId || !user || !token) return;
		try {
			const response = await fetch(`/api/tenants/${tenantId}/database`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) throw new Error("Failed to fetch database");
			const data = await response.json();
			if (!data) {
				showAlert("No database found", "error");
				setTables([]);
			} else {
				setDatabaseInfo(null);
				setTables(data.tables || []);
			}
		} catch (error) {
			showAlert("Error loading database", "error");
		}
	};

	const handleAddTable = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token) {
			showAlert("No token available", "error");

			return console.error("No token available");
		}
		if (!name) {
			showAlert("Table name is required", "error");
			return console.error("Table name is required");
		}
		try {
			const response = await fetch(
				`/api/tenants/${user.tenantId}/database/tables`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name }),
				},
			);
			if (!response.ok) throw new Error("Failed to add table");

			setShowAddTableModal(false);
			setName("");
			fetchDatabase();
		} catch (error) {
			console.error("Error adding table:", error);
		}
	};

	const handleDeleteTable = async (id: string) => {
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/database/tables/${id}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${localStorage.getItem("token")}`,
					},
				},
			);
			if (!response.ok) {
				throw new Error("Failed to delete table");
			}

			fetchDatabase();
			showAlert("Table deleted successfully", "success");
		} catch (error) {
			console.error("Error deleting table:", error);
			showAlert("Failed to delete table", "error");
		}
	};
	const validateTableName = (n: string): boolean => {
		return !tables.some((table) => table.name === n);
	};
	return (
		<DatabaseContext.Provider
			value={{
				token,
				databaseInfo,
				tables,
				setTables,
				showAddTableModal,
				setShowAddTableModal,
				name,
				setName,
				handleAddTable,
				handleDeleteTable,
				loading,
				validateTableName,
			}}>
			{children}
		</DatabaseContext.Provider>
	);
};

export const useDatabase = () => {
	const context = useContext(DatabaseContext);
	if (!context)
		throw new Error("useDatabase must be used within DatabaseProvider");
	return context;
};

// const handleUpdateTable = async (e: React.FormEvent) => {
// 		e.preventDefault();
// 		if (!token) return console.error("No token available");
// 		if (!name || !columns.length)
// 			return console.error("Table name and columns are required");

// 		try {
// 			const response = await fetch(
// 				`/api/tenant/${user.tenantId}/database/table/${selectedTable?.id}`,
// 				{
// 					method: "PATCH",
// 					headers: {
// 						"Content-Type": "application/json",
// 						Authorization: `Bearer ${token}`,
// 					},
// 					body: JSON.stringify({ name, columns }),
// 				},
// 			);
// 			if (!response.ok) throw new Error("Failed to add table");

// 			setShowAddTableModal(false);
// 			setName("");
// 			setColumns([]);
// 			fetchDatabase();
// 		} catch (error) {
// 			showAlert(error as string, "error");
// 		}
// 	};
