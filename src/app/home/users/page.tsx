/** @format */

"use client";

import Loading from "@/components/loading";
import UsersHeader from "@/components/users/UsersHeader";
import UsersTable from "@/components/users/UsersTable";
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
	const { users, handleAddUser,handleUpdateUser } = useUsers();
	const { loading } = useApp();
	return (
		<div className='min-h-screen bg-gray-50 p-6'>
			<div className='max-w-7xl mx-auto space-y-10'>
				<UsersHeader addUser={handleAddUser} />
				{loading || users.length === 0 ? (
					<Loading message='users' />
				) : (
					<UsersTable
						users={users}
						onUpdate={(updatedUser) => {
							handleUpdateUser(updatedUser);
						}}
					/>
				)}
			</div>
		</div>
	);
}
