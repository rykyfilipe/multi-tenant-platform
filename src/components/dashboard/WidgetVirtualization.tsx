/**
 * Widget Virtualization Component
 * Virtualizes widgets for better performance with large numbers
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { BaseWidget, WidgetProps } from '@/types/widgets';
import { WidgetRegistry } from './WidgetRegistry';

interface WidgetVirtualizationProps {
  widgets: BaseWidget[];
  containerHeight: number;
  itemHeight: number;
  overscan?: number;
  onWidgetProps?: (widget: BaseWidget) => Partial<WidgetProps>;
  className?: string;
}

export function WidgetVirtualization({
  widgets,
  containerHeight,
  itemHeight,
  overscan = 5,
  onWidgetProps,
  className
}: WidgetVirtualizationProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      widgets.length
    );
    return { start, end };
  }, [scrollTop, containerHeight, itemHeight, overscan, widgets.length]);

  // Get visible widgets
  const visibleWidgets = useMemo(() => {
    return widgets.slice(visibleRange.start, visibleRange.end);
  }, [widgets, visibleRange]);

  // Calculate total height
  const totalHeight = widgets.length * itemHeight;

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleWidgets.map((widget, index) => {
          const actualIndex = visibleRange.start + index;
          const top = actualIndex * itemHeight;
          
          return (
            <div
              key={widget.id}
              style={{
                position: 'absolute',
                top,
                left: 0,
                right: 0,
                height: itemHeight
              }}
            >
              {WidgetRegistry.render(widget, {
                ...onWidgetProps?.(widget),
                className: 'h-full'
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Grid-based widget virtualization
 */
interface WidgetGridVirtualizationProps {
  widgets: BaseWidget[];
  containerWidth: number;
  containerHeight: number;
  itemWidth: number;
  itemHeight: number;
  gap?: number;
  overscan?: number;
  onWidgetProps?: (widget: BaseWidget) => Partial<WidgetProps>;
  className?: string;
}

export function WidgetGridVirtualization({
  widgets,
  containerWidth,
  containerHeight,
  itemWidth,
  itemHeight,
  gap = 16,
  overscan = 5,
  onWidgetProps,
  className
}: WidgetGridVirtualizationProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions
  const gridDimensions = useMemo(() => {
    const cols = Math.floor((containerWidth + gap) / (itemWidth + gap));
    const rows = Math.ceil(widgets.length / cols);
    return { cols, rows };
  }, [containerWidth, itemWidth, gap, widgets.length]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / (itemHeight + gap));
    const endRow = Math.min(
      startRow + Math.ceil(containerHeight / (itemHeight + gap)) + overscan,
      gridDimensions.rows
    );
    
    const startCol = Math.floor(scrollLeft / (itemWidth + gap));
    const endCol = Math.min(
      startCol + Math.ceil(containerWidth / (itemWidth + gap)) + overscan,
      gridDimensions.cols
    );
    
    return { startRow, endRow, startCol, endCol };
  }, [scrollTop, scrollLeft, containerHeight, containerWidth, itemHeight, itemWidth, gap, overscan, gridDimensions]);

  // Get visible widgets
  const visibleWidgets = useMemo(() => {
    const widgets: Array<{ widget: BaseWidget; row: number; col: number; index: number }> = [];
    
    for (let row = visibleRange.startRow; row < visibleRange.endRow; row++) {
      for (let col = visibleRange.startCol; col < visibleRange.endCol; col++) {
        const index = row * gridDimensions.cols + col;
        if (index < widgets.length) {
          widgets.push({
            widget: widgets[index],
            row,
            col,
            index
          });
        }
      }
    }
    
    return widgets;
  }, [widgets, visibleRange, gridDimensions.cols]);

  // Calculate total dimensions
  const totalWidth = gridDimensions.cols * (itemWidth + gap) - gap;
  const totalHeight = gridDimensions.rows * (itemHeight + gap) - gap;

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ 
        height: containerHeight, 
        width: containerWidth,
        overflow: 'auto' 
      }}
      onScroll={handleScroll}
    >
      <div style={{ 
        height: totalHeight, 
        width: totalWidth,
        position: 'relative' 
      }}>
        {visibleWidgets.map(({ widget, row, col, index }) => {
          const top = row * (itemHeight + gap);
          const left = col * (itemWidth + gap);
          
          return (
            <div
              key={widget.id}
              style={{
                position: 'absolute',
                top,
                left,
                width: itemWidth,
                height: itemHeight
              }}
            >
              {WidgetRegistry.render(widget, {
                ...onWidgetProps?.(widget),
                className: 'h-full w-full'
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WidgetVirtualization;
