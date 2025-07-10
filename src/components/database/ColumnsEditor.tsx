/** @format */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Column, ColumnSchema } from "@/types/database";
import { Plus, Trash2, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

interface ColumnEditorProps {
	columns: Column[];
	setColumns: (columns: Column[]) => void;
	columnsSchema: ColumnSchema[];
}

export function ColumnEditor({ columns, setColumns }: ColumnEditorProps) {
	const { showAlert } = useApp();
	const validateColumn = (col: Column): boolean => {
		return !columns.some((c) => c.name === col.name);
	};

	const addColumn = () => {
		const newColumn: Column = {
			name: "",
			type: "string",
			primary: false,
			autoIncrement: false,
			required: false,
			unique: false,
			defaultValue: "",
		};
		setColumns([...columns, newColumn]);
	};

	const removeColumn = (index: number) => {
		setColumns(columns.filter((_, i) => i !== index));
	};

	const updateColumn = (index: number, field: keyof Column, value: any) => {
		const newColumns = [...columns];
		newColumns[index] = { ...newColumns[index], [field]: value };

		if (validateColumn(newColumns[index])) setColumns(newColumns);
		else {
			showAlert("Column name unavailible", "error");
			return;
		}
	};

	return (
		<div className='w-full max-w-full'>
			<Card className='border-0 shadow-2xl bg-white'>
				<CardHeader className='text-center pb-4'>
					<div className='flex items-center justify-center space-x-2 mb-2'>
						<div className='p-2 bg-purple-100 rounded-lg'>
							<Database className='h-6 w-6 text-purple-600' />
						</div>
						<CardTitle className='text-2xl font-bold text-gray-900'>
							Table Schema
						</CardTitle>
					</div>
					<p className='text-gray-600'>Define the columns for your table</p>
				</CardHeader>
				<CardContent className='pt-0'>
					<div className='space-y-4'>
						{columns.length > 0 ? (
							columns.map((column, index) => (
								<Card
									key={`column-${index}`}
									className='border border-gray-200 bg-gray-50 relative'
									style={{ zIndex: 10 - index }}>
									<CardContent
										className={cn(
											column.name === "id" &&
												index === 0 &&
												"pointer-events-none",
											"p-4",
										)}>
										<div className='flex items-center justify-between mb-3'>
											<h4 className='font-medium text-gray-900'>
												Column {index + 1}
											</h4>
											<Button
												variant='ghost'
												size='sm'
												onClick={() => removeColumn(index)}
												className=' text-red-500 hover:text-red-700 hover:bg-red-50'>
												<Trash2 className='h-4 w-4' />
											</Button>
										</div>

										<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
											<div>
												<Label className='text-sm font-medium text-gray-700'>
													Name
												</Label>
												<Input
													value={column.name}
													onChange={(e) =>
														updateColumn(index, "name", e.target.value)
													}
													placeholder='Column name'
													className='mt-1 h-10 rounded-lg'
												/>
											</div>

											<div className='relative'>
												<Label className='text-sm font-medium text-gray-700'>
													Type
												</Label>
												<Select
													value={column.type}
													onValueChange={(value) =>
														updateColumn(index, "type", value)
													}>
													<SelectTrigger className='mt-1 h-10 rounded-lg bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'>
														<SelectValue placeholder='Select a type' />
													</SelectTrigger>
													<SelectContent
														className='z-[9999] bg-white border border-gray-200 shadow-lg'
														position='popper'
														sideOffset={4}
														align='start'>
														<SelectItem
															value='string'
															className='cursor-pointer hover:bg-gray-100 focus:bg-gray-100'>
															String
														</SelectItem>
														<SelectItem
															value='number'
															className='cursor-pointer hover:bg-gray-100 focus:bg-gray-100'>
															Number
														</SelectItem>
														<SelectItem
															value='boolean'
															className='cursor-pointer hover:bg-gray-100 focus:bg-gray-100'>
															Boolean
														</SelectItem>
														<SelectItem
															value='date'
															className='cursor-pointer hover:bg-gray-100 focus:bg-gray-100'>
															Date
														</SelectItem>
													</SelectContent>
												</Select>
											</div>

											<div>
												<Label className='text-sm font-medium text-gray-700'>
													Default Value
												</Label>
												<Input
													value={column.defaultValue}
													onChange={(e) =>
														updateColumn(index, "defaultValue", e.target.value)
													}
													placeholder='Default value'
													className='mt-1 h-10 rounded-lg'
												/>
											</div>
										</div>

										<div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4'>
											<div className='flex items-center space-x-2'>
												<Checkbox
													id={`primary-${index}`}
													checked={column.primary}
													onCheckedChange={(checked) =>
														updateColumn(index, "primary", checked)
													}
												/>
												<Label
													htmlFor={`primary-${index}`}
													className='text-sm text-gray-700 cursor-pointer'>
													Primary
												</Label>
											</div>

											<div className='flex items-center space-x-2'>
												<Checkbox
													id={`required-${index}`}
													checked={column.required}
													onCheckedChange={(checked) =>
														updateColumn(index, "required", checked)
													}
												/>
												<Label
													htmlFor={`required-${index}`}
													className='text-sm text-gray-700 cursor-pointer'>
													Required
												</Label>
											</div>

											<div className='flex items-center space-x-2'>
												<Checkbox
													id={`unique-${index}`}
													checked={column.unique}
													onCheckedChange={(checked) =>
														updateColumn(index, "unique", checked)
													}
												/>
												<Label
													htmlFor={`unique-${index}`}
													className='text-sm text-gray-700 cursor-pointer'>
													Unique
												</Label>
											</div>
											{column.type === "number" && (
												<div className='flex items-center space-x-2'>
													<Checkbox
														id={`auto-increment-${index}`}
														checked={column.autoIncrement}
														onCheckedChange={(checked) =>
															updateColumn(index, "autoIncrement", checked)
														}
													/>
													<Label
														htmlFor={`auto-increment-${index}`}
														className='text-sm text-gray-700 cursor-pointer'>
														Auto-increment
													</Label>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className='text-center py-8 text-gray-500'>
								<Database className='h-12 w-12 mx-auto mb-4 text-gray-400' />
								<p className='text-lg font-medium'>No columns added yet</p>
								<p className='text-sm text-gray-400 mt-1'>
									Click "Add Column" to get started
								</p>
							</div>
						)}

						<Button
							onClick={addColumn}
							variant='outline'
							className='w-full h-12 border-dashed border-2 border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all duration-200'>
							<Plus className='h-5 w-5 mr-2' />
							Add Column
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
