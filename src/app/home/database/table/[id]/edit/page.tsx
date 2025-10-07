/** @format */

"use client";

import { TableLoadingState } from "@/components/ui/loading-states";
import { useDatabase } from "@/contexts/DatabaseContext";
import TourProv from "@/contexts/TourProvider";
import useTable from "@/hooks/useTable";
import { useParams } from "next/navigation";
import { tourUtils } from "@/lib/tour-config";
import { TableEditorRedesigned } from "@/components/table/editor-v2/TableEditorRedesigned";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;

	const { table, columns, setColumns, loading, refreshTable } = useTable(!id ? "" : id);
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
			steps={tourUtils.getUnifiedTableEditorTourSteps(true)}
			onTourComplete={() => {
				tourUtils.markTourSeen("unified-table-editor");
			}}
			onTourSkip={() => {
				tourUtils.markTourSeen("unified-table-editor");
			}}>
			<div className='h-full bg-background'>
				<TableEditorRedesigned 
					table={table} 
					columns={columns} 
					setColumns={setColumns} 
					refreshTable={refreshTable} 
				/>
			</div>
		</TourProv>
	);
}

export default Page;
