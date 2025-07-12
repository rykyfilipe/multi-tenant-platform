/** @format */

"use client";

import TableEditor from "@/components/table/rows/TableEditor";
import { useApp } from "@/contexts/AppContext";
import { Table } from "@/types/database";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;

	const { token, user } = useApp();
	const [table, setTable] = useState<Table | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTable = async () => {
			if (!id || !user?.tenantId || !token) return;

			try {
				const res = await fetch(
					`/api/tenant/${user.tenantId}/database/table/${id}`,
					{
						method: "GET",
						headers: { Authorization: `Bearer ${token}` },
					},
				);
				if (!res.ok) throw new Error("Failed to fetch table");
				const data = await res.json();
				setTable(data);
			} catch (err) {
				console.error("Error fetching table:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchTable();
	}, [id, token, user]);

	if (loading)
		return (
			<div className='p-4 text-gray-600 animate-pulse'>Loading table...</div>
		);

	if (!table)
		return <div className='p-4 text-red-500'>Failed to load table.</div>;

	return (
		<div className='max-w-7xl mx-auto p-6 bg-white shadow-md rounded-lg'>
			<h1 className='text-2xl font-bold mb-2'>{table.name}</h1>
			{/*<p className='text-sm text-gray-500 mb-4'>ID: {table.id}</p>
			 
			<h2 className='text-lg font-semibold mb-2'>Columns</h2>
			<ul className='grid gap-3'>
				{table.columns?.create?.map((column, index) => (
					<li key={index} className='border rounded p-3 text-sm bg-gray-50'>
						{Object.entries(column).map(([key, value]) => (
							<div key={key} className='flex justify-between'>
								<span className='font-medium text-gray-700'>{key}</span>
								<span className='text-gray-900'>{String(value)}</span>
							</div>
						))}
					</li>
				))}
			</ul> */}

			<TableEditor table={table} />
		</div>
	);
}

export default Page;
