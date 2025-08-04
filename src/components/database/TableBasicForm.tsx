/** @format */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Table2, X } from "lucide-react";
import { SheetDescription } from "../ui/sheet";

interface TableBasicsFormProps {
	name: string;
	setName: (name: string) => void;
	onSubmit: (e: React.FormEvent) => void;
	onCancel: () => void;
	loading: boolean;
	description: string;
	setDescription: (name: string) => void;
}

export function TableBasicsForm({
	name,
	setName,
	onSubmit,
	onCancel,
	loading,
	description,
	setDescription,
}: TableBasicsFormProps) {
	const { validateTableName } = useDatabase();
	const { showAlert } = useApp();

	return (
		<div className='space-y-6'>
			<div className='text-center'>
				<div className='flex items-center justify-center space-x-3 mb-3'>
					<div className='p-3 bg-primary/10 rounded-xl'>
						<Table2 className='h-6 w-6 text-primary' />
					</div>
				</div>
				<h3 className='text-lg font-semibold text-foreground mb-2'>
					Table Basics
				</h3>
				<p className='text-sm text-muted-foreground'>
					Define the basic information for your table
				</p>
			</div>

			<form onSubmit={onSubmit} className='space-y-6'>
				<div className='space-y-3'>
					<Label
						htmlFor='tableName'
						className='text-sm font-medium text-foreground'>
						Table Name
					</Label>
					<Input
						id='tableName'
						type='text'
						value={name}
						onChange={(e) => {
							if (validateTableName(e.target.value)) setName(e.target.value);
							else {
								showAlert(
									"This table name is already taken. Please choose a different name.",
									"error",
								);
								return;
							}
						}}
						placeholder='Enter table name'
						required
						className='table-name h-11 px-4 rounded-lg border-border/20 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'
					/>
				</div>

				<div className='space-y-3'>
					<Label
						htmlFor='tableDescription'
						className='text-sm font-medium text-foreground'>
						Description
					</Label>
					<Input
						id='tableDescription'
						type='text'
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						placeholder='Enter table description'
						required
						className='table-description h-11 px-4 rounded-lg border-border/20 bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors'
					/>
				</div>

				<div className='flex space-x-3 pt-6'>
					<Button
						type='submit'
						disabled={loading}
						className='add-table flex-1 h-11 rounded-lg shadow-sm hover:shadow-md transition-all duration-200'>
						{loading ? "Creating..." : "Create Table"}
					</Button>
					<Button
						type='button'
						variant='outline'
						onClick={onCancel}
						className='h-11 px-6 rounded-lg border-border/20 hover:bg-muted/50 transition-colors'>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
}
