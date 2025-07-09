/** @format */

import { useState, useCallback, useMemo, useEffect } from "react";
import { Users as UsersIcon } from "lucide-react";
import { Role, User } from "@/types/user";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface Props {
	users: User[];
	onUpdate?: (user: User) => void;
	isLoading?: boolean;
}

interface EditingCell {
	id: number;
	field: keyof User;
}

function UsersTable({ users, onUpdate, isLoading = false }: Props) {
	const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
	const [tempValue, setTempValue] = useState<string>("");
	const [error, setError] = useState<string | null>(null);

	// Memoized role options to avoid recreation on every render
	const roleOptions = useMemo(
		() => Object.values(Role).filter((role) => role !== Role.ADMIN),
		[],
	);

	// Email validation
	const isValidEmail = useCallback((email: string): boolean => {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}, []);

	// Field validation
	const validateField = useCallback(
		(field: keyof User, value: string): string | null => {
			if (!value.trim()) {
				return `${field} cannot be empty`;
			}

			if (field === "email" && !isValidEmail(value)) {
				return "Please enter a valid email address";
			}

			if ((field === "firstName" || field === "lastName") && value.length < 2) {
				return `${field} must be at least 2 characters long`;
			}

			return null;
		},
		[isValidEmail],
	);

	const startEditing = useCallback(
		(userId: number, field: keyof User, currentValue: string | Role) => {
			setEditingCell({ id: userId, field });
			setTempValue(
				typeof currentValue === "string"
					? currentValue
					: (currentValue as Role).toString(),
			);
			setError(null);
		},
		[],
	);

	const stopEditing = useCallback(
		(user: User) => {
			if (!editingCell || editingCell.field === "role") return;
			const trimmedValue = tempValue.trim();
			const validationError = validateField(editingCell.field, trimmedValue);

			if (validationError) {
				setError(validationError);
				return;
			}

			const updatedUser = { ...user, [editingCell.field]: trimmedValue };

			try {
				onUpdate?.(updatedUser);
				setEditingCell(null);
				setError(null);
			} catch (err) {
				setError("Failed to update user");
			}
		},
		[editingCell, tempValue, validateField, onUpdate],
	);
	const cancelEditing = useCallback(() => {
		setEditingCell(null);
		setError(null);
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>, user: User) => {
			if (e.key === "Enter") {
				e.preventDefault();
				stopEditing(user);
			}
			if (e.key === "Escape") {
				e.preventDefault();
				cancelEditing();
			}
		},
		[stopEditing, cancelEditing],
	);

	const handleSelectChange = useCallback(
		(value: string, user: User) => {
			setTempValue(value);
			// Update the user immediately with the new role
			const updatedUser = { ...user, role: value as Role };
			onUpdate?.(updatedUser);
			setEditingCell(null);
		},
		[onUpdate],
	);

	// Early return for empty state
	if (users.length === 0) {
		return (
			<div className='text-center py-16'>
				<div className='p-4 bg-muted rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center'>
					<UsersIcon className='h-12 w-12 text-muted-foreground' />
				</div>
				<h3 className='text-xl font-semibold text-muted-foreground mb-2'>
					No users found
				</h3>
				<p className='text-sm text-muted-foreground'>Create users first</p>
			</div>
		);
	}

	const tableFields: (keyof User)[] = ["firstName", "lastName", "email"];

	return (
		<div className='overflow-x-auto select-none'>
			{error && (
				<div className='mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md'>
					<p className='text-sm text-destructive'>{error}</p>
				</div>
			)}

			<table className='min-w-full border border-muted rounded-md bg-background'>
				<thead className='bg-muted text-left'>
					<tr>
						<th className='p-3 font-semibold'>First Name</th>
						<th className='p-3 font-semibold'>Last Name</th>
						<th className='p-3 font-semibold'>Email</th>
						<th className='p-3 font-semibold'>Role</th>
					</tr>
				</thead>
				<tbody>
					{users.map((user) => (
						<tr
							key={user.id}
							className={`hover:bg-muted/30 transition-colors ${
								isLoading ? "opacity-50 pointer-events-none" : ""
							}`}>
							{tableFields.map((field) => (
								<td
									key={field}
									className='p-3 cursor-pointer'
									onDoubleClick={() =>
										!isLoading &&
										startEditing(user.id, field, user[field] as string)
									}
									title='Double-click to edit'>
									{editingCell?.id === user.id &&
									editingCell.field === field ? (
										<Input
											value={tempValue}
											onChange={(e) => setTempValue(e.target.value)}
											onBlur={() => stopEditing(user)}
											onKeyDown={(e) => handleKeyDown(e, user)}
											autoFocus
											className={error ? "border-destructive" : ""}
											disabled={isLoading}
										/>
									) : (
										<span className='block py-1'>
											{user[field] || (
												<em className='text-muted-foreground'>Empty</em>
											)}
										</span>
									)}
								</td>
							))}

							{/* Role Column */}
							<td
								className='p-3 cursor-pointer'
								onDoubleClick={() =>
									!isLoading && startEditing(user.id, "role", user.role)
								}
								title='Double-click to edit'>
								{editingCell?.id === user.id && editingCell.field === "role" ? (
									<Select
										value={tempValue}
										onValueChange={(val) => handleSelectChange(val, user)}
										disabled={isLoading}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{roleOptions.map((role) => (
												<SelectItem key={role} value={role.toString()}>
													{role}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								) : (
									<span className='block py-1 capitalize'>{user.role}</span>
								)}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{/* Loading overlay */}
			{isLoading && (
				<div className='absolute inset-0 bg-background/50 flex items-center justify-center'>
					<div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
				</div>
			)}
		</div>
	);
}

export default UsersTable;
