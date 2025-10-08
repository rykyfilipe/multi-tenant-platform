/** @format */

"use client";

import { Database, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useApp } from "@/contexts/AppContext";
import { useLanguage } from "@/contexts/LanguageContext";
import CreateDatabaseModal from "./CreateDatabaseModal";

export default function DatabaseSelector() {
	const {
		databases,
		selectedDatabase,
		handleSelectDatabase,
		handleDeleteDatabase,
		showAddDatabaseModal,
		setShowAddDatabaseModal,
	} = useDatabase();
	const { user } = useApp();
	const { t } = useLanguage();

	if (!databases || databases.length === 0) {
		return (
			<div className='flex items-center gap-2'>
				<Button
					onClick={() => setShowAddDatabaseModal(true)}
					variant='outline'
					size='sm'
					className='gap-2'>
					<Plus className='w-4 h-4' />
					{t("database.selector.createDatabase")}
				</Button>
				{showAddDatabaseModal && <CreateDatabaseModal />}
			</div>
		);
	}

	return (
		<div className='flex items-center gap-2'>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant='outline'
						className='gap-3 min-w-[200px] sm:min-w-[240px] justify-between h-11 shadow-sm hover:shadow-md transition-all duration-200 border-border bg-card hover:bg-muted/50'>
						<div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
							<div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
								<Database className='w-4 h-4 text-primary' />
							</div>
							<span className='truncate font-semibold text-foreground text-sm'>
								{selectedDatabase?.name || t("database.selector.selectDatabase")}
							</span>
						</div>
						<ChevronDown className='w-4 h-4 text-muted-foreground flex-shrink-0' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='start' className='w-[280px] shadow-xl border-border'>
					<div className='px-3 py-2 bg-muted/30'>
						<p className='text-xs font-bold text-foreground uppercase tracking-wide'>
							{t("database.selector.databasesCount", { count: databases.length })}
						</p>
					</div>
					<DropdownMenuSeparator />
					{databases.map((database) => (
						<DropdownMenuItem
							key={database.id}
							onClick={() => {
								handleSelectDatabase(database);
							}}
							className='flex items-center justify-between cursor-pointer py-3 px-3 hover:bg-muted/50 focus:bg-muted/50'>
							<div className='flex items-center gap-3 flex-1 min-w-0'>
								<div className={`p-1.5 rounded-lg ${selectedDatabase?.id === database.id ? 'bg-primary/20' : 'bg-muted/50'}`}>
									<Database className={`w-4 h-4 ${selectedDatabase?.id === database.id ? 'text-primary' : 'text-muted-foreground'}`} />
								</div>
								<span className='truncate font-medium text-foreground'>{database.name}</span>
								{selectedDatabase?.id === database.id && (
									<Badge className='text-xs bg-primary/10 text-primary border-primary/30 font-semibold'>
										{t("database.selector.active")}
									</Badge>
								)}
							</div>
							{user?.role === "ADMIN" &&
								databases.length > 1 &&
								!database.tables?.some((table: any) => table.isPredefined) && (
									<Button
										variant='ghost'
										size='sm'
										onClick={(e) => {
											e.stopPropagation();
											if (
												confirm(
													t("database.selector.deleteConfirm", { name: database.name }),
												)
											) {
												handleDeleteDatabase(database.id);
											}
										}}
										className='h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'>
										<Trash2 className='w-3.5 h-3.5' />
									</Button>
								)}
							{user?.role === "ADMIN" &&
								database.tables?.some((table: any) => table.isPredefined) && (
									<Badge variant="outline" className='text-xs bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/30'>
										<Database className='w-3 h-3 mr-1' />
										{t("database.selector.protected")}
									</Badge>
								)}
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					{user?.role === "ADMIN" && (
						<DropdownMenuItem
							onClick={() => {
								setShowAddDatabaseModal(true);
							}}
							className='cursor-pointer py-3 px-3 font-semibold text-primary hover:bg-primary/10 focus:bg-primary/10'>
							<Plus className='w-4 h-4 mr-2' />
							{t("database.selector.createNewDatabase")}
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			{showAddDatabaseModal && <CreateDatabaseModal />}
		</div>
	);
}
