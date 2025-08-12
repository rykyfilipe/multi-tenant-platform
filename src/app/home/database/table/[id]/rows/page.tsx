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

	const { table, columns, setColumns, loading } = useTable(id);
	const { selectedDatabase } = useDatabase();

	if (loading) return <TableLoadingState />;

	if (!selectedDatabase || !table) {
		return (
			<div className='p-4 text-center'>
				<div className='flex items-center justify-center mb-4'>
					<div className='w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
				</div>
				<p className='text-muted-foreground'>Loading table data...</p>
			</div>
		);
	}

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
				<TableEditor table={table} columns={columns} setColumns={setColumns} />
			</div>
		</TourProv>
	);
}

export default Page;
