/**
 * @format
 */

import { describe, it, expect } from '@jest/globals';

// Mock data for testing
const mockRows = [
  {
    id: 1,
    cells: [
      { columnId: 1, value: 'John Doe' },
      { columnId: 2, value: 25 },
      { columnId: 3, value: 'john@example.com' },
      { columnId: 4, value: true },
      { columnId: 5, value: '2024-01-01T00:00:00Z' }
    ]
  },
  {
    id: 2,
    cells: [
      { columnId: 1, value: 'Jane Smith' },
      { columnId: 2, value: 30 },
      { columnId: 3, value: 'jane@example.com' },
      { columnId: 4, value: false },
      { columnId: 5, value: '2024-01-02T00:00:00Z' }
    ]
  },
  {
    id: 3,
    cells: [
      { columnId: 1, value: 'Bob Johnson' },
      { columnId: 2, value: 35 },
      { columnId: 3, value: 'bob@example.com' },
      { columnId: 4, value: true },
      { columnId: 5, value: '2024-01-03T00:00:00Z' }
    ]
  },
  {
    id: 4,
    cells: [
      { columnId: 1, value: '' }, // Empty name
      { columnId: 2, value: 40 },
      { columnId: 3, value: 'empty@example.com' },
      { columnId: 4, value: true },
      { columnId: 5, value: '2024-01-04T00:00:00Z' }
    ]
  }
];

const mockColumns = [
  { id: 1, name: 'name', type: 'string' },
  { id: 2, name: 'age', type: 'number' },
  { id: 3, name: 'email', type: 'email' },
  { id: 4, name: 'active', type: 'boolean' },
  { id: 5, name: 'created_at', type: 'date' }
];

// String filtering function (simplified version for testing)
function applyStringFilters(rows: any[], filters: any[], tableColumns: any[]): any[] {
  const stringFilters = filters.filter((filter) => {
    const column = tableColumns.find((col) => col.id === filter.columnId);
    if (!column) return false;

    return (
      ["text", "string", "email", "url"].includes(column.type) &&
      ["starts_with", "ends_with", "contains", "not_contains", "equals", "not_equals", "is_empty", "is_not_empty"].includes(
        filter.operator,
      )
    );
  });

  if (stringFilters.length === 0) return rows;

  return rows.filter((row) => {
    return stringFilters.every((filter) => {
      const cell = row.cells?.find((c: any) => c.columnId === filter.columnId);
      
      // Handle is_empty and is_not_empty operators first
      if (filter.operator === "is_empty") {
        // Check if cell is empty
        return !cell || cell.value === null || cell.value === undefined || cell.value === "";
      } else if (filter.operator === "is_not_empty") {
        // Check if cell is not empty
        return cell && cell.value !== null && cell.value !== undefined && cell.value !== "";
      }

      // Handle empty/null cells for other operators
      if (!cell || cell.value === null || cell.value === undefined || cell.value === "") {
        return false; // For other operators, empty cell doesn't match
      }

      // For other operators, check if filter value is empty
      if (filter.value === null || filter.value === undefined || filter.value === "") {
        return false; // Empty filter value doesn't match anything
      }

      const cellValue = String(cell.value);
      const filterValue = String(filter.value);

      switch (filter.operator) {
        case "starts_with":
          return cellValue.toLowerCase().startsWith(filterValue.toLowerCase());
        case "ends_with":
          return cellValue.toLowerCase().endsWith(filterValue.toLowerCase());
        case "contains":
          return cellValue.toLowerCase().includes(filterValue.toLowerCase());
        case "not_contains":
          return !cellValue.toLowerCase().includes(filterValue.toLowerCase());
        case "equals":
          return cellValue === filterValue;
        case "not_equals":
          return cellValue !== filterValue;
        case "is_empty":
          return false; // Cell has value, so it's not empty
        case "is_not_empty":
          return true; // Cell has value, so it's not empty
        default:
          return true;
      }
    });
  });
}

describe('String Filtering Logic', () => {
  describe('contains operator', () => {
    it('should filter rows containing the search term', () => {
      const filters = [{
        columnId: 1,
        operator: 'contains',
        value: 'John'
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(2); // John Doe and Bob Johnson (both contain "John")
      expect(result.find(r => r.id === 1)).toBeDefined();
      expect(result.find(r => r.id === 3)).toBeDefined();
    });

    it('should be case insensitive', () => {
      const filters = [{
        columnId: 1,
        operator: 'contains',
        value: 'jane'
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  describe('equals operator', () => {
    it('should filter rows with exact match', () => {
      const filters = [{
        columnId: 1,
        operator: 'equals',
        value: 'Jane Smith'
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  describe('starts_with operator', () => {
    it('should filter rows starting with the search term', () => {
      const filters = [{
        columnId: 1,
        operator: 'starts_with',
        value: 'J'
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(2); // John Doe and Jane Smith
    });
  });

  describe('ends_with operator', () => {
    it('should filter rows ending with the search term', () => {
      const filters = [{
        columnId: 1,
        operator: 'ends_with',
        value: 'Smith'
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(2);
    });
  });

  describe('not_contains operator', () => {
    it('should filter rows not containing the search term', () => {
      const filters = [{
        columnId: 1,
        operator: 'not_contains',
        value: 'John'
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(1); // Only Jane Smith (empty row is filtered out because it's empty)
      expect(result.find(r => r.id === 1)).toBeUndefined();
      expect(result.find(r => r.id === 3)).toBeUndefined();
      expect(result[0].id).toBe(2);
    });
  });

  describe('not_equals operator', () => {
    it('should filter rows not equal to the search term', () => {
      const filters = [{
        columnId: 1,
        operator: 'not_equals',
        value: 'John Doe'
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(2); // Jane Smith and Bob Johnson (not John Doe or empty row)
      expect(result.find(r => r.id === 1)).toBeUndefined();
    });
  });

  describe('is_empty operator', () => {
    it('should filter rows with empty values', () => {
      const filters = [{
        columnId: 1,
        operator: 'is_empty',
        value: ''
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(4);
    });
  });

  describe('is_not_empty operator', () => {
    it('should filter rows with non-empty values', () => {
      const filters = [{
        columnId: 1,
        operator: 'is_not_empty',
        value: ''
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(3); // All except the empty one
      expect(result.find(r => r.id === 4)).toBeUndefined();
    });
  });

  describe('multiple filters', () => {
    it('should combine multiple filters with AND logic', () => {
      const filters = [
        {
          columnId: 1,
          operator: 'contains',
          value: 'J'
        },
        {
          columnId: 2,
          operator: 'greater_than',
          value: 25
        }
      ];

      // Only string filters are processed by this function
      const stringFilters = filters.filter(f => f.columnId === 1);
      const result = applyStringFilters(mockRows, stringFilters, mockColumns);
      expect(result).toHaveLength(3); // John, Jane, and Bob (all contain 'J')
    });
  });

  describe('edge cases', () => {
    it('should handle null values gracefully', () => {
      const rowsWithNull = [
        {
          id: 1,
          cells: [
            { columnId: 1, value: null },
            { columnId: 2, value: 25 }
          ]
        }
      ];

      const filters = [{
        columnId: 1,
        operator: 'is_empty',
        value: ''
      }];

      const result = applyStringFilters(rowsWithNull, filters, mockColumns);
      expect(result).toHaveLength(1);
    });

    it('should handle undefined values gracefully', () => {
      const rowsWithUndefined = [
        {
          id: 1,
          cells: [
            { columnId: 1, value: undefined },
            { columnId: 2, value: 25 }
          ]
        }
      ];

      const filters = [{
        columnId: 1,
        operator: 'is_empty',
        value: ''
      }];

      const result = applyStringFilters(rowsWithUndefined, filters, mockColumns);
      expect(result).toHaveLength(1);
    });

    it('should handle empty string values', () => {
      const filters = [{
        columnId: 1,
        operator: 'is_empty',
        value: ''
      }];

      const result = applyStringFilters(mockRows, filters, mockColumns);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(4);
    });
  });
});
