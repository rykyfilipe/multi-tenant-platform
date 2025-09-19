'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedTableSelector } from './EnhancedTableSelector';
import { AggregationSelector } from './AggregationSelector';
import type { EnhancedDataSource } from './EnhancedTableSelector';
import type { AggregationConfig } from './AggregationSelector';

/**
 * Test component to verify the enhanced data source system works correctly
 * This component demonstrates the new functionality:
 * 1. Multi-column selection for charts
 * 2. Aggregation configuration for KPI widgets
 * 3. Type validation for different widget types
 */
export function EnhancedDataSourceTest() {
  const [chartDataSource, setChartDataSource] = React.useState<EnhancedDataSource>({
    type: 'table',
    tableId: undefined,
    xAxis: undefined,
    yAxis: undefined,
    columns: [],
    filters: []
  });

  const [tableDataSource, setTableDataSource] = React.useState<EnhancedDataSource>({
    type: 'table',
    tableId: undefined,
    columns: [],
    filters: []
  });

  const [kpiDataSource, setKpiDataSource] = React.useState<EnhancedDataSource>({
    type: 'table',
    tableId: undefined,
    yAxis: undefined,
    aggregationConfig: {
      primary: 'sum',
      showMultiple: false,
      compareWithPrevious: false
    },
    filters: []
  });

  const [aggregationConfig, setAggregationConfig] = React.useState<AggregationConfig>({
    primary: 'sum',
    showMultiple: false,
    compareWithPrevious: false
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Enhanced Data Source System Test</h1>
      
      {/* Chart Widget Test */}
      <Card>
        <CardHeader>
          <CardTitle>Chart Widget (Multi-Column Support)</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedTableSelector
            dataSource={chartDataSource}
            onDataSourceChange={setChartDataSource}
            widgetType="chart"
            supportedAxes={['x', 'y']}
            allowMultiColumn={true}
            expectedXType="text"
            expectedYType="number"
            tenantId={1}
          />
          
          {/* Display current configuration */}
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Current Configuration:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(chartDataSource, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Table Widget Test */}
      <Card>
        <CardHeader>
          <CardTitle>Table Widget (Multi-Column Selection)</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedTableSelector
            dataSource={tableDataSource}
            onDataSourceChange={setTableDataSource}
            widgetType="table"
            tenantId={1}
          />
          
          {/* Display current configuration */}
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Current Configuration:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(tableDataSource, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* KPI Widget Test */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Widget (Aggregation + Number Columns Only)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <EnhancedTableSelector
              dataSource={kpiDataSource}
              onDataSourceChange={(newDataSource) => {
                setKpiDataSource({ ...newDataSource, aggregationConfig });
              }}
              widgetType="kpi"
              expectedYType="number"
              tenantId={1}
            />
            
            <AggregationSelector
              config={aggregationConfig}
              onConfigChange={(newConfig) => {
                setAggregationConfig(newConfig);
                setKpiDataSource(prev => ({ ...prev, aggregationConfig: newConfig }));
              }}
              columnType="number"
            />
          </div>
          
          {/* Display current configuration */}
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Current Configuration:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify({ ...kpiDataSource, aggregationConfig }, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Feature Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Implemented Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span><strong>Chart Widgets:</strong> Multi-column support with dropdowns for each axis</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span><strong>Type Validation:</strong> Only compatible columns shown (text/number/date/boolean)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span><strong>KPI Widgets:</strong> Number columns only + mandatory aggregation functions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span><strong>Aggregation Functions:</strong> sum, count, avg, min, max, median, stddev, distinct</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span><strong>Multi-Aggregation:</strong> Support for multiple aggregation results in KPI widgets</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span><strong>Backward Compatibility:</strong> Old widget configurations still work</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EnhancedDataSourceTest;
