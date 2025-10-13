"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface InfiniteScrollSelectOption {
  value: string;
  label: string;
  [key: string]: any;
}

interface InfiniteScrollSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: InfiniteScrollSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onSearch?: (searchTerm: string) => void;
  emptyMessage?: string;
}

export const InfiniteScrollSelect: React.FC<InfiniteScrollSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  className,
  disabled = false,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onSearch,
  emptyMessage = "No options available",
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
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
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onValueChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                      value === option.value && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}

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
        </div>
      </PopoverContent>
    </Popover>
  );
};

