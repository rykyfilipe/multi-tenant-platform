/** @format */

import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { User } from "@/types/user";

interface Props {
	onDelete: () => void;
	user: User;
}

export default function DeleteAccountButton({ onDelete, user }: Props) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant='destructive' size='sm'>
					<Trash2 className='mr-2 h-4 w-4' />
					Delete Account
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete the
						account and remove all associated data from the system.
						{/* Add warning for admin users */}
						{user?.role === "ADMIN" && (
							<>
								<br />
								<br />
								<strong className="text-red-600">
									⚠️ Warning: As an admin, this will also delete your entire tenant 
									including all databases, tables, and data. This action is irreversible.
								</strong>
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onDelete()}
						className='bg-red-600 hover:bg-red-700'>
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
