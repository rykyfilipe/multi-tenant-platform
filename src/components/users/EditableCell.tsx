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
						<SelectTrigger className='w-[100px]'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='true'>True</SelectItem>
							<SelectItem value='false'>False</SelectItem>
						</SelectContent>
					</Select>
				) : isRole(value) ? (
					<Select value={value} onValueChange={(v) => setValue(v as Role)}>
						<SelectTrigger className='w-[150px]'>
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
						className='w-max'
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
					aria-label='Save'>
					✓
				</Button>
				<Button
					variant='ghost'
					size='sm'
					onClick={onCancel}
					aria-label='Cancel'>
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
			className={`cursor-pointer select-none ${
				display === "Empty" ? "text-gray-500 italic text-start" : ""
			}`}>
			{display}
		</div>
	);
}
