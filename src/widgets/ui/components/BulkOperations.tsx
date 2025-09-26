"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Copy,
  Trash2,
  Move,
  Settings,
  MoreHorizontal,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import { WidgetEntity } from "@/widgets/domain/entities";

interface BulkOperationsProps {
  selectedWidgets: Set<number>;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onMoveSelected: () => void;
  onConfigureSelected: () => void;
  totalWidgets: number;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedWidgets,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onDuplicateSelected,
  onMoveSelected,
  onConfigureSelected,
  totalWidgets,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedCount = selectedWidgets.size;
  const isAllSelected = selectedCount === totalWidgets && totalWidgets > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalWidgets;

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [isAllSelected, onSelectAll, onDeselectAll]);

  if (selectedCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="gap-2"
        >
          {isAllSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          Select All
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={isAllSelected}
          ref={(el) => {
            if (el) el.indeterminate = isPartiallySelected;
          }}
          onCheckedChange={handleSelectAll}
        />
        <span className="text-sm font-medium">
          {selectedCount} widget{selectedCount !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicateSelected}
          className="gap-1"
        >
          <Copy className="h-3 w-3" />
          Duplicate
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onMoveSelected}
          className="gap-1"
        >
          <Move className="h-3 w-3" />
          Move
        </Button>

        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onConfigureSelected}>
              <Settings className="h-4 w-4 mr-2" />
              Configure Selected
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDeleteSelected}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDeselectAll}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
