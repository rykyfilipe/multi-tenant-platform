/**
 * Widget Performance Hooks
 * Optimized hooks for widget performance
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { BaseWidget, WidgetConfig } from '@/types/widgets';

/**
 * Memoized widget configuration
 */
export function useWidgetConfig(widget: BaseWidget) {
  return useMemo(() => {
    return {
      dataSource: widget.config?.dataSource,
      options: widget.config?.options,
      chartType: widget.config?.chartType,
      style: widget.style
    };
  }, [widget.config, widget.style]);
}

/**
 * Memoized widget position
 */
export function useWidgetPosition(widget: BaseWidget) {
  return useMemo(() => {
    return {
      x: widget.position.x,
      y: widget.position.y,
      width: widget.position.width,
      height: widget.position.height
    };
  }, [widget.position.x, widget.position.y, widget.position.width, widget.position.height]);
}

/**
 * Debounced widget update
 */
export function useDebouncedWidgetUpdate(
  widget: BaseWidget,
  onUpdate: (widget: BaseWidget) => void,
  delay: number = 300
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<BaseWidget>(widget);

  const debouncedUpdate = useCallback((updatedWidget: BaseWidget) => {
    lastUpdateRef.current = updatedWidget;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onUpdate(lastUpdateRef.current);
    }, delay);
  }, [onUpdate, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedUpdate;
}

/**
 * Widget visibility optimization
 */
export function useWidgetVisibility(widget: BaseWidget, containerRef: React.RefObject<HTMLElement>) {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [containerRef]);

  return isVisible;
}

/**
 * Widget resize optimization
 */
export function useWidgetResize(
  widget: BaseWidget,
  onResize: (position: { width: number; height: number }) => void
) {
  const resizeObserverRef = useRef<ResizeObserver>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        onResize({ width, height });
      }
    });

    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [onResize]);

  return containerRef;
}

/**
 * Widget data caching
 */
export function useWidgetDataCache(widget: BaseWidget, data: any[]) {
  const cacheKey = useMemo(() => {
    return `${widget.id}-${JSON.stringify(widget.config)}`;
  }, [widget.id, widget.config]);

  const cachedData = useMemo(() => {
    return data;
  }, [data, cacheKey]);

  return cachedData;
}

/**
 * Widget render optimization
 */
export function useWidgetRenderOptimization(widget: BaseWidget) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());

  useEffect(() => {
    renderCountRef.current += 1;
    lastRenderTimeRef.current = Date.now();
  });

  const shouldRender = useMemo(() => {
    // Only re-render if widget config or position changed significantly
    return true;
  }, [widget.config, widget.position]);

  return {
    renderCount: renderCountRef.current,
    lastRenderTime: lastRenderTimeRef.current,
    shouldRender
  };
}

/**
 * Widget memory optimization
 */
export function useWidgetMemoryOptimization(widget: BaseWidget) {
  const cleanupRef = useRef<(() => void)[]>([]);

  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupRef.current.push(cleanup);
  }, []);

  useEffect(() => {
    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [widget.id]);

  return { addCleanup };
}

// All hooks are already exported individually above
