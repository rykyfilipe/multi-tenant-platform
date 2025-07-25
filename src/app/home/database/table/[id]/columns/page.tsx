/** @format */

"use client";

import Loading from "@/components/loading";
import TableEditor from "@/components/table/columns/TableEditor";
import { useApp } from "@/contexts/AppContext";
import useTable from "@/hooks/useTable";
import { useParams } from "next/navigation";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;

	if (!id) return;

	const { table, columns, setColumns, loading } = useTable(id);
	const { user } = useApp();

	if (loading) return <Loading message='table' />;

	if (!table)
		return <div className='p-4 text-red-500'>Failed to load table.</div>;

	return (
		<div className='max-w-8xl mx-auto p-6 bg-white shadow-md rounded-lg'>
			<h1 className='text-2xl font-bold mb-2'>{table.name}</h1>

			<TableEditor columns={columns} setColumns={setColumns} table={table} />
		</div>
	);
}

export default Page;
