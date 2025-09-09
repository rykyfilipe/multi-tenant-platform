/**
 * Optimized Prisma filter builder
 * Converts filter configurations to efficient Prisma where clauses
 */

import { FilterConfig, ColumnType } from '@/types/filtering-enhanced';
import { FilterValidator } from './filter-validator';

export class PrismaFilterBuilder {
  private whereClause: any = {};
  private tableId: number;
  private tableColumns: any[];

  constructor(tableId: number, tableColumns: any[]) {
    this.tableId = tableId;
    this.tableColumns = tableColumns;
    this.whereClause = { tableId };
  }

  /**
   * Add global search to the where clause
   */
  addGlobalSearch(searchTerm: string): this {
    if (!searchTerm || !searchTerm.trim()) {
      return this;
    }

    const trimmedSearch = searchTerm.trim();
    
    this.whereClause.cells = {
      some: {
        value: {
          path: ['$'],
          string_contains: trimmedSearch
        }
      }
    };

    return this;
  }

  /**
   * Add column filters to the where clause
   */
  addColumnFilters(filters: FilterConfig[]): this {
    if (!filters || filters.length === 0) {
      return this;
    }

    const validFilters = filters.filter(filter => this.isValidFilter(filter));
    
    if (validFilters.length === 0) {
      return this;
    }

    const filterConditions = validFilters.map(filter => this.buildFilterCondition(filter));
    const validConditions = filterConditions.filter(condition => condition !== null);

    if (validConditions.length > 0) {
      if (this.whereClause.AND) {
        this.whereClause.AND = [...this.whereClause.AND, ...validConditions];
      } else {
        this.whereClause.AND = validConditions;
      }
    }

    return this;
  }

  /**
   * Build a single filter condition
   */
  private buildFilterCondition(filter: FilterConfig): any {
    const { columnId, operator, value, secondValue, columnType } = filter;
    
    // Convert values to correct types
    const convertedValue = FilterValidator.convertFilterValue(value, columnType as ColumnType);
    const convertedSecondValue = secondValue ? FilterValidator.convertFilterValue(secondValue, columnType as ColumnType) : null;

    // Handle empty value filters
    if (['is_empty', 'is_not_empty'].includes(operator)) {
      return this.buildEmptyValueCondition(columnId, operator);
    }

    // Handle range filters
    if (['between', 'not_between'].includes(operator)) {
      return this.buildRangeCondition(columnId, operator, convertedValue, convertedSecondValue, columnType);
    }

    // Handle date filters
    if (this.isDateColumn(columnType)) {
      return this.buildDateCondition(columnId, operator, convertedValue, columnType);
    }

    // Handle numeric filters
    if (this.isNumericColumn(columnType)) {
      return this.buildNumericCondition(columnId, operator, convertedValue, columnType);
    }

    // Handle text filters
    if (this.isTextColumn(columnType)) {
      return this.buildTextCondition(columnId, operator, convertedValue, columnType);
    }

    // Handle boolean filters
    if (this.isBooleanColumn(columnType)) {
      return this.buildBooleanCondition(columnId, operator, convertedValue, columnType);
    }

    // Handle reference filters
    if (this.isReferenceColumn(columnType)) {
      return this.buildReferenceCondition(columnId, operator, convertedValue, columnType);
    }

    console.warn(`Unsupported column type: ${columnType} for filter:`, filter);
    return null;
  }

  /**
   * Build empty value conditions
   */
  private buildEmptyValueCondition(columnId: number, operator: string): any {
    const isEmpty = operator === 'is_empty';
    
    return {
      cells: {
        some: {
          columnId: Number(columnId),
          OR: isEmpty ? [
            { value: null },
            { value: { path: ['$'], equals: null } },
            { value: { path: ['$'], equals: '' } }
          ] : [
            { value: { not: null } },
            { value: { path: ['$'], not: null } },
            { value: { path: ['$'], not: '' } }
          ]
        }
      }
    };
  }

  /**
   * Build range conditions
   */
  private buildRangeCondition(columnId: number, operator: string, value: any, secondValue: any, columnType: string): any {
    const isBetween = operator === 'between';
    
    if (this.isNumericColumn(columnType)) {
      return {
        cells: {
          some: {
            columnId: Number(columnId),
            value: {
              path: ['$'],
              [isBetween ? 'gte' : 'not']: Number(value),
              [isBetween ? 'lte' : 'not']: Number(secondValue)
            }
          }
        }
      };
    }

    if (this.isDateColumn(columnType)) {
      return {
        cells: {
          some: {
            columnId: Number(columnId),
            value: {
              path: ['$'],
              [isBetween ? 'gte' : 'not']: new Date(value).toISOString(),
              [isBetween ? 'lte' : 'not']: new Date(secondValue).toISOString()
            }
          }
        }
      };
    }

    return null;
  }

  /**
   * Build date conditions
   */
  private buildDateCondition(columnId: number, operator: string, value: any, columnType: string): any {
    const columnIdNum = Number(columnId);
    
    switch (operator) {
      case 'equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                gte: new Date(value).toISOString(),
                lt: new Date(new Date(value).getTime() + 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }
        };

      case 'not_equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                not: {
                  gte: new Date(value).toISOString(),
                  lt: new Date(new Date(value).getTime() + 24 * 60 * 60 * 1000).toISOString()
                }
              }
            }
          }
        };

      case 'before':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                lt: new Date(value).toISOString()
              }
            }
          }
        };

      case 'after':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                gt: new Date(value).toISOString()
              }
            }
          }
        };

      case 'today':
        return this.buildTodayCondition(columnIdNum);
      
      case 'yesterday':
        return this.buildYesterdayCondition(columnIdNum);
      
      case 'this_week':
        return this.buildThisWeekCondition(columnIdNum);
      
      case 'last_week':
        return this.buildLastWeekCondition(columnIdNum);
      
      case 'this_month':
        return this.buildThisMonthCondition(columnIdNum);
      
      case 'last_month':
        return this.buildLastMonthCondition(columnIdNum);
      
      case 'this_year':
        return this.buildThisYearCondition(columnIdNum);
      
      case 'last_year':
        return this.buildLastYearCondition(columnIdNum);

      default:
        return null;
    }
  }

  /**
   * Build numeric conditions
   */
  private buildNumericCondition(columnId: number, operator: string, value: any, columnType: string): any {
    const columnIdNum = Number(columnId);
    const numericValue = Number(value);

    switch (operator) {
      case 'equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                equals: numericValue
              }
            }
          }
        };

      case 'not_equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                not: numericValue
              }
            }
          }
        };

      case 'greater_than':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                gt: numericValue
              }
            }
          }
        };

      case 'greater_than_or_equal':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                gte: numericValue
              }
            }
          }
        };

      case 'less_than':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                lt: numericValue
              }
            }
          }
        };

      case 'less_than_or_equal':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                lte: numericValue
              }
            }
          }
        };

      default:
        return null;
    }
  }

  /**
   * Build text conditions
   */
  private buildTextCondition(columnId: number, operator: string, value: any, columnType: string): any {
    const columnIdNum = Number(columnId);
    const stringValue = String(value);

    switch (operator) {
      case 'contains':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                string_contains: stringValue
              }
            }
          }
        };

      case 'not_contains':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                not: {
                  string_contains: stringValue
                }
              }
            }
          }
        };

      case 'equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                equals: stringValue
              }
            }
          }
        };

      case 'not_equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                not: stringValue
              }
            }
          }
        };

      case 'starts_with':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                string_starts_with: stringValue
              }
            }
          }
        };

      case 'ends_with':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                string_ends_with: stringValue
              }
            }
          }
        };

      case 'regex':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                string_matches: stringValue
              }
            }
          }
        };

      default:
        return null;
    }
  }

  /**
   * Build boolean conditions
   */
  private buildBooleanCondition(columnId: number, operator: string, value: any, columnType: string): any {
    const columnIdNum = Number(columnId);
    const booleanValue = Boolean(value);

    switch (operator) {
      case 'equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                equals: booleanValue
              }
            }
          }
        };

      case 'not_equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                not: booleanValue
              }
            }
          }
        };

      default:
        return null;
    }
  }

  /**
   * Build reference conditions
   */
  private buildReferenceCondition(columnId: number, operator: string, value: any, columnType: string): any {
    const columnIdNum = Number(columnId);
    const referenceValue = Number(value);

    switch (operator) {
      case 'equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                equals: referenceValue
              }
            }
          }
        };

      case 'not_equals':
        return {
          cells: {
            some: {
              columnId: columnIdNum,
              value: {
                path: ['$'],
                not: referenceValue
              }
            }
          }
        };

      default:
        return null;
    }
  }

  /**
   * Helper methods for column type checking
   */
  private isDateColumn(columnType: string): boolean {
    return ['date', 'datetime', 'time'].includes(columnType);
  }

  private isNumericColumn(columnType: string): boolean {
    return ['number', 'integer', 'decimal'].includes(columnType);
  }

  private isTextColumn(columnType: string): boolean {
    return ['text', 'string', 'email', 'url'].includes(columnType);
  }

  private isBooleanColumn(columnType: string): boolean {
    return columnType === 'boolean';
  }

  private isReferenceColumn(columnType: string): boolean {
    return columnType === 'reference';
  }

  private isValidFilter(filter: FilterConfig): boolean {
    return filter && 
           filter.columnId && 
           filter.operator && 
           filter.columnType &&
           (filter.value !== null && filter.value !== undefined);
  }

  /**
   * Get the final where clause
   */
  getWhereClause(): any {
    return this.whereClause;
  }

  /**
   * Date helper methods
   */
  private buildTodayCondition(columnId: number): any {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return {
      cells: {
        some: {
          columnId,
          value: {
            path: ['$'],
            gte: startOfDay.toISOString(),
            lt: endOfDay.toISOString()
          }
        }
      }
    };
  }

  private buildYesterdayCondition(columnId: number): any {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    return {
      cells: {
        some: {
          columnId,
          value: {
            path: ['$'],
            gte: startOfDay.toISOString(),
            lt: endOfDay.toISOString()
          }
        }
      }
    };
  }

  private buildThisWeekCondition(columnId: number): any {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return {
      cells: {
        some: {
          columnId,
          value: {
            path: ['$'],
            gte: startOfWeek.toISOString(),
            lt: endOfWeek.toISOString()
          }
        }
      }
    };
  }

  private buildLastWeekCondition(columnId: number): any {
    const now = new Date();
    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);
    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 7);

    return {
      cells: {
        some: {
          columnId,
          value: {
            path: ['$'],
            gte: startOfLastWeek.toISOString(),
            lt: endOfLastWeek.toISOString()
          }
        }
      }
    };
  }

  private buildThisMonthCondition(columnId: number): any {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      cells: {
        some: {
          columnId,
          value: {
            path: ['$'],
            gte: startOfMonth.toISOString(),
            lt: endOfMonth.toISOString()
          }
        }
      }
    };
  }

  private buildLastMonthCondition(columnId: number): any {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      cells: {
        some: {
          columnId,
          value: {
            path: ['$'],
            gte: startOfLastMonth.toISOString(),
            lt: endOfLastMonth.toISOString()
          }
        }
      }
    };
  }

  private buildThisYearCondition(columnId: number): any {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);

    return {
      cells: {
        some: {
          columnId,
          value: {
            path: ['$'],
            gte: startOfYear.toISOString(),
            lt: endOfYear.toISOString()
          }
        }
      }
    };
  }

  private buildLastYearCondition(columnId: number): any {
    const now = new Date();
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear(), 0, 1);

    return {
      cells: {
        some: {
          columnId,
          value: {
            path: ['$'],
            gte: startOfLastYear.toISOString(),
            lt: endOfLastYear.toISOString()
          }
        }
      }
    };
  }
}
