/** @format */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Database, Settings2, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { EditableCell } from "./EditableCell";
import { User } from "@/types/user";
import { Role } from "@/types/user";
import { useApp } from "@/contexts/AppContext";
import Link from "next/link";

interface Props {
	users: User[];
	editingCell: { userId: string; fieldName: string } | null;
	onEditCell: (userId: string, fieldName: string) => void;
	onSaveCell: (userId: string, fieldName: keyof User, value: any) => void;
	onCancelEdit: () => void;
	onDeleteRow: (userId: string) => void;
}

interface UserCols {
	firstName: string;
	lastName: string;
	email: string;
	role: Role;
}
export function TableView({
	users,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteRow,
}: Props) {
	const { user: curentUser } = useApp();

	const mockUser: UserCols = {
		email: "mock",
		firstName: "mock",
		lastName: "mock",
		role: Role.VIEWER,
	};

	return (
		<div className='border border-border/20 bg-card/50 backdrop-blur-sm rounded-lg overflow-hidden'>
			{/* Table Header */}
			<div className='flex items-center justify-between p-4 border-b border-border/20 bg-muted/30'>
				<div className='flex items-center gap-3'>
					<div className='p-2 bg-primary/10 rounded-lg'>
						<svg
							className='w-4 h-4 text-primary'
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
					<div>
						<h3 className='text-sm font-semibold text-foreground'>
							Team Members
						</h3>
						<p className='text-xs text-muted-foreground'>
							{users.length} user{users.length !== 1 && "s"}
						</p>
					</div>
				</div>
			</div>

			{/* Table Content */}
			<div
				className='overflow-auto'
				style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
				{users.length === 0 ? (
					<div className='text-center py-12'>
						<div className='p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4'>
							<svg
								className='w-8 h-8 text-muted-foreground'
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
						<h3 className='text-lg font-medium text-foreground mb-2'>
							No team members yet
						</h3>
						<p className='text-sm text-muted-foreground'>
							Start by adding your first team member to collaborate on projects.
						</p>
					</div>
				) : (
					<table className='w-full'>
						<thead>
							<tr className='bg-muted/20'>
								{(Object.keys(mockUser) as (keyof UserCols)[]).map((key) => (
									<th
										key={crypto.randomUUID()}
										className='text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 text-left'>
										{key}
									</th>
								))}
								{curentUser.role === "ADMIN" && (
									<th className='text-xs font-medium text-muted-foreground uppercase tracking-wider p-4 text-right'>
										Actions
									</th>
								)}
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr
									key={user.id}
									className='hover:bg-muted/30 transition-colors border-b border-border/10'>
									{(Object.keys(user) as (keyof User)[]).map((key) => {
										if (key === "id") return null; // Skip ID column
										return (
											<td key={crypto.randomUUID()} className='p-4'>
												<EditableCell
													field={key}
													user={user}
													isEditing={
														editingCell?.userId === user.id.toString() &&
														editingCell.fieldName === key
													}
													onStartEdit={() => {
														onEditCell(user.id.toString(), key);
													}}
													onSave={(val) => {
														onSaveCell(user.id.toString(), key, val);
													}}
													onCancel={onCancelEdit}
												/>
											</td>
										);
									})}
									{curentUser.role === "ADMIN" && (
										<td className='p-4'>
											<div className='flex items-center justify-end gap-2'>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => onDeleteRow(user.id.toString())}
													className='h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10'>
													<Trash2 className='w-4 h-4' />
												</Button>
												<Link href={`/home/users/permisions/${user.id}`}>
													<Button
														variant='outline'
														size='sm'
														className='h-8 px-3 text-xs'>
														<Settings2 className='w-4 h-4 mr-1' />
														Permissions
													</Button>
												</Link>
											</div>
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
