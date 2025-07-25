/** @format */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Database, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { EditableCell } from "./EditableCell";
import { User, UserSchema } from "@/types/user";
import { Role } from "@/types/user";
import { useApp } from "@/contexts/AppContext";

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
		<Card className='shadow-lg'>
			<CardHeader>
				<div className='flex items-center gap-2'>
					<Database />
					<CardTitle>Table Data</CardTitle>
					<span className='ml-auto'>
						{users.length} row{users.length !== 1 && "s"}
					</span>
				</div>
			</CardHeader>
			<CardContent>
				<div
					className='overflow-auto'
					style={{
						scrollbarWidth: "none",
						msOverflowStyle: "none",
					}}>
					{users.length === 0 ? (
						<div>
							<span className='text-center py-8'>No data yet.</span>
						</div>
					) : (
						<table className='w-full'>
							<thead>
								<tr>
									{(Object.keys(mockUser) as (keyof UserCols)[]).map((key) => (
										<th
											key={crypto.randomUUID()}
											className=' font-semibold text-start'>
											{key}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{users.map((user) => (
									<tr key={user.id}>
										{(Object.keys(user) as (keyof User)[]).map((key) => {
											if (key === "id") return null; // Skip ID column
											return (
												<td key={crypto.randomUUID()}>
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
											<td>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => onDeleteRow(user.id.toString())}>
													<Trash2 />
												</Button>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
