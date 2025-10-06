"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BarChart3, Table as TableIcon, Target } from "lucide-react";

interface WidgetSkeletonProps {
  variant?: "chart" | "table" | "kpi" | "custom";
  className?: string;
  showIcon?: boolean;
}

export const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ 
  variant = "custom", 
  className = "",
  showIcon = true 
}) => {
  const renderChartSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className="p-2 rounded-lg bg-muted/50">
              <BarChart3 className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="relative h-32 w-full bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-transparent animate-shimmer" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className="p-2 rounded-lg bg-muted/50">
              <TableIcon className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
          <Skeleton className="h-4 w-20" />
        </div>
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
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className="p-2 rounded-lg bg-muted/50">
              <Target className="h-4 w-4 text-muted-foreground/50" />
            </div>
          )}
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );

  const renderCustomSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="relative h-24 w-full bg-gradient-to-br from-muted/30 to-muted/50 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/10 to-transparent animate-shimmer" />
        </div>
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
    <Card className={cn(
      "border border-border/50 bg-card/50 backdrop-blur-sm",
      "animate-in fade-in-0 duration-500",
      className
    )}>
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

// Enhanced loading grid for multiple widgets
export const WidgetGridSkeleton: React.FC<{ count?: number; className?: string }> = ({ 
  count = 6,
  className 
}) => (
  <div className={cn(
    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
    className
  )}>
    {Array.from({ length: count }).map((_, i) => (
      <WidgetSkeleton 
        key={i} 
        variant={i % 4 === 0 ? "chart" : i % 4 === 1 ? "table" : i % 4 === 2 ? "kpi" : "custom"}
      />
    ))}
  </div>
);

// Enhanced toolbar skeleton
export const ToolbarSkeleton: React.FC = () => (
  <Card className="mb-4 border-border/50 bg-card/50">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-6 w-32" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/20">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-2 w-20" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

// Enhanced search skeleton
export const SearchSkeleton: React.FC = () => (
  <div className="flex items-center gap-2 w-full max-w-2xl">
    <Skeleton className="h-11 flex-1 rounded-lg" />
    <Skeleton className="h-11 w-24 rounded-lg" />
  </div>
);

// Enhanced bulk operations skeleton
export const BulkOperationsSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/30">
    <Skeleton className="h-5 w-5 rounded" />
    <Skeleton className="h-4 w-32" />
    <div className="flex gap-2 ml-auto">
      <Skeleton className="h-9 w-24 rounded-md" />
      <Skeleton className="h-9 w-20 rounded-md" />
      <Skeleton className="h-9 w-9 rounded-md" />
    </div>
  </div>
);

// Shimmer animation CSS (add to globals.css if not present)
/*
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
*/
