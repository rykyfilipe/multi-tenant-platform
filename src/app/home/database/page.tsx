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
import { useTour } from "@reactour/tour";
import { Plus } from "lucide-react";
import { useEffect } from "react";
import { tourUtils } from "@/lib/tour-config";
import { TableTemplateSelector } from "@/components/database/TableTemplateSelector";

export const dynamic = "force-dynamic";

function Page() {
	return <DatabaseContent />;
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


	const { setIsOpen, setCurrentStep } = useTour();

	const startTour = () => {
		setCurrentStep(0);
		setIsOpen(true);
	};

	useEffect(() => {
		// Check if user is new or hasn't seen the tour
		const isNewUser = !localStorage.getItem("app-first-visit");
		const hasSeenTour = tourUtils.isTourSeen("database");

		if (isNewUser || !hasSeenTour) {
			// Mark first visit
			if (isNewUser) {
				localStorage.setItem("app-first-visit", "true");
			}

			// Start tour after a short delay to ensure elements are rendered
			const timer = setTimeout(() => {
				startTour();
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, []);

	return (
		<TourProv
			steps={tourUtils.getDatabaseTourSteps((tables?.length || 0) > 0)}
			onTourComplete={() => {
				tourUtils.markTourSeen("database");
			}}
			onTourSkip={() => {
				tourUtils.markTourSeen("database");
			}}>
			<div className='min-h-full bg-background'>
				{/* Header */}
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='px-3 sm:px-4 md:px-6 py-3 sm:py-4'>
						{/* Title and Description */}
						<div className='mb-4 sm:mb-0'>
							<h1 className='text-lg sm:text-xl font-semibold text-foreground'>
								Database
							</h1>
							<p className='text-xs sm:text-sm text-muted-foreground'>
								Manage your data tables and schemas
							</p>
						</div>

						{/* Database Selector */}
						<div className='mb-4 sm:mb-0'>
							<DatabaseSelector />
						</div>

						{/* Action Buttons */}
						{selectedDatabase && (
							<div className='flex flex-col sm:flex-row gap-2 sm:gap-3'>
								<div className='flex-1 sm:flex-none'>
									<TableTemplateSelector />
								</div>
								<Button
									onClick={() => setShowAddTableModal(true)}
									className='w-full sm:w-auto add-table-button'
									disabled={!selectedDatabase}>
									<Plus className='w-4 h-4 mr-2' />
									Add Table
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Main Content */}
				<div className='p-3 sm:p-4 md:p-6'>
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
		</TourProv>
	);
}
