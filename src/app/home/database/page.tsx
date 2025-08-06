/** @format */

"use client";

import AddTableModal from "@/components/database/AddTableModal";
import { DatabaseLoadingState } from "@/components/ui/loading-states";
import { TableGrid } from "@/components/database/TableGrid";
import DatabaseSelector from "@/components/database/DatabaseSelector";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import TourProv from "@/contexts/TourProvider";
import Tour, { StepType, useTour } from "@reactour/tour";
import { Plus } from "lucide-react";
import { useEffect } from "react";
export const dynamic = "force-dynamic";

function Page() {
	const steps: StepType[] = [
		{
			selector: ".database-selector",
			content: (
				<div>
					<h3 className='text-lg font-semibold mb-2'>Database Selection</h3>
					<p>
						Select which database you want to work with. You can create multiple
						databases and switch between them.
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
						Click this button to create a new table in your selected database.
						You can define columns, data types, and relationships.
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
						This grid displays all tables in your selected database. You can
						view, edit, and manage each table from here.
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
					<h3 className='text-lg font-semibold mb-2'>Table Card</h3>
					<p>This card shows information about each table in your database.</p>
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
					<h3 className='text-lg font-semibold mb-2'>Manage Columns</h3>
					<p>This button will take you to the columns editor for this table.</p>
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
					<h3 className='text-lg font-semibold mb-2'>Manage Rows</h3>
					<p>This button will take you to the rows editor for this table.</p>
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
					<h3 className='text-lg font-semibold mb-2'>Delete Table</h3>
					<p>This button will delete the specific table. Use with caution!</p>
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
			<DatabaseContent />
		</TourProv>
	);
}

export default Page;

function DatabaseContent() {
	const {
		tables,
		selectedDatabase,
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
	}, []);

	return (
		<div className='h-full bg-background'>
			{/* Header */}
			<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
				<div className='flex items-center justify-between px-6 py-4'>
					<div className='flex items-center gap-4'>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								Database
							</h1>
							<p className='text-sm text-muted-foreground'>
								Manage your data tables and schemas
							</p>
						</div>
						<div className='database-selector'>
							<DatabaseSelector />
						</div>
					</div>
					<div className='flex items-center space-x-3'>
						{selectedDatabase && (
							<Button
								onClick={() => setShowAddTableModal(true)}
								className='add-table-button'
								disabled={!selectedDatabase}>
								<Plus className='w-4 h-4 mr-2' />
								Add Table
							</Button>
						)}
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-6'>
				<div className='max-w-7xl mx-auto'>
					{/* Loading state */}
					{loading && <DatabaseLoadingState />}

					{/* Selected database info */}
					{!loading && selectedDatabase && (
						<div className='mb-6 p-4 bg-card rounded-lg border'>
							<h2 className='text-lg font-semibold text-foreground mb-2'>
								{selectedDatabase.name}
							</h2>
							<p className='text-sm text-muted-foreground'>
								Created on{" "}
								{new Date(selectedDatabase.createdAt).toLocaleDateString()}
							</p>
						</div>
					)}

					{/* Tables grid or No tables message */}
					{!loading && selectedDatabase && tables && (
						<>
							{tables.length > 0 ? (
								<div className='table-grid space-y-6'>
									<TableGrid tables={tables} />
								</div>
							) : (
								<div className='text-center py-12'>
									<div className='max-w-md mx-auto'>
										<div className='w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4'>
											<Plus className='w-8 h-8 text-muted-foreground' />
										</div>
										<h3 className='text-lg font-semibold text-foreground mb-2'>
											No tables yet
										</h3>
										<p className='text-muted-foreground mb-6'>
											Create your first table in "{selectedDatabase.name}" to
											start managing your data
										</p>
										<Button
											onClick={() => setShowAddTableModal(true)}
											className='add-table-button'>
											<Plus className='w-4 h-4 mr-2' />
											Create First Table
										</Button>
									</div>
								</div>
							)}
						</>
					)}

					{/* No database selected */}
					{!loading && !selectedDatabase && (
						<div className='text-center py-12'>
							<div className='max-w-md mx-auto'>
								<div className='w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4'>
									<Plus className='w-8 h-8 text-muted-foreground' />
								</div>
								<h3 className='text-lg font-semibold text-foreground mb-2'>
									Select a Database
								</h3>
								<p className='text-muted-foreground mb-6'>
									Choose a database from the dropdown above to start managing
									your tables
								</p>
							</div>
						</div>
					)}

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
		</div>
	);
}
