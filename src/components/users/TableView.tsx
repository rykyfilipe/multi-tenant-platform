/** @format */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Settings2, Trash2, Mail, User as UserIcon, Crown, Eye, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { User } from "@/types/user";
import { Role } from "@/types/user";
import { useApp } from "@/contexts/AppContext";
import Link from "next/link";

interface Props {
	users: User[];
	editingCell?: { userId: string; fieldName: string } | null;
	onEditCell?: (userId: string, fieldName: string) => void;
	onSaveCell?: (userId: string, fieldName: keyof User, value: any) => void;
	onCancelEdit?: () => void;
	onDeleteRow: (userId: string) => void;
}

const getRoleIcon = (role: Role) => {
	switch (role) {
		case Role.ADMIN:
			return <Crown className="w-4 h-4" />;
		case Role.EDITOR:
			return <Edit className="w-4 h-4" />;
		case Role.VIEWER:
			return <Eye className="w-4 h-4" />;
		default:
			return <UserIcon className="w-4 h-4" />;
	}
};

const getRoleColor = (role: Role) => {
	switch (role) {
		case Role.ADMIN:
			return "bg-gradient-to-r from-purple-500 to-pink-500 text-white";
		case Role.EDITOR:
			return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white";
		case Role.VIEWER:
			return "bg-gradient-to-r from-gray-500 to-slate-500 text-white";
		default:
			return "bg-gray-100 text-gray-700";
	}
};

const getInitials = (firstName: string, lastName: string) => {
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export function TableView({
	users,
	editingCell,
	onEditCell,
	onSaveCell,
	onCancelEdit,
	onDeleteRow,
}: Props) {
	const { user: currentUser } = useApp();

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl">
						<UserIcon className="w-6 h-6 text-primary" />
					</div>
					<div>
						<h2 className="text-xl font-semibold text-foreground">
							Team Members
						</h2>
						<p className="text-sm text-muted-foreground">
							{users.length} member{users.length !== 1 && "s"} in your team
						</p>
					</div>
				</div>
			</div>

			{/* Users Grid */}
			{users.length === 0 ? (
				<Card className="border-dashed border-2 border-muted-foreground/20">
					<CardContent className="text-center py-16">
						<div className="p-4 bg-muted/30 rounded-full w-fit mx-auto mb-4">
							<UserIcon className="w-8 h-8 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-medium text-foreground mb-2">
							No team members yet
						</h3>
						<p className="text-sm text-muted-foreground max-w-md mx-auto">
							Start by adding your first team member to collaborate on projects and share data.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{users.map((user) => (
						<Card key={user.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/20 bg-card/50 backdrop-blur-sm">
							<CardContent className="p-6">
								{/* Profile Section */}
								<div className="flex items-center gap-4 mb-4">
									<Avatar className="w-16 h-16 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
										<AvatarImage 
											src={user.profileImage} 
											alt={`${user.firstName} ${user.lastName}`}
										/>
										<AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary font-semibold text-lg">
											{getInitials(user.firstName, user.lastName)}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1 min-w-0">
										<h3 className="font-semibold text-foreground truncate">
											{user.firstName} {user.lastName}
										</h3>
										<div className="flex items-center gap-2 mt-1">
											<Badge 
												variant="secondary" 
												className={`${getRoleColor(user.role)} border-0 text-xs font-medium`}
											>
												{getRoleIcon(user.role)}
												<span className="ml-1">{user.role}</span>
											</Badge>
										</div>
									</div>
								</div>

								{/* Contact Info */}
								<div className="space-y-2 mb-4">
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Mail className="w-4 h-4" />
										<span className="truncate">{user.email}</span>
									</div>
								</div>

								{/* Actions */}
								{currentUser?.role === "ADMIN" && (
									<div className="flex items-center gap-2 pt-4 border-t border-border/10">
										<Link href={`/home/users/permisions/${user.id}`} className="flex-1">
											<Button
												variant="outline"
												size="sm"
												className="w-full text-xs h-8"
											>
												<Settings2 className="w-3 h-3 mr-1" />
												Permissions
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => onDeleteRow(user.id.toString())}
											className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
										>
											<Trash2 className="w-4 h-4" />
										</Button>
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
