/** @format */

"use client";

import { Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function CreateDatabaseModal() {
	const {
		showAddDatabaseModal,
		setShowAddDatabaseModal,
		databaseName,
		setDatabaseName,
		handleAddDatabase,
		validateDatabaseName,
	} = useDatabase();
	const { t } = useLanguage();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!databaseName.trim()) return;
		if (!validateDatabaseName(databaseName.trim())) {
			alert(t("database.createModal.alreadyExists"));
			return;
		}
		handleAddDatabase(e);
	};

	return (
		<Dialog open={showAddDatabaseModal} onOpenChange={setShowAddDatabaseModal}>
			<DialogContent className='sm:max-w-md'>
				<DialogHeader>
					<DialogTitle className='flex items-center gap-2'>
						<Database className='w-5 h-5' />
						{t("database.createModal.title")}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='databaseName'>
							{t("database.createModal.databaseName")}
						</Label>
						<Input
							id='databaseName'
							type='text'
							value={databaseName}
							onChange={(e) => setDatabaseName(e.target.value)}
							placeholder={t("database.createModal.placeholder")}
							required
						/>
					</div>

					<div className='flex gap-3 pt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setShowAddDatabaseModal(false)}
							className='flex-1'>
							{t("database.createModal.cancel")}
						</Button>
						<Button
							type='submit'
							disabled={!databaseName.trim()}
							className='flex-1'>
							{t("database.createModal.create")}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
