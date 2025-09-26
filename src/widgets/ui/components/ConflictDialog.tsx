"use client";

import React from "react";
import { ConflictMetadata } from "@/widgets/domain/entities";

interface ConflictDialogProps {
  conflicts: ConflictMetadata[];
  onResolve: (strategy: "keepLocal" | "acceptRemote" | "manual", conflict: ConflictMetadata) => void;
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({ conflicts, onResolve }) => {
  if (!conflicts.length) return null;

  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <h2 className="font-semibold">Conflicts detected</h2>
      <p className="mt-1 mb-3 text-xs text-amber-800">
        Some widgets changed since you started editing. Decide how to resolve each conflict.
      </p>
      <ul className="space-y-3">
        {conflicts.map((conflict) => (
          <li key={conflict.widgetId} className="rounded border border-amber-200 bg-white p-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>Widget #{conflict.widgetId}</span>
              <span>
                Local v{conflict.localVersion} vs Remote v{conflict.remoteVersion}
              </span>
            </div>
            <div className="mt-2 flex gap-2 text-xs">
              <button
                className="rounded bg-amber-500 px-2 py-1 text-white hover:bg-amber-600"
                onClick={() => onResolve("keepLocal", conflict)}
              >
                Keep Local
              </button>
              <button
                className="rounded bg-amber-100 px-2 py-1 text-amber-900 hover:bg-amber-200"
                onClick={() => onResolve("acceptRemote", conflict)}
              >
                Accept Remote
              </button>
              <button
                className="rounded border border-amber-400 px-2 py-1 text-amber-900 hover:bg-amber-100"
                onClick={() => onResolve("manual", conflict)}
              >
                Manual Merge
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
