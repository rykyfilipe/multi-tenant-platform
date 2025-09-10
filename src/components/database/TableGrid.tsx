/** @format */

import { Table } from "@/types/database";
import { TableCard } from "@/components/database/TableCard";

interface TableGridProps {
	tables: Table[];
}

export function TableGrid({ tables }: TableGridProps) {
	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6'>
			{tables.map((table) => (
				<TableCard key={table.id} table={table} />
			))}
		</div>
	);
}
