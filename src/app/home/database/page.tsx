/** @format */

"use client";

import AddTableModal from "@/components/database/AddTableModal";
import { DatabaseLoadingState } from "@/components/ui/loading-states";
import { TableGrid } from "@/components/database/TableGrid";
import DatabaseSelector from "@/components/database/DatabaseSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import TourProv from "@/contexts/TourProvider";
import { useTour } from "@reactour/tour";
import { 
	Plus, 
	Database as DatabaseIcon, 
	Table as TableIcon, 
	Columns, 
	BarChart3, 
	HardDrive, 
	Sparkles, 
	FileText,
	TrendingUp,
	Clock,
	Zap
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { tourUtils } from "@/lib/tour-config";
import { TableTemplateSelector } from "@/components/database/TableTemplateSelector";

export const dynamic = "force-dynamic";

function Page() {
	return <DatabaseContent />;
}

export default Page;

// Enhanced Stats Card Component
function QuickStatCard({ 
	icon: Icon, 
	label, 
	value, 
	sublabel, 
	variant = "default",
	trend,
	trendLabel 
}: { 
	icon: any, 
	label: string, 
	value: string | number, 
	sublabel?: string,
	variant?: "default" | "primary" | "success" | "secondary" | "accent",
	trend?: "up" | "down" | "neutral",
	trendLabel?: string
}) {
	const variantClasses = {
		default: 'bg-card border-border/50 hover:border-border',
		primary: 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/30',
		success: 'bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 hover:border-green-500/30',
		secondary: 'bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20 hover:border-secondary/30',
		accent: 'bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20 hover:border-blue-500/30',
	};

	const iconVariantClasses = {
		default: 'bg-muted/60 text-foreground',
		primary: 'bg-primary/20 text-primary',
		success: 'bg-green-500/20 text-green-600 dark:text-green-500',
		secondary: 'bg-secondary/20 text-secondary-foreground',
		accent: 'bg-blue-500/20 text-blue-600 dark:text-blue-500',
	};

	const trendIcons = {
		up: TrendingUp,
		down: TrendingUp,
		neutral: Clock,
	};

	const TrendIcon = trend ? trendIcons[trend] : null;

	return (
		<Card className={`group border shadow-sm hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden ${variantClasses[variant]} hover:scale-[1.02]`}>
			<CardContent className="p-6">
				<div className="flex items-start justify-between mb-4">
					<div className={`p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300 ${iconVariantClasses[variant]}`}>
						<Icon className="h-5 w-5" />
					</div>
					{trend && TrendIcon && (
						<div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
							trend === 'up' ? 'bg-green-500/10 text-green-600 dark:text-green-500' :
							trend === 'down' ? 'bg-red-500/10 text-red-600 dark:text-red-500' :
							'bg-muted/50 text-muted-foreground'
						}`}>
							<TrendIcon className={`h-3 w-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
							{trendLabel}
						</div>
					)}
				</div>
				<div className="space-y-1">
					<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
					<p className="text-3xl font-bold text-foreground">{value}</p>
					{sublabel && (
						<p className="text-sm text-muted-foreground">{sublabel}</p>
					)}
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
			<div className='min-h-screen bg-gradient-to-br from-background via-background to-muted/20'>
				{/* Modern Header */}
				<div className='relative'>
					<div className='absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5' />
					<div className='relative border-b border-border/20 bg-background/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm'>
						<div className='px-4 sm:px-6 lg:px-8 py-8'>
							<div className='max-w-7xl mx-auto'>
								{/* Hero Section */}
								<div className='text-center mb-8'>
									<div className='inline-flex items-center gap-3 mb-4'>
										<div className='p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg'>
											<DatabaseIcon className="w-8 h-8 text-primary" />
										</div>
										<h1 className='text-3xl sm:text-4xl font-bold text-foreground tracking-tight'>
											Database Management
										</h1>
									</div>
									<p className='text-lg text-muted-foreground max-w-2xl mx-auto mb-6'>
										Organize, manage, and scale your data infrastructure with powerful table management tools
									</p>
									<div className='flex items-center justify-center gap-2'>
										<Badge 
											variant="outline" 
											className="bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/30 px-4 py-2 text-sm font-semibold"
										>
											<div className='w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse' />
											System Live
										</Badge>
										<Badge 
											variant="outline" 
											className="bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/30 px-4 py-2 text-sm font-semibold"
										>
											<Zap className='w-3 h-3 mr-2' />
											Real-time Sync
										</Badge>
									</div>
								</div>

								{/* Controls Section */}
								<div className='flex flex-col lg:flex-row items-center gap-4 p-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50 shadow-sm'>
									<div className='flex-1 w-full lg:max-w-md'>
										<DatabaseSelector />
									</div>

									{selectedDatabase && (
										<div className='flex items-center gap-3 w-full lg:w-auto'>
											<TableTemplateSelector />
											<Button
												onClick={() => setShowAddTableModal(true)}
												className='add-table-button shadow-lg hover:shadow-xl transition-all duration-300 flex-1 lg:flex-none bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary'
												size="lg">
												<Plus className='w-5 h-5 mr-2' />
												<span className='font-semibold'>Create Table</span>
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

						{/* Enhanced Stats Overview */}
						{!loading && selectedDatabase && tables && tables.length > 0 && (
							<div className="space-y-6">
								<div className='text-center'>
									<h2 className="text-2xl font-bold text-foreground tracking-tight mb-2">
										Database Analytics
									</h2>
									<p className="text-muted-foreground">
										Real-time insights into your data infrastructure
									</p>
								</div>
								
								<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
									<QuickStatCard
										icon={TableIcon}
										label="Active Tables"
										value={stats.totalTables}
										sublabel={`in ${selectedDatabase.name}`}
										variant="primary"
										trend="up"
										trendLabel="+2 this week"
									/>
									<QuickStatCard
										icon={Columns}
										label="Total Columns"
										value={stats.totalColumns}
										sublabel={`avg ${stats.avgColumnsPerTable} per table`}
										variant="accent"
										trend="up"
										trendLabel="+5 today"
									/>
									<QuickStatCard
										icon={BarChart3}
										label="Data Rows"
										value={stats.totalRows.toLocaleString()}
										sublabel={`avg ${stats.avgRowsPerTable} per table`}
										variant="success"
										trend="up"
										trendLabel="+12% growth"
									/>
									<QuickStatCard
										icon={HardDrive}
										label="Database Size"
										value="2.4 GB"
										sublabel={`Created ${new Date(selectedDatabase.createdAt).toLocaleDateString()}`}
										variant="secondary"
										trend="neutral"
										trendLabel="Stable"
									/>
								</div>
							</div>
						)}

						{/* Tables Section */}
						{!loading && selectedDatabase && tables && (
							<>
								{tables.length > 0 ? (
									<div className='space-y-8'>
										<div className='text-center'>
											<div className='inline-flex items-center gap-3 mb-3'>
												<div className='p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg'>
													<TableIcon className="w-6 h-6 text-primary" />
												</div>
												<h2 className="text-2xl font-bold text-foreground tracking-tight">
													Data Tables
												</h2>
											</div>
											<p className="text-muted-foreground">
												Manage and organize your data structures
											</p>
											<div className='mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20'>
												<div className='w-2 h-2 rounded-full bg-primary animate-pulse' />
												<span className='text-sm font-medium text-primary'>
													{tables.length} active table{tables.length !== 1 ? 's' : ''}
												</span>
											</div>
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
