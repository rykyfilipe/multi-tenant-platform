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
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
	onDelete: () => void;
	user: User;
}

export default function DeleteAccountButton({ onDelete, user }: Props) {
	const { t } = useLanguage();
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant='destructive' size='sm'>
					<Trash2 className='mr-2 h-4 w-4' />
					{t("settings.deleteAccount.button")}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{t("settings.deleteAccount.confirmTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{t("settings.deleteAccount.confirmDescription")}
						{/* Add warning for admin users */}
						{user?.role === "ADMIN" && (
							<>
								<br />
								<br />
								<strong className='text-destructive'>
									{t("settings.deleteAccount.adminWarning")}
								</strong>
							</>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						{t("settings.deleteAccount.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={() => onDelete()}
						className='bg-red-600 hover:bg-red-700'>
						{t("settings.deleteAccount.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
