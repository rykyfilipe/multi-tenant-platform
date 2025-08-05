/** @format */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Table, Database } from "@/types/database";
import { useApp } from "./AppContext";
import { usePlanLimitError } from "@/hooks/usePlanLimitError";

interface DatabaseContextType {
	token: string | null;

	databases: Database[] | null;
	setDatabases: (databases: Database[]) => void;

	selectedDatabase: Database | null;
	setSelectedDatabase: (database: Database | null) => void;

	tables: Table[] | null;
	setTables: (tables: Table[]) => void;

	showAddTableModal: boolean;
	setShowAddTableModal: (state: boolean) => void;

	showAddDatabaseModal: boolean;
	setShowAddDatabaseModal: (state: boolean) => void;

	name: string;
	setName: (name: string) => void;
	description: string;
	setDescription: (name: string) => void;
	databaseName: string;
	setDatabaseName: (name: string) => void;

	handleAddTable: (e: React.FormEvent) => void;
	handleDeleteTable: (id: string) => void;
	handleAddDatabase: (e: React.FormEvent) => void;
	handleDeleteDatabase: (id: number) => void;
	handleSelectDatabase: (database: Database) => void;

	loading: boolean;

	validateTableName: (name: string) => boolean;
	validateDatabaseName: (name: string) => boolean;
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
	const { handleApiError } = usePlanLimitError();
	const tenantId = tenant?.id;

	const [databases, setDatabases] = useState<Database[] | null>(null);
	const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(
		null,
	);
	const [tables, setTables] = useState<Table[] | null>(null);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [databaseName, setDatabaseName] = useState("");

	const [showAddTableModal, setShowAddTableModal] = useState(false);
	const [showAddDatabaseModal, setShowAddDatabaseModal] = useState(false);

	useEffect(() => {
		fetchDatabases();
	}, [token, user, tenant]);

	useEffect(() => {
		if (selectedDatabase) {
			setTables(selectedDatabase.tables || []);
		} else {
			setTables(null);
		}
	}, [selectedDatabase]);

	const fetchDatabases = async () => {
		setLoading(true);

		if (!tenant || !user || !token) return;

		try {
			const response = await fetch(`/api/tenants/${tenant.id}/databases`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) throw new Error("Failed to fetch databases");
			const data = await response.json();

			if (!data || data.length === 0) {
				showAlert(
					"No databases found. Please create a database to get started.",
					"info",
				);
				setDatabases([]);
				setSelectedDatabase(null);
				setTables([]);
			} else {
				setDatabases(data);
				// Selectează prima bază de date ca fiind activă
				if (!selectedDatabase) {
					setSelectedDatabase(data[0]);
				}
			}
		} catch (error) {
			showAlert(
				"Failed to load databases. Please refresh the page and try again.",
				"error",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleSelectDatabase = (database: Database) => {
		setSelectedDatabase(database);
	};

	const handleAddDatabase = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token || !tenantId) {
			showAlert("Authentication required. Please log in again.", "error");
			return console.error("No token available");
		}
		if (!databaseName.trim()) {
			showAlert(
				"Database name is required. Please enter a name for your database.",
				"error",
			);
			return console.error("Database name is required");
		}

		try {
			const response = await fetch(`/api/tenants/${tenantId}/databases`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ name: databaseName }),
			});

			if (!response.ok) {
				handleApiError(response);
				return;
			}

			const newDatabase = await response.json();
			setShowAddDatabaseModal(false);
			setDatabaseName("");
			fetchDatabases();
			showAlert("Database created successfully!", "success");
		} catch (error) {
			console.error("Error adding database:", error);
			showAlert(
				"Failed to create database. Please check your information and try again.",
				"error",
			);
		}
	};

	const handleDeleteDatabase = async (id: number) => {
		if (!tenantId || !token) return;
		try {
			const response = await fetch(`/api/tenants/${tenantId}/databases/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			});
			if (!response.ok) {
				throw new Error("Failed to delete database");
			}

			fetchDatabases();
			showAlert("Database removed successfully", "success");
		} catch (error) {
			console.error("Error deleting database:", error);
			showAlert("Failed to remove database. Please try again.", "error");
		}
	};

	const handleAddTable = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token || !tenantId || !selectedDatabase) {
			showAlert("Authentication required. Please log in again.", "error");
			return console.error("No token available");
		}
		if (!name) {
			showAlert(
				"Table name is required. Please enter a name for your table.",
				"error",
			);
			return console.error("Table name is required");
		}
		if (!description) {
			showAlert(
				"Table description is required. Please describe what this table will contain.",
				"error",
			);
			return console.error("Table description is required");
		}
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${selectedDatabase.id}/tables`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name, description }),
				},
			);

			if (!response.ok) {
				handleApiError(response);
				return;
			}

			// Fetch baza de date actualizată (cu tabele noi)
			const dbResponse = await fetch(
				`/api/tenants/${tenantId}/databases/${selectedDatabase.id}`,
				{
					headers: { Authorization: `Bearer ${token}` },
				},
			);
			if (dbResponse.ok) {
				const updatedDb = await dbResponse.json();
				setSelectedDatabase(updatedDb);
			}

			setShowAddTableModal(false);
			setName("");
			setDescription("");
			showAlert(
				"Table created successfully! You can now add columns and data.",
				"success",
			);
		} catch (error) {
			console.error("Error adding table:", error);
			showAlert(
				"Failed to create table. Please check your information and try again.",
				"error",
			);
		}
	};

	const handleDeleteTable = async (id: string) => {
		if (!tenantId || !token || !selectedDatabase) return;
		try {
			const response = await fetch(
				`/api/tenants/${tenantId}/databases/${selectedDatabase.id}/tables/${id}`,
				{
					method: "DELETE",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				},
			);
			if (!response.ok) {
				throw new Error("Failed to delete table");
			}

			fetchDatabases();
			showAlert("Table removed successfully", "success");
		} catch (error) {
			console.error("Error deleting table:", error);
			showAlert("Failed to remove table. Please try again.", "error");
		}
	};

	const validateTableName = (n: string): boolean => {
		if (!tables) return false;
		return !tables.some((table) => table.name === n);
	};

	const validateDatabaseName = (n: string): boolean => {
		if (!databases) return false;
		return !databases.some((database) => database.name === n);
	};

	return (
		<DatabaseContext.Provider
			value={{
				token,
				databases,
				setDatabases,
				selectedDatabase,
				setSelectedDatabase,
				tables,
				setTables,
				showAddTableModal,
				setShowAddTableModal,
				showAddDatabaseModal,
				setShowAddDatabaseModal,
				name,
				setName,
				description,
				setDescription,
				databaseName,
				setDatabaseName,
				handleAddTable,
				handleDeleteTable,
				handleAddDatabase,
				handleDeleteDatabase,
				handleSelectDatabase,
				loading,
				validateTableName,
				validateDatabaseName,
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
