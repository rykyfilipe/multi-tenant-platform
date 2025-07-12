/** @format */

"use client";

import TableEditor from "@/components/table/rows/TableEditor";
import { useApp } from "@/contexts/AppContext";
import useTable from "@/hooks/useTable";
import { Table } from "@/types/database";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	if (!id) return;

	const { table, columns, setColumns, rows, setRows, loading } = useTable(id);

	if (loading)
		return (
			<div className='p-4 text-gray-600 animate-pulse'>Loading table...</div>
		);

	if (!table)
		return <div className='p-4 text-red-500'>Failed to load table.</div>;

	return (
		<div className='max-w-7xl mx-auto p-6 bg-white shadow-md rounded-lg'>
			<h1 className='text-2xl font-bold mb-2'>{table.name}</h1>

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
