/** @format */

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Loader2,
	Search,
	Plus,
	Edit,
	Trash2,
	Download,
	Key,
	Globe,
} from "lucide-react";

interface TableData {
	id: number;
	name: string;
	description: string | null;
	database: { id: number; name: string };
}

interface ColumnData {
	id: number;
	name: string;
	type: string;
	required: boolean;
	primary: boolean;
}

interface RowData {
	id: number;
	[key: string]: any;
	createdAt: string;
	updatedAt: string;
}

export default function SimpleApiConsumer() {
	const [apiToken, setApiToken] = useState("");
	const [baseUrl, setBaseUrl] = useState("");
	const [isConfigured, setIsConfigured] = useState(false);
	const [tables, setTables] = useState<TableData[]>([]);
	const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
	const [columns, setColumns] = useState<ColumnData[]>([]);
	const [rows, setRows] = useState<RowData[]>([]);
	const [loading, setLoading] = useState(false);
	const [showAddForm, setShowAddForm] = useState(false);
	const [formData, setFormData] = useState<Record<string, any>>({});
	const [searchTerm, setSearchTerm] = useState("");
	const [searchColumn, setSearchColumn] = useState("");

	const headers = {
		Authorization: `Bearer ${apiToken}`,
		"Content-Type": "application/json",
	};

	const testConnection = async () => {
		if (!apiToken.trim()) return;

		setLoading(true);
		try {
			const response = await fetch(`${baseUrl || ""}/api/public/tables`, {
				headers,
			});
			if (response.ok) {
				setIsConfigured(true);
				fetchTables();
			}
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	const fetchTables = async () => {
		try {
			const response = await fetch(`${baseUrl || ""}/api/public/tables`, {
				headers,
			});
			const result = await response.json();
			if (result.success) setTables(result.data);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchTableDetails = async (tableId: number) => {
		try {
			const response = await fetch(
				`${baseUrl || ""}/api/public/tables/${tableId}`,
				{ headers },
			);
			const result = await response.json();
			if (result.success) setColumns(result.data.columns);
		} catch (err) {
			console.error(err);
		}
	};

	const fetchRows = async (tableId: number) => {
		try {
			const response = await fetch(
				`${baseUrl || ""}/api/public/tables/${tableId}/rows`,
				{ headers },
			);
			const result = await response.json();
			if (result.success) setRows(result.data);
		} catch (err) {
			console.error(err);
		}
	};

	const handleTableSelect = (table: TableData) => {
		setSelectedTable(table);
		fetchTableDetails(table.id);
		fetchRows(table.id);
	};

	const handleAddRow = async () => {
		if (!selectedTable) return;

		try {
			const response = await fetch(
				`${baseUrl || ""}/api/public/tables/${selectedTable.id}/rows`,
				{
					method: "POST",
					headers,
					body: JSON.stringify({ data: formData }),
				},
			);

			if (response.ok) {
				setShowAddForm(false);
				setFormData({});
				fetchRows(selectedTable.id);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleDeleteRow = async (rowId: number) => {
		if (!selectedTable || !confirm("Delete this row?")) return;

		try {
			const response = await fetch(
				`${baseUrl || ""}/api/public/tables/${selectedTable.id}/rows/${rowId}`,
				{
					method: "DELETE",
					headers,
				},
			);

			if (response.ok) {
				fetchRows(selectedTable.id);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleSearch = () => {
		if (!searchTerm || !searchColumn) return;
		// Implement search logic here
	};

	const handleExport = () => {
		if (!rows.length) return;

		const csvContent = [
			Object.keys(rows[0]).join(","),
			...rows.map((row) =>
				Object.values(row)
					.map((value) => `"${value}"`)
					.join(","),
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${selectedTable?.name || "table"}_data.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	if (!isConfigured) {
		return (
			<div className='max-w-2xl mx-auto p-6'>
				<div className='text-center mb-8'>
					<h1 className='text-3xl font-bold mb-2'>Public API Consumer</h1>
					<p className='text-muted-foreground'>
						Connect to your multi-tenant platform's public API
					</p>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className='flex items-center gap-2'>
							<Key className='h-5 w-5' />
							API Configuration
						</CardTitle>
						<CardDescription>
							Enter your API token and base URL to start
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div>
							<Label htmlFor='baseUrl'>Base URL (Optional)</Label>
							<div className='flex items-center gap-2 mt-1'>
								<Globe className='h-4 w-4 text-muted-foreground' />
								<Input
									id='baseUrl'
									placeholder='https://your-domain.com (leave empty for current domain)'
									value={baseUrl}
									onChange={(e) => setBaseUrl(e.target.value)}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor='apiToken'>API Token *</Label>
							<Input
								id='apiToken'
								type='password'
								placeholder='Enter your JWT API token'
								value={apiToken}
								onChange={(e) => setApiToken(e.target.value)}
								className='mt-1'
							/>
						</div>

						<Button
							onClick={testConnection}
							disabled={!apiToken.trim() || loading}
							className='w-full'>
							{loading ? (
								<>
									<Loader2 className='h-4 w-4 animate-spin mr-2' />
									Testing Connection...
								</>
							) : (
								"Connect to API"
							)}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-3xl font-bold'>Public API Consumer</h1>
					<p className='text-muted-foreground'>
						Interact with your public tables through the API
					</p>
				</div>
				<Button variant='outline' onClick={() => setIsConfigured(false)}>
					<Key className='h-4 w-4 mr-2' />
					Change Configuration
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Available Tables</CardTitle>
					<CardDescription>
						Select a table to view and manage its data
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{tables.map((table) => (
							<Card
								key={table.id}
								className={`cursor-pointer transition-all hover:shadow-md ${
									selectedTable?.id === table.id ? "ring-2 ring-primary" : ""
								}`}
								onClick={() => handleTableSelect(table)}>
								<CardContent className='p-4'>
									<h3 className='font-semibold text-lg'>{table.name}</h3>
									<p className='text-sm text-muted-foreground'>
										{table.description || "No description"}
									</p>
									<Badge variant='secondary' className='mt-2'>
										{table.database.name}
									</Badge>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>

			{selectedTable && (
				<Card>
					<CardHeader>
						<div className='flex items-center justify-between'>
							<div>
								<CardTitle>{selectedTable.name}</CardTitle>
								<CardDescription>
									{selectedTable.description || "No description"} •{" "}
									{rows.length} rows
								</CardDescription>
							</div>
							<div className='flex gap-2'>
								<Button onClick={() => setShowAddForm(true)}>
									<Plus className='h-4 w-4 mr-2' />
									Add Row
								</Button>
								<Button variant='outline' onClick={handleExport}>
									<Download className='h-4 w-4 mr-2' />
									Export
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className='mb-6'>
							<Label>Search</Label>
							<div className='flex gap-2 mt-1'>
								<Select value={searchColumn} onValueChange={setSearchColumn}>
									<SelectTrigger className='w-32'>
										<SelectValue placeholder='Column' />
									</SelectTrigger>
									<SelectContent>
										{columns.map((column) => (
											<SelectItem key={column.id} value={column.name}>
												{column.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Input
									placeholder='Search term...'
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className='flex-1'
								/>
								<Button onClick={handleSearch}>
									<Search className='h-4 w-4 mr-2' />
									Search
								</Button>
							</div>
						</div>

						<div className='rounded-md border'>
							<Table>
								<TableHeader>
									<TableRow>
										{columns.map((column) => (
											<TableHead key={column.id}>
												<div className='flex items-center gap-2'>
													{column.name}
													{column.primary && (
														<Badge variant='outline' className='text-xs'>
															PK
														</Badge>
													)}
													{column.required && (
														<Badge variant='secondary' className='text-xs'>
															Required
														</Badge>
													)}
												</div>
											</TableHead>
										))}
										<TableHead>Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{rows.map((row) => (
										<TableRow key={row.id}>
											{columns.map((column) => (
												<TableCell key={column.id}>
													{column.type === "boolean" ? (
														<Badge
															variant={
																row[column.name] ? "default" : "secondary"
															}>
															{row[column.name] ? "Yes" : "No"}
														</Badge>
													) : column.type === "date" ? (
														new Date(row[column.name]).toLocaleDateString()
													) : (
														String(row[column.name] || "")
													)}
												</TableCell>
											))}
											<TableCell>
												<div className='flex gap-2'>
													<Button
														variant='ghost'
														size='sm'
														onClick={() => handleDeleteRow(row.id)}>
														<Trash2 className='h-4 w-4' />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</CardContent>
				</Card>
			)}

			<Dialog open={showAddForm} onOpenChange={setShowAddForm}>
				<DialogContent className='max-w-2xl'>
					<DialogHeader>
						<DialogTitle>Add New Row</DialogTitle>
						<DialogDescription>
							Fill in the form to add a new row to {selectedTable?.name}
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-4'>
						{columns
							.filter((column) => !column.primary)
							.map((column) => (
								<div key={column.id}>
									<Label htmlFor={column.name}>
										{column.name}
										{column.required && (
											<span className='text-red-500 ml-1'>*</span>
										)}
									</Label>
									<Input
										id={column.name}
										value={formData[column.name] || ""}
										onChange={(e) =>
											setFormData({
												...formData,
												[column.name]: e.target.value,
											})
										}
										placeholder={`Enter ${column.name}`}
									/>
								</div>
							))}
					</div>
					<div className='flex justify-end gap-2 mt-6'>
						<Button variant='outline' onClick={() => setShowAddForm(false)}>
							Cancel
						</Button>
						<Button onClick={handleAddRow}>Add Row</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
