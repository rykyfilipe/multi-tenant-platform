/** @format */

"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, HardDrive, BarChart3, RefreshCw } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface RealSizeInfoProps {
  databases: Array<{
    name: string;
    realSizeMB: number;
    realSizeKB: number;
    realSizeFormatted: string;
    tables: number;
    rows: number;
    cells: number;
  }>;
  totalMemoryUsed: number;
  totalRows: number;
  totalTables: number;
  loading?: boolean;
}

export function RealSizeInfo({ 
  databases, 
  totalMemoryUsed, 
  totalRows, 
  totalTables, 
  loading = false 
}: RealSizeInfoProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Real Database Sizes
          </CardTitle>
          <CardDescription>
            Actual storage usage calculated using PostgreSQL pg_column_size
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Real Database Sizes
        </CardTitle>
        <CardDescription>
          Actual storage usage calculated using PostgreSQL pg_column_size
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {formatFileSize(totalMemoryUsed * 1024 * 1024)}
              </div>
              <div className="text-sm text-muted-foreground">Total Storage</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {totalTables.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
          </div>

          {/* Database Details */}
          <div className="space-y-3">
            {databases.map((db, index) => (
              <div key={db.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{db.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {db.tables} tables • {db.rows.toLocaleString()} rows • {db.cells.toLocaleString()} cells
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">
                    {db.realSizeFormatted}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {db.realSizeMB.toFixed(3)} MB
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Note */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-start gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  Real-time Size Calculation
                </div>
                <div className="text-blue-700 dark:text-blue-300 mt-1">
                  Sizes are calculated using PostgreSQL's <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">pg_column_size()</code> function 
                  for accurate byte-level measurements of your actual data.
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
