/** @format */

"use client";

import Loading from "@/components/loading";
import TableEditor from "@/components/table/rows/TableEditor";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import useTable from "@/hooks/useTable";
import Link from "next/link";
import { useParams } from "next/navigation";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	if (!id) return;

	const { table, columns, setColumns, rows, setRows, loading } = useTable(id);
	const { user } = useApp();

	if (loading) return <Loading message='table' />;

	if (!table)
		return <div className='p-4 text-red-500'>Failed to load table.</div>;

	return (
		<div className='max-w-7xl mx-auto p-6 bg-white shadow-md rounded-lg'>
			<h1 className='text-2xl font-bold mb-2'>{table.name}</h1>
			<Link
				href={`/home/database/table/${table.id}/columns`}
				className='absolute right-6 top-6'>
				{user.role !== "VIEWER" && (
					<Button variant='outline' size='sm'>
						Edit columns
					</Button>
				)}
			</Link>
			<TableEditor
				table={table}
				columns={columns}
				setColumns={setColumns}
				rows={rows}
				setRows={setRows}
			/>
		</div>
	);
}

export default Page;
