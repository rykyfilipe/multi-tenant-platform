/** @format */

import { useDatabase } from "@/contexts/DatabaseContext";
import { useCallback } from "react";

/**
 * Hook pentru a actualiza cache-ul bazei de date după modificări
 */
export function useDatabaseRefresh() {
	const { refreshSelectedDatabase } = useDatabase();

	const refreshAfterChange = useCallback(async () => {
		try {
			await refreshSelectedDatabase();
		} catch (error) {
			console.error("Error refreshing database cache:", error);
		}
	}, [refreshSelectedDatabase]);

	return { refreshAfterChange };
}
