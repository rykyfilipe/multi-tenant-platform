/** @format */

"use client";

import { FormEvent } from "react";
import { Column } from "@/types/database";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Input } from "../..//ui/input";
import { Label } from "@radix-ui/react-label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../ui/select";

interface Props {
	columns: Column[];
	onAdd: (e: FormEvent) => void;
	newRow: Record<string, any>;
	setNewRow: (value: { [key: string]: any }) => void;
}

export function AddRowForm({ columns, onAdd, newRow, setNewRow }: Props) {
	return (
		<Card className='shadow-lg'>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<CardTitle className='text-xl'>Create New Row</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<form onSubmit={onAdd} className='space-y-4'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{columns.map((col) => (
							<div key={col.name}>
								<Label>
									{col.name}
									{col.required && " *"}
								</Label>
								{col.type === "boolean" ? (
									<Select
										value={newRow[col.name] ?? ""}
										onValueChange={(val) =>
											setNewRow({ ...newRow, [col.name]: val })
										}>
										<SelectTrigger>
											<SelectValue placeholder='Select' />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value='true'>True</SelectItem>
											<SelectItem value='false'>False</SelectItem>
										</SelectContent>
									</Select>
								) : (
									<Input
										type={
											col.type === "date"
												? "date"
												: col.type === "number"
												? "number"
												: "text"
										}
										value={newRow[col.name] ?? ""}
										onChange={(e) =>
											setNewRow({ ...newRow, [col.name]: e.target.value })
										}
										placeholder={`Enter ${col.name}`}
										required={col.required}
									/>
								)}
							</div>
						))}
					</div>
					<div className='flex justify-end'>
						<Button type='submit'>Add Row</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
