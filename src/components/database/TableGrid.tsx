/** @format */

import { Table } from "@/types/database";
import TableCard from "@/components/database/TableCard";
import { Database } from "lucide-react";

interface TableGridProps {
	tables: Table[];
}

export function TableGrid({ tables }: TableGridProps) {
	if (tables.length === 0) {
		return (
			<div className='text-center py-16'>
				<div className='p-4 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center'>
					<Database className='h-12 w-12 text-gray-400' />
				</div>
				<h3 className='text-xl font-semibold text-gray-700 mb-2'>
					No tables found
				</h3>
				<p className='text-gray-500'>Create your first table to get started</p>
			</div>
		);
	}

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
			{tables.map((table) => (
				<TableCard
					key={table.id}
					table={{
						id: table.id,
						name: table.name,
						columns: { create: table.columns },
						rows: { create: table.rows },
					}}
				/>
			))}
		</div>
	);
}
