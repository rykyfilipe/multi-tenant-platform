/** @format */

"use client";

import { User } from "@/types/user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, User as UserIcon } from "lucide-react";

interface UsersReadOnlyViewProps {
	users: User[] | null;
}

export function UsersReadOnlyView({ users }: UsersReadOnlyViewProps) {
	if (!users || users.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='w-5 h-5' />
						Team Members
					</CardTitle>
					<CardDescription>No team members found</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Users Grid */}
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{users.map((user) => (
					<Card key={user.id} className='hover:shadow-md transition-shadow'>
						<CardHeader className='pb-3'>
							<div className='flex items-center gap-3'>
								<div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
									<UserIcon className='w-5 h-5 text-primary' />
								</div>
								<div className='flex-1'>
									<CardTitle className='text-base'>
										{user.firstName} {user.lastName}
									</CardTitle>
									<CardDescription className='text-sm'>
										{user.email}
									</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className='pt-0'>
							<div className='flex items-center justify-between'>
								<Badge 
									variant={user.role === 'ADMIN' ? 'default' : 'outline'}
									className={user.role === 'ADMIN' ? 'bg-blue-100 text-blue-800' : ''}
								>
									{user.role}
								</Badge>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Summary Card */}
			<Card>
				<CardHeader>
					<CardTitle className='flex items-center gap-2'>
						<Users className='w-5 h-5' />
						Team Summary
					</CardTitle>
					<CardDescription>
						Overview of your team composition
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
						<div className='text-center'>
							<div className='text-2xl font-bold text-primary'>
								{users.length}
							</div>
							<div className='text-sm text-muted-foreground'>
								Total Members
							</div>
						</div>
						<div className='text-center'>
							<div className='text-2xl font-bold text-blue-600'>
								{users.filter(u => u.role === 'ADMIN').length}
							</div>
							<div className='text-sm text-muted-foreground'>
								Admins
							</div>
						</div>
						<div className='text-center'>
							<div className='text-2xl font-bold text-green-600'>
								{users.filter(u => u.role === 'EDITOR').length}
							</div>
							<div className='text-sm text-muted-foreground'>
								Editors
							</div>
						</div>
						<div className='text-center'>
							<div className='text-2xl font-bold text-gray-600'>
								{users.filter(u => u.role === 'VIEWER').length}
							</div>
							<div className='text-sm text-muted-foreground'>
								Viewers
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 