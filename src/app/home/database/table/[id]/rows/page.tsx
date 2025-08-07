/** @format */

"use client";

import { TableLoadingState } from "@/components/ui/loading-states";
import TableEditor from "@/components/table/rows/TableEditor";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import TourProv from "@/contexts/TourProvider";
import useTable from "@/hooks/useTable";
import { useParams } from "next/navigation";
import { tourUtils } from "@/lib/tour-config";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;

	if (!id) return;

	const { table, columns, setColumns, rows, setRows, loading } = useTable(id);
	const { user } = useApp();
	const { selectedDatabase } = useDatabase();

	if (loading) return <TableLoadingState />;

	if (!selectedDatabase) {
		return (
			<div className='p-4 text-center'>
				<div className='text-red-500 mb-4'>No database selected</div>
				<p className='text-muted-foreground'>
					Please select a database from the dropdown to view this table.
				</p>
			</div>
		);
	}

	if (!table)
		return <div className='p-4 text-red-500'>Failed to load table.</div>;

	return (
		<TourProv
			steps={tourUtils.getRowsEditorTourSteps(true)} // Always show rows for now
			onTourComplete={() => {
				tourUtils.markTourSeen("rows-editor");
			}}
			onTourSkip={() => {
				tourUtils.markTourSeen("rows-editor");
			}}>
			<div className='h-full bg-background p-4'>
				<TableEditor
					table={table}
					columns={columns}
					setColumns={setColumns}
					rows={rows}
					setRows={setRows}
				/>
			</div>
		</TourProv>
	);
}

export default Page;
