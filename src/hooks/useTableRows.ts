/** @format */

import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Row } from "@/types/database";
import { useCallback, useEffect, useState } from "react";

interface PaginationInfo {
	page: number;
	pageSize: number;
	totalRows: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

interface UseTableRowsResult {
	rows: Row[];
	loading: boolean;
	error: string | null;
	pagination: PaginationInfo | null;
	fetchRows: (page?: number, pageSize?: number) => Promise<void>;
	refetch: () => Promise<void>;
}

function useTableRows(
	tableId: string,
	initialPageSize: number = 25,
): UseTableRowsResult {
	const { token, user, tenant } = useApp();
	const { selectedDatabase } = useDatabase();
	const userId = user?.id;
	const tenantId = tenant?.id;
	const databaseId = selectedDatabase?.id;

	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);

	const fetchRows = useCallback(
		async (page: number = currentPage, pageSize: number = currentPageSize) => {
			if (!token || !userId || !tenantId || !databaseId || !tableId) return;

			setLoading(true);
			setError(null);

			try {
				const url = new URL(
					`/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows`,
					window.location.origin,
				);
				url.searchParams.set("page", page.toString());
				url.searchParams.set("pageSize", pageSize.toString());
				url.searchParams.set("includeCells", "true");

				const res = await fetch(url.toString(), {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});

				if (!res.ok) {
					throw new Error("Failed to fetch rows");
				}

				const data = await res.json();

				// Handle both old format (direct array) and new format (object with data and pagination)
				if (Array.isArray(data)) {
					// Old format - fallback for backwards compatibility
					setRows(data);
					setPagination(null);
				} else {
					// New format with pagination
					setRows(data.data || []);
					setPagination(data.pagination || null);
					setCurrentPage(page);
					setCurrentPageSize(pageSize);
				}
			} catch (err) {
				console.error("Error fetching rows:", err);
				setError(err instanceof Error ? err.message : "Unknown error");
				setRows([]);
				setPagination(null);
			} finally {
				setLoading(false);
			}
		},
		[
			token,
			userId,
			tenantId,
			databaseId,
			tableId,
			currentPage,
			currentPageSize,
		],
	);

	const refetch = useCallback(() => {
		return fetchRows(currentPage, currentPageSize);
	}, [fetchRows, currentPage, currentPageSize]);

	// Auto-fetch on mount and when dependencies change
	useEffect(() => {
		if (token && userId && tenantId && databaseId && tableId) {
			fetchRows(1, initialPageSize); // Reset to first page when table changes
		}
	}, [token, userId, tenantId, databaseId, tableId, initialPageSize]);

	return {
		rows,
		loading,
		error,
		pagination,
		fetchRows,
		refetch,
	};
}

export default useTableRows;
