/** @format */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Table, Column, ColumnSchema } from "@/types/database";
import { useApp } from "./AppContext";

interface DatabaseContextType {
	token: string | null;
	tables: Table[];
	columns: Column[];
	setColumns: (columns: Column[]) => void;
	fetchDatabase: (authToken: string) => void;
	showAddTableModal: boolean;
	setShowAddTableModal: (state: boolean) => void;
	name: string;
	setName: (name: string) => void;
	loading: boolean;
	handleAddTable: (e: React.FormEvent) => void;
	columnsSchema: ColumnSchema[];
	databaseInfo: string | null;
	setTables: (tables: Table[]) => void;
	selectedTable: Table | null;
	setSelectedTable: (table: Table | null) => void;
	handleUpdateTable: (e: React.FormEvent) => void;
	isUpdate: boolean;
	setIsUpdate: (x: boolean) => void;
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
	const [columns, setColumns] = useState<Column[]>([]);
	const [showAddTableModal, setShowAddTableModal] = useState(false);
	const [name, setName] = useState("");
	const [isUpdate, setIsUpdate] = useState(false);

	const [selectedTable, setSelectedTable] = useState<Table | null>(null);

	const columnsSchema: ColumnSchema[] = [
		{ name: "name", type: "string", required: true },
		{ name: "type", type: "string", required: true },
		{ name: "primary", type: "boolean", required: false, default: false },
		{
			name: "auto-increment",
			type: "boolean",
			required: false,
			default: false,
		},
		{ name: "required", type: "boolean", required: false, default: false },
		{ name: "unique", type: "boolean", required: false, default: false },
		{ name: "defaultValue", type: "string", required: false },
	];

	useEffect(() => {
		fetchDatabase();
	}, [token, user, loading, tenantId]);

	const fetchDatabase = async () => {
		if (!tenantId || !user || !token) return;
		try {
			const response = await fetch(`/api/tenant/${tenantId}/database`, {
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
		if (!token) return console.error("No token available");
		if (!name || !columns.length)
			return console.error("Table name and columns are required");

		try {
			const response = await fetch(
				`/api/tenant/${user.tenantId}/database/table`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name, columns }),
				},
			);
			if (!response.ok) throw new Error("Failed to add table");

			setShowAddTableModal(false);
			setName("");
			setColumns([]);
			fetchDatabase();
		} catch (error) {
			console.error("Error adding table:", error);
		}
	};
	const handleUpdateTable = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token) return console.error("No token available");
		if (!name || !columns.length)
			return console.error("Table name and columns are required");

		try {
			const response = await fetch(
				`/api/tenant/${user.tenantId}/database/table/${selectedTable?.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ name, columns }),
				},
			);
			if (!response.ok) throw new Error("Failed to add table");

			setShowAddTableModal(false);
			setName("");
			setColumns([]);
			fetchDatabase();
		} catch (error) {
			showAlert(error as string, "error");
		}
	};

	return (
		<DatabaseContext.Provider
			value={{
				token,
				tables,
				columns,
				setColumns,
				fetchDatabase,
				showAddTableModal,
				setShowAddTableModal,
				name,
				setName,
				loading,
				handleAddTable,
				columnsSchema,
				databaseInfo,
				setTables,
				selectedTable,
				setSelectedTable,
				handleUpdateTable,
				isUpdate,
				setIsUpdate,
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
