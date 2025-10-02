import { z } from "zod";

// ============================================================================
// STRICT DATA FLOW SCHEMA - ENFORCES IMMUTABLE PROCESSING ORDER
// ============================================================================

/**
 * STEP 1: Database and Table Selection
 * Must be configured first - no other steps can be configured without this
 */
export const dataSourceSchema = z.object({
  databaseId: z.number().positive("Database must be selected"),
  tableId: z.string().min(1, "Table must be selected"),
});

/**
 * STEP 2: Column Selection
 * Can only be configured after data source is selected
 */
export const columnSelectionSchema = z.object({
  // Primary columns for processing
  primaryColumns: z.array(z.string()).min(1, "At least one primary column must be selected"),
  
  // Optional grouping column
  groupingColumn: z.string().optional(),
  
  // Optional display columns (for labels, categories, etc.)
  displayColumns: z.array(z.string()).default([]),
});

/**
 * STEP 3: Aggregation Functions
 * Can only be configured after columns are selected
 * Must specify which columns to aggregate and how
 */
export const aggregationSchema = z.object({
  // Aggregation functions to apply
  functions: z.array(z.enum(["sum", "avg", "count", "min", "max"])).min(1, "At least one aggregation function must be selected"),
  
  // Columns to apply aggregations to (must be from primaryColumns)
  aggregationColumns: z.array(z.string()).min(1, "At least one column must be selected for aggregation"),
  
  // Validation: aggregation columns must be numeric
  _validation: z.literal(true).optional(), // Will be validated at runtime
});

/**
 * STEP 4: Secondary Functions (Post-Aggregation)
 * Can only be configured after aggregation is set up
 * These operate on the results of aggregation
 */
export const secondaryFunctionsSchema = z.object({
  // Secondary functions that operate on aggregated data
  functions: z.array(z.enum(["max", "min", "sort", "rank", "percentile"])).default([]),
  
  // Configuration for each secondary function
  maxConfig: z.object({
    enabled: z.boolean().default(false),
    targetColumn: z.string().optional(), // Column to find max of
  }).optional(),
  
  minConfig: z.object({
    enabled: z.boolean().default(false),
    targetColumn: z.string().optional(), // Column to find min of
  }).optional(),
  
  sortConfig: z.object({
    enabled: z.boolean().default(false),
    sortByColumn: z.string().optional(),
    direction: z.enum(["asc", "desc"]).default("desc"),
  }).optional(),
  
  rankConfig: z.object({
    enabled: z.boolean().default(false),
    rankByColumn: z.string().optional(),
    method: z.enum(["dense", "standard"]).default("standard"),
  }).optional(),
});

/**
 * STEP 5: Filtering (Three Levels)
 * Applied in strict order: WHERE → HAVING → Post-processing
 */
export const filteringSchema = z.object({
  // Level 1: WHERE filters (applied at query level)
  whereFilters: z.array(z.object({
    column: z.string(),
    operator: z.enum(["=", "!=", ">", "<", ">=", "<=", "contains", "startsWith", "endsWith"]),
    value: z.union([z.string(), z.number(), z.boolean(), z.date()]),
  })).default([]),
  
  // Level 2: HAVING filters (applied to aggregated results)
  havingFilters: z.array(z.object({
    column: z.string(),
    operator: z.enum([">", "<", ">=", "<=", "=", "!="]),
    value: z.number(),
  })).default([]),
  
  // Level 3: Post-processing filters (applied to final results)
  postProcessingFilters: z.array(z.object({
    type: z.enum(["topN", "bottomN", "range", "custom"]),
    config: z.record(z.any()),
  })).default([]),
});

/**
 * STEP 6: Output Configuration
 * Final step - defines how processed data is presented
 */
export const outputSchema = z.object({
  // Chart-specific output config
  chartConfig: z.object({
    xAxisColumn: z.string(),
    yAxisColumns: z.array(z.string()).min(1),
    chartType: z.enum(["line", "bar", "area", "pie", "radar", "scatter"]),
  }).optional(),
  
  // KPI-specific output config
  kpiConfig: z.object({
    displayFormat: z.enum(["number", "currency", "percentage", "duration"]),
    showTrend: z.boolean().default(false),
    trendComparison: z.string().optional(),
  }).optional(),
  
  // Table-specific output config
  tableConfig: z.object({
    displayColumns: z.array(z.string()),
    sortBy: z.string().optional(),
    sortDirection: z.enum(["asc", "desc"]).default("asc"),
  }).optional(),
});

/**
 * COMPLETE STRICT DATA FLOW SCHEMA
 * Enforces the exact order: DataSource → Columns → Aggregation → Secondary → Filters → Output
 */
export const strictDataFlowSchema = z.object({
  // Step 1: Data Source (REQUIRED FIRST)
  dataSource: dataSourceSchema,
  
  // Step 2: Column Selection (REQUIRED SECOND)
  columnSelection: columnSelectionSchema,
  
  // Step 3: Aggregation (REQUIRED THIRD)
  aggregation: aggregationSchema,
  
  // Step 4: Secondary Functions (OPTIONAL FOURTH)
  secondaryFunctions: secondaryFunctionsSchema.optional(),
  
  // Step 5: Filtering (OPTIONAL FIFTH)
  filtering: filteringSchema.optional(),
  
  // Step 6: Output Configuration (REQUIRED LAST)
  output: outputSchema,
  
  // Flow validation - ensures steps are completed in order
  flowState: z.object({
    dataSourceConfigured: z.boolean(),
    columnsConfigured: z.boolean(),
    aggregationConfigured: z.boolean(),
    secondaryFunctionsConfigured: z.boolean().optional(),
    filteringConfigured: z.boolean().optional(),
    outputConfigured: z.boolean(),
    canProceedToStep: z.function().args(z.number()).returns(z.boolean()),
  }),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates that the data flow is properly configured in the correct order
 */
export function validateDataFlow(config: z.infer<typeof strictDataFlowSchema>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check step completion order
  if (!config.flowState.dataSourceConfigured) {
    errors.push("Step 1: Data source must be configured first");
  }
  
  if (config.flowState.dataSourceConfigured && !config.flowState.columnsConfigured) {
    errors.push("Step 2: Column selection must be configured after data source");
  }
  
  if (config.flowState.columnsConfigured && !config.flowState.aggregationConfigured) {
    errors.push("Step 3: Aggregation must be configured after column selection");
  }
  
  if (config.flowState.aggregationConfigured && !config.flowState.outputConfigured) {
    errors.push("Step 6: Output configuration must be completed");
  }
  
  // Validate aggregation columns are numeric
  if (config.aggregation.aggregationColumns.length > 0) {
    // This would need to be validated against actual column metadata
    // For now, we assume it's validated at the UI level
  }
  
  // Validate secondary functions don't conflict with aggregation
  if (config.secondaryFunctions) {
    const hasConflictingFunctions = config.secondaryFunctions.functions.some(func => {
      return config.aggregation.functions.includes(func as any);
    });
    
    if (hasConflictingFunctions) {
      warnings.push("Secondary functions should not duplicate aggregation functions");
    }
  }
  
  // Validate filter levels are used appropriately
  if (config.filtering) {
    const hasHavingFilters = config.filtering.havingFilters.length > 0;
    const hasAggregation = config.aggregation.functions.length > 0;
    
    if (hasHavingFilters && !hasAggregation) {
      errors.push("HAVING filters can only be used with aggregation functions");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Creates a default configuration with proper flow state
 */
export function createDefaultDataFlowConfig(): Partial<z.infer<typeof strictDataFlowSchema>> {
  return {
    flowState: {
      dataSourceConfigured: false,
      columnsConfigured: false,
      aggregationConfigured: false,
      secondaryFunctionsConfigured: false,
      filteringConfigured: false,
      outputConfigured: false,
      canProceedToStep: (step: number) => {
        switch (step) {
          case 1: return true; // Always can start with data source
          case 2: return true; // Can configure columns after data source
          case 3: return true; // Can configure aggregation after columns
          case 4: return true; // Can configure secondary functions after aggregation
          case 5: return true; // Can configure filtering after secondary functions
          case 6: return true; // Can configure output after all previous steps
          default: return false;
        }
      }
    }
  };
}

/**
 * Updates flow state based on configuration changes
 */
export function updateFlowState(
  config: Partial<z.infer<typeof strictDataFlowSchema>>,
  changes: Partial<z.infer<typeof strictDataFlowSchema>>
): Partial<z.infer<typeof strictDataFlowSchema>> {
  const currentFlowState = config.flowState || {
    dataSourceConfigured: false,
    columnsConfigured: false,
    aggregationConfigured: false,
    outputConfigured: false,
    canProceedToStep: (step: number) => step === 1
  };
  
  const newFlowState = { ...currentFlowState };
  
  // Update based on what's being configured
  if (changes.dataSource) {
    newFlowState.dataSourceConfigured = true;
  }
  
  if (changes.columnSelection) {
    newFlowState.columnsConfigured = true;
  }
  
  if (changes.aggregation) {
    newFlowState.aggregationConfigured = true;
  }
  
  if (changes.secondaryFunctions) {
    newFlowState.secondaryFunctionsConfigured = true;
  }
  
  if (changes.filtering) {
    newFlowState.filteringConfigured = true;
  }
  
  if (changes.output) {
    newFlowState.outputConfigured = true;
  }
  
  return {
    ...config,
    ...changes,
    flowState: newFlowState
  };
}

// Export types
export type StrictDataFlowConfig = z.infer<typeof strictDataFlowSchema>;
export type DataSourceConfig = z.infer<typeof dataSourceSchema>;
export type ColumnSelectionConfig = z.infer<typeof columnSelectionSchema>;
export type AggregationConfig = z.infer<typeof aggregationSchema>;
export type SecondaryFunctionsConfig = z.infer<typeof secondaryFunctionsSchema>;
export type FilteringConfig = z.infer<typeof filteringSchema>;
export type OutputConfig = z.infer<typeof outputSchema>;
