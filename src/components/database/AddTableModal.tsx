/** @format */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableBasicsForm } from "./TableBasicForm";
import { ColumnEditor } from "./ColumnsEditor";
import { Column, Table } from "@/types/database";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddTableModalProps {
	isOpen: boolean;
	onClose: () => void;
	name: string;
	setName: (name: string) => void;
	columns: Column[];
	setColumns: (columns: Column[]) => void;
	onSubmit: (e: React.FormEvent) => void;
	loading: boolean;
	selectedTable: Table | null;
	setSelectedTable: (table: Table) => void;
}

export function AddTableModal({
	isOpen,
	onClose,
	name,
	setName,
	columns,
	setColumns,
	onSubmit,
	loading,
}: AddTableModalProps) {
	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in'>
			<div className='bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
				<div className='flex items-center justify-between p-6 border-b border-gray-200'>
					<h2 className='text-2xl font-bold text-gray-900'>
						{name ? name : "Create new Table"}
					</h2>
					<Button
						variant='ghost'
						size='sm'
						onClick={onClose}
						className='text-gray-400 hover:text-gray-600'>
						<X className='h-6 w-6' />
					</Button>
				</div>

				<div className='p-6 overflow-y-auto max-h-[calc(90vh-80px)]'>
					<Tabs defaultValue='table-basics' className='w-full'>
						<TabsList className='grid w-full grid-cols-2 mb-6 bg-gray-100 rounded-xl p-1'>
							<TabsTrigger
								value='table-basics'
								className='rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm'>
								Table Basics
							</TabsTrigger>
							<TabsTrigger
								value='tableSchema'
								className='rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm'>
								Table Schema
							</TabsTrigger>
						</TabsList>

						<TabsContent value='table-basics' className='mt-0'>
							<TableBasicsForm
								name={name}
								setName={setName}
								onSubmit={onSubmit}
								onCancel={onClose}
								loading={loading}
							/>
						</TabsContent>

						<TabsContent value='tableSchema' className='mt-0'>
							<ColumnEditor
								columns={columns}
								setColumns={setColumns}
							/>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</div>
	);
}
