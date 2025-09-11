/** @format */

import { useRef, useCallback, useEffect } from "react";

interface UseAbortControllerResult {
	abortController: React.RefObject<AbortController | null>;
	createNewController: () => AbortController;
	abortPrevious: () => void;
}

export function useAbortController(): UseAbortControllerResult {
	const abortController = useRef<AbortController | null>(null);

	const createNewController = useCallback(() => {
		// Abort previous request if exists
		if (abortController.current) {
			abortController.current.abort();
		}

		// Create new controller
		abortController.current = new AbortController();
		return abortController.current;
	}, []);

	const abortPrevious = useCallback(() => {
		if (abortController.current) {
			abortController.current.abort();
			abortController.current = null;
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			abortPrevious();
		};
	}, [abortPrevious]);

	return {
		abortController,
		createNewController,
		abortPrevious
	};
}
