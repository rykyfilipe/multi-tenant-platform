/** @format */

"use client";

import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle, Database } from "lucide-react";
import { motion } from "framer-motion";

interface DeleteTableDialogProps {
	tableName: string;
	tableId: string;
	onConfirm: (tableId: string) => void;
	isProtected?: boolean;
	isModuleTable?: boolean;
	rowsCount?: number;
	columnsCount?: number;
}

export function DeleteTableDialog({
	tableName,
	tableId,
	onConfirm,
	isProtected = false,
	isModuleTable = false,
	rowsCount = 0,
	columnsCount = 0,
}: DeleteTableDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const handleConfirm = async () => {
		setIsDeleting(true);
		try {
			await onConfirm(tableId);
			setIsOpen(false);
		} catch (error) {
			console.error("Error deleting table:", error);
		} finally {
			setIsDeleting(false);
		}
	};

	if (isProtected || isModuleTable) {
		return (
			<div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
				<Database className="w-3 h-3" />
				{isModuleTable ? "Module" : "Protected"}
			</div>
		);
	}

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button
					size="sm"
					variant="destructive"
					className="delete-table-button text-xs hover:bg-destructive/90 hover:scale-105 transition-all duration-200"
					disabled={isDeleting}>
					<Trash2 className="w-4 h-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent className="max-w-md mx-4 sm:mx-0">
				<AlertDialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<motion.div
							className="p-2 bg-destructive/10 rounded-full"
							animate={{ scale: [1, 1.1, 1] }}
							transition={{ duration: 2, repeat: Infinity }}>
							<AlertTriangle className="w-5 h-5 text-destructive" />
						</motion.div>
						<AlertDialogTitle className="text-lg font-semibold">
							Delete Table
						</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="text-xs sm:text-sm text-muted-foreground space-y-3">
						<p>
							Are you sure you want to delete <strong className="text-foreground">"{tableName}"</strong>?
						</p>
						<motion.div 
							className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-lg p-3 sm:p-4 space-y-2 border border-border/20"
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.1 }}>
							<div className="flex items-center justify-between text-xs sm:text-sm">
								<span className="text-muted-foreground flex items-center gap-2">
									<Database className="w-3 h-3 sm:w-4 sm:h-4" />
									Columns:
								</span>
								<span className="font-semibold text-foreground">{columnsCount}</span>
							</div>
							<div className="flex items-center justify-between text-xs sm:text-sm">
								<span className="text-muted-foreground flex items-center gap-2">
									<Database className="w-3 h-3 sm:w-4 sm:h-4" />
									Rows:
								</span>
								<span className="font-semibold text-foreground">{rowsCount}</span>
							</div>
						</motion.div>
						<motion.div 
							className="bg-destructive/5 border border-destructive/20 rounded-lg p-2 sm:p-3"
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ delay: 0.2 }}>
							<p className="text-destructive/90 font-medium text-xs sm:text-sm flex items-start gap-2">
								<AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
								<span>This action cannot be undone and will permanently remove all data in this table.</span>
							</p>
						</motion.div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-2 sm:gap-0">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.3 }}>
						<AlertDialogCancel disabled={isDeleting}>
							Cancel
						</AlertDialogCancel>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.3 }}>
						<AlertDialogAction
							onClick={handleConfirm}
							disabled={isDeleting}
							className="bg-destructive hover:bg-destructive/90 focus:ring-destructive/20 transition-all duration-200">
							{isDeleting ? (
								<>
									<motion.div
										className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
										animate={{ rotate: 360 }}
										transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
									/>
									Deleting...
								</>
							) : (
								<>
									<Trash2 className="w-4 h-4 mr-2" />
									Delete Table
								</>
							)}
						</AlertDialogAction>
					</motion.div>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
