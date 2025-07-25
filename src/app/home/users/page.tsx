/** @format */

"use client";

import Loading from "@/components/loading";
import TableEditor from "@/components/users/TableEditor";
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
	const { loading } = useApp();
	const { users, setUsers } = useUsers();

	if (loading) return <Loading message='users' />;
	if (!loading && !users) return <Loading message='users' />;
	
	return (
		<div className='max-w-7xl mx-auto p-6 bg-white shadow-md rounded-lg'>
			<TableEditor users={users} setUsers={setUsers} />
		</div>
	);
}
