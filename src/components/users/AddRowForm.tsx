/** @format */

"use client";

import { FormEvent, useCallback, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Role, UserSchema } from "@/types/user";

interface Props {
	onAdd: (e: FormEvent) => void;
	newUser: UserSchema | null;
	setNewUser: React.Dispatch<React.SetStateAction<UserSchema | null>>;
}

type FieldType = "string" | "number" | "boolean" | "date" | "role";

const userFieldTypes: Record<keyof UserSchema, FieldType> = {
	email: "string",
	firstName: "string",
	lastName: "string",
	role: "role",
	password: "string", // corrected typo from 'passwod'
};

export function AddRowForm({ newUser, setNewUser, onAdd }: Props) {
	

	if (!newUser) return null;

	const validateField = (key: keyof UserSchema, value: any): boolean => {
		const type = userFieldTypes[key];
		switch (type) {
			case "number":
				return typeof value === "number" && !isNaN(value);
			case "boolean":
				return typeof value === "boolean";
			case "date":
				return !isNaN(Date.parse(value));
			case "role":
				return Object.values(Role).includes(value);
			case "string":
			default:
				return typeof value === "string" && value.trim() !== "";
		}
	};

	const formValidation = useMemo(() => {
		const errors: string[] = [];
		(Object.keys(userFieldTypes) as (keyof UserSchema)[]).forEach((key) => {
			const val = newUser[key];
			if (!validateField(key, val)) {
				errors.push(`Field "${key}" is invalid or missing`);
			}
		});
		return { isValid: errors.length === 0, errors };
	}, [newUser]);

	const handleChange = (key: keyof UserSchema, value: any) => {
		setNewUser((prev) =>
			prev
				? {
						...prev,
						[key]:
							userFieldTypes[key] === "number"
								? Number(value)
								: userFieldTypes[key] === "role"
								? value
								: value,
				  }
				: prev,
		);
	};

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (!formValidation.isValid) return;
		onAdd(e);
	};

	const renderField = (key: keyof UserSchema) => {
		const type = userFieldTypes[key];
		const value = newUser[key];
		const error = !validateField(key, value);

		const labelClass = error ? "text-destructive" : "";
		const inputClass = error ? "border-destructive" : "";

		switch (type) {
			case "number":
				return (
					<div key={key} className='space-y-2'>
						<Label className={labelClass}>{key}</Label>
						<Input
							type='number'
							value={Number(value)}
							onChange={(e) => handleChange(key, e.target.value)}
							className={inputClass}
							required
						/>
					</div>
				);
			case "role":
				return (
					<div key={key} className='space-y-2'>
						<Label className={labelClass}>{key}</Label>
						<Select
							value={value as Role}
							onValueChange={(val) => handleChange(key, val as Role)}>
							<SelectTrigger className={inputClass}>
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
					</div>
				);
			case "string":
			default:
				return (
					<div key={key} className='space-y-2'>
						<Label className={labelClass}>{key}</Label>
						<Input
							type='text'
							value={value as string}
							onChange={(e) => handleChange(key, e.target.value)}
							className={inputClass}
							required
						/>
					</div>
				);
		}
	};

	return (
		<Card className='shadow-lg border-0 bg-gradient-to-br from-background to-muted/20'>
			<CardHeader className='pb-4'>
				<CardTitle className='text-xl font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent'>
					Create New User
				</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className='space-y-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
						{(Object.keys(userFieldTypes) as (keyof UserSchema)[]).map(
							renderField,
						)}
					</div>

					{/* Validation Errors */}
					{!formValidation.isValid && (
						<div className='p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
							<p className='text-sm font-medium text-destructive mb-2'>
								Please fix the following errors:
							</p>
							<ul className='text-sm text-destructive-foreground space-y-1'>
								{formValidation.errors.map((error, i) => (
									<li key={i} className='flex items-start gap-2'>
										<span className='text-destructive'>•</span>
										{error}
									</li>
								))}
							</ul>
						</div>
					)}

					{/* Buttons */}
					<div className='flex justify-end space-x-3 pt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setNewUser(null)}>
							Clear
						</Button>
						<Button
							type='submit'
							disabled={!formValidation.isValid}
							className='min-w-[120px]'>
							Add User
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
