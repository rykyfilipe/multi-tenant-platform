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
		<Card className='border-0 shadow-2xl bg-white'>
			<CardHeader className='text-center pb-4'>
				<div className='flex items-center justify-center space-x-2 mb-2'>
					<div className='p-2 bg-blue-100 rounded-lg'>
						<Table2 className='h-6 w-6 ' />
					</div>
					<CardTitle className='text-2xl font-bold text-gray-900'>
						Table Basics
					</CardTitle>
				</div>
				<p className='text-gray-600'>
					Define the basic information for your table
				</p>
			</CardHeader>
			<CardContent className='pt-0'>
				<form onSubmit={onSubmit} className='space-y-6'>
					<div className='space-y-2'>
						<Label
							htmlFor='tableName'
							className='text-sm font-medium text-gray-700'>
							Table Name
						</Label>
						<Input
							id='tableName'
							type='text'
							value={name}
							onChange={(e) => {
								if (validateTableName(e.target.value)) setName(e.target.value);
								else {
									showAlert("Table name unavailible", "error");
									return;
								}
							}}
							placeholder='Enter table name'
							required
							className='table-name-input h-12 px-4 rounded-xl border-gray-200  focus:ring-black/25'
						/>
					</div>
					<div className='space-y-2'>
						<Label
							htmlFor='tableName'
							className='text-sm font-medium text-gray-700'>
							Table Name
						</Label>
						<Input
							id='tableDescription'
							type='text'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder='Enter table description'
							required
							className='table-description-input h-12 px-4 rounded-xl border-gray-200  focus:ring-black/25'
						/>
					</div>

					<div className='flex space-x-3 pt-4'>
						<Button
							type='submit'
							disabled={loading}
							className='flex-1 h-12  text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200'>
							{loading ? "Creating..." : "Create Table"}
						</Button>
						<Button
							type='button'
							variant='outline'
							onClick={onCancel}
							className='submit-table-data h-12 px-6 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl'>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
