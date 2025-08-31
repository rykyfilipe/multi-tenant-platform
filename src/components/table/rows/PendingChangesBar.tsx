/** @format */

"use client";

import { memo } from "react";
import { Button } from "../../ui/button";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Save, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
	pendingChangesCount: number;
	isSaving: boolean;
	onSave: () => void;
	onDiscard: () => void;
	isVisible: boolean;
}

export const PendingChangesBar = memo(function PendingChangesBar({
	pendingChangesCount,
	isSaving,
	onSave,
	onDiscard,
	isVisible,
}: Props) {
	const { t } = useLanguage();

	if (!isVisible || pendingChangesCount === 0) {
		return null;
	}

	return (
		<Card className='fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 shadow-lg border-2 border-primary/20 bg-background/95 backdrop-blur-sm'>
			<div className='flex items-center gap-3 px-4 py-3'>
				<div className='flex items-center gap-2'>
					<Badge
						variant='secondary'
						className='bg-primary/10 text-primary border-primary/20'>
						{pendingChangesCount}
					</Badge>
					<span className='text-sm font-medium'>
						{pendingChangesCount === 1
							? t("table.pendingChanges.single", "1 unsaved change")
							: t(
									"table.pendingChanges.multiple",
									`${pendingChangesCount} unsaved changes`,
							  )}
					</span>
				</div>

				<div className='flex items-center gap-2 ml-4'>
					<Button
						size='sm'
						onClick={onSave}
						disabled={isSaving}
						className='bg-primary hover:bg-primary/90'>
						{isSaving ? (
							<>
								<Loader2 className='h-4 w-4 mr-2 animate-spin' />
								{t("common.saving", "Saving...")}
							</>
						) : (
							<>
								<Save className='h-4 w-4 mr-2' />
								{t("common.save", "Save")}
							</>
						)}
					</Button>

					<Button
						size='sm'
						variant='outline'
						onClick={onDiscard}
						disabled={isSaving}
						className='border-destructive/20 text-destructive hover:bg-destructive/10'>
						<X className='h-4 w-4 mr-2' />
						{t("common.discard", "Discard")}
					</Button>
				</div>
			</div>

			{/* Progress indicator */}
			{isSaving && (
				<div className='absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden'>
					<div className='h-full bg-primary animate-pulse' />
				</div>
			)}
		</Card>
	);
});
