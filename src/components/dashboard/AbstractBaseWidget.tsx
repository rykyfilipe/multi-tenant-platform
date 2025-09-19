/**
 * Abstract Base Widget Class
 * Provides lifecycle management and data source validation for all widgets
 */

import React from 'react';
import { WidgetType } from '@/types/widgets';

export interface BaseWidgetLifecycle {
  onMount?: () => void;
  onUnmount?: () => void;
  onConfigChange?: (newConfig: any) => void;
  onDataChange?: (newData: any) => void;
  onError?: (error: Error) => void;
}

export interface BaseWidgetConfig {
  id: string | number;
  type: WidgetType;
  title: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: any;
  isVisible: boolean;
  order: number;
  style?: any;
  dataSource?: {
    type: 'table' | 'manual' | 'api';
    tableId?: number | null;
    mapping?: Record<string, string>;
    columns?: string[];
    filters?: any[];
    [key: string]: any;
  };
}

export abstract class AbstractBaseWidget {
  protected config: BaseWidgetConfig;
  protected lifecycle: BaseWidgetLifecycle;
  protected data: any[] = [];
  protected isLoading: boolean = false;
  protected error: string | null = null;

  constructor(config: BaseWidgetConfig, lifecycle?: BaseWidgetLifecycle) {
    this.config = config;
    this.lifecycle = lifecycle || {};
  }

  // Abstract methods that must be implemented by subclasses
  abstract render(): React.ReactElement;
  abstract validateConfig(): { isValid: boolean; errors: string[] };
  abstract getRequiredFields(): string[];
  abstract getDefaultConfig(): any;

  // Lifecycle methods
  onMount(): void {
    this.lifecycle.onMount?.();
  }

  onUnmount(): void {
    this.lifecycle.onUnmount?.();
  }

  onConfigChange(newConfig: any): void {
    this.config = { ...this.config, ...newConfig };
    this.lifecycle.onConfigChange?.(newConfig);
  }

  onDataChange(newData: any): void {
    this.data = newData;
    this.lifecycle.onDataChange?.(newData);
  }

  onError(error: Error): void {
    this.error = error.message;
    this.lifecycle.onError?.(error);
  }

  // Data source validation
  validateDataSource(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.config.dataSource) {
      return { isValid: true, errors: [] }; // Data source is optional
    }

    const { dataSource } = this.config;
    const requiredFields = this.getRequiredFields();

    // Check required fields for this widget type
    for (const field of requiredFields) {
      if (!dataSource[field]) {
        errors.push(`Required field '${field}' is missing from data source`);
      }
    }

    // Validate table data source
    if (dataSource.type === 'table') {
      if (!dataSource.tableId) {
        errors.push('Table ID is required for table data source');
      }
      if (!dataSource.mapping || Object.keys(dataSource.mapping).length === 0) {
        errors.push('Column mapping is required for table data source');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Get widget configuration
  getConfig(): BaseWidgetConfig {
    return this.config;
  }

  // Get current data
  getData(): any[] {
    return this.data;
  }

  // Get loading state
  getLoadingState(): boolean {
    return this.isLoading;
  }

  // Get error state
  getError(): string | null {
    return this.error;
  }

  // Set loading state
  setLoading(loading: boolean): void {
    this.isLoading = loading;
  }

  // Set error state
  setError(error: string | null): void {
    this.error = error;
  }

  // Update data
  updateData(data: any[]): void {
    this.data = data;
    this.onDataChange(data);
  }

  // Clone widget with new configuration
  clone(newConfig?: Partial<BaseWidgetConfig>): AbstractBaseWidget {
    const clonedConfig = { ...this.config, ...newConfig };
    return new (this.constructor as any)(clonedConfig, this.lifecycle);
  }

  // Serialize widget to JSON
  toJSON(): BaseWidgetConfig {
    return {
      ...this.config,
      dataSource: this.config.dataSource ? { ...this.config.dataSource } : undefined
    };
  }

  // Create widget from JSON
  static fromJSON(json: BaseWidgetConfig, lifecycle?: BaseWidgetLifecycle): AbstractBaseWidget {
    return new (this as any)(json, lifecycle);
  }
}

export default AbstractBaseWidget;
