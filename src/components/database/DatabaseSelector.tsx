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
						className='gap-3 min-w-[240px] justify-between h-11 shadow-sm hover:shadow-md transition-all duration-200 border-gray-200 dark:border-border bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-card/80'>
						<div className='flex items-center gap-3'>
							<div className="p-1.5 rounded-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-primary/20 dark:to-primary/10">
								<Database className='w-4 h-4 text-blue-600 dark:text-primary' />
							</div>
							<span className='truncate font-semibold text-gray-900 dark:text-foreground'>
								{selectedDatabase?.name || t("database.selector.selectDatabase")}
							</span>
						</div>
						<ChevronDown className='w-4 h-4 text-gray-500' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='start' className='w-[280px] shadow-xl border-gray-200 dark:border-border'>
					<div className='px-3 py-2 bg-gradient-to-r from-gray-50 to-white dark:from-card dark:to-card/50'>
						<p className='text-xs font-bold text-gray-700 dark:text-foreground uppercase tracking-wide'>
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
							className='flex items-center justify-between cursor-pointer py-3 px-3 hover:bg-gray-50 dark:hover:bg-card/50'>
							<div className='flex items-center gap-3 flex-1 min-w-0'>
								<div className={`p-1.5 rounded-md ${selectedDatabase?.id === database.id ? 'bg-blue-100 dark:bg-primary/20' : 'bg-gray-100 dark:bg-card'}`}>
									<Database className={`w-4 h-4 ${selectedDatabase?.id === database.id ? 'text-blue-600 dark:text-primary' : 'text-gray-600 dark:text-foreground'}`} />
								</div>
								<span className='truncate font-medium text-gray-900 dark:text-foreground'>{database.name}</span>
								{selectedDatabase?.id === database.id && (
									<Badge className='text-xs bg-blue-100 text-blue-700 border-blue-200 font-semibold'>
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
										className='h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors'>
										<Trash2 className='w-3.5 h-3.5' />
									</Button>
								)}
							{user?.role === "ADMIN" &&
								database.tables?.some((table: any) => table.isPredefined) && (
									<Badge variant="outline" className='text-xs bg-amber-50 text-amber-700 border-amber-200'>
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
							className='cursor-pointer py-3 px-3 font-semibold text-blue-600 dark:text-primary hover:bg-blue-50 dark:hover:bg-primary/10'>
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
