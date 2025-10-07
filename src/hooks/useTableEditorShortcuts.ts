/** @format */
"use client";

import { useEffect } from "react";

interface UseTableEditorShortcutsProps {
	onSave?: () => void;
	onNewColumn?: () => void;
	onNewRow?: () => void;
	onUndo?: () => void;
	onSearch?: () => void;
	onToggleMode?: () => void;
	enabled?: boolean;
}

export function useTableEditorShortcuts({
	onSave,
	onNewColumn,
	onNewRow,
	onUndo,
	onSearch,
	onToggleMode,
	enabled = true,
}: UseTableEditorShortcutsProps) {
	useEffect(() => {
		if (!enabled) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			// Check for Cmd (Mac) or Ctrl (Windows/Linux)
			const isCmdOrCtrl = event.metaKey || event.ctrlKey;

			// Cmd/Ctrl + S: Save changes
			if (isCmdOrCtrl && event.key === "s") {
				event.preventDefault();
				if (onSave) {
					onSave();
				}
			}

			// Cmd/Ctrl + K: Add new column (schema mode)
			if (isCmdOrCtrl && event.key === "k") {
				event.preventDefault();
				if (onNewColumn) {
					onNewColumn();
				}
			}

			// Cmd/Ctrl + N: Add new row (data mode)
			if (isCmdOrCtrl && event.key === "n") {
				event.preventDefault();
				if (onNewRow) {
					onNewRow();
				}
			}

			// Cmd/Ctrl + Z: Undo (discard changes)
			if (isCmdOrCtrl && event.key === "z") {
				event.preventDefault();
				if (onUndo) {
					onUndo();
				}
			}

			// Cmd/Ctrl + F: Focus search
			if (isCmdOrCtrl && event.key === "f") {
				event.preventDefault();
				if (onSearch) {
					onSearch();
				}
			}

			// Cmd/Ctrl + M: Toggle mode (Schema ⇄ Data)
			if (isCmdOrCtrl && event.key === "m") {
				event.preventDefault();
				if (onToggleMode) {
					onToggleMode();
				}
			}

			// ESC: Close properties panel / cancel edit
			if (event.key === "Escape") {
				// Let components handle this individually
				// Can be used to close modals, cancel edits, etc.
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [enabled, onSave, onNewColumn, onNewRow, onUndo, onSearch, onToggleMode]);

	return {
		shortcuts: {
			save: "Cmd+S / Ctrl+S",
			newColumn: "Cmd+K / Ctrl+K",
			newRow: "Cmd+N / Ctrl+N",
			undo: "Cmd+Z / Ctrl+Z",
			search: "Cmd+F / Ctrl+F",
			toggleMode: "Cmd+M / Ctrl+M",
		},
	};
}

