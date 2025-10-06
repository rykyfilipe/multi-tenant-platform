/**
 * Smart Column Suggestions Hook
 * Analyzes data types and suggests optimal column mappings for charts
 */

import { useMemo } from "react";

interface Column {
  id: number;
  name: string;
  type: string;
}

interface ColumnSuggestions {
  xAxis: string | null;
  yAxis: string[];
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Analyzes columns and suggests the best mapping for chart visualization
 */
export const useSmartColumnSuggestions = (columns: Column[]): ColumnSuggestions => {
  return useMemo(() => {
    if (!columns || columns.length === 0) {
      return {
        xAxis: null,
        yAxis: [],
        reasoning: "No columns available",
        confidence: 'low'
      };
    }

    // Categorize columns by type
    const dateColumns = columns.filter(col => 
      col.type === 'date' || col.type === 'datetime' || col.type === 'timestamp'
    );
    const textColumns = columns.filter(col => 
      col.type === 'string' || col.type === 'text' || col.type === 'varchar'
    );
    const numericColumns = columns.filter(col => 
      col.type === 'number' || col.type === 'integer' || col.type === 'float' || 
      col.type === 'decimal' || col.type === 'bigint'
    );

    // Priority 1: Date column as X-axis (time series)
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      return {
        xAxis: dateColumns[0].name,
        yAxis: numericColumns.slice(0, 3).map(col => col.name), // Max 3 series
        reasoning: "Time series detected: Date column as X-axis, numeric values as Y-axis",
        confidence: 'high'
      };
    }

    // Priority 2: Text/categorical column as X-axis
    if (textColumns.length > 0 && numericColumns.length > 0) {
      // Prefer columns with keywords like 'name', 'category', 'type', 'region'
      const categoricalKeywords = ['name', 'category', 'type', 'region', 'country', 'product', 'status'];
      const categoricalColumn = textColumns.find(col => 
        categoricalKeywords.some(keyword => col.name.toLowerCase().includes(keyword))
      ) || textColumns[0];

      // For Y-axis, prefer columns with keywords like 'amount', 'value', 'total', 'count'
      const metricKeywords = ['amount', 'value', 'total', 'count', 'revenue', 'sales', 'price', 'quantity'];
      const metricColumns = numericColumns.filter(col =>
        metricKeywords.some(keyword => col.name.toLowerCase().includes(keyword))
      );

      const yAxisColumns = metricColumns.length > 0 
        ? metricColumns.slice(0, 3).map(col => col.name)
        : numericColumns.slice(0, 3).map(col => col.name);

      return {
        xAxis: categoricalColumn.name,
        yAxis: yAxisColumns,
        reasoning: "Categorical analysis: Text column for categories, numeric columns for values",
        confidence: metricColumns.length > 0 ? 'high' : 'medium'
      };
    }

    // Priority 3: Only numeric columns (use first as X, rest as Y)
    if (numericColumns.length >= 2) {
      return {
        xAxis: numericColumns[0].name,
        yAxis: numericColumns.slice(1, 4).map(col => col.name),
        reasoning: "Correlation analysis: First numeric column as X-axis, others as Y-axis",
        confidence: 'medium'
      };
    }

    // Priority 4: Only text columns (not ideal for charts)
    if (textColumns.length >= 2) {
      return {
        xAxis: textColumns[0].name,
        yAxis: [],
        reasoning: "Limited data: Only text columns available. Consider adding numeric columns for better visualization.",
        confidence: 'low'
      };
    }

    // Fallback
    return {
      xAxis: columns[0]?.name || null,
      yAxis: [],
      reasoning: "Insufficient data structure for automatic suggestion",
      confidence: 'low'
    };
  }, [columns]);
};

/**
 * Suggests appropriate chart types based on data structure
 */
export const useSuggestedChartTypes = (columns: Column[]) => {
  return useMemo(() => {
    const dateColumns = columns.filter(col => 
      col.type === 'date' || col.type === 'datetime'
    );
    const textColumns = columns.filter(col => 
      col.type === 'string' || col.type === 'text'
    );
    const numericColumns = columns.filter(col => 
      col.type === 'number' || col.type === 'integer' || col.type === 'float'
    );

    const suggestions = [];

    // Time series → Line/Area chart
    if (dateColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        type: 'line',
        reason: 'Time series data works best with line charts',
        confidence: 'high'
      });
      suggestions.push({
        type: 'area',
        reason: 'Area charts emphasize magnitude over time',
        confidence: 'high'
      });
    }

    // Categorical → Bar chart
    if (textColumns.length > 0 && numericColumns.length > 0) {
      suggestions.push({
        type: 'bar',
        reason: 'Bar charts are ideal for comparing categories',
        confidence: 'high'
      });
    }

    // Multiple metrics → Radar chart
    if (numericColumns.length >= 3) {
      suggestions.push({
        type: 'radar',
        reason: 'Radar charts show multivariate data patterns',
        confidence: 'medium'
      });
    }

    // Parts of a whole → Pie chart
    if (textColumns.length === 1 && numericColumns.length === 1) {
      suggestions.push({
        type: 'pie',
        reason: 'Pie charts display proportional relationships',
        confidence: 'medium'
      });
    }

    // Correlation → Scatter plot
    if (numericColumns.length >= 2) {
      suggestions.push({
        type: 'scatter',
        reason: 'Scatter plots reveal correlations between variables',
        confidence: 'medium'
      });
    }

    return suggestions;
  }, [columns]);
};

/**
 * Detects data quality issues and suggests improvements
 */
export const useDataQualityCheck = (columns: Column[], data?: any[]) => {
  return useMemo(() => {
    const issues = [];
    const recommendations = [];

    // No numeric columns
    if (!columns.some(col => ['number', 'integer', 'float', 'decimal'].includes(col.type))) {
      issues.push({
        severity: 'warning',
        message: 'No numeric columns detected',
        recommendation: 'Add numeric columns to enable meaningful visualizations'
      });
    }

    // No categorical columns
    if (!columns.some(col => ['string', 'text', 'date'].includes(col.type))) {
      issues.push({
        severity: 'info',
        message: 'No categorical columns available',
        recommendation: 'Consider adding text or date columns for better categorization'
      });
    }

    // Too many numeric columns
    const numericColumns = columns.filter(col => 
      ['number', 'integer', 'float'].includes(col.type)
    );
    if (numericColumns.length > 10) {
      recommendations.push({
        type: 'performance',
        message: `${numericColumns.length} numeric columns detected`,
        action: 'Consider selecting only the most relevant metrics for better readability'
      });
    }

    return {
      issues,
      recommendations,
      isOptimal: issues.length === 0 && numericColumns.length > 0
    };
  }, [columns, data]);
};

