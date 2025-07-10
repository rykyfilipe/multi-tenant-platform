/** @format */

import { Delete, Edit, Edit2Icon, Edit3Icon, Trash } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useApp } from "@/contexts/AppContext";
import Link from "next/link";
import { Table } from "@/types/database";

function TableCard({ table }: { table: Table }) {
	const {
		tables,
		setTables,
		setColumns,
		setName,
		setShowAddTableModal,
		setIsUpdate,
		setSelectedTable,
		handleDeleteTable,
	} = useDatabase();
	const { showAlert } = useApp();

	const editTable = async () => {
		setName(table.name);
		setColumns(table.columns);
		setShowAddTableModal(true);
		setIsUpdate(true);
		setSelectedTable(table);
	};
	return (
		<Card>
			<CardHeader>
				<div className='w-full flex items-center justify-between'>
					<h2 className='text-lg font-semibold'>{table.name}</h2>
					<Button
						className='bg-transparent text-black shadow-none hover:bg-gray-200 max-w-min'
						onClick={editTable}>
						<Edit />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className='space-y-2'>
					<p className='text-sm text-gray-600'>ID: {table.id}</p>
					<p className='text-sm text-gray-600'>
						Columns: {Array.isArray(table.columns) ? table.columns.length : 0}
					</p>
					<p className='text-sm text-gray-600'>
						Rows: {Array.isArray(table.rows) ? table.rows.length : 0}
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
					onClick={() => handleDeleteTable(table?.id)}>
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
