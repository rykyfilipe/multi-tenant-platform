/** @format */

"use client";

import { Button } from "@/components/ui/button";

import { useApp } from "@/contexts/AppContext";
import { Plus, Users } from "lucide-react";

interface Props {
	addUser: () => void;
}

function UsersHeader({ addUser }: Props) {
	const { user, token, showAlert } = useApp();

	return (
		<div className='w-full flex items-center justify-between px-4 py-8 border-2 rounded-4xl bg-black/5'>
			<div className='flex gap-4 items-center'>
				<Users size={60} className='bg-black/5 rounded-xl p-2' />
				<div className='flex flex-col '>
					<h1 className='text-4xl font-bold'>Users</h1>
					<p>Manage your users</p>
				</div>
			</div>
			<Button onClick={addUser}>
				<Plus />
				Add user
			</Button>
		</div>
	);
}

export default UsersHeader;
