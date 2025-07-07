/** @format */

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Table, Column, ColumnSchema } from "@/types/database";

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
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(
	undefined,
);

export const DatabaseProvider = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const [token, setToken] = useState<string | null>(null);
	const [databaseInfo, setDatabaseInfo] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [tables, setTables] = useState<Table[]>([]);
	const [columns, setColumns] = useState<Column[]>([]);
	const [showAddTableModal, setShowAddTableModal] = useState(false);
	const [name, setName] = useState("");

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
		const storedToken = localStorage.getItem("token");
		if (!storedToken) return;
		setToken(storedToken);
		fetchDatabase(storedToken);
	}, []);

	const fetchDatabase = async (authToken: string) => {
		try {
			const response = await fetch("/api/tenant/database", {
				headers: { Authorization: `Bearer ${authToken}` },
			});
			if (!response.ok) throw new Error("Failed to fetch database");

			const data = await response.json();
			if (!data || !data.length) {
				setDatabaseInfo("No database found");
				setTables([]);
			} else {
				setDatabaseInfo(null);
				setTables(data[0]?.tables || []);
			}
		} catch (error) {
			console.error("Error fetching database:", error);
			setDatabaseInfo("Error loading database");
		}
	};

	const handleAddTable = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token) return console.error("No token available");
		if (!name || !columns.length)
			return console.error("Table name and columns are required");
		setLoading(true);

		try {
			const response = await fetch("/api/tenant/database/table", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ name, columns }),
			});
			if (!response.ok) throw new Error("Failed to add table");

			setShowAddTableModal(false);
			setName("");
			setColumns([]);
			fetchDatabase(token);
		} catch (error) {
			console.error("Error adding table:", error);
		} finally {
			setLoading(false);
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
