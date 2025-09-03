/** @format */

"use client";

// TableLoadingState nu mai este folosit - TableEditor gestionează skeleton-ul
import TableEditor from "@/components/table/rows/TableEditor";
// useApp nu mai este folosit aici
// useDatabase nu mai este folosit aici
import TourProv from "@/contexts/TourProvider";
import useTable from "@/hooks/useTable";
import { useParams } from "next/navigation";
import { tourUtils } from "@/lib/tour-config";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;
	const { table, columns, setColumns } = useTable(id || "");

	if (!id) return null;

	// Eliminăm loading-urile suplimentare - TableEditor gestionează totul cu skeleton

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
