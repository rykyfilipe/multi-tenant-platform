/** @format */

"use client";

import AddTableModal from "@/components/database/AddTableModal";
import { DatabaseLoadingState } from "@/components/ui/loading-states";
import { TableGrid } from "@/components/database/TableGrid";
import DatabaseSelector from "@/components/database/DatabaseSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { Plus, Database as DatabaseIcon, Table as TableIcon, Columns, BarChart3, HardDrive, Sparkles, FileText } from "lucide-react";
import { useEffect, useMemo } from "react";
import { tourUtils } from "@/lib/tour-config";
import { TableTemplateSelector } from "@/components/database/TableTemplateSelector";

export const dynamic = "force-dynamic";

function Page() {
	return <DatabaseContent />;
}

export default Page;

// Quick Stats Card Component
function QuickStatCard({ icon: Icon, label, value, sublabel, variant = "default" }: { 
	icon: any, 
	label: string, 
	value: string | number, 
	sublabel?: string,
	variant?: "default" | "primary" | "success" | "secondary"
}) {
	const variantClasses = {
		default: 'bg-card border-border/50',
		primary: 'bg-primary/5 border-primary/20',
		success: 'bg-green-500/5 border-green-500/20',
		secondary: 'bg-secondary/5 border-secondary/20',
	};

	const iconVariantClasses = {
		default: 'bg-muted/50 text-foreground',
		primary: 'bg-primary/10 text-primary',
		success: 'bg-green-500/10 text-green-600 dark:text-green-500',
		secondary: 'bg-secondary/10 text-secondary-foreground',
	};

	return (
		<Card className={`border shadow-sm hover:shadow-md transition-all duration-200 rounded-xl overflow-hidden ${variantClasses[variant]}`}>
			<CardContent className="p-6">
				<div className="flex items-center gap-3">
					<div className={`p-3 rounded-xl shadow-sm ${iconVariantClasses[variant]}`}>
						<Icon className="h-5 w-5" />
					</div>
					<div className="flex-1 min-w-0">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
						<p className="text-2xl font-bold text-foreground">{value}</p>
						{sublabel && (
							<p className="text-xs text-muted-foreground mt-1">{sublabel}</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

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

	// Calculate quick stats
	const stats = useMemo(() => {
		if (!tables || tables.length === 0) {
			return {
				totalTables: 0,
				totalColumns: 0,
				totalRows: 0,
				avgColumnsPerTable: 0,
				avgRowsPerTable: 0,
			};
		}

		const totalColumns = tables.reduce((acc, table) => 
			acc + (table.columnsCount ?? (Array.isArray(table.columns) ? table.columns.length : 0)), 0
		);
		const totalRows = tables.reduce((acc, table) => 
			acc + (table.rowsCount ?? (Array.isArray(table.rows) ? table.rows.length : 0)), 0
		);

		return {
			totalTables: tables.length,
			totalColumns,
			totalRows,
			avgColumnsPerTable: tables.length > 0 ? (totalColumns / tables.length).toFixed(1) : 0,
			avgRowsPerTable: tables.length > 0 ? Math.floor(totalRows / tables.length) : 0,
		};
	}, [tables]);

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
				{/* Enhanced Header */}
				<div className='border-b border-border/20 bg-background/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm'>
					<div className='px-4 sm:px-6 lg:px-8 py-6'>
						<div className='max-w-7xl mx-auto'>
							{/* Title Row */}
							<div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6'>
								<div className='flex-1'>
									<div className='flex items-center gap-3 mb-2'>
										<div className='p-2 rounded-xl bg-primary/10 shadow-sm'>
											<DatabaseIcon className="w-6 h-6 text-primary" />
										</div>
										<h1 className='text-2xl sm:text-3xl font-bold text-foreground tracking-tight'>
											Database Management
										</h1>
									</div>
									<p className='text-sm text-muted-foreground ml-14'>
										Organize and manage all your data tables
									</p>
								</div>
								<Badge 
									variant="outline" 
									className="bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/30 px-3 py-1 text-xs font-semibold self-start"
								>
									<div className='w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse' />
									Live
								</Badge>
							</div>

							{/* Controls Row */}
							<div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
								<div className='database-selector flex-1 sm:max-w-xs'>
									<DatabaseSelector />
								</div>

								{selectedDatabase && (
									<div className='flex items-center gap-2 sm:gap-3'>
										<TableTemplateSelector />
										<Button
											onClick={() => setShowAddTableModal(true)}
											className='add-table-button shadow-sm hover:shadow-md transition-all duration-200 flex-1 sm:flex-none'
											size="default">
											<Plus className='w-4 h-4 mr-2' />
											<span className='font-semibold'>Add Table</span>
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className='p-6'>
					<div className='max-w-7xl mx-auto space-y-6'>
						{/* Loading state */}
						{loading && <DatabaseLoadingState />}

						{/* Quick Stats Overview */}
						{!loading && selectedDatabase && tables && tables.length > 0 && (
							<div className="space-y-4">
								<h2 className="text-xl font-bold text-gray-900 dark:text-foreground tracking-tight flex items-center gap-2">
									<BarChart3 className="w-5 h-5 text-gray-600 dark:text-foreground" />
									Quick Overview
								</h2>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									<QuickStatCard
										icon={TableIcon}
										label="Total Tables"
										value={stats.totalTables}
										sublabel={`in ${selectedDatabase.name}`}
										color="blue"
									/>
									<QuickStatCard
										icon={Columns}
										label="Total Columns"
										value={stats.totalColumns}
										sublabel={`avg ${stats.avgColumnsPerTable} per table`}
										color="purple"
									/>
									<QuickStatCard
										icon={BarChart3}
										label="Total Rows"
										value={stats.totalRows.toLocaleString()}
										sublabel={`avg ${stats.avgRowsPerTable} per table`}
										color="green"
									/>
									<QuickStatCard
										icon={HardDrive}
										label="Database"
										value={selectedDatabase.name}
										sublabel={`Created ${new Date(selectedDatabase.createdAt).toLocaleDateString()}`}
										color="gray"
									/>
								</div>
							</div>
						)}

						{/* Tables Section */}
						{!loading && selectedDatabase && tables && (
							<>
								{tables.length > 0 ? (
									<div className='space-y-4'>
										<h2 className="text-xl font-bold text-gray-900 dark:text-foreground tracking-tight flex items-center gap-2">
											<TableIcon className="w-5 h-5 text-gray-600 dark:text-foreground" />
											Tables ({tables.length})
										</h2>
										<div className='table-grid'>
											<TableGrid tables={tables} />
										</div>
									</div>
								) : (
									<Card className="border-0 shadow-xl shadow-gray-100/50 rounded-2xl overflow-hidden">
										<CardContent className="p-12 text-center">
											<div className='max-w-md mx-auto'>
												<div className='w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100/50'>
													<Sparkles className='w-10 h-10 text-blue-600' />
												</div>
												<h3 className='text-2xl font-bold text-gray-900 dark:text-foreground mb-3'>
													No tables yet
												</h3>
												<p className='text-gray-600 dark:text-muted-foreground mb-8 text-base'>
													Create your first table in <span className="font-semibold text-gray-900 dark:text-foreground">"{selectedDatabase.name}"</span> to start managing your data
												</p>
												<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
													<Button
														onClick={() => setShowAddTableModal(true)}
														className='add-table-button shadow-lg hover:shadow-xl transition-all duration-200'
														size="lg">
														<Plus className='w-5 h-5 mr-2' />
														Create First Table
													</Button>
													<TableTemplateSelector />
												</div>
												
												{/* Feature hints */}
												<div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
																<TableIcon className="w-4 h-4 text-blue-600" />
															</div>
															<h4 className="font-semibold text-sm text-gray-900 dark:text-foreground">Custom Schemas</h4>
														</div>
														<p className="text-xs text-gray-600 dark:text-muted-foreground ml-10">
															Design tables that fit your exact needs
														</p>
													</div>
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
																<Columns className="w-4 h-4 text-purple-600" />
															</div>
															<h4 className="font-semibold text-sm text-gray-900 dark:text-foreground">Rich Data Types</h4>
														</div>
														<p className="text-xs text-gray-600 dark:text-muted-foreground ml-10">
															Text, numbers, dates, references & more
														</p>
													</div>
													<div className="space-y-1">
														<div className="flex items-center gap-2">
															<div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
																<FileText className="w-4 h-4 text-green-600" />
															</div>
															<h4 className="font-semibold text-sm text-gray-900 dark:text-foreground">Templates</h4>
														</div>
														<p className="text-xs text-gray-600 dark:text-muted-foreground ml-10">
															Start quickly with pre-built schemas
														</p>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								)}
							</>
						)}

						{/* No database selected */}
						{!loading && !selectedDatabase && (
							<Card className="border-0 shadow-xl shadow-gray-100/50 rounded-2xl overflow-hidden">
								<CardContent className="p-12 text-center">
									<div className='max-w-md mx-auto'>
										<div className='w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gray-100/50'>
											<DatabaseIcon className='w-10 h-10 text-gray-600' />
										</div>
										<h3 className='text-2xl font-bold text-gray-900 dark:text-foreground mb-3'>
											Select a Database
										</h3>
										<p className='text-gray-600 dark:text-muted-foreground mb-8 text-base'>
											Choose a database from the dropdown above to view and manage your tables
										</p>
									</div>
								</CardContent>
							</Card>
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
