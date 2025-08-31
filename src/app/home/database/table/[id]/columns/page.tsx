/** @format */

"use client";

import { TableLoadingState } from "@/components/ui/loading-states";
import TableEditor from "@/components/table/columns/TableEditor";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import TourProv from "@/contexts/TourProvider";
import useTable from "@/hooks/useTable";
import { useParams } from "next/navigation";
import { tourUtils } from "@/lib/tour-config";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;

	const { table, columns, setColumns, loading } = useTable(id);
	const { selectedDatabase } = useDatabase();

	if (!id) return null;

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
			steps={tourUtils.getColumnsEditorTourSteps(true)} // Always show columns for now
			onTourComplete={() => {
				tourUtils.markTourSeen("columns-editor");
			}}
			onTourSkip={() => {
				tourUtils.markTourSeen("columns-editor");
			}}>
			<div className='h-full bg-background p-4'>
				<TableEditor table={table} columns={columns} setColumns={setColumns} />
			</div>
		</TourProv>
	);
}

export default Page;
