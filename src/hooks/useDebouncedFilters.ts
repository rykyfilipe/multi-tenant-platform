/**
 * Custom hook for debounced filter operations
 * Prevents excessive API calls when users type quickly in filter inputs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FilterConfig } from '@/types/filtering';

interface UseDebouncedFiltersOptions {
  debounceMs?: number;
  onFiltersChange?: (filters: FilterConfig[]) => void;
  onGlobalSearchChange?: (search: string) => void;
}

export function useDebouncedFilters(options: UseDebouncedFiltersOptions = {}) {
  const { debounceMs = 300, onFiltersChange, onGlobalSearchChange } = options;
  
  // Internal state
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isDebouncing, setIsDebouncing] = useState(false);
  
  // Refs for debouncing
  const filtersTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced filters update
  const updateFilters = useCallback((newFilters: FilterConfig[]) => {
    setFilters(newFilters);
    setIsDebouncing(true);
    
    // Clear existing timeout
    if (filtersTimeoutRef.current) {
      clearTimeout(filtersTimeoutRef.current);
    }
    
    // Set new timeout
    filtersTimeoutRef.current = setTimeout(() => {
      onFiltersChange?.(newFilters);
      setIsDebouncing(false);
    }, debounceMs);
  }, [debounceMs, onFiltersChange]);
  
  // Debounced global search update
  const updateGlobalSearch = useCallback((newSearch: string) => {
    setGlobalSearch(newSearch);
    setIsDebouncing(true);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      onGlobalSearchChange?.(newSearch);
      setIsDebouncing(false);
    }, debounceMs);
  }, [debounceMs, onGlobalSearchChange]);
  
  // Immediate update for filters (no debouncing)
  const setFiltersImmediate = useCallback((newFilters: FilterConfig[]) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [onFiltersChange]);
  
  // Immediate update for global search (no debouncing)
  const setGlobalSearchImmediate = useCallback((newSearch: string) => {
    setGlobalSearch(newSearch);
    onGlobalSearchChange?.(newSearch);
  }, [onGlobalSearchChange]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters([]);
    setGlobalSearch('');
    onFiltersChange?.([]);
    onGlobalSearchChange?.('');
  }, [onFiltersChange, onGlobalSearchChange]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (filtersTimeoutRef.current) {
        clearTimeout(filtersTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    // State
    filters,
    globalSearch,
    isDebouncing,
    
    // Actions
    updateFilters,
    updateGlobalSearch,
    setFiltersImmediate,
    setGlobalSearchImmediate,
    clearFilters,
    
    // Setters for external control
    setFilters,
    setGlobalSearch,
  };
}
