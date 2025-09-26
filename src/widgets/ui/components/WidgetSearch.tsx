"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X, Calendar, Tag } from "lucide-react";
import { WidgetKind } from "@/generated/prisma";
import { WidgetEntity } from "@/widgets/domain/entities";

interface WidgetSearchProps {
  widgets: WidgetEntity[];
  onFilteredWidgets: (widgets: WidgetEntity[]) => void;
  onSearchFocus?: () => void;
}

export const WidgetSearch: React.FC<WidgetSearchProps> = ({
  widgets,
  onFilteredWidgets,
  onSearchFocus,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKind, setSelectedKind] = useState<WidgetKind | "all">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [isOpen, setIsOpen] = useState(false);

  const filteredWidgets = useMemo(() => {
    let filtered = widgets;

    // Search by title and description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (widget) =>
          widget.title?.toLowerCase().includes(query) ||
          widget.description?.toLowerCase().includes(query) ||
          widget.kind.toLowerCase().includes(query)
      );
    }

    // Filter by widget kind
    if (selectedKind !== "all") {
      filtered = filtered.filter((widget) => widget.kind === selectedKind);
    }

    // Filter by date
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter((widget) => widget.createdAt >= filterDate);
    }

    return filtered;
  }, [widgets, searchQuery, selectedKind, dateFilter]);

  React.useEffect(() => {
    onFilteredWidgets(filteredWidgets);
  }, [filteredWidgets, onFilteredWidgets]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedKind("all");
    setDateFilter("all");
  };

  const hasActiveFilters = searchQuery || selectedKind !== "all" || dateFilter !== "all";

  const widgetKindOptions = [
    { value: "all", label: "All Types" },
    { value: WidgetKind.CHART, label: "Chart" },
    { value: WidgetKind.TABLE, label: "Table" },
    { value: WidgetKind.KPI, label: "KPI" },
    { value: WidgetKind.WEATHER, label: "Weather" },
    { value: WidgetKind.CLOCK, label: "Clock" },
    { value: WidgetKind.CUSTOM, label: "Custom" },
  ];

  return (
    <div className="flex items-center gap-2 w-full max-w-2xl">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search widgets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={onSearchFocus}
          className="pl-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                {[searchQuery, selectedKind !== "all", dateFilter !== "all"].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Widget Type
                </label>
                <Select value={selectedKind} onValueChange={(value) => setSelectedKind(value as WidgetKind | "all")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {widgetKindOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created Date
                </label>
                <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as typeof dateFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="pt-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredWidgets.length} of {widgets.length} widgets
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
