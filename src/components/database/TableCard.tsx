/** @format */

import { Delete, Trash } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useApp } from "@/contexts/AppContext";
import Link from "next/link";

interface TableCardProps {
	table: {
		id: string;
		name: string;
		columns: {
			create: Array<{
				name: string;
				type: string;
				primary: boolean;
				autoIncrement: boolean;
				required: boolean;
				unique: boolean;
				defaultValue: string;
			}>;
		};
		rows: { create: Array<Record<string, any>> };
	};
}

function TableCard({ table }: TableCardProps) {
	const { tables, setTables } = useDatabase();
	const { showAlert } = useApp();
	const deleteTable = async () => {
		try {
			const response = await fetch(`/api/tenant/database/table/${table.id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${localStorage.getItem("token")}`,
				},
			});
			if (!response.ok) {
				throw new Error("Failed to delete table");
			}
			const updatedTables = tables.filter((t) => t.id !== table.id);
			setTables(updatedTables);

			showAlert("Table deleted successfully", "success");
		} catch (error) {
			console.error("Error deleting table:", error);
			showAlert("Failed to delete table", "error");
		}
	};
	return (
		<Card>
			<CardHeader>
				<h2 className='text-lg font-semibold'>{table.name}</h2>
			</CardHeader>
			<CardContent>
				<div className='space-y-2'>
					<p className='text-sm text-gray-600'>ID: {table.id}</p>
					<p className='text-sm text-gray-600'>
						Columns: {table.columns.create.create.length}
					</p>
					<p className='text-sm text-gray-600'>
						Rows: {table.rows.create.create.length}
					</p>
				</div>
			</CardContent>
			<CardFooter className='flex justify-between w-full'>
				<Button variant='outline' size='sm'>
					<Link href={`/home/database/table/${table.id}`}>View Details</Link>
				</Button>
				<Button
					className='bg-red-600 hover:bg-red-700 text-white'
					size='sm'
					onClick={deleteTable}>
					<Trash />
				</Button>
			</CardFooter>
		</Card>
	);
}

export default TableCard;

{
	/* <ul className='list-disc pl-5'>
						{table.columns?.create.map((column, index) => (
							<li
								key={index}
								className='text-sm text-gray-700 border p-2 rounded'>
								{Object.entries(column).map(([key, value]) => (
									<p key={key}>
										<span className='font-medium'>{key}:</span> {String(value)}
									</p>
								))}
							</li>
						))}
					</ul> */
}
