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
import { 
	Plus, 
	Database as DatabaseIcon, 
	Sparkles, 
	FileText,
	Columns,
	Table as TableIcon,
	Zap
} from "lucide-react";
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
		const isNewUser = !localStorage.getItem("app-first-visit");
		const hasSeenTour = tourUtils.isTourSeen("database");

		if (isNewUser || !hasSeenTour) {
			if (isNewUser) {
				localStorage.setItem("app-first-visit", "true");
			}

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
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
				{/* Modern Header */}
				<div className='relative'>
					<div className='relative border-b border-border bg-background sticky top-0 z-50'>
						<div className='px-3 sm:px-6 lg:px-8 py-3 sm:py-4'>
							<div className='max-w-7xl mx-auto'>
								{/* Hero Section */}
								<div className='text-center mb-3 sm:mb-6'>
									<div className='inline-flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3'>
										<div className='p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10'>
											<DatabaseIcon className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
										</div>
										<h1 className='text-lg sm:text-2xl lg:text-3xl font-bold text-foreground'>
											Database Management
										</h1>
									</div>
									<p className='text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto px-2'>
										Organize and manage your data infrastructure
									</p>
								</div>

								{/* Controls Section */}
								<div className='flex flex-col lg:flex-row items-center gap-2 sm:gap-3'>
									<div className='flex-1 w-full lg:max-w-md'>
										<DatabaseSelector />
									</div>

									{selectedDatabase && (
										<div className='flex items-center gap-1.5 sm:gap-2 w-full lg:w-auto'>
											<TableTemplateSelector />
											<Button
												onClick={() => setShowAddTableModal(true)}
												className='add-table-button flex-1 lg:flex-none'
												size="sm">
												<Plus className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2' />
												<span className='text-xs sm:text-sm'>Create Table</span>
											</Button>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='px-4 sm:px-6 lg:px-8 py-8'>
					<div className='max-w-7xl mx-auto space-y-12'>
						{/* Loading state */}
						{loading && <DatabaseLoadingState />}

						{/* Tables Section */}
						{!loading && selectedDatabase && tables && (
							<>
								{tables.length > 0 ? (
									<div className='space-y-6'>
										<div className='flex items-center justify-between'>
											<h2 className="text-lg font-semibold text-foreground">
												Tables
												<span className='ml-2 text-sm text-muted-foreground font-normal'>
													({tables.length})
												</span>
											</h2>
										</div>
										
										<div className='table-grid'>
											<TableGrid tables={tables} />
										</div>
									</div>
								) : (
									<div className='text-center py-16'>
										<div className='max-w-2xl mx-auto'>
											<div className='relative mb-8'>
												<div className='w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mx-auto shadow-2xl'>
													<Sparkles className='w-16 h-16 text-primary' />
												</div>
												<div className='absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-secondary to-secondary/80 rounded-full flex items-center justify-center shadow-lg'>
													<Plus className='w-4 h-4 text-white' />
												</div>
											</div>
											
											<h3 className='text-3xl font-bold text-foreground mb-4'>
												Ready to Build Your Data?
											</h3>
											<p className='text-lg text-muted-foreground mb-8 max-w-lg mx-auto'>
												Create your first table in <span className="font-semibold text-foreground bg-primary/10 px-2 py-1 rounded-lg">"{selectedDatabase.name}"</span> to start organizing and managing your data
											</p>
											
											<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
												<Button
													onClick={() => setShowAddTableModal(true)}
													className='add-table-button shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary px-8 py-4 text-lg'
													size="lg">
													<Plus className='w-6 h-6 mr-3' />
													<span className='font-semibold'>Create Your First Table</span>
												</Button>
												<TableTemplateSelector />
											</div>
											
											{/* Enhanced Feature Showcase */}
											<div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
												<div className="group p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
													<div className="flex items-center gap-3 mb-4">
														<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
															<TableIcon className="w-6 h-6 text-primary" />
														</div>
														<h4 className="font-bold text-foreground">Custom Schemas</h4>
													</div>
													<p className="text-sm text-muted-foreground leading-relaxed">
														Design tables with custom columns, relationships, and data types that perfectly fit your workflow
													</p>
												</div>
												<div className="group p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-secondary/30 transition-all duration-300 hover:shadow-lg">
													<div className="flex items-center gap-3 mb-4">
														<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
															<Columns className="w-6 h-6 text-secondary-foreground" />
														</div>
														<h4 className="font-bold text-foreground">Rich Data Types</h4>
													</div>
													<p className="text-sm text-muted-foreground leading-relaxed">
														Support for text, numbers, dates, references, JSON, and custom arrays with validation
													</p>
												</div>
												<div className="group p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-green-500/30 transition-all duration-300 hover:shadow-lg">
													<div className="flex items-center gap-3 mb-4">
														<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
															<FileText className="w-6 h-6 text-green-600 dark:text-green-500" />
														</div>
														<h4 className="font-bold text-foreground">Quick Templates</h4>
													</div>
													<p className="text-sm text-muted-foreground leading-relaxed">
														Start instantly with pre-built templates for common use cases like CRM, inventory, and analytics
													</p>
												</div>
											</div>
										</div>
									</div>
								)}
							</>
						)}

						{/* No database selected */}
						{!loading && !selectedDatabase && (
							<div className='text-center py-20'>
								<div className='max-w-xl mx-auto'>
									<div className='relative mb-8'>
										<div className='w-40 h-40 bg-gradient-to-br from-muted/30 to-muted/20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl'>
											<DatabaseIcon className='w-20 h-20 text-muted-foreground' />
										</div>
										<div className='absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg animate-bounce'>
											<Zap className='w-6 h-6 text-white' />
										</div>
									</div>
									
									<h3 className='text-3xl font-bold text-foreground mb-4'>
										Choose Your Database
									</h3>
									<p className='text-lg text-muted-foreground mb-8 max-w-lg mx-auto'>
										Select a database from the dropdown above to start exploring and managing your data tables
									</p>
									
									<div className='inline-flex items-center gap-2 px-6 py-3 bg-primary/10 rounded-full border border-primary/20'>
										<div className='w-2 h-2 rounded-full bg-primary animate-pulse' />
										<span className='text-sm font-medium text-primary'>
											Ready to connect
										</span>
									</div>
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
