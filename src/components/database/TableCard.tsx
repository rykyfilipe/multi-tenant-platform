/** @format */

import { Edit, Trash } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { useDatabase } from "@/contexts/DatabaseContext";
import Link from "next/link";
import { Table } from "@/types/database";
import { useApp } from "@/contexts/AppContext";

function TableCard({ table }: { table: Table }) {
	const { handleDeleteTable } = useDatabase();
	const { user } = useApp();
	return (
		<Card className='shadow-md hover:shadow-lg transition-shadow rounded-2xl'>
			<CardHeader className='pb-2'>
				<div className='w-full flex items-center justify-between'>
					<h2 className='text-xl font-semibold text-slate-800'>{table.name}</h2>
					<Link href={`/home/database/table/${table.id}/columns`}>
						{user.role !== "VIEWER" && (
							<Button
								variant='ghost'
								size='icon'
								className='hover:bg-slate-100 text-slate-600'>
								<Edit className='w-5 h-5' />
							</Button>
						)}
					</Link>
				</div>
			</CardHeader>

			<CardContent className='space-y-2 text-sm text-slate-600'>
				<p>
					<span className='font-medium text-slate-800'>Description: </span>
					{table.description}
				</p>
				<p>
					<span className='font-medium text-slate-800'>Columns: </span>
					{Array.isArray(table.columns) ? table.columns.length : 0}
				</p>
				<p>
					<span className='font-medium text-slate-800'>Rows: </span>
					{Array.isArray(table.rows) ? table.rows.length : 0}
				</p>
			</CardContent>

			<CardFooter
				className={`flex ${
					user.role === "VIEWER" ? "justify-end" : "justify-between"
				}   pt-4`}>
				<Link href={`/home/database/table/${table.id}/rows`}>
					<Button variant='outline' size='sm'>
						{user.role === "VIEWER" ? "View" : "Edit"} rows
					</Button>
				</Link>
				{user.role !== "VIEWER" && (
					<Button
						size='sm'
						variant='destructive'
						onClick={() => handleDeleteTable(table?.id.toString())}
						className='bg-red-500 hover:bg-red-600 text-white'>
						<Trash className='w-4 h-4' />
					</Button>
				)}
			</CardFooter>
		</Card>
	);
}

export default TableCard;
