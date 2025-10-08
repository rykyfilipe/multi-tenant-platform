/** @format */
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Database,
	Settings as SettingsIcon,
	Save,
	MoreHorizontal,
	Download,
	Upload,
	Trash2,
	ChevronLeft,
	FileDown,
	FileUp,
} from "lucide-react";
import { Table } from "@/types/database";
import { useRouter } from "next/navigation";

interface Props {
	table: Table;
	mode: "schema" | "data";
	setMode: (mode: "schema" | "data") => void;
	columnsCount: number;
	rowsCount: number;
	hasUnsavedChanges: boolean;
	unsavedChangesCount: number;
	onSaveAll: () => void;
	onExportSchema?: () => void;
	onExportData?: () => void;
	onImportData?: () => void;
	onDeleteTable?: () => void;
	isSaving?: boolean;
	isExporting?: boolean;
	isImporting?: boolean;
	canEdit?: boolean;
}

export function TableEditorHeader({
	table,
	mode,
	setMode,
	columnsCount,
	rowsCount,
	hasUnsavedChanges,
	unsavedChangesCount,
	onSaveAll,
	onExportSchema,
	onExportData,
	onImportData,
	onDeleteTable,
	isSaving = false,
	isExporting = false,
	isImporting = false,
	canEdit = false,
}: Props) {
	const router = useRouter();

	return (
		<header className='sticky top-0 z-50 bg-background/98 backdrop-blur-md border-b border-border shadow-sm'>
			<div className='flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8'>
				{/* Left: Navigation & Table Info */}
				<div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => router.back()}
						className='flex-shrink-0 hover:bg-muted/50 transition-colors'>
						<ChevronLeft className='w-4 h-4 mr-1' />
						<span className='hidden sm:inline'>Back</span>
					</Button>

					<div className='h-8 w-px bg-border hidden sm:block flex-shrink-0' />

					<div className='flex items-center gap-3 min-w-0'>
						<div className='w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border flex items-center justify-center flex-shrink-0 shadow-sm'>
							<Database className='w-5 h-5 sm:w-6 sm:h-6 text-primary' />
						</div>
						<div className='min-w-0'>
							<h1 className='text-base sm:text-lg font-bold text-foreground truncate tracking-tight'>{table.name}</h1>
							<p className='text-xs text-muted-foreground hidden sm:flex items-center gap-2'>
								<span className='flex items-center gap-1'>
									<span className='w-1 h-1 rounded-full bg-primary' />
									{columnsCount} columns
								</span>
								<span className='text-border'>·</span>
								<span className='flex items-center gap-1'>
									<span className='w-1 h-1 rounded-full bg-green-500' />
									{rowsCount} rows
								</span>
							</p>
						</div>
					</div>
				</div>

			{/* Center: Mode Toggle - Hidden on mobile */}
			<div className='hidden md:flex items-center gap-1 bg-muted rounded-xl p-1.5 border border-border/50 shadow-sm table-editor-mode-toggle'>
				<Button
					variant={mode === "schema" ? "default" : "ghost"}
					size='sm'
					onClick={() => setMode("schema")}
					className={`gap-2 px-4 transition-all duration-200 ${
						mode === "schema" ? 'shadow-sm' : 'hover:bg-muted-foreground/10'
					}`}>
					<SettingsIcon className='w-4 h-4' />
					<span className='font-medium'>Schema</span>
				</Button>
				<Button
					variant={mode === "data" ? "default" : "ghost"}
					size='sm'
					onClick={() => setMode("data")}
					className={`gap-2 px-4 transition-all duration-200 ${
						mode === "data" ? 'shadow-sm' : 'hover:bg-muted-foreground/10'
					}`}>
					<Database className='w-4 h-4' />
					<span className='font-medium'>Data</span>
				</Button>
			</div>

				{/* Right: Actions */}
				<div className='flex items-center gap-2 sm:gap-3 flex-shrink-0'>
					{hasUnsavedChanges && (
						<Badge variant='secondary' className='gap-2 hidden sm:flex bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800'>
							<span className='w-2 h-2 rounded-full bg-amber-500 animate-pulse' />
							<span className='hidden lg:inline font-medium'>{unsavedChangesCount} unsaved</span>
							<span className='lg:hidden font-medium'>{unsavedChangesCount}</span>
						</Badge>
					)}

					<Button
						onClick={onSaveAll}
						disabled={!hasUnsavedChanges || isSaving}
						className='gap-2 shadow-sm transition-all duration-200'
						size='sm'>
						{isSaving ? (
							<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
						) : (
							<Save className='w-4 h-4' />
						)}
						<span className='hidden sm:inline font-medium'>Save</span>
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='ghost' size='sm' className='h-9 w-9 p-0 hover:bg-muted/50 transition-colors'>
								<MoreHorizontal className='w-4 h-4' />
								<span className='sr-only'>More options</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end' className='w-48'>
							{onExportData && (
								<DropdownMenuItem onClick={onExportData} disabled={isExporting}>
									<FileDown className='w-4 h-4 mr-2' />
									{isExporting ? 'Exporting...' : 'Export Data'}
								</DropdownMenuItem>
							)}
						{onImportData && canEdit && (
							<DropdownMenuItem onClick={onImportData} disabled={isImporting}>
								<FileUp className='w-4 h-4 mr-2' />
								{isImporting ? 'Importing...' : 'Import Data'}
							</DropdownMenuItem>
						)}
							{(onExportData || onImportData) && <DropdownMenuSeparator />}
							<DropdownMenuItem onClick={onExportSchema}>
								<Download className='w-4 h-4 mr-2' />
								Export Schema
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={onDeleteTable}
								className='text-destructive focus:text-destructive focus:bg-destructive/10'>
								<Trash2 className='w-4 h-4 mr-2' />
								Delete Table
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

		{/* Mobile Mode Toggle - Below header */}
		<div className='md:hidden flex items-center gap-2 bg-muted/80 p-2 border-t border-border table-editor-mode-toggle'>
			<Button
				variant={mode === "schema" ? "default" : "ghost"}
				size='sm'
				onClick={() => setMode("schema")}
				className={`flex-1 gap-2 transition-all duration-200 ${
					mode === "schema" ? 'shadow-sm' : 'hover:bg-muted-foreground/10'
				}`}>
				<SettingsIcon className='w-4 h-4' />
				<span className='font-medium'>Schema</span>
			</Button>
			<Button
				variant={mode === "data" ? "default" : "ghost"}
				size='sm'
				onClick={() => setMode("data")}
				className={`flex-1 gap-2 transition-all duration-200 ${
					mode === "data" ? 'shadow-sm' : 'hover:bg-muted-foreground/10'
				}`}>
				<Database className='w-4 h-4' />
				<span className='font-medium'>Data</span>
			</Button>
		</div>
		</header>
	);
}

