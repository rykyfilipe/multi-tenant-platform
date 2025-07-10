/** @format */

"use client";

import { DatabaseHeader } from "@/components/database/DatabaseHeader";
import { TableGrid } from "@/components/database/TableGrid";
import { AddTableModal } from "@/components/database/AddTableModal";

import { DatabaseProvider, useDatabase } from "@/contexts/DatabaseContext";
import Loading from "@/components/loading";

export default function DatabasePage() {
	return (
		<DatabaseProvider>
			<DatabaseContent />
		</DatabaseProvider>
	);
}

function DatabaseContent() {
	const {
		tables,
		columns,
		setColumns,
		setIsUpdate,
		showAddTableModal,
		setShowAddTableModal,
		name,
		setName,
		handleAddTable,
		loading,
		columnsSchema,
		databaseInfo,
		selectedTable,
		setSelectedTable,
		isUpdate,
		handleUpdateTable,
	} = useDatabase();

	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-7xl mx-auto'>
				<DatabaseHeader onAddTable={() => setShowAddTableModal(true)} />
				{loading || tables === null ? (
					<Loading message='tables' />
				) : (
					<TableGrid tables={tables} />
				)}

				{databaseInfo && (
					<div className='text-center mt-8'>
						<p className='text-gray-600 text-lg'>{databaseInfo}</p>
					</div>
				)}

				<AddTableModal
					isOpen={showAddTableModal}
					onClose={() => {
						setShowAddTableModal(false);
						setSelectedTable(null);
						setColumns([
							{
								name: "id",
								type: "number",
								unique: true,
								primary: true,
								autoIncrement: true,
								defaultValue: "0",
								required: false,
							},
						]);
						setName("");
						setIsUpdate(false);
					}}
					name={name}
					setName={setName}
					columns={columns}
					setColumns={setColumns}
					columnsSchema={columnsSchema}
					onSubmit={isUpdate ? handleUpdateTable : handleAddTable}
					loading={loading}
					selectedTable={selectedTable}
					setSelectedTable={setSelectedTable}
				/>
			</div>
		</div>
	);
}
