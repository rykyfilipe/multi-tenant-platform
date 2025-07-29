/** @format */

"use client";

import Loading from "@/components/loading";
import TableEditor from "@/components/table/columns/TableEditor";
import { useApp } from "@/contexts/AppContext";
import TourProv from "@/contexts/TourProvider";
import useTable from "@/hooks/useTable";
import { StepType } from "@reactour/tour";
import { useParams } from "next/navigation";

function Page() {
	const params = useParams();
	const id = Array.isArray(params.id) ? params.id[0] : params.id;

	if (!id) return;

	const { table, columns, setColumns, loading } = useTable(id);
	const { user } = useApp();

	if (loading) return <Loading message='table' />;

	if (!table)
		return <div className='p-4 text-red-500'>Failed to load table.</div>;
	const steps: StepType[] = [
		{
			selector: ".add-column-button",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>New column button</h3>
					<p>
						Click this button to activate the modal for adding a new column.
					</p>
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
			selector: ".rows-button",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Rows Editor</h3>
					<p>Click this button to manage table's rows</p>
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
					<h3 className='text-lg font-semibold mb-2'>Columns Editor</h3>
					<p>
						This area displays all your table columns. You can view, edit, and
						manage each column.
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
			selector: ".column-row",
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
			<div className='max-w-8xl mx-auto p-6 bg-white shadow-md rounded-lg'>
				<h1 className='text-2xl font-bold mb-2'>{table.name}</h1>

				<TableEditor columns={columns} setColumns={setColumns} table={table} />
			</div>
		</TourProv>
	);
}

export default Page;
