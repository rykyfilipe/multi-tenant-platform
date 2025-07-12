/** @format */

import { Edit, Trash } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { useDatabase } from "@/contexts/DatabaseContext";
import Link from "next/link";
import { Table } from "@/types/database";
import { useRouter } from "next/navigation";

function TableCard({ table }: { table: Table }) {
	const { handleDeleteTable } = useDatabase();

	return (
		<Card>
			<CardHeader>
				<div className='w-full flex items-center justify-between'>
					<h2 className='text-lg font-semibold'>{table.name}</h2>
					<Button className='bg-transparent text-black shadow-none hover:bg-gray-200 max-w-min'>
						<Link href={`/home/database/table/${table.id}/columns`}>
							<Edit />
						</Link>
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
					<Link href={`/home/database/table/${table.id}/rows`}>View rows</Link>
				</Button>
				<Button
					className='bg-red-600 hover:bg-red-700 text-white'
					size='sm'
					onClick={() => handleDeleteTable(table?.id.toString())}>
					<Trash />
				</Button>
			</CardFooter>
		</Card>
	);
}

export default TableCard;
