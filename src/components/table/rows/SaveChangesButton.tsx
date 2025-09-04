/** @format */

"use client";

import { useState, useCallback, memo } from "react";
import { Button } from "../../ui/button";
import { CheckCircle, Save, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SaveChangesButtonProps {
	// Pentru rânduri noi
	pendingNewRows?: any[];
	isSavingNewRows?: boolean;
	onSaveNewRows?: () => void;
	onDiscardNewRows?: () => void;

	// Pentru modificări existente
	pendingChanges?: Map<string, any>;
	isSavingChanges?: boolean;
	onSaveChanges?: () => void;
	onDiscardChanges?: () => void;

	// Stilizare
	className?: string;
	size?: "sm" | "lg" | "default";
	variant?: "default" | "outline" | "destructive" | "secondary" | "ghost" | "link";
}

export const SaveChangesButton = memo(function SaveChangesButton({
	pendingNewRows = [],
	isSavingNewRows = false,
	onSaveNewRows,
	onDiscardNewRows,
	pendingChanges = new Map(),
	isSavingChanges = false,
	onSaveChanges,
	onDiscardChanges,
	className = "",
	size = "lg",
	variant = "default",
}: SaveChangesButtonProps) {
	const { t } = useLanguage();
	const [isHovered, setIsHovered] = useState(false);

	// Calculează numărul total de modificări
	const newRowsCount = pendingNewRows.length;
	const changesCount = pendingChanges.size;
	const totalChanges = newRowsCount + changesCount;

	// Determină dacă există modificări de salvat
	const hasChanges = totalChanges > 0;
	const isSaving = isSavingNewRows || isSavingChanges;

	// Gestionează salvarea unificată
	const handleSave = useCallback(() => {
		if (isSaving) return;

		// Salvează modificările existente mai întâi
		if (changesCount > 0 && onSaveChanges) {
			onSaveChanges();
		}

		// Apoi salvează rândurile noi
		if (newRowsCount > 0 && onSaveNewRows) {
			onSaveNewRows();
		}
	}, [isSaving, changesCount, onSaveChanges, newRowsCount, onSaveNewRows]);

	// Gestionează anularea modificărilor
	const handleDiscard = useCallback(() => {
		if (isSaving) return;

		// Anulează modificările existente
		if (changesCount > 0 && onDiscardChanges) {
			onDiscardChanges();
		}

		// Anulează rândurile noi
		if (newRowsCount > 0 && onDiscardNewRows) {
			onDiscardNewRows();
		}
	}, [isSaving, changesCount, onDiscardChanges, newRowsCount, onDiscardNewRows]);

	// Nu afișa butonul dacă nu există modificări
	if (!hasChanges) {
		return null;
	}

	// Determină textul butonului
	const getButtonText = () => {
		if (isSaving) {
			return t("common.saving");
		}

		if (totalChanges === 1) {
			if (newRowsCount === 1) {
				return t("table.saveChanges.saveNewRow");
			} else {
				return t("table.saveChanges.saveChange");
			}
		} else {
			return t("table.saveChanges.saveChanges", { count: totalChanges });
		}
	};

	// Determină iconița
	const getIcon = () => {
		if (isSaving) {
			return <Loader2 className="w-4 h-4 mr-2 animate-spin" />;
		}
		return <Save className="w-4 h-4 mr-2" />;
	};

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Button
				onClick={handleSave}
				disabled={isSaving}
				variant={variant}
				size={size}
				className="min-w-[140px] transition-all duration-200 hover:scale-105"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			>
				{getIcon()}
				{getButtonText()}
			</Button>

			{/* Butonul de anulare - doar dacă există modificări */}
			<Button
				onClick={handleDiscard}
				disabled={isSaving}
				variant="outline"
				size={size}
				className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
			>
				<CheckCircle className="w-4 h-4 mr-2" />
				{t("common.discard")} ({totalChanges})
			</Button>

			{/* Indicator vizual pentru tipul de modificări */}
			{totalChanges > 0 && (
				<div className="flex items-center gap-1 text-xs text-muted-foreground">
					{newRowsCount > 0 && (
						<span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
							+{newRowsCount} {t("table.saveChanges.newRows")}
						</span>
					)}
					{changesCount > 0 && (
						<span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
							~{changesCount} {t("table.saveChanges.changes")}
						</span>
					)}
				</div>
			)}
		</div>
	);
});

export default SaveChangesButton;
