/** @format */

import { useEffect } from "react";

export interface FilterKeyboardHandlers {
	onFocusSearch?: () => void;
	onApply?: () => void;
	onClose?: () => void;
	onAddFilter?: () => void;
}

/**
 * Hook to handle keyboard shortcuts for filter panel
 * 
 * Shortcuts:
 * - Cmd/Ctrl+K: Focus global search
 * - Cmd/Ctrl+Enter: Apply filters
 * - Escape: Close filter panel
 * - Cmd/Ctrl+Shift+N: Add new filter
 */
export function useFilterKeyboards(handlers: FilterKeyboardHandlers, enabled: boolean = true) {
	useEffect(() => {
		if (!enabled) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
			const modKey = isMac ? e.metaKey : e.ctrlKey;

			// Cmd/Ctrl+K: Focus search
			if (e.key === "k" && modKey && !e.shiftKey) {
				e.preventDefault();
				handlers.onFocusSearch?.();
				return;
			}

			// Cmd/Ctrl+Enter: Apply filters
			if (e.key === "Enter" && modKey) {
				e.preventDefault();
				handlers.onApply?.();
				return;
			}

			// Escape: Close panel
			if (e.key === "Escape" && !modKey) {
				handlers.onClose?.();
				return;
			}

			// Cmd/Ctrl+Shift+N: Add new filter
			if (e.key === "n" && modKey && e.shiftKey) {
				e.preventDefault();
				handlers.onAddFilter?.();
				return;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [enabled, handlers]);
}

