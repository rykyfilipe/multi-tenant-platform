/**
 * Widget Data Mappers
 * Centralized data mapping for different widget types
 */

import { BaseWidget, WidgetType, DataSource } from '@/types/widgets';

export interface MappedData {
  [key: string]: any;
}

export interface ChartMappedData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }>;
}

export interface TableMappedData {
  columns: Array<{
    key: string;
    label: string;
    type: string;
  }>;
  rows: Array<Record<string, any>>;
  totalCount: number;
}

export interface MetricMappedData {
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface TextMappedData {
  content: string;
  type: 'plain' | 'html' | 'markdown';
}

/**
 * Base data mapper interface
 */
export interface WidgetDataMapper<T = any> {
  map(data: any[], config: any, dataSource: DataSource): T;
  validate(data: any[], config: any, dataSource: DataSource): { isValid: boolean; errors: string[] };
}

/**
 * Chart Data Mapper
 * Maps raw data to chart format (labels + datasets)
 */
export class ChartDataMapper implements WidgetDataMapper<ChartMappedData> {
  map(data: any[], config: any, dataSource: DataSource): ChartMappedData {
    if (!data || data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const { xAxis, yAxis, chartType } = config;
    const xKey = xAxis?.key || 'x';
    const yKey = yAxis?.key || 'y';
    const labelKey = xAxis?.key || 'label';

    // Check if data is in complex format (with cell objects)
    const isComplexFormat = data.some(item => 
      item && typeof item === 'object' && 
      'column' in item && 'value' in item
    );

    let processedData = data;
    if (isComplexFormat) {
      processedData = this.mapComplexData(data);
    }

    // Extract unique labels from x-axis
    const labels = [...new Set(processedData.map(item => item[xKey] || item[labelKey]).filter(Boolean))];

    // For single series charts (line, bar, pie)
    if (chartType === 'line' || chartType === 'bar' || chartType === 'pie') {
      const dataset = {
        label: yAxis?.label || 'Value',
        data: labels.map(label => {
          const item = processedData.find(d => (d[xKey] || d[labelKey]) === label);
          return item ? Number(item[yKey]) || 0 : 0;
        }),
        backgroundColor: config.colors?.[0] || '#3B82F6',
        borderColor: config.colors?.[0] || '#3B82F6',
        borderWidth: 2
      };

      return {
        labels,
        datasets: [dataset]
      };
    }

    // For multi-series charts (if supported in future)
    return {
      labels,
      datasets: []
    };
  }

  private mapComplexData(data: any[]): any[] {
    // Group data by rowId
    const rowMap = new Map<number, any>();
    
    data.forEach(cell => {
      if (!cell.rowId) return;
      
      if (!rowMap.has(cell.rowId)) {
        rowMap.set(cell.rowId, { id: cell.rowId });
      }
      
      const row = rowMap.get(cell.rowId);
      const columnName = cell.column?.name;
      if (columnName) {
        // Extract the actual value based on column type
        row[columnName] = this.extractValue(cell);
      }
    });

    return Array.from(rowMap.values());
  }

  private extractValue(cell: any): any {
    // Extract the actual value based on the column type
    if (cell.stringValue !== null && cell.stringValue !== undefined) {
      return cell.stringValue;
    }
    if (cell.numberValue !== null && cell.numberValue !== undefined) {
      return cell.numberValue;
    }
    if (cell.dateValue !== null && cell.dateValue !== undefined) {
      return cell.dateValue;
    }
    if (cell.booleanValue !== null && cell.booleanValue !== undefined) {
      return cell.booleanValue;
    }
    // Fallback to the generic value
    return cell.value;
  }

  validate(data: any[], config: any, dataSource: DataSource): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data || data.length === 0) {
      errors.push('No data available');
      return { isValid: false, errors };
    }

    const { xAxis, yAxis } = config;
    const xKey = xAxis?.key;
    const yKey = yAxis?.key;

    if (!xKey) {
      errors.push('X-axis key is required');
    }

    if (!yKey) {
      errors.push('Y-axis key is required');
    }

    // Check if required keys exist in data
    const sampleItem = data[0];
    if (sampleItem) {
      if (xKey && !(xKey in sampleItem)) {
        errors.push(`X-axis key '${xKey}' not found in data`);
      }
      if (yKey && !(yKey in sampleItem)) {
        errors.push(`Y-axis key '${yKey}' not found in data`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Table Data Mapper
 * Maps raw data to table format
 */
export class TableDataMapper implements WidgetDataMapper<TableMappedData> {
  map(data: any[], config: any, dataSource: DataSource): TableMappedData {
    console.log('[TableDataMapper] Input data:', data);
    console.log('[TableDataMapper] Config:', config);
    console.log('[TableDataMapper] Data source:', dataSource);
    
    if (!data || data.length === 0) {
      console.log('[TableDataMapper] No data, returning empty result');
      return {
        columns: [],
        rows: [],
        totalCount: 0
      };
    }

    const { columns } = dataSource;
    
    // Check if data is in complex format (with cell objects)
    const isComplexFormat = data.some(item => 
      item && typeof item === 'object' && 
      'column' in item && 'value' in item
    );

    console.log('[TableDataMapper] Is complex format:', isComplexFormat);
    console.log('[TableDataMapper] Columns from data source:', columns);

    if (isComplexFormat) {
      const result = this.mapComplexData(data, columns);
      console.log('[TableDataMapper] Complex data mapping result:', result);
      return result;
    }

    // Simple format - direct mapping
    const sampleItem = data[0];
    const tableColumns = columns && columns.length > 0 
      ? columns.map(col => ({
          key: col,
          label: col.charAt(0).toUpperCase() + col.slice(1),
          type: this.inferType(sampleItem[col])
        }))
      : Object.keys(sampleItem).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          type: this.inferType(sampleItem[key])
        }));

    return {
      columns: tableColumns,
      rows: data,
      totalCount: data.length
    };
  }

  private mapComplexData(data: any[], columns?: string[]): TableMappedData {
    console.log('[TableDataMapper] mapComplexData - Input data:', data);
    console.log('[TableDataMapper] mapComplexData - Columns:', columns);
    
    // Group data by rowId
    const rowMap = new Map<number, any>();
    
    data.forEach((cell, index) => {
      console.log(`[TableDataMapper] Processing cell ${index}:`, cell);
      
      if (!cell.rowId) {
        console.log(`[TableDataMapper] Cell ${index} has no rowId, skipping`);
        return;
      }
      
      if (!rowMap.has(cell.rowId)) {
        rowMap.set(cell.rowId, { id: cell.rowId });
        console.log(`[TableDataMapper] Created new row for rowId ${cell.rowId}`);
      }
      
      const row = rowMap.get(cell.rowId);
      const columnName = cell.column?.name;
      console.log(`[TableDataMapper] Column name: ${columnName}`);
      
      if (columnName) {
        // Extract the actual value based on column type
        const extractedValue = this.extractValue(cell);
        console.log(`[TableDataMapper] Extracted value for ${columnName}:`, extractedValue);
        row[columnName] = extractedValue;
      }
    });

    const rows = Array.from(rowMap.values());
    
    if (rows.length === 0) {
      return {
        columns: [],
        rows: [],
        totalCount: 0
      };
    }

    // Generate columns from the first row or specified columns
    const sampleRow = rows[0];
    const tableColumns = columns && columns.length > 0 
      ? columns.map(col => ({
          key: col,
          label: col.charAt(0).toUpperCase() + col.slice(1),
          type: this.inferType(sampleRow[col])
        }))
      : Object.keys(sampleRow).filter(key => key !== 'id').map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          type: this.inferType(sampleRow[key])
        }));

    return {
      columns: tableColumns,
      rows: rows,
      totalCount: rows.length
    };
  }

  private extractValue(cell: any): any {
    console.log('[TableDataMapper] extractValue - Input cell:', cell);
    
    // Extract the actual value based on the column type
    if (cell.stringValue !== null && cell.stringValue !== undefined) {
      console.log('[TableDataMapper] Using stringValue:', cell.stringValue);
      return cell.stringValue;
    }
    if (cell.numberValue !== null && cell.numberValue !== undefined) {
      console.log('[TableDataMapper] Using numberValue:', cell.numberValue);
      return cell.numberValue;
    }
    if (cell.dateValue !== null && cell.dateValue !== undefined) {
      console.log('[TableDataMapper] Using dateValue:', cell.dateValue);
      return cell.dateValue;
    }
    if (cell.booleanValue !== null && cell.booleanValue !== undefined) {
      console.log('[TableDataMapper] Using booleanValue:', cell.booleanValue);
      return cell.booleanValue;
    }
    // Fallback to the generic value
    console.log('[TableDataMapper] Using fallback value:', cell.value);
    return cell.value;
  }

  private inferType(value: any): string {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'date';
    if (typeof value === 'string' && !isNaN(Date.parse(value))) return 'date';
    return 'string';
  }

  validate(data: any[], config: any, dataSource: DataSource): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data || data.length === 0) {
      errors.push('No data available');
      return { isValid: false, errors };
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Metric Data Mapper
 * Maps raw data to metric format
 */
export class MetricDataMapper implements WidgetDataMapper<MetricMappedData> {
  map(data: any[], config: any, dataSource: DataSource): MetricMappedData {
    if (!data || data.length === 0) {
      return {
        value: 0,
        previousValue: 0,
        change: 0,
        changePercentage: 0,
        trend: 'stable'
      };
    }

    const { column, aggregation = 'sum' } = dataSource;
    const values = data.map(item => Number(item[column]) || 0).filter(val => !isNaN(val));

    let currentValue = 0;
    switch (aggregation) {
      case 'sum':
        currentValue = values.reduce((sum, val) => sum + val, 0);
        break;
      case 'avg':
        currentValue = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        break;
      case 'count':
        currentValue = values.length;
        break;
      case 'min':
        currentValue = values.length > 0 ? Math.min(...values) : 0;
        break;
      case 'max':
        currentValue = values.length > 0 ? Math.max(...values) : 0;
        break;
      default:
        currentValue = values.reduce((sum, val) => sum + val, 0);
    }

    // For now, we'll simulate previous value (in real app, this would come from time-based data)
    const previousValue = currentValue * 0.9; // Simulate 10% decrease
    const change = currentValue - previousValue;
    const changePercentage = previousValue !== 0 ? (change / previousValue) * 100 : 0;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      value: currentValue,
      previousValue,
      change,
      changePercentage,
      trend
    };
  }

  validate(data: any[], config: any, dataSource: DataSource): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!data || data.length === 0) {
      errors.push('No data available');
      return { isValid: false, errors };
    }

    const { column } = dataSource;
    if (!column) {
      errors.push('Column is required for metric widget');
      return { isValid: false, errors };
    }

    const sampleItem = data[0];
    if (sampleItem && !(column in sampleItem)) {
      errors.push(`Column '${column}' not found in data`);
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Text Data Mapper
 * Maps raw data to text format
 */
export class TextDataMapper implements WidgetDataMapper<TextMappedData> {
  map(data: any[], config: any, dataSource: DataSource): TextMappedData {
    const { content, type = 'plain' } = dataSource;
    
    return {
      content: content || '',
      type: type as 'plain' | 'html' | 'markdown'
    };
  }

  validate(data: any[], config: any, dataSource: DataSource): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    const { content } = dataSource;
    if (!content || content.trim() === '') {
      errors.push('Content is required for text widget');
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Data Mapper Factory
 */
export class WidgetDataMapperFactory {
  private static mappers: Record<WidgetType, WidgetDataMapper> = {
    chart: new ChartDataMapper(),
    table: new TableDataMapper(),
    metric: new MetricDataMapper(),
    text: new TextDataMapper()
  };

  static getMapper(type: WidgetType): WidgetDataMapper {
    return this.mappers[type];
  }

  static mapData(widget: BaseWidget, rawData: any[]): any {
    const mapper = this.getMapper(widget.type);
    const config = widget.config || {};
    const dataSource = config.dataSource || {};

    return mapper.map(rawData, config, dataSource);
  }

  static validateData(widget: BaseWidget, rawData: any[]): { isValid: boolean; errors: string[] } {
    const mapper = this.getMapper(widget.type);
    const config = widget.config || {};
    const dataSource = config.dataSource || {};

    return mapper.validate(rawData, config, dataSource);
  }
}

export default WidgetDataMapperFactory;
