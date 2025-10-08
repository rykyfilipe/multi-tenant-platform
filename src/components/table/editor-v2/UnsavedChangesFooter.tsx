/** @format */
"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
	unsavedChangesCount: number;
	changesDescription?: string;
	onDiscard: () => void;
	onReview?: () => void;
	onSaveAll: () => void;
	isSaving?: boolean;
}

export function UnsavedChangesFooter({
	unsavedChangesCount,
	changesDescription,
	onDiscard,
	onReview,
	onSaveAll,
	isSaving = false,
}: Props) {
	if (unsavedChangesCount === 0) return null;

	return (
		<AnimatePresence>
			<motion.div
				initial={{ y: 100, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				exit={{ y: 100, opacity: 0 }}
				transition={{ type: "spring", damping: 25, stiffness: 300 }}
				className='fixed bottom-0 left-0 right-0 z-50 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-200 dark:border-amber-800 shadow-2xl backdrop-blur-sm'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5'>
					<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
						<div className='flex items-start sm:items-center gap-4'>
							<div className='w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0'>
								<AlertCircle className='w-5 h-5 text-amber-600 dark:text-amber-500' />
							</div>
							<div>
								<p className='font-semibold text-sm text-amber-900 dark:text-amber-100'>
									{unsavedChangesCount} unsaved change{unsavedChangesCount > 1 ? "s" : ""}
								</p>
								{changesDescription && (
									<p className='text-xs text-amber-700 dark:text-amber-300 mt-0.5'>
										{changesDescription}
									</p>
								)}
							</div>
						</div>

						<div className='flex items-center gap-2 sm:gap-3 w-full sm:w-auto'>
							<Button
								variant='outline'
								onClick={onDiscard}
								disabled={isSaving}
								className='flex-1 sm:flex-none h-10 px-4 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all duration-200'>
								Discard
							</Button>
							{onReview && (
								<Button
									variant='outline'
									onClick={onReview}
									disabled={isSaving}
									className='flex-1 sm:flex-none h-10 px-4 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all duration-200'>
									Review Changes
								</Button>
							)}
							<Button
								onClick={onSaveAll}
								disabled={isSaving}
								className='flex-1 sm:flex-none h-10 px-5 gap-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 shadow-md hover:shadow-lg transition-all duration-200'>
								{isSaving ? (
									<div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
								) : (
									<Save className='w-4 h-4' />
								)}
								<span className='font-medium'>Save All Changes</span>
							</Button>
						</div>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
}

