/** @format */

"use client";

import AddDatabaseForm from "@/components/database/AddDatabaseForm";
import AddTableModal from "@/components/database/AddTableModal";
import { DatabaseHeader } from "@/components/database/DatabaseHeader";
import { TableCardSkeletonAdaptive } from "@/components/database/LoadingState";
import { TableGrid } from "@/components/database/TableGrid";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { DatabaseProvider, useDatabase } from "@/contexts/DatabaseContext";
import TourProv from "@/contexts/TourProvider";
import Tour, { StepType, useTour } from "@reactour/tour";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
export const dynamic = "force-dynamic";

function Page() {
	const steps: StepType[] = [
		{
			selector: ".database-header",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Database Header</h3>
					<p>
						This is your database management center. Here you can view database
						information and perform main actions.
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
			selector: ".add-table-button",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Add New Table</h3>
					<p>
						Click this button to create a new table in your database. You can
						define columns, data types, and relationships.
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
			selector: ".table-grid",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Tables Overview</h3>
					<p>
						This grid displays all your database tables. You can view, edit, and
						manage each table from here.
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
			selector: ".table-card",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Tables Overview</h3>
					<p>This card shows information about each table.</p>
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
			selector: ".columns-button",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Tables Overview</h3>
					<p>This button will send you to a columns editor.</p>
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
			selector: ".rows-button",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Tables Overview</h3>
					<p>This button will send you to a rows editor.</p>
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
			selector: ".delete-table-button",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Tables Overview</h3>
					<p>This button will delete the specific table.</p>
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
		<DatabaseProvider>
			<TourProv steps={steps}>
				<DatabaseContent />
			</TourProv>
		</DatabaseProvider>
	);
}

export default Page;

function DatabaseContent() {
	const {
		tables,
		databaseInfo,
		showAddTableModal,
		setShowAddTableModal,
		name,
		setName,
		description,
		setDescription,
		handleAddTable,
		loading,
	} = useDatabase();

	const { user } = useApp();
	const [showForm, setShowForm] = useState(false);
	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		const seen = localStorage.getItem("database-tour-seen");
		if (!seen) {
			localStorage.setItem("database-tour-seen", "true");
			startTour();
		}
	}, [loading]);
	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-8xl mx-auto'>
				<div className='database-header'>
					<DatabaseHeader onAddTable={() => setShowAddTableModal(true)} />
				</div>

				{/* Loading state */}
				{loading && <TableCardSkeletonAdaptive />}

				{/* Tables grid */}
				{!loading && tables && (
					<div className='table-grid'>
						<TableGrid tables={tables} />
					</div>
				)}

				{/* No tables message */}
				{!loading && !tables && <p className='text-center'>No tables</p>}

				{/* No database available */}
				{!loading && databaseInfo === null && tables?.length === 0 && (
					<div className='flex flex-col items-center space-y-4'>
						<h1 className='text-xl font-semibold'>No database available</h1>
						<p className='text-gray-600'>Create a database to continue</p>
						<Button
							onClick={() => setShowForm(true)}
							className='flex gap-2 show-modal-button'
							disabled={user?.role !== "ADMIN"}>
							<Plus className='w-4 h-4' />
							Create database
						</Button>
					</div>
				)}

				{showForm && <AddDatabaseForm setShowForm={setShowForm} />}

				<AddTableModal
					isOpen={showAddTableModal}
					onClose={() => {
						setShowAddTableModal(false);
						setName("");
						setDescription("");
					}}
					name={name}
					setName={setName}
					description={description}
					setDescription={setDescription}
					onSubmit={handleAddTable}
					loading={loading}
				/>
			</div>
		</div>
	);
}
