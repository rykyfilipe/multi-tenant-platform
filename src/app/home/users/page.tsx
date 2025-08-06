/** @format */

"use client";

import { UsersLoadingState } from "@/components/ui/loading-states";
import TableEditor from "@/components/users/TableEditor";
import { InvitationsList } from "@/components/users/InvitationsList";
import { useApp } from "@/contexts/AppContext";
import { UsersProvider, useUsers } from "@/contexts/UsersContext";

export default function UsersPage() {
	return (
		<UsersProvider>
			<UsersContent />
		</UsersProvider>
	);
}

function UsersContent() {
	const { loading, tenant } = useApp();
	const { users, setUsers } = useUsers();

	if (loading) return <UsersLoadingState />;
	if (!loading && !users) return <UsersLoadingState />;

	return (
		<div className='h-full bg-background'>
			{/* Header */}
			<div className='border-b border-border/20 bg-background/80 backdrop-blur-sm sticky top-0 z-50'>
				<div className='flex items-center justify-between px-6 py-4'>
					<div className='flex items-center space-x-4'>
						<div>
							<h1 className='text-xl font-semibold text-foreground'>
								User Management
							</h1>
							<p className='text-sm text-muted-foreground'>
								Manage team members, permissions, and access controls
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-3'>
						<div className='text-sm text-muted-foreground'>
							{users?.length || 0} users
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className='p-6 max-w-7xl mx-auto space-y-6'>
				<TableEditor users={users} setUsers={setUsers} />
				<InvitationsList tenantId={tenant?.id || 0} />
			</div>
		</div>
	);
}
