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
	canEdit = false,
}: Props) {
	const router = useRouter();

	return (
		<header className='sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50 shadow-sm'>
			<div className='flex items-center justify-between h-[60px] px-4 sm:px-6'>
				{/* Left: Navigation & Table Info */}
				<div className='flex items-center gap-3 sm:gap-4 min-w-0 flex-1'>
					<Button
						variant='ghost'
						size='sm'
						onClick={() => router.back()}
						className='flex-shrink-0'>
						<ChevronLeft className='w-4 h-4 mr-1' />
						<span className='hidden sm:inline'>Back</span>
					</Button>

					<div className='h-8 w-px bg-border hidden sm:block flex-shrink-0' />

					<div className='flex items-center gap-2 sm:gap-3 min-w-0'>
						<div className='w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0'>
							<Database className='w-4 h-4 sm:w-5 sm:h-5 text-primary' />
						</div>
						<div className='min-w-0'>
							<h1 className='text-base sm:text-lg font-semibold truncate'>{table.name}</h1>
							<p className='text-xs text-muted-foreground hidden sm:block'>
								{columnsCount} columns · {rowsCount} rows
							</p>
						</div>
					</div>
				</div>

			{/* Center: Mode Toggle - Hidden on mobile */}
			<div className='hidden md:flex items-center gap-2 bg-muted/50 rounded-lg p-1 table-editor-mode-toggle'>
				<Button
					variant={mode === "schema" ? "default" : "ghost"}
					size='sm'
					onClick={() => setMode("schema")}
					className='gap-2'>
					<SettingsIcon className='w-4 h-4' />
					Schema
				</Button>
				<Button
					variant={mode === "data" ? "default" : "ghost"}
					size='sm'
					onClick={() => setMode("data")}
					className='gap-2'>
					<Database className='w-4 h-4' />
					Data
				</Button>
			</div>

				{/* Right: Actions */}
				<div className='flex items-center gap-2 flex-shrink-0'>
					{hasUnsavedChanges && (
						<Badge variant='secondary' className='gap-2 hidden sm:flex'>
							<span className='w-2 h-2 rounded-full bg-amber-500 animate-pulse' />
							<span className='hidden lg:inline'>{unsavedChangesCount} unsaved</span>
							<span className='lg:hidden'>{unsavedChangesCount}</span>
						</Badge>
					)}

					<Button
						onClick={onSaveAll}
						disabled={!hasUnsavedChanges || isSaving}
						className='gap-2'
						size='sm'>
						{isSaving ? (
							<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
						) : (
							<Save className='w-4 h-4' />
						)}
						<span className='hidden sm:inline'>Save</span>
					</Button>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant='ghost' size='sm' className='h-9 w-9 p-0'>
								<MoreHorizontal className='w-4 h-4' />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							{onExportData && (
								<DropdownMenuItem onClick={onExportData} disabled={isExporting}>
									<FileDown className='w-4 h-4 mr-2' />
									{isExporting ? 'Exporting...' : 'Export Data'}
								</DropdownMenuItem>
							)}
							{onImportData && canEdit && (
								<DropdownMenuItem onClick={onImportData}>
									<FileUp className='w-4 h-4 mr-2' />
									Import Data
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
								className='text-destructive focus:text-destructive'>
								<Trash2 className='w-4 h-4 mr-2' />
								Delete Table
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

		{/* Mobile Mode Toggle - Below header */}
		<div className='md:hidden flex items-center gap-2 bg-muted/50 p-2 border-t border-border/50 table-editor-mode-toggle'>
			<Button
				variant={mode === "schema" ? "default" : "ghost"}
				size='sm'
				onClick={() => setMode("schema")}
				className='flex-1 gap-2'>
				<SettingsIcon className='w-4 h-4' />
				Schema
			</Button>
			<Button
				variant={mode === "data" ? "default" : "ghost"}
				size='sm'
				onClick={() => setMode("data")}
				className='flex-1 gap-2'>
				<Database className='w-4 h-4' />
				Data
			</Button>
		</div>
		</header>
	);
}

