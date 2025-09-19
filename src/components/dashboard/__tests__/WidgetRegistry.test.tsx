/**
 * Widget Registry Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { WidgetRegistry } from '../WidgetRegistry';
import { BaseWidget, WidgetType } from '@/types/widgets';

// Mock widget components
const MockChartWidget = ({ widget }: { widget: BaseWidget }) => (
  <div data-testid="chart-widget">Chart: {widget.title}</div>
);

const MockTableWidget = ({ widget }: { widget: BaseWidget }) => (
  <div data-testid="table-widget">Table: {widget.title}</div>
);

const MockMetricWidget = ({ widget }: { widget: BaseWidget }) => (
  <div data-testid="metric-widget">Metric: {widget.title}</div>
);

const MockTextWidget = ({ widget }: { widget: BaseWidget }) => (
  <div data-testid="text-widget">Text: {widget.title}</div>
);

describe('WidgetRegistry', () => {
  beforeEach(() => {
    // Clear registry before each test
    WidgetRegistry.clear();
    
    // Register mock widgets
    WidgetRegistry.register('chart', MockChartWidget);
    WidgetRegistry.register('table', MockTableWidget);
    WidgetRegistry.register('metric', MockMetricWidget);
    WidgetRegistry.register('text', MockTextWidget);
  });

  describe('Widget Registration', () => {
    it('should register widget components', () => {
      expect(WidgetRegistry.isRegistered('chart')).toBe(true);
      expect(WidgetRegistry.isRegistered('table')).toBe(true);
      expect(WidgetRegistry.isRegistered('metric')).toBe(true);
      expect(WidgetRegistry.isRegistered('text')).toBe(true);
    });

    it('should return available widget types', () => {
      const types = WidgetRegistry.getAvailableTypes();
      expect(types).toContain('chart');
      expect(types).toContain('table');
      expect(types).toContain('metric');
      expect(types).toContain('text');
    });
  });

  describe('Widget Rendering', () => {
    const mockWidget: BaseWidget = {
      id: '1',
      type: 'chart',
      title: 'Test Chart',
      position: { x: 0, y: 0, width: 8, height: 6 },
      config: {},
      isVisible: true,
      order: 0
    };

    it('should render registered widget', () => {
      const element = WidgetRegistry.render(mockWidget, {});
      render(element as React.ReactElement);
      
      expect(screen.getByTestId('chart-widget')).toBeInTheDocument();
      expect(screen.getByText('Chart: Test Chart')).toBeInTheDocument();
    });

    it('should render different widget types', () => {
      const tableWidget = { ...mockWidget, type: 'table' as WidgetType };
      const element = WidgetRegistry.render(tableWidget, {});
      render(element as React.ReactElement);
      
      expect(screen.getByTestId('table-widget')).toBeInTheDocument();
    });

    it('should handle unknown widget type', () => {
      const unknownWidget = { ...mockWidget, type: 'unknown' as WidgetType };
      const element = WidgetRegistry.render(unknownWidget, {});
      render(element as React.ReactElement);
      
      expect(screen.getByText('Unknown Widget Type')).toBeInTheDocument();
    });

    it('should handle rendering errors', () => {
      const errorWidget = { ...mockWidget, type: 'error' as WidgetType };
      const element = WidgetRegistry.render(errorWidget, {});
      render(element as React.ReactElement);
      
      expect(screen.getByText('Unknown Widget Type')).toBeInTheDocument();
    });
  });

  describe('Chart Sub-types', () => {
    it('should register chart sub-types', () => {
      WidgetRegistry.registerChartSubType('line', MockChartWidget);
      expect(WidgetRegistry.isChartTypeRegistered('line')).toBe(true);
    });

    it('should render chart sub-type', () => {
      WidgetRegistry.registerChartSubType('line', MockChartWidget);
      
      const chartWidget = {
        id: '1',
        type: 'chart' as WidgetType,
        title: 'Line Chart',
        position: { x: 0, y: 0, width: 8, height: 6 },
        config: { chartType: 'line' },
        isVisible: true,
        order: 0
      };

      const element = WidgetRegistry.render(chartWidget, {});
      render(element as React.ReactElement);
      
      expect(screen.getByTestId('chart-widget')).toBeInTheDocument();
    });
  });

  describe('Registry Statistics', () => {
    it('should return correct statistics', () => {
      const stats = WidgetRegistry.getStats();
      expect(stats.widgetTypes).toBe(4);
      expect(stats.chartTypes).toBe(0);
      expect(stats.totalRegistrations).toBe(4);
    });
  });
});
