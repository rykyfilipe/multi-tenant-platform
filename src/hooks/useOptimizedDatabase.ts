/** @format */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Database, Table } from "@/types/database";
import { useApp } from "@/contexts/AppContext";

interface UseOptimizedDatabaseReturn {
	databases: Database[] | null;
	selectedDatabase: Database | null;
	loading: boolean;
	error: string | null;
	selectDatabase: (database: Database) => void;
	refetchDatabases: () => Promise<void>;
}

export function useOptimizedDatabase(): UseOptimizedDatabaseReturn {
	const { token, tenant } = useApp();
	const [databases, setDatabases] = useState<Database[] | null>(null);
	const [selectedDatabase, setSelectedDatabase] = useState<Database | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchDatabases = useCallback(async () => {
		if (!token || !tenant?.id) {
			setLoading(false);
			return;
		}

		// Don't refetch if we already have data
		if (databases && databases.length >= 0) {
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/tenants/${tenant.id}/databases`, {
				headers: {
					Authorization: `Bearer ${token}`,
					"Cache-Control": "max-age=300", // 5 minutes cache
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch databases");
			}

			const data = await response.json();
			setDatabases(data);

			// Auto-select first database if none selected
			if (!selectedDatabase && data.length > 0) {
				setSelectedDatabase(data[0]);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Unknown error";
			setError(errorMessage);
			console.error("Error fetching databases:", err);
		} finally {
			setLoading(false);
		}
	}, [token, tenant?.id, selectedDatabase]);

	// Optimized refetch function
	const refetchDatabases = useCallback(async () => {
		setDatabases(null); // Clear cache to force refetch
		await fetchDatabases();
	}, [fetchDatabases]);

	// Optimized database selection
	const selectDatabase = useCallback((database: Database) => {
		setSelectedDatabase(database);
	}, []);

	useEffect(() => {
		fetchDatabases();
	}, [fetchDatabases]);

	// Memoized return value to prevent unnecessary re-renders
	const returnValue = useMemo(
		() => ({
			databases,
			selectedDatabase,
			loading,
			error,
			selectDatabase,
			refetchDatabases,
		}),
		[databases, selectedDatabase, loading, error, selectDatabase, refetchDatabases],
	);

	return returnValue;
}
