/** @format */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface FetchOptions {
	cacheTime?: number; // Time to keep data fresh (in ms)
	staleTime?: number; // Time to consider data stale (in ms)
	refetchOnFocus?: boolean;
	refetchInterval?: number;
}

interface FetchState<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	isStale: boolean;
}

interface FetchReturn<T> extends FetchState<T> {
	refetch: () => Promise<void>;
	mutate: (data: T | null) => void;
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

export function useOptimizedFetch<T>(
	url: string | null,
	options: FetchOptions = {},
): FetchReturn<T> {
	const {
		cacheTime = 5 * 60 * 1000, // 5 minutes
		staleTime = 1 * 60 * 1000, // 1 minute
		refetchOnFocus = false,
		refetchInterval,
	} = options;

	const [state, setState] = useState<FetchState<T>>({
		data: null,
		loading: true,
		error: null,
		isStale: false,
	});

	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);

	const fetchData = useCallback(
		async (forceRefetch = false) => {
			if (!url) {
				setState((prev) => ({ ...prev, loading: false }));
				return;
			}

			const cacheKey = url;
			const now = Date.now();

			// Check cache first
			if (!forceRefetch) {
				const cached = cache.get(cacheKey);
				if (cached && now - cached.timestamp < cacheTime) {
					const isStale = now - cached.timestamp > cached.staleTime;
					setState({
						data: cached.data,
						loading: false,
						error: null,
						isStale,
					});

					// If data is stale but still valid, fetch in background
					if (isStale) {
						fetchData(true);
					}
					return;
				}
			}

			setState((prev) => ({ ...prev, loading: true, error: null }));

			// Cancel previous request
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			abortControllerRef.current = new AbortController();

			try {
				const response = await fetch(url, {
					signal: abortControllerRef.current.signal,
					headers: {
						"Content-Type": "application/json",
					},
				});

				if (!response.ok) {
					throw new Error(`HTTP ${response.status}: ${response.statusText}`);
				}

				const data = await response.json();

				// Update cache
				cache.set(cacheKey, {
					data,
					timestamp: now,
					staleTime,
				});

				setState({
					data,
					loading: false,
					error: null,
					isStale: false,
				});
			} catch (err) {
				if (err instanceof Error && err.name === "AbortError") {
					return; // Request was cancelled
				}

				const errorMessage = err instanceof Error ? err.message : "Unknown error";
				setState((prev) => ({
					...prev,
					loading: false,
					error: errorMessage,
				}));
			}
		},
		[url, cacheTime, staleTime],
	);

	const refetch = useCallback(() => fetchData(true), [fetchData]);

	const mutate = useCallback(
		(newData: T | null) => {
			setState((prev) => ({
				...prev,
				data: newData,
				isStale: false,
			}));

			// Update cache
			if (url && newData) {
				cache.set(url, {
					data: newData,
					timestamp: Date.now(),
					staleTime,
				});
			}
		},
		[url, staleTime],
	);

	// Initial fetch
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Refetch on focus
	useEffect(() => {
		if (!refetchOnFocus) return;

		const handleFocus = () => {
			if (state.isStale) {
				fetchData(true);
			}
		};

		window.addEventListener("focus", handleFocus);
		return () => window.removeEventListener("focus", handleFocus);
	}, [refetchOnFocus, state.isStale, fetchData]);

	// Refetch interval
	useEffect(() => {
		if (!refetchInterval) return;

		intervalRef.current = setInterval(() => {
			fetchData(true);
		}, refetchInterval);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [refetchInterval, fetchData]);

	// Cleanup
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return {
		...state,
		refetch,
		mutate,
	};
}

// Utility function to clear cache
export function clearCache(pattern?: string) {
	if (pattern) {
		const regex = new RegExp(pattern);
		for (const key of cache.keys()) {
			if (regex.test(key)) {
				cache.delete(key);
			}
		}
	} else {
		cache.clear();
	}
}

// Utility function to preload data
export async function preloadData(url: string, staleTime = 60000) {
	try {
		const response = await fetch(url);
		if (response.ok) {
			const data = await response.json();
			cache.set(url, {
				data,
				timestamp: Date.now(),
				staleTime,
			});
		}
	} catch (error) {
		console.warn("Failed to preload data:", error);
	}
}
