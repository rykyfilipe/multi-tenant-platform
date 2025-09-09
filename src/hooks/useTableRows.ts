/** @format */

import { useApp } from "@/contexts/AppContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Row } from "@/types/database";
import { useCallback, useEffect, useState, useRef, useMemo } from "react";

interface PaginationInfo {
	page: number;
	pageSize: number;
	totalRows: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

interface FilterConfig {
	id: string; // Unique identifier for each filter
	columnId: number;
	columnName: string;
	columnType: string;
	operator: string;
	value: any;
	secondValue?: any; // For range filters
}

interface UseTableRowsResult {
	rows: Row[];
	loading: boolean;
	error: string | null;
	pagination: PaginationInfo | null;
	filters: FilterConfig[];
	globalSearch: string;
	sortBy: string;
	sortOrder: "asc" | "desc";
	fetchRows: (
		page?: number,
		pageSize?: number,
		filters?: FilterConfig[],
		globalSearch?: string,
		sortBy?: string,
		sortOrder?: "asc" | "desc",
		showLoading?: boolean,
	) => Promise<void>;
	refetch: () => Promise<void>;
	silentRefresh: () => Promise<void>;
	applyFilters: (
		filters: FilterConfig[],
		globalSearch: string,
		sortBy?: string,
		sortOrder?: "asc" | "desc",
	) => Promise<void>;
	updateFilters: (filters: FilterConfig[]) => void;
	updateGlobalSearch: (search: string) => void;
	updateSorting: (sortBy: string, sortOrder: "asc" | "desc") => void;
	clearFilters: () => void;
	setRows: (rows: Row[] | ((prevRows: Row[]) => Row[])) => void;
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

	// State pentru rânduri și paginare
	const [rows, setRows] = useState<Row[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);

	// State pentru filtrare și sortare
	const [currentPage, setCurrentPage] = useState(1);
	const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);
	const [filters, setFilters] = useState<FilterConfig[]>([]);
	const [globalSearch, setGlobalSearch] = useState("");
	const [sortBy, setSortBy] = useState("id");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	// Refs pentru debouncing și caching
	const lastFetchParamsRef = useRef<string>("");
	const isInitialLoadRef = useRef(true);
	const cacheRef = useRef<Map<string, { data: any; timestamp: number }>>(
		new Map(),
	);
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Helper function to ensure filters have IDs
	const ensureFilterIds = useCallback((filters: FilterConfig[]): FilterConfig[] => {
		return filters.map((filter, index) => ({
			...filter,
			id: filter.id || `filter-${Date.now()}-${index}`
		}));
	}, []);

	// Cache key generator
	const generateCacheKey = useCallback(
		(
			page: number,
			pageSize: number,
			filters: FilterConfig[],
			globalSearch: string,
			sortBy: string,
			sortOrder: string,
		) => {
			return `${page}-${pageSize}-${JSON.stringify(
				filters,
			)}-${globalSearch}-${sortBy}-${sortOrder}`;
		},
		[],
	);

	// Cache management - RE-ENABLED pentru performanță
	const getCachedData = useCallback((cacheKey: string) => {
		const cached = cacheRef.current.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < 2 * 60 * 1000) {
			// 2 minute cache pentru performanță
			return cached.data;
		}
		return null;
	}, []);

	const setCachedData = useCallback((cacheKey: string, data: any) => {
		cacheRef.current.set(cacheKey, {
			data,
			timestamp: Date.now(),
		});

		// Cleanup cache-ul vechi (păstrează doar ultimele 100 de intrări)
		if (cacheRef.current.size > 100) {
			const entries = Array.from(cacheRef.current.entries());
			const sortedEntries = entries.sort(
				(a, b) => b[1].timestamp - a[1].timestamp,
			);
			const toDelete = sortedEntries.slice(100);
			toDelete.forEach(([key]) => cacheRef.current.delete(key));
		}
	}, []);

	// Funcția principală de fetch cu optimizări
			const fetchRows = useCallback(
		async (
			page: number = 1,
			pageSize: number = 25,
			filtersParam: FilterConfig[] = filters,
			globalSearchParam: string = globalSearch,
			sortByParam: string = sortBy,
			sortOrderParam: "asc" | "desc" = sortOrder,
			showLoading: boolean = true,
		) => {
			
			
			if (!token || !userId || !tenantId || !databaseId || !tableId || tableId === "" || tableId === "0") {
				
				return;
			}

			// Generează cache key
			const cacheKey = generateCacheKey(
				page,
				pageSize,
				filtersParam,
				globalSearchParam,
				sortByParam,
				sortOrderParam,
			);

			// Verifică cache-ul - ENABLED pentru paginare
			const cachedData = getCachedData(cacheKey);
			if (cachedData) {
				setRows(cachedData.data || []);
				setPagination(cachedData.pagination || null);
				setCurrentPage(page);
				setCurrentPageSize(pageSize);
				setFilters(ensureFilterIds(filtersParam));
				setGlobalSearch(globalSearchParam);
				setSortBy(sortByParam);
				setSortOrder(sortOrderParam);
				return;
			}

			// Verifică dacă parametrii au schimbat
			const paramsString = JSON.stringify({
				page,
				pageSize,
				filtersParam,
				globalSearchParam,
				sortByParam,
				sortOrderParam,
			});
			// DISABLED pentru paginare - permite schimbarea paginii

			// Pentru paginare, verifică dacă pagina s-a schimbat
			if (page !== currentPage) {
				lastFetchParamsRef.current = ""; // Clear last fetch params to force new fetch
			}

			// Only set loading state if showLoading is true
			if (showLoading) {
				setLoading(true);
			}
			setError(null);
			lastFetchParamsRef.current = paramsString;

			try {
				// Construiește URL-ul cu parametrii optimizați
				const url = new URL(
					`/api/tenants/${tenantId}/databases/${databaseId}/tables/${tableId}/rows`,
					window.location.origin,
				);

				// Parametri de bază
				url.searchParams.set("page", page.toString());
				url.searchParams.set("pageSize", pageSize.toString());
				url.searchParams.set("includeCells", "true");

				// Parametri de filtrare
				if (globalSearchParam.trim()) {
					url.searchParams.set("search", globalSearchParam.trim());
				}
				
				if (filtersParam.length > 0) {
					url.searchParams.set(
						"filters",
						encodeURIComponent(JSON.stringify(filtersParam)),
					);
				}
				if (sortByParam && sortByParam !== "id") {
					url.searchParams.set("sortBy", sortByParam);
				}
				if (sortOrderParam && sortOrderParam !== "asc") {
					url.searchParams.set("sortOrder", sortOrderParam);
				}

				console.log("🌐 useTableRows - Making API request:", {
					url: url.toString(),
					filtersParam: JSON.stringify(filtersParam, null, 2),
					globalSearchParam,
					page,
					pageSize
				});

				const res = await fetch(url.toString(), {
					method: "GET",
					headers: {
						Authorization: `Bearer ${token}`,
						"Cache-Control": "no-cache", // Pentru date dinamice
					},
				});

				if (!res.ok) {
					throw new Error(`HTTP ${res.status}: ${res.statusText}`);
				}

				const data = await res.json();
				console.log("🔍 useTableRows - API Response:", data);

				// Validează răspunsul
				if (data.data && data.pagination) {
					// Actualizează state-ul - IMPORTANT: actualizează currentPage înainte de a seta rows
					setCurrentPage(page);
					setCurrentPageSize(pageSize);
					setFilters(ensureFilterIds(filtersParam));
					setGlobalSearch(globalSearchParam);
					setSortBy(sortByParam);
					setSortOrder(sortOrderParam);

					// Actualizează rows și pagination
					
					setRows(data.data || []);
					setPagination(data.pagination || null);

					// Cache-ază răspunsul - ENABLED pentru paginare
					setCachedData(cacheKey, {
						data: data.data,
						pagination: data.pagination,
					});
				} else {
					throw new Error("Invalid response format from server");
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				setRows([]);
				setPagination(null);
			} finally {
				// Only reset loading state if we set it to true
				if (showLoading) {
					setLoading(false);
				}
			}
		},
		[
			token,
			userId,
			tenantId,
			databaseId,
			tableId,
			generateCacheKey,
			getCachedData,
			setCachedData,
		],
	);

	const refetch = useCallback(async () => {
		// Use setTimeout to avoid dependency issues
		return new Promise<void>((resolve) => {
			setTimeout(() => {
				fetchRows(
					currentPage,
					currentPageSize,
					filters,
					globalSearch,
					sortBy,
					sortOrder,
				).then(() => resolve());
			}, 0);
		});
	}, [
		currentPage,
		currentPageSize,
		filters,
		globalSearch,
		sortBy,
		sortOrder,
		// Removed fetchRows from dependencies
	]);

	// Silent refresh that doesn't set loading state - useful for background updates
	const silentRefresh = useCallback(async () => {
		if (!token || !userId || !tenantId || !databaseId || !tableId) {
			return;
		}

		// Use fetchRows with showLoading: false to avoid loading state
		await fetchRows(
			currentPage,
			currentPageSize,
			filters,
			globalSearch,
			sortBy,
			sortOrder,
			false, // showLoading: false
		);
	}, [
		token,
		userId,
		tenantId,
		databaseId,
		tableId,
		currentPage,
		currentPageSize,
		filters,
		globalSearch,
		sortBy,
		sortOrder,
		fetchRows,
	]);

	// Aplică filtre cu reset la prima pagină - OPTIMISTIC UPDATE
	const applyFilters = useCallback(
		async (
			filtersParam: FilterConfig[],
			globalSearchParam: string,
			sortByParam: string = "id",
			sortOrderParam: "asc" | "desc" = "asc",
		) => {
			console.log("🔍 useTableRows - applyFilters called (optimistic):", {
				filtersParam,
				globalSearchParam,
				sortByParam,
				sortOrderParam,
				currentPageSize,
				tableId
			});

			// OPTIMISTIC UPDATE: Actualizează state-ul local imediat
			setFilters(ensureFilterIds(filtersParam));
			setGlobalSearch(globalSearchParam);
			setSortBy(sortByParam);
			setSortOrder(sortOrderParam);
			setCurrentPage(1);

			// Apoi face fetch-ul în background
			try {
				await fetchRows(
					1,
					currentPageSize,
					filtersParam,
					globalSearchParam,
					sortByParam,
					sortOrderParam,
					true // showLoading: true
				);
				console.log("✅ useTableRows - applyFilters completed successfully");
			} catch (error) {
				console.error("❌ useTableRows - applyFilters failed:", error);
				// Revert optimistic update on error
				setError(error instanceof Error ? error.message : "Filter application failed");
			}
		},
		[currentPageSize, fetchRows, tableId],
	);

	// Actualizează filtrele fără a face fetch
	const updateFilters = useCallback((newFilters: FilterConfig[]) => {
		setFilters(ensureFilterIds(newFilters));
	}, [ensureFilterIds]);

	// Debounced global search update
	const updateGlobalSearch = useCallback(
		(newSearch: string) => {
			setGlobalSearch(newSearch);

			// Debounce search pentru a evita prea multe API calls
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}

			debounceTimeoutRef.current = setTimeout(() => {
				// Auto-apply search după 500ms de inactivitate
				if (newSearch !== globalSearch) {
					applyFilters(filters, newSearch, sortBy, sortOrder);
				}
			}, 500);
		},
		[filters, globalSearch, sortBy, sortOrder, applyFilters],
	);

	// Cleanup debounce timeout
	useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, []);

	// Actualizează sortarea fără a face fetch
	const updateSorting = useCallback(
		(newSortBy: string, newSortOrder: "asc" | "desc") => {
			setSortBy(newSortBy);
			setSortOrder(newSortOrder);
		},
		[],
	);

	// Curăță toate filtrele
	const clearFilters = useCallback(() => {
		setFilters([]);
		setGlobalSearch("");
		setSortBy("id");
		setSortOrder("asc");
		// Reset la pagina 1 - use setTimeout to avoid dependency issues
		setTimeout(() => {
			fetchRows(1, currentPageSize, [], "", "id", "asc");
		}, 0);
	}, [currentPageSize]); // Removed fetchRows from dependencies

	// Auto-fetch când se schimbă dependențele
	useEffect(() => {
		if (token && userId && tenantId && databaseId && tableId && tableId !== "" && tableId !== "0") {
			// Fetch doar la prima încărcare, nu la fiecare schimbare de dependențe
			if (isInitialLoadRef.current) {
				// Use setTimeout to avoid dependency issues
				const timeoutId = setTimeout(() => {
					// Only set loading state for initial load, not for subsequent operations
					setLoading(true);
					fetchRows(1, initialPageSize).finally(() => {
						setLoading(false);
						isInitialLoadRef.current = false;
					});
				}, 0);

				return () => clearTimeout(timeoutId);
			}
		}
	}, [
		token,
		userId,
		tenantId,
		databaseId,
		tableId,
		initialPageSize,
		// Removed fetchRows from dependencies to prevent infinite loop
	]);

	// Cleanup la unmount
	useEffect(() => {
		return () => {
			// Cleanup removed since fetchTimeoutRef is no longer used
		};
	}, []);

	return {
		rows,
		loading,
		error,
		pagination,
		filters,
		globalSearch,
		sortBy,
		sortOrder,
		fetchRows,
		refetch,
		silentRefresh,
		applyFilters,
		updateFilters,
		updateGlobalSearch,
		updateSorting,
		clearFilters,
		setRows,
	};
}

export default useTableRows;
