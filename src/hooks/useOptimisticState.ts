/** @format */

import { useState, useCallback } from "react";

interface OptimisticOperation<T> {
	type: "create" | "update" | "delete";
	optimisticId?: string;
	item?: T;
	updateFn?: (item: T) => T;
	filterFn?: (item: T) => boolean;
}

interface UseOptimisticStateOptions {
	onSuccess?: () => void;
	onError?: (error: any) => void;
}

/**
 * Hook pentru managementul optimist al stării CRUD
 * Permite actualizări imediate ale UI-ului înainte de confirmarea de la server
 */
export function useOptimisticState<T extends { id: number | string }>(
	initialItems: T[] = [],
	options: UseOptimisticStateOptions = {},
) {
	const [items, setItems] = useState<T[]>(initialItems);
	const [pendingOperations, setPendingOperations] = useState<Set<string>>(
		new Set(),
	);
	const [isLoading, setIsLoading] = useState(false);

	// Generează ID-uri temporare pentru operațiuni optimiste
	const generateTempId = useCallback(() => {
		return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}, []);

	// Adaugă operațiune optimistă
	const performOptimisticOperation = useCallback(
		async <R>(
			operation: OptimisticOperation<T>,
			apiCall: () => Promise<R>,
		): Promise<R> => {
			const operationId = operation.optimisticId || generateTempId();

			try {
				setIsLoading(true);
				setPendingOperations((prev) => new Set(prev).add(operationId));

				// Aplicăm imediat schimbarea optimistă
				setItems((currentItems) => {
					switch (operation.type) {
						case "create":
							if (operation.item) {
								const optimisticItem = {
									...operation.item,
									id: operationId as any, // folosim ID-ul temporar
								};
								return [...currentItems, optimisticItem];
							}
							return currentItems;

						case "update":
							if (operation.updateFn && operation.filterFn) {
								return currentItems.map((item) =>
									operation.filterFn!(item) ? operation.updateFn!(item) : item,
								);
							}
							return currentItems;

						case "delete":
							if (operation.filterFn) {
								return currentItems.filter(
									(item) => !operation.filterFn!(item),
								);
							}
							return currentItems;

						default:
							return currentItems;
					}
				});

				// Executăm API call-ul
				const result = await apiCall();

				// Actualizăm cu datele reale de la server
				if (operation.type === "create" && result) {
					setItems((currentItems) =>
						currentItems.map((item) =>
							item.id === operationId ? (result as T) : item,
						),
					);
				}

				setPendingOperations((prev) => {
					const newSet = new Set(prev);
					newSet.delete(operationId);
					return newSet;
				});

				options.onSuccess?.();
				return result;
			} catch (error) {
				// Revertim schimbarea optimistă în caz de eroare
				setItems((currentItems) => {
					switch (operation.type) {
						case "create":
							return currentItems.filter((item) => item.id !== operationId);

						case "update":
							// Pentru update, ar trebui să avem starea anterioară salvată
							// Pentru simplitate, lăsăm starea curentă
							return currentItems;

						case "delete":
							// Pentru delete, ar trebui să readăugăm item-ul
							// Pentru simplitate, refreshăm toată lista
							return initialItems;

						default:
							return currentItems;
					}
				});

				setPendingOperations((prev) => {
					const newSet = new Set(prev);
					newSet.delete(operationId);
					return newSet;
				});

				options.onError?.(error);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[generateTempId, initialItems, options],
	);

	// Operațiuni CRUD optimiste
	const createItem = useCallback(
		async (item: Omit<T, "id">, apiCall: () => Promise<T>) => {
			const tempItem = { ...item, id: generateTempId() } as T;

			return performOptimisticOperation(
				{
					type: "create",
					item: tempItem,
					optimisticId: tempItem.id as string,
				},
				apiCall,
			);
		},
		[performOptimisticOperation, generateTempId],
	);

	const updateItem = useCallback(
		async (
			id: number | string,
			updates: Partial<T>,
			apiCall: () => Promise<T>,
		) => {
			return performOptimisticOperation(
				{
					type: "update",
					filterFn: (item) => item.id === id,
					updateFn: (item) => ({ ...item, ...updates }),
				},
				apiCall,
			);
		},
		[performOptimisticOperation],
	);

	const deleteItem = useCallback(
		async (id: number | string, apiCall: () => Promise<void>) => {
			return performOptimisticOperation(
				{
					type: "delete",
					filterFn: (item) => item.id === id,
				},
				apiCall,
			);
		},
		[performOptimisticOperation],
	);

	// Reset la starea inițială
	const resetItems = useCallback((newItems: T[]) => {
		setItems(newItems);
		setPendingOperations(new Set());
	}, []);

	// Verifică dacă o operațiune este în curs
	const isPending = useCallback(
		(id?: string) => {
			if (id) {
				return pendingOperations.has(id);
			}
			return pendingOperations.size > 0;
		},
		[pendingOperations],
	);

	return {
		items,
		isLoading,
		isPending,
		createItem,
		updateItem,
		deleteItem,
		resetItems,
		setItems,
	};
}
