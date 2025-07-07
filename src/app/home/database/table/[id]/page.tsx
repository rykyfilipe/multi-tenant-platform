/** @format */

"use client";

import { useApp } from "@/contexts/AppContext";
import { Table } from "@/types/database";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function Page() {
	const params = useParams();
	const id = params.id;

	const { token } = useApp();

	const [table, setTable] = useState<Table | null>(null);

	useEffect(() => {
		if (!id) return;
		const fetchTable = async () => {
			try {
				const res = await fetch(`/api/tenant/database/table/${id}`, {
					method: "GET",
					headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
				});
				if (!res.ok) throw new Error("Failed to fetch table");
				const data = await res.json();
				setTable(data);
			} catch (err) {
				console.error(err);
			}
		};

		fetchTable();
	}, [id]);

	if (!table) return <div className='p-4'>Loading...</div>;

	return (
		<div className='max-w-7xl mx-auto p-6 bg-white shadow-md rounded-lg'>
			<h1 className='text-2xl font-bold mb-4'>{table.name}</h1>
			<p className='text-gray-600 mb-2'>ID: {table.id}</p>
			<p className='text-gray-600 mb-4'>
				Description: {table.description || "No description available."}
			</p>

			<h2 className='text-xl font-semibold mb-2'>Columns</h2>
			<ul className='list-disc pl-5'>
				{table.columns?.create.map((column, index) => (
					<li key={index} className='text-sm text-gray-700 border p-2 rounded'>
						{Object.entries(column).map(([key, value]) => (
							<p key={key}>
								<span className='font-medium'>{key}:</span> {String(value)}
							</p>
						))}
					</li>
				))}
			</ul>

			<h2 className='text-xl font-semibold mt-6 mb-2'>Rows</h2>
			{table.rows?.length > 0 ? (
				<ul className='list-disc pl-5'>
					{table.rows.map((row, index) => (
						<li key={index} className='mb-1'>
							{JSON.stringify(row)}
						</li>
					))}
				</ul>
			) : (
				<p className='text-gray-500'>No rows available.</p>
			)}
		</div>
	);
}

export default Page;
