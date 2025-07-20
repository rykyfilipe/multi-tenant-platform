/** @format */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Table } from "@/types/database";
import { useApp } from "./AppContext";

interface DatabaseContextType {
	token: string | null;

	databaseInfo: any;
	setDatabaseInfo: (x: any) => void;

	tables: Table[] | null;
	setTables: (tables: Table[]) => void;

	showAddTableModal: boolean;
	setShowAddTableModal: (state: boolean) => void;

	name: string;
	setName: (name: string) => void;
	description: string;
	setDescription: (name: string) => void;
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
	const { token, user, loading, showAlert, tenant, setLoading } = useApp();
	const tenantId = tenant?.id;

	const [databaseInfo, setDatabaseInfo] = useState<any>(null);

	const [tables, setTables] = useState<Table[] | null>(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");

	const [showAddTableModal, setShowAddTableModal] = useState(false);
	useEffect(() => {
		fetchDatabase();
	}, [token, user, tenant]);

	const fetchDatabase = async () => {
		setLoading(true);

		if (!tenant || !user || !token) return;
		try {
			const response = await fetch(`/api/tenants/${tenant.id}/database`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) throw new Error("Failed to fetch database");
			const data = await response.json();
			if (!data) {
				showAlert("No database found", "error");
				setTables([]);
				setDatabaseInfo(null);
			} else {
				setDatabaseInfo("Database name");
				setTables(data.tables || []);
			}
		} catch (error) {
			showAlert("Error loading database", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleAddTable = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token || !tenantId) {
			showAlert("No token available", "error");

			return console.error("No token available");
		}
		if (!name) {
			showAlert("Table name is required", "error");
			return console.error("Table name is required");
		}
		if (!description) {
			showAlert("Table description is required", "error");
			return console.error("Table description is required");
		}
		try {
			const response = await fetch(`/api/tenants/${tenantId}/database/tables`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ name, description }),
			});
			if (!response.ok) throw new Error("Failed to add table");

			setShowAddTableModal(false);
			setName("");
			setDescription("");
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
		if (!tables) return false;
		return !tables.some((table) => table.name === n);
	};
	return (
		<DatabaseContext.Provider
			value={{
				token,
				databaseInfo,
				setDatabaseInfo,
				tables,
				setTables,
				showAddTableModal,
				setShowAddTableModal,
				name,
				setName,
				description,
				setDescription,
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
