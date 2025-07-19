/** @format */

"use client";

import { Button } from "@/components/ui/button";

import { useApp } from "@/contexts/AppContext";
import { Plus, Users } from "lucide-react";

interface Props {
	addUser: () => void;
}

function UsersHeader({ addUser }: Props) {
	return (
		<div className='max-w-full flex flex-col sm:flex-row gap-5  items-center justify-between py-8 px-6  bg-black/5 rounded-2xl mb-8 border'>
			<div className='flex gap-4 items-center'>
				<div className='p-3 bg-black/5 rounded-xl'>
					<Users className='h-8 w-8 text-black' />
				</div>
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
