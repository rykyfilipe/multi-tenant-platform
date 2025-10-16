"use client";

import React, { Suspense, lazy, useEffect, useState, useRef } from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { WidgetType } from "@/generated/prisma";
import { WidgetSkeleton } from "./WidgetSkeleton";

/**
 * LAZY LOADING OPTIMIZATION
 * Load heavy renderers only when needed to improve initial load time
 */

// Lazy load heavy renderers (Chart uses recharts - very heavy library)
const ChartWidgetRenderer = lazy(() => 
  import("../renderers/ChartWidgetRenderer").then(m => ({ default: m.ChartWidgetRenderer }))
);

const TableWidgetRenderer = lazy(() => 
  import("../renderers/TableWidgetRenderer").then(m => ({ default: m.TableWidgetRenderer }))
);

// Light renderers can be loaded immediately
import { KPIWidgetRenderer } from "../renderers/KPIWidgetRenderer";
import { ClockWidgetRenderer } from "../renderers/ClockWidgetRenderer";
import { WeatherWidgetRenderer } from "../renderers/WeatherWidgetRenderer";
import { NotesWidgetRenderer } from "../renderers/NotesWidgetRenderer";
import { TasksWidgetRenderer } from "../renderers/TasksWidgetRenderer";
import { TextWidgetRenderer } from "../renderers/TextWidgetRenderer";

interface LazyWidgetProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
  isSelected?: boolean;
}

/**
 * INTERSECTION OBSERVER OPTIMIZATION
 * Only render widgets that are visible in viewport
 */
export const LazyWidget: React.FC<LazyWidgetProps> = (props) => {
  const { widget } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, mark for loading (will stay true even if scrolled away)
            setShouldLoad(true);
          }
        });
      },
      {
        // Load widgets slightly before they enter viewport
        rootMargin: "100px 0px",
        threshold: 0.01,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Get appropriate renderer based on widget type
  const getRenderer = () => {
    switch (widget.type) {
      case WidgetType.CHART:
        return ChartWidgetRenderer;
      case WidgetType.KPI:
        return KPIWidgetRenderer;
      case WidgetType.TABLE:
        return TableWidgetRenderer;
      case WidgetType.CLOCK:
        return ClockWidgetRenderer;
      case WidgetType.WEATHER:
        return WeatherWidgetRenderer;
      case WidgetType.NOTES:
        return NotesWidgetRenderer;
      case WidgetType.TASKS:
        return TasksWidgetRenderer;
      case WidgetType.TEXT:
        return TextWidgetRenderer;
      default:
        return null;
    }
  };

  const Renderer = getRenderer();

  const getSkeletonVariant = (): "chart" | "table" | "kpi" | "custom" => {
    const typeMap: Record<string, "chart" | "table" | "kpi" | "custom"> = {
      "CHART": "chart",
      "TABLE": "table",
      "KPI": "kpi",
      "CLOCK": "custom",
      "WEATHER": "custom",
      "NOTES": "custom",
      "TASKS": "custom",
      "TEXT": "custom",
    };
    return typeMap[widget.type] || "custom";
  };

  return (
    <div ref={containerRef} className="h-full w-full">
      {shouldLoad && Renderer ? (
        <Suspense fallback={<WidgetSkeleton variant={getSkeletonVariant()} />}>
          <Renderer {...props} />
        </Suspense>
      ) : (
        <WidgetSkeleton variant={getSkeletonVariant()} />
      )}
    </div>
  );
};

/**
 * PRELOAD OPTIMIZATION
 * Preload critical widget types in the background
 */
export const preloadCriticalWidgets = () => {
  // Preload Chart renderer (heaviest) in background after initial render
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      import("../renderers/ChartWidgetRenderer");
      import("../renderers/TableWidgetRenderer");
    }, 100);
  }
};

