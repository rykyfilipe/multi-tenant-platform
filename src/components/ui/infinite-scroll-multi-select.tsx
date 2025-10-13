"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface InfiniteScrollMultiSelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface InfiniteScrollMultiSelectProps {
  value?: string[] | string | null;
  onValueChange: (value: string[] | null) => void;
  options: InfiniteScrollMultiSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onSearch?: (searchTerm: string) => void;
  emptyMessage?: string;
  referencedTableName?: string;
}

export const InfiniteScrollMultiSelect: React.FC<InfiniteScrollMultiSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onSearch,
  emptyMessage = "No options available",
  referencedTableName,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Normalize value to array
  const selectedValues = useMemo(() => {
    if (Array.isArray(value)) {
      return value.map((val) => val?.toString() || "");
    }
    return value ? [value.toString()] : [];
  }, [value]);

  const selectedOptions = useMemo(() => {
    return options.filter((option) => selectedValues.includes(option.value));
  }, [options, selectedValues]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || !onLoadMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.1,
      }
    );

    observerRef.current.observe(loadMoreRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (onSearch && searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  }, [onSearch, searchTerm]);

  // Search on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm("");
    if (onSearch) {
      onSearch("");
    }
  };

  // Toggle option selection
  const toggleOption = (optionValue: string) => {
    const isCurrentlySelected = selectedValues.includes(optionValue);
    
    const newValues = isCurrentlySelected
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];

    onValueChange(newValues.length > 0 ? newValues : null);
  };

  // Remove option
  const removeOption = (optionValue: string) => {
    const newValues = selectedValues.filter((v) => v !== optionValue);
    onValueChange(newValues.length > 0 ? newValues : null);
  };

  // Clear all selections
  const clearAll = () => {
    onValueChange(null);
  };

  // Get display text
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    if (selectedOptions.length === 1) {
      return selectedOptions[0]?.label || selectedValues[0];
    }
    const firstItem = selectedOptions[0]?.label || selectedValues[0];
    return `${firstItem} +${selectedOptions.length - 1} more`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-9 h-auto",
            selectedValues.length === 0 && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 overflow-hidden">
            {selectedValues.length > 0 ? (
              <>
                {selectedOptions.slice(0, 2).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="text-xs max-w-[100px] truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOption(option.value);
                    }}
                  >
                    <span className="truncate">{option.label}</span>
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {selectedValues.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{selectedValues.length - 2} more
                  </Badge>
                )}
              </>
            ) : (
              <span className="truncate">{getDisplayText()}</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {selectedValues.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="flex flex-col">
          {/* Search Bar */}
          {onSearch && (
            <div className="flex items-center border-b p-2 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-8 pr-8 h-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-8 w-8 p-0"
                    onClick={clearSearch}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleSearch}
                className="h-8 px-3"
                disabled={!searchTerm.trim()}
              >
                Search
              </Button>
            </div>
          )}

          {/* Options List */}
          <div
            ref={scrollContainerRef}
            className="max-h-[300px] overflow-y-auto p-1"
          >
            {options.length === 0 && !isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      onClick={() => toggleOption(option.value)}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                        isSelected && "bg-accent text-accent-foreground"
                      )}
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                        {isSelected && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}

                {/* Load More Trigger */}
                {hasMore && (
                  <div ref={loadMoreRef} className="py-2 text-center">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Loading more...
                        </span>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onLoadMore}
                        className="w-full"
                      >
                        Load more
                      </Button>
                    )}
                  </div>
                )}

                {/* Initial Loading */}
                {isLoading && options.length === 0 && (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {options.length > 0 && (
            <div className="border-t px-2 py-1.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>
                  {options.length} {referencedTableName || "options"}
                </span>
                {selectedValues.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {selectedValues.length} selected
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

