/**
 * Centralized Widget Data Mapper
 * Maps raw data from custom tables to widget-specific formats
 */

import { 
  WidgetType, 
  WidgetTypeSpecificConfig, 
  MappedData, 
  WidgetError 
} from '@/types/widget';
import { mapWidgetData } from './widget-registry';

/**
 * Centralized function to map widget data with error handling
 */
export function mapWidgetDataSafely(
  widgetType: WidgetType,
  rawData: any[],
  config: WidgetTypeSpecificConfig
): MappedData {
  try {
    // Validate input data
    if (!Array.isArray(rawData)) {
      throw new Error('Raw data must be an array');
    }

    if (!config) {
      throw new Error('Widget configuration is required');
    }

    // Map the data using the registry
    const result = mapWidgetData(widgetType, rawData, config);

    // Validate mapped result
    if (!result || !result.type) {
      throw new Error('Data mapping returned invalid result');
    }

    return result;

  } catch (error) {
    console.error(`Error mapping data for widget type ${widgetType}:`, error);
    
    return {
      type: widgetType,
      data: rawData,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown mapping error',
        totalRows: Array.isArray(rawData) ? rawData.length : 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }
}

/**
 * Batch map multiple widgets' data
 */
export function mapMultipleWidgetsData(
  widgets: Array<{
    type: WidgetType;
    config: WidgetTypeSpecificConfig;
    rawData: any[];
  }>
): Array<{
  widgetType: WidgetType;
  mappedData: MappedData;
  error?: string;
}> {
  return widgets.map(({ type, config, rawData }) => {
    try {
      const mappedData = mapWidgetDataSafely(type, rawData, config);
      
      return {
        widgetType: type,
        mappedData,
        error: mappedData.metadata?.error
      };
    } catch (error) {
      return {
        widgetType: type,
        mappedData: {
          type,
          data: rawData,
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            totalRows: rawData.length,
            lastUpdated: new Date().toISOString()
          }
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });
}

/**
 * Validate widget configuration
 */
export function validateWidgetConfig(
  widgetType: WidgetType,
  config: WidgetTypeSpecificConfig
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    switch (widgetType) {
      case 'line':
      case 'bar':
      case 'area':
      case 'scatter':
        if (!config.xAxis    || !config.yAxis) {
          errors.push('X and Y axis columns are required for chart widgets');
        }
        break;

      case 'pie':
        if (!config.labelColumn || !config.valueColumn) {
          errors.push('Label and value columns are required for pie charts');
        }
        break;

      case 'table':
        if (!config.columns || config.columns.length === 0) {
          errors.push('At least one column is required for table widgets');
        }
        break;

      case 'metric':
        if (!config.valueColumn) {
          errors.push('Value column is required for metric widgets');
        }
        break;

      case 'calendar':
        if (!config.dateColumn) {
          errors.push('Date column is required for calendar widgets');
        }
        break;

      case 'tasks':
        if (!config.titleColumn || !config.statusColumn) {
          errors.push('Title and status columns are required for task widgets');
        }
        break;

      case 'text':
        // Text widgets don't require specific configuration
        break;

      case 'clock':
      case 'weather':
        // These widgets use external data sources
        break;

      default:
        errors.push(`Unknown widget type: ${widgetType}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Configuration validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Get available columns for a widget type based on data source
 */
export function getAvailableColumns(
  dataSource: { type: 'table'; tableId: number } | { type: 'manual'; rows: any[] },
  sampleData?: any[]
): string[] {
  try {
    if (dataSource.type === 'manual') {
      // Extract columns from manual data
      if (sampleData && sampleData.length > 0) {
        return Object.keys(sampleData[0] || {});
      }
      return [];
    }

    if (dataSource.type === 'table') {
      // In a real implementation, this would query the table schema
      // For now, return common column names
      return [
        'id', 'name', 'title', 'date', 'value', 'amount', 'quantity',
        'category', 'status', 'priority', 'description', 'email',
        'phone', 'address', 'created_at', 'updated_at'
      ];
    }

    return [];

  } catch (error) {
    console.error('Error getting available columns:', error);
    return [];
  }
}

/**
 * Create a widget error object
 */
export function createWidgetError(
  type: 'mapping' | 'rendering' | 'editor' | 'data',
  message: string,
  widgetId: string | number,
  widgetType: WidgetType,
  details?: any
): WidgetError {
  return {
    type,
    message,
    widgetId: widgetId.toString(),
    widgetType,
    timestamp: new Date().toISOString(),
    details
  };
}

/**
 * Log widget errors for debugging
 */
export function logWidgetError(error: WidgetError): void {
  console.error(`Widget Error [${error.type}] for ${error.widgetType} widget ${error.widgetId}:`, {
    message: error.message,
    timestamp: error.timestamp,
    details: error.details
  });
}

/**
 * Check if mapped data has errors
 */
export function hasDataErrors(mappedData: MappedData): boolean {
  return !!(mappedData.metadata?.error);
}

/**
 * Get error message from mapped data
 */
export function getDataErrorMessage(mappedData: MappedData): string | null {
  return mappedData.metadata?.error || null;
}
