/** @format */

"use client";

import { FormEvent, useState } from "react";
import { Column, Row, Table } from "@/types/database";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { useApp } from "@/contexts/AppContext";

interface Props {
	columns: Column[];
	onAdd: (row: Row) => void;
	rows: Row[];
	setRows: (rows: Row[]) => void;
	table: Table;
}

export function AddRowForm({ columns, onAdd, rows, setRows, table }: Props) {
	const [newRow, setNewRow] = useState<Record<string, any>>({});
	const [rowId, setRowId] = useState(1);
	const { showAlert, token, user } = useApp();

	function validate(newRow: Record<string, any>) {
		for (const col of columns) {
			const rowData = newRow[col.name];

			if (
				col.required &&
				(!rowData || rowData.toString().trim() === "" || rowData === undefined)
			) {
				showAlert(`Field ${col.name}' is required`, "error");
				return false;
			}
			if (
				col.unique &&
				rows.some((row) => {
					const storedValue = row.data[col.name];
					switch (col.type) {
						case "number":
							return Number(storedValue) === Number(rowData);
						case "boolean":
							return (
								Boolean(storedValue) ===
								(rowData === "true" || rowData === true)
							);
						case "date":
							return (
								new Date(storedValue).toISOString() ===
								new Date(rowData).toISOString()
							);
						default:
							return storedValue === rowData;
					}
				})
			) {
				showAlert(`Field '${col.name}' must be unique`, "error");
				return false;
			}

			if (
				col.autoIncrement &&
				(rowData === undefined ||
					rowData.toString().trim() === "" ||
					rowData < 0)
			) {
				newRow[col.name] = rowId;
				setRowId(rowId + 1);
			}

			if (!rowData || rowData.toString().trim() === "") {
				continue;
			}

			if (col.type === "number" && isNaN(Number(rowData))) {
				showAlert(`Field '${col.name}' must be a number`, "error");
				return false;
			}

			if (
				col.defaultValue &&
				(rowData === undefined || rowData.toString().trim() === "")
			) {
				newRow[col.name] = col.defaultValue;
			}

			if (
				col.type === "boolean" &&
				!["true", "false"].includes(rowData.toString().toLowerCase())
			) {
				showAlert(`Field '${col.name}' must be true or false`, "error");
				return false;
			}

			if (col.type === "date" && isNaN(Date.parse(rowData))) {
				showAlert(`Field '${col.name}' must be a valid date`, "error");
				return false;
			}
		}

		return true;
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		if (!validate(newRow)) return;

		// Convert types properly
		const processedData: Record<string, any> = {};
		columns.forEach((col) => {
			const value = newRow[col.name];
			if (value !== undefined && value !== null && value !== "") {
				switch (col.type) {
					case "number":
						processedData[col.name] = Number(value);
						break;
					case "boolean":
						processedData[col.name] = value === "true";
						break;
					case "date":
						processedData[col.name] = new Date(value).toISOString();
						break;
					default:
						processedData[col.name] = value;
				}
			} else if (col.defaultValue) {
				processedData[col.name] = col.defaultValue;
			}
		});

		const row: Row = {
			id: rowId,
			data: processedData,
		};
		console.log(row);
		if (!token) return console.error("No token available");

		try {
			const response = await fetch(
				`/api/tenant/${user.tenantId}/database/table/${table.id}/rows`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ row }),
				},
			);
			if (!response.ok) throw new Error("Failed to add row");

			showAlert("Row added succesfuly", "success");

			setRows([...rows, row]);
			setRowId(rowId + 1);
			setNewRow({});
		} catch (error) {
			showAlert("Error at adding a row", "error");
		}
	}

	return (
		<Card className='shadow-lg'>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<CardTitle className='text-xl'>Create New Row</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{columns.map((col) => (
							<div key={col.name}>
								<Label>
									{col.name}
									{col.required && " *"}
								</Label>
								{col.type === "boolean" ? (
									<Select
										value={newRow[col.name] ?? ""}
										onValueChange={(val) =>
											setNewRow({ ...newRow, [col.name]: val })
										}>
										<SelectTrigger>
											<SelectValue placeholder='Select' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='true'>True</SelectItem>
											<SelectItem value='false'>False</SelectItem>
										</SelectContent>
									</Select>
								) : (
									<Input
										type={
											col.type === "date"
												? "date"
												: col.type === "number"
												? "number"
												: "text"
										}
										value={newRow[col.name] ?? ""}
										onChange={(e) =>
											setNewRow({ ...newRow, [col.name]: e.target.value })
										}
										placeholder={`Enter ${col.name}`}
										required={col.required}
									/>
								)}
							</div>
						))}
					</div>
					<div className='flex justify-end'>
						<Button type='submit'>Add Row</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
