/** @format */

"use client";

import { TableLoadingState } from "@/components/ui/loading-states";
import TableEditor from "@/components/table/rows/TableEditor";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import TourProv from "@/contexts/TourProvider";
import useTable from "@/hooks/useTable";
import { StepType } from "@reactour/tour";
import { useParams } from "next/navigation";

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

	const steps: StepType[] = [
		{
			selector: ".add-row-button",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Add Row Button</h3>
					<p>Click this button to add a new row to the table.</p>
				</div>
			),
			position: "bottom",
			styles: {
				popover: (base) => ({
					...base,
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
				}),
			},
		},
		{
			selector: ".columns-button",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Columns Editor</h3>
					<p>Click this button to manage table's columns</p>
				</div>
			),
			position: "top",
			styles: {
				popover: (base) => ({
					...base,
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
				}),
			},
		},
		{
			selector: ".table-content",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Rows Editor</h3>
					<p>
						This area displays all your table rows. You can view, edit, and
						manage each row.
					</p>
				</div>
			),
			position: "top",
			styles: {
				popover: (base) => ({
					...base,
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
				}),
			},
		},
		{
			selector: ".row-row",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Editable row</h3>
					<p>You can edit each cell by double click over it</p>
				</div>
			),
			position: "top",
			styles: {
				popover: (base) => ({
					...base,
					borderRadius: "12px",
					boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
				}),
			},
		},
	];

	return (
		<TourProv steps={steps}>
			<div className='h-full bg-background'>
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
