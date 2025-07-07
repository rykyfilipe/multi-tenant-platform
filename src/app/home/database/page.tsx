/** @format */

"use client";

import { DatabaseHeader } from "@/components/database/DatabaseHeader";
import { TableGrid } from "@/components/database/TableGrid";
import { AddTableModal } from "@/components/database/AddTableModal";

import { DatabaseProvider, useDatabase } from "@/contexts/DatabaseContext";

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
		showAddTableModal,
		setShowAddTableModal,
		name,
		setName,
		handleAddTable,
		loading,
		columnsSchema,
		databaseInfo,
	} = useDatabase();

	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-7xl mx-auto'>
				<DatabaseHeader onAddTable={() => setShowAddTableModal(true)} />
				<TableGrid tables={tables} />

				{databaseInfo && (
					<div className='text-center mt-8'>
						<p className='text-gray-600 text-lg'>{databaseInfo}</p>
					</div>
				)}

				<AddTableModal
					isOpen={showAddTableModal}
					onClose={() => setShowAddTableModal(false)}
					name={name}
					setName={setName}
					columns={columns}
					setColumns={setColumns}
					columnsSchema={columnsSchema}
					onSubmit={handleAddTable}
					loading={loading}
				/>
			</div>
		</div>
	);
}
