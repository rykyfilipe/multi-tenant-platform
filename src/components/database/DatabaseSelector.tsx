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
						className='gap-2 min-w-[200px] justify-between'>
						<div className='flex items-center gap-2'>
							<Database className='w-4 h-4' />
							<span className='truncate'>
								{selectedDatabase?.name || t("database.selector.selectDatabase")}
							</span>
						</div>
						<ChevronDown className='w-4 h-4' />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align='start' className='w-[250px]'>
					<div className='px-2 py-1.5 text-sm font-medium text-muted-foreground'>
						{t("database.selector.databasesCount", { count: databases.length })}
					</div>
					<DropdownMenuSeparator />
					{databases.map((database) => (
						<DropdownMenuItem
							key={database.id}
							onClick={() => {
								handleSelectDatabase(database);
							}}
							className='flex items-center justify-between cursor-pointer'>
							<div className='flex items-center gap-2 flex-1 min-w-0'>
								<Database className='w-4 h-4 flex-shrink-0' />
								<span className='truncate'>{database.name}</span>
								{selectedDatabase?.id === database.id && (
									<Badge variant='secondary' className='text-xs'>
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
										className='h-6 w-6 p-0 text-muted-foreground hover:text-destructive'>
										<Trash2 className='w-3 h-3' />
									</Button>
								)}
							{user?.role === "ADMIN" &&
								database.tables?.some((table: any) => table.isPredefined) && (
									<div className='flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded'>
										<Database className='w-3 h-3' />
										{t("database.selector.protected")}
									</div>
								)}
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					{user?.role === "ADMIN" && (
						<DropdownMenuItem
							onClick={() => {
								setShowAddDatabaseModal(true);
							}}
							className='cursor-pointer'>
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
