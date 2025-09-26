"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface WidgetSkeletonProps {
  variant?: "chart" | "table" | "kpi" | "custom";
  className?: string;
}

export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ 
  variant = "custom", 
  className = "" 
}) => {
  const renderChartSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderKpiSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );

  const renderCustomSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
    </div>
  );

  const renderSkeletonContent = () => {
    switch (variant) {
      case "chart":
        return renderChartSkeleton();
      case "table":
        return renderTableSkeleton();
      case "kpi":
        return renderKpiSkeleton();
      default:
        return renderCustomSkeleton();
    }
  };

  return (
    <Card className={`border-dashed ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        {renderSkeletonContent()}
      </CardContent>
    </Card>
  );
};

// Loading grid for multiple widgets
export const WidgetGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <WidgetSkeleton 
        key={i} 
        variant={i % 4 === 0 ? "chart" : i % 4 === 1 ? "table" : i % 4 === 2 ? "kpi" : "custom"}
      />
    ))}
  </div>
);

// Loading state for toolbar
export const ToolbarSkeleton: React.FC = () => (
  <Card className="mb-4">
    <CardHeader>
      <Skeleton className="h-6 w-32" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Loading state for search
export const SearchSkeleton: React.FC = () => (
  <div className="flex items-center gap-2 w-full max-w-2xl">
    <Skeleton className="h-10 flex-1" />
    <Skeleton className="h-10 w-20" />
  </div>
);

// Loading state for bulk operations
export const BulkOperationsSkeleton: React.FC = () => (
  <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
    <Skeleton className="h-4 w-4 rounded" />
    <Skeleton className="h-4 w-24" />
    <div className="flex gap-1">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-8" />
    </div>
  </div>
);
