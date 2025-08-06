/** @format */

"use client";

import { FormEvent, useCallback, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "@radix-ui/react-label";
import { Badge } from "../ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Role, UserSchema } from "@/types/user";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Users } from "lucide-react";

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
};

export function AddRowForm({ newUser, setNewUser, onAdd }: Props) {
	if (!newUser) return null;

	const { checkLimit, currentPlan } = usePlanLimits();

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
								{Object.values(Role).map((role) => {
									if (role === "ADMIN") return null;

									return (
										<SelectItem key={role} value={role}>
											{role}
										</SelectItem>
									);
								})}
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
		<div className='space-y-6'>
			{/* Header */}
			<div className='text-center'>
				<div className='flex items-center justify-center space-x-3 mb-3'>
					<div className='p-3 bg-primary/10 rounded-xl'>
						<svg
							className='w-6 h-6 text-primary'
							fill='none'
							stroke='currentColor'
							viewBox='0 0 24 24'>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={2}
								d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
							/>
						</svg>
					</div>
				</div>
				<h3 className='text-lg font-semibold text-foreground mb-2'>
					Invite New Team Member
				</h3>
				<p className='text-sm text-muted-foreground'>
					Send an invitation email to add a new team member
				</p>
			</div>

			{/* Plan Limit Info */}
			{(() => {
				const userLimit = checkLimit("users");
				return (
					<div className='p-3 bg-blue-50 rounded-lg border border-blue-200'>
						<div className='flex items-center justify-between mb-2'>
							<div className='flex items-center gap-2'>
								<Users className='w-4 h-4 text-blue-600' />
								<span className='text-sm font-medium text-blue-900'>
									User Limit
								</span>
							</div>
							<Badge
								variant={userLimit.allowed ? "default" : "destructive"}
								className='text-xs'>
								{userLimit.current} / {userLimit.limit}
							</Badge>
						</div>
						<p className='text-xs text-blue-700'>
							{userLimit.allowed
								? `You can add ${
										userLimit.limit - userLimit.current
								  } more user(s)`
								: "You've reached your plan limit. Upgrade to add more users."}
						</p>
					</div>
				);
			})()}

			{/* Form */}
			<form onSubmit={handleSubmit} className='space-y-6'>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
						onClick={() => setNewUser(null)}
						className='px-6'>
						Cancel
					</Button>
					<Button
						type='submit'
						disabled={!formValidation.isValid || !checkLimit("users").allowed}
						className={`px-6 ${
							!checkLimit("users").allowed ? "opacity-50" : ""
						}`}>
						Send Invitation
					</Button>
				</div>
			</form>
		</div>
	);
}
