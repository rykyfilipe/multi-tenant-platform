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

export function DatabaseContent() {
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
				{/* Mobile-First Header */}
				<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
					<div className='px-4 py-4'>
						{/* Mobile Header Layout */}
						<div className='space-y-4'>
							{/* Title and Description */}
							<div>
								<h1 className='text-xl sm:text-2xl font-bold text-foreground'>
									Database
								</h1>
								<p className='text-sm text-muted-foreground mt-1'>
									Manage your data tables and schemas
								</p>
							</div>

							{/* Database Selector - Mobile Optimized */}
							<div>
								<DatabaseSelector />
							</div>

							{/* Action Buttons - Mobile First */}
							{selectedDatabase && (
								<div className='flex flex-col sm:flex-row gap-3'>
									<div className='w-full sm:flex-1'>
										<TableTemplateSelector />
									</div>
									<Button
										onClick={() => setShowAddTableModal(true)}
										className='w-full sm:w-auto h-12 mobile-touch-feedback add-table-button'
										disabled={!selectedDatabase}>
										<Plus className='w-5 h-5 mr-2' />
										Add Table
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Main Content - Mobile Optimized */}
				<div className='p-4 sm:p-6'>
					<div className='max-w-7xl mx-auto space-y-6'>
						{/* Loading state */}
						{loading && <DatabaseLoadingState />}

						{/* Selected database info - Mobile Card */}
						{!loading && selectedDatabase && (
							<div className='bg-card rounded-xl border border-border/20 p-4 sm:p-6 shadow-sm'>
								<div className='flex items-start justify-between'>
									<div className='flex-1'>
										<h2 className='text-lg sm:text-xl font-semibold text-foreground mb-1'>
											{selectedDatabase.name}
										</h2>
										<p className='text-sm text-muted-foreground'>
											Created on{" "}
											{new Date(selectedDatabase.createdAt).toLocaleDateString()}
										</p>
									</div>
									<div className='ml-4'>
										<div className='w-3 h-3 rounded-full bg-green-500 animate-pulse'></div>
									</div>
								</div>
							</div>
						)}

						{/* Tables grid or No tables message - Mobile Optimized */}
						{!loading && selectedDatabase && tables && (
							<>
								{tables.length > 0 ? (
									<div className='space-y-4'>
										<div className='flex items-center justify-between'>
											<h3 className='text-lg font-semibold text-foreground'>
												Tables ({tables.length})
											</h3>
										</div>
										<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
											<TableGrid tables={tables} />
										</div>
									</div>
								) : (
									<div className='text-center py-12 px-4'>
										<div className='max-w-sm mx-auto'>
											<div className='w-20 h-20 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6'>
												<Plus className='w-10 h-10 text-primary' />
											</div>
											<h3 className='text-xl font-semibold text-foreground mb-3'>
												No tables yet
											</h3>
											<p className='text-muted-foreground mb-8 leading-relaxed'>
												Create your first table in "{selectedDatabase.name}" to
												start managing your data
											</p>
											<Button
												onClick={() => setShowAddTableModal(true)}
												className='h-12 px-8 mobile-touch-feedback add-table-button'>
												<Plus className='w-5 h-5 mr-2' />
												Create First Table
											</Button>
										</div>
									</div>
								)}
							</>
						)}

						{/* No database selected - Mobile Optimized */}
						{!loading && !selectedDatabase && (
							<div className='text-center py-16 px-4'>
								<div className='max-w-sm mx-auto'>
									<div className='w-20 h-20 bg-gradient-to-br from-muted/20 to-muted/40 rounded-2xl flex items-center justify-center mx-auto mb-6'>
										<Plus className='w-10 h-10 text-muted-foreground' />
									</div>
									<h3 className='text-xl font-semibold text-foreground mb-3'>
										Select a Database
									</h3>
									<p className='text-muted-foreground leading-relaxed'>
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
