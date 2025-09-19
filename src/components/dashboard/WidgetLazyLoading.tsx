/**
 * Widget Lazy Loading Component
 * Lazy loads widgets when they come into view
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BaseWidget, WidgetProps } from '@/types/widgets';
import { WidgetRegistry } from './WidgetRegistry';
import { WidgetLoading } from './composition/WidgetLoading';

interface WidgetLazyLoadingProps {
  widget: BaseWidget;
  onWidgetProps?: (widget: BaseWidget) => Partial<WidgetProps>;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function WidgetLazyLoading({
  widget,
  onWidgetProps,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  className
}: WidgetLazyLoadingProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Handle intersection
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      setIsInView(true);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    }
  }, []);

  // Set up intersection observer
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    });

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin]);

  // Load widget when in view
  useEffect(() => {
    if (isInView && !isLoaded) {
      try {
        setIsLoaded(true);
      } catch (err) {
        setError(err as Error);
      }
    }
  }, [isInView, isLoaded]);

  // Render loading state
  if (!isLoaded) {
    return (
      <div ref={containerRef} className={className}>
        {fallback || <WidgetLoading type="skeleton" size="md" />}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-32 text-destructive">
          <div className="text-center">
            <div className="text-sm font-medium">Error loading widget</div>
            <div className="text-xs text-muted-foreground">{error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  // Render widget
  return (
    <div className={className}>
      {WidgetRegistry.render(widget, onWidgetProps?.(widget) || {})}
    </div>
  );
}

/**
 * Lazy loading with preloading
 */
interface WidgetLazyLoadingWithPreloadProps extends WidgetLazyLoadingProps {
  preloadDistance?: number;
  onPreload?: (widget: BaseWidget) => void;
}

export function WidgetLazyLoadingWithPreload({
  widget,
  onWidgetProps,
  fallback,
  threshold = 0.1,
  rootMargin = '50px',
  preloadDistance = 200,
  onPreload,
  className
}: WidgetLazyLoadingWithPreloadProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Handle intersection
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting) {
      setIsInView(true);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    }
  }, []);

  // Set up intersection observer
  useEffect(() => {
    if (!containerRef.current) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin: `${rootMargin} ${preloadDistance}px`
    });

    observerRef.current.observe(containerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold, rootMargin, preloadDistance]);

  // Preload widget
  useEffect(() => {
    if (isInView && !isPreloaded) {
      try {
        onPreload?.(widget);
        setIsPreloaded(true);
      } catch (err) {
        setError(err as Error);
      }
    }
  }, [isInView, isPreloaded, widget, onPreload]);

  // Load widget when in view
  useEffect(() => {
    if (isInView && !isLoaded) {
      try {
        setIsLoaded(true);
      } catch (err) {
        setError(err as Error);
      }
    }
  }, [isInView, isLoaded]);

  // Render loading state
  if (!isLoaded) {
    return (
      <div ref={containerRef} className={className}>
        {fallback || <WidgetLoading type="skeleton" size="md" />}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-32 text-destructive">
          <div className="text-center">
            <div className="text-sm font-medium">Error loading widget</div>
            <div className="text-xs text-muted-foreground">{error.message}</div>
          </div>
        </div>
      </div>
    );
  }

  // Render widget
  return (
    <div className={className}>
      {WidgetRegistry.render(widget, onWidgetProps?.(widget) || {})}
    </div>
  );
}

export default WidgetLazyLoading;
