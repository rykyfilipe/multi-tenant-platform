/** @format */

"use client";

import { memo, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useOptimizedDatabase } from "@/hooks/useOptimizedDatabase";
import { useAuth, useAlert } from "@/contexts/AppContext";
import { TableGrid } from "./TableGrid";
import DatabaseSelector from "./DatabaseSelector";
import AddTableModal from "./AddTableModal";
import { DatabaseLoadingState } from "@/components/ui/loading-states";

const OptimizedDatabasePage = memo(function OptimizedDatabasePage() {
	const { token } = useAuth();
	const { showAlert } = useAlert();
	const {
		databases,
		selectedDatabase,
		loading,
		error,
		selectDatabase,
		refetchDatabases,
	} = useOptimizedDatabase();

	// Memoized handlers to prevent re-renders
	const handleDatabaseSelect = useCallback(
		(database: any) => {
			selectDatabase(database);
		},
		[selectDatabase],
	);

	const handleRefresh = useCallback(async () => {
		await refetchDatabases();
		showAlert("Database list refreshed", "success");
	}, [refetchDatabases, showAlert]);

	// Memoized table data to prevent unnecessary calculations
	const tables = useMemo(() => {
		return selectedDatabase?.tables || [];
	}, [selectedDatabase?.tables]);

	const hasTablesData = useMemo(() => {
		return tables.length > 0;
	}, [tables.length]);

	if (loading) {
		return <DatabaseLoadingState />;
	}

	if (error) {
		return (
			<div className='p-6'>
				<div className='text-center'>
					<h3 className='text-lg font-semibold text-red-600 mb-2'>Error</h3>
					<p className='text-muted-foreground mb-4'>{error}</p>
					<Button onClick={handleRefresh} variant='outline'>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className='h-full bg-background'>
			{/* Header */}
			<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
				<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 gap-4'>
					<div className='flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6'>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								Database
							</h1>
							<p className='text-sm text-muted-foreground'>
								Manage your data tables and schemas
							</p>
						</div>

						<div className='database-selector w-full sm:w-auto'>
							<OptimizedDatabaseSelector
								databases={databases}
								selectedDatabase={selectedDatabase}
								onSelect={handleDatabaseSelect}
							/>
						</div>
					</div>

					{selectedDatabase && (
						<div className='w-full sm:w-auto flex justify-end'>
							<Button
								onClick={() => {
									// This would open add table modal
									showAlert("Add table functionality", "info");
								}}
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
			<div className='p-6'>
				<div className='max-w-7xl mx-auto'>
					{/* Selected database info */}
					{selectedDatabase && (
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
					{selectedDatabase && (
						<>
							{hasTablesData ? (
								<div className='table-grid space-y-6'>
									<OptimizedTableGrid tables={tables} />
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
											onClick={() =>
												showAlert("Create table functionality", "info")
											}
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
					{!selectedDatabase && (
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
				</div>
			</div>
		</div>
	);
});

// Optimized Database Selector
const OptimizedDatabaseSelector = memo(function OptimizedDatabaseSelector({
	databases,
	selectedDatabase,
	onSelect,
}: {
	databases: any[] | null;
	selectedDatabase: any;
	onSelect: (database: any) => void;
}) {
	if (!databases || databases.length === 0) {
		return (
			<div className='text-sm text-muted-foreground'>
				No databases available
			</div>
		);
	}

	return (
		<Select
			value={selectedDatabase?.id?.toString() || ""}
			onValueChange={(value) => {
				const database = databases.find(
					(db) => db.id.toString() === value,
				);
				if (database) onSelect(database);
			}}
		>
			<SelectTrigger className='px-3 py-2 border rounded-md bg-background'>
				<SelectValue placeholder="Select database" />
			</SelectTrigger>
			<SelectContent>
				{databases.map((database) => (
					<SelectItem key={database.id} value={database.id.toString()}>
						{database.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
});

// Optimized Table Grid
const OptimizedTableGrid = memo(function OptimizedTableGrid({
	tables,
}: {
	tables: any[];
}) {
	const memoizedTables = useMemo(() => tables, [tables]);

	return <TableGrid tables={memoizedTables} />;
});

export default OptimizedDatabasePage;
