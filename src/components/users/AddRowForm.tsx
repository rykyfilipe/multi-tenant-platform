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
import { usePlanPermissions } from "@/hooks/usePlanPermissions";
import { Users } from "lucide-react";

interface Props {
	onAdd: (e: FormEvent) => void;
	newUser: UserSchema | null;
	setNewUser: React.Dispatch<React.SetStateAction<UserSchema | null>>;
	serverError?: string | null; // Add server error prop
}

type FieldType = "string" | "text" | "number" | "boolean" | "date" | "role";

const userFieldTypes: Record<keyof UserSchema, FieldType> = {
	email: "string",
	role: "role",
};

export function AddRowForm({ newUser, setNewUser, onAdd, serverError }: Props) {
	if (!newUser) return null;

	const { checkLimit, currentPlan } = usePlanLimits();
	const { canCreateUser } = usePlanPermissions();

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
			case "text":
			default:
				// Match backend validation: email must be valid
				if (key === "email") {
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					return typeof value === "string" && emailRegex.test(value);
				}
				return typeof value === "string" && value.trim() !== "";
		}
	};

	const formValidation = useMemo(() => {
		const errors: string[] = [];
		// Only validate if there's a server error
		if (serverError) {
			(Object.keys(userFieldTypes) as (keyof UserSchema)[]).forEach((key) => {
				const val = newUser[key];
				if (!validateField(key, val)) {
					// Provide specific error messages
					if (key === "email") {
						errors.push("Email must be a valid email address");
					} else if (key === "role") {
						errors.push("Please select a valid role");
					} else {
						errors.push(`Field "${key}" is invalid or missing`);
					}
				}
			});
		}
		return { isValid: errors.length === 0, errors };
	}, [newUser, serverError]);

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
		onAdd(e);
	};

	const renderField = (key: keyof UserSchema) => {
		const type = userFieldTypes[key];
		const value = newUser[key];
		const error = serverError && !validateField(key, value);

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
			case "text":
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
					Send an invitation email with role assignment to add a new team member
				</p>
			</div>

			{/* Plan Limit Info */}
			{(() => {
				const userLimit = checkLimit("users");
				const userPermission = canCreateUser();

				return (
					<div
						className={`p-3 rounded-lg border ${
							userPermission.allowed
								? "bg-blue-50 border-blue-200"
								: "bg-orange-50 border-orange-200"
						}`}>
						<div className='flex items-center justify-between mb-2'>
							<div className='flex items-center gap-2'>
								<Users
									className={`w-4 h-4 ${
										userPermission.allowed ? "text-blue-600" : "text-orange-600"
									}`}
								/>
								<span
									className={`text-sm font-medium ${
										userPermission.allowed ? "text-blue-900" : "text-orange-900"
									}`}>
									User Limit
								</span>
							</div>
							<Badge
								variant={userPermission.allowed ? "default" : "destructive"}
								className='text-xs'>
								{userLimit.current} / {userLimit.limit}
							</Badge>
						</div>
						<p
							className={`text-xs ${
								userPermission.allowed ? "text-blue-700" : "text-orange-700"
							}`}>
							{userPermission.allowed
								? userLimit.allowed
									? `You can add ${
											userLimit.limit - userLimit.current
									  } more user(s)`
									: "You've reached your plan limit. Upgrade to add more users."
								: userPermission.reason ||
								  "User creation not available in your plan"}
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

				{/* Validation Errors - only show when there's a server error */}
				{serverError && !formValidation.isValid && (
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
						className='px-4'>
						Cancel
					</Button>
					<Button
						type='submit'
						disabled={!canCreateUser().allowed}
						className={`px-6 ${!canCreateUser().allowed ? "opacity-50" : ""}`}>
						Send Invitation
					</Button>
				</div>
			</form>
		</div>
	);
}
