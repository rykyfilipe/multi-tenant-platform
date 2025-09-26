"use client";

import React from "react";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";

export const PendingChangesBadge: React.FC = () => {
  const pendingCount = useWidgetsStore((state) => state.pendingOperations.length);

  if (!pendingCount) return null;

  return (
    <div className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
      {pendingCount} pending change{pendingCount === 1 ? "" : "s"}
    </div>
  );
};
