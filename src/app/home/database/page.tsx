/** @format */

"use client";

import AddDatabaseForm from "@/components/database/AddDatabaseForm";
import { AddTableModal } from "@/components/database/AddTableModal";
import { DatabaseHeader } from "@/components/database/DatabaseHeader";
import { TableGrid } from "@/components/database/TableGrid";
import Loading from "@/components/loading";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Button } from "@/components/ui/button";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Plus } from "lucide-react";
import { useState } from "react";
export const dynamic = "force-dynamic";

export default function DatabaseContent() {
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

	const steps = [
		{
			selector: ".add-table-button",
			content: "Apasă acest buton pentru a adauga o tabela noua!",
		},
		{
			selector: ".table-name-input",
			content: "Completează aici numele tabelei!",
		},
		{
			selector: ".table-description-input",
			content: "Completează aici descrierea tabelei!",
		},
		{
			selector: ".submit-table-data",
			content: "Aici finalizezi totul.",
		},
	];

	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-7xl mx-auto'>
				<OnboardingTour steps={steps} tourKey='database'>
					<DatabaseHeader onAddTable={() => setShowAddTableModal(true)} />

					{/* ✅ Loading este afișat chiar dacă `tables` e null */}
					{loading && <Loading message='database' />}

					{/* ⛔️ Mută verificarea `!tables` mai jos */}
					{!loading && tables && <TableGrid tables={tables} />}

					{!loading && databaseInfo === null && tables?.length === 0 && (
						<div className='flex flex-col items-center space-y-4'>
							<h1 className='text-xl font-semibold'>No database available</h1>
							<p className='text-gray-600'>Create a database to continue</p>
							<Button
								onClick={() => setShowForm(true)}
								className='flex gap-2'
								disabled={user?.role !== "ADMIN"}>
								<Plus className='w-4 h-4' />
								Create databse
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
				</OnboardingTour>
				;
			</div>
		</div>
	);
}
