/** @format */

"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";
import { Role, User } from "@/types/user";
import { fi } from "date-fns/locale";
import { useApp } from "@/contexts/AppContext";

interface Props {
	field: keyof User;
	user: User;
	isEditing: boolean;
	onStartEdit: () => void;
	onSave: (value: any) => void;
	onCancel: () => void;
}

export function EditableCell({
	field,
	user,
	isEditing,
	onStartEdit,
	onSave,
	onCancel,
}: Props) {
	const [value, setValue] = useState<any>(user[field]);
	const { user: curentUser } = useApp();
	// Actualizează valoarea locală dacă user sau field se schimbă
	useEffect(() => {
		setValue(user[field]);
	}, [user, field]);

	// Detectează dacă valoarea este o dată (Date object sau string valid)
	function isDate(value: any): boolean {
		return (
			value instanceof Date ||
			(typeof value === "string" && !isNaN(Date.parse(value)))
		);
	}

	// Obține tipul inputului pentru <Input>
	function getInputType(value: any): "text" | "number" | "date" {
		if (isDate(value)) return "date";
		if (typeof value === "number") return "number";
		return "text";
	}

	// Verifică dacă valoarea e unul din rolurile enum Role
	function isRole(value: any): value is Role {
		return Object.values(Role).includes(value);
	}

	// Gestionarea tastelor Enter/Escape
	function handleKey(e: KeyboardEvent<HTMLInputElement>) {
		if (e.key === "Enter") onSave(value);
		if (e.key === "Escape") onCancel();
	}

	if (isEditing) {
		return (
			<div className='flex items-center gap-2'>
				{typeof value === "boolean" ? (
					<Select
						value={value ? "true" : "false"}
						onValueChange={(v) => setValue(v === "true")}>
						<SelectTrigger className='w-[100px] h-8 text-sm'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='true'>True</SelectItem>
							<SelectItem value='false'>False</SelectItem>
						</SelectContent>
					</Select>
				) : isRole(value) ? (
					<Select value={value} onValueChange={(v) => setValue(v as Role)}>
						<SelectTrigger className='w-[150px] h-8 text-sm'>
							<SelectValue placeholder='Select role' />
						</SelectTrigger>
						<SelectContent>
							{Object.values(Role).map((role) => (
								<SelectItem key={role} value={role}>
									{role}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Input
						className='w-max h-8 text-sm'
						type={getInputType(value)}
						value={
							isDate(value) ? String(value).slice(0, 10) : String(value ?? "")
						}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={handleKey}
						autoFocus
					/>
				)}

				<Button
					variant='ghost'
					size='sm'
					onClick={() => {
						onSave(value);
					}}
					aria-label='Save'
					className='h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50'>
					✓
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={onCancel}
					aria-label='Cancel'
					className='h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50'>
					✕
				</Button>
			</div>
		);
	}

	let display: string;
	if (value == null || value === "") display = "Empty";
	else if (typeof value === "boolean") display = value ? "True" : "False";
	else if (isDate(value)) {
		const date = new Date(value);
		display = date.toLocaleDateString();
	} else display = String(value);

	return (
		<div
			onDoubleClick={onStartEdit}
			title='Double-click to edit'
			className={`cursor-pointer select-none hover:bg-muted/30 px-2 py-1 rounded transition-colors ${
				display === "Empty" ? "text-muted-foreground italic" : "text-foreground"
			}`}>
			{display}
		</div>
	);
}
