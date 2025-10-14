import { WidgetType } from "@/generated/prisma";

/**
 * Widget Template - Pre-configured widget ready to use
 */
export interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'analytics' | 'operational' | 'sales' | 'inventory';
  icon: string; // emoji or icon name
  widgetType: WidgetType;
  config: any; // Widget config based on type
  requiresData?: {
    table: string; // Table name needed (e.g., "invoices", "customers")
    columns: string[]; // Required columns
  };
}

/**
 * Business Widget Templates for Company Admin
 */
export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  // ==================== FINANCIAL TEMPLATES ====================
  {
    id: 'revenue-over-time',
    name: '💰 Revenue Over Time',
    description: 'Monthly revenue trend chart with total sales aggregation',
    category: 'financial',
    icon: '📈',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'line',
        dateGrouping: {
          enabled: true,
          granularity: 'month'
        },
        yColumnAggregations: {
          total: [
            { function: 'sum', label: 'Total Revenue' }
          ]
        },
        refreshInterval: 300
      },
      style: {
        themeName: 'platinum',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null, // Will be set by user
        tableId: 'invoices',
        mappings: {
          x: 'created_at',
          y: ['total']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['created_at', 'total']
    }
  },
  
  {
    id: 'invoices-by-status',
    name: '📊 Invoices by Status',
    description: 'Distribution of invoices across different statuses (pie chart)',
    category: 'financial',
    icon: '🥧',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'pie',
        yColumnAggregations: {
          id: [
            { function: 'count', label: 'Count' }
          ]
        },
        refreshInterval: 300
      },
      style: {
        themeName: 'sapphire',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'status',
          y: ['id']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['status', 'id']
    }
  },

  {
    id: 'total-revenue-kpi',
    name: '💵 Total Revenue',
    description: 'Single KPI showing total revenue with trend',
    category: 'financial',
    icon: '💰',
    widgetType: WidgetType.KPI,
    config: {
      settings: {
        layout: 'grid',
        showTrend: true,
        showComparison: false,
        refreshInterval: 300
      },
      style: {
        themeName: 'emerald',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        filters: [],
        metric: {
          column: 'total',
          aggregations: [
            { function: 'sum', label: 'Total Revenue' }
          ],
          prefix: '$',
          suffix: '',
          decimals: 2
        }
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['total']
    }
  },

  {
    id: 'outstanding-invoices',
    name: '⏰ Outstanding Invoices',
    description: 'Total unpaid/pending invoices amount',
    category: 'financial',
    icon: '⚠️',
    widgetType: WidgetType.KPI,
    config: {
      settings: {
        layout: 'grid',
        showTrend: true,
        refreshInterval: 180
      },
      style: {
        themeName: 'amber',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        filters: [
          { column: 'status', operator: '=', value: 'pending' }
        ],
        metric: {
          column: 'total',
          aggregations: [
            { function: 'sum', label: 'Pending Amount' }
          ],
          prefix: '$',
          decimals: 2
        }
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['total', 'status']
    }
  },

  // ==================== ANALYTICS TEMPLATES ====================
  {
    id: 'customers-growth',
    name: '👥 Customer Growth',
    description: 'New customers registered over time',
    category: 'analytics',
    icon: '📈',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'area',
        dateGrouping: {
          enabled: true,
          granularity: 'month'
        },
        yColumnAggregations: {
          id: [
            { function: 'count', label: 'New Customers' }
          ]
        },
        refreshInterval: 600
      },
      style: {
        themeName: 'sapphire',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'customers',
        mappings: {
          x: 'created_at',
          y: ['id']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'customers',
      columns: ['created_at', 'id']
    }
  },

  {
    id: 'total-customers-kpi',
    name: '👤 Total Customers',
    description: 'Count of all customers',
    category: 'analytics',
    icon: '👥',
    widgetType: WidgetType.KPI,
    config: {
      settings: {
        layout: 'grid',
        showTrend: true,
        refreshInterval: 600
      },
      style: {
        themeName: 'platinum',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'customers',
        filters: [],
        metric: {
          column: 'id',
          aggregations: [
            { function: 'count', label: 'Total Customers' }
          ],
          prefix: '',
          suffix: ' customers',
          decimals: 0
        }
      }
    },
    requiresData: {
      table: 'customers',
      columns: ['id']
    }
  },

  // ==================== SALES TEMPLATES ====================
  {
    id: 'top-products',
    name: '🏆 Top Products',
    description: 'Best selling products by quantity or revenue',
    category: 'sales',
    icon: '📦',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'bar',
        enableTopN: true,
        topNCount: 10,
        topNSort: 'desc',
        yColumnAggregations: {
          quantity: [
            { function: 'sum', label: 'Total Sold' }
          ]
        },
        refreshInterval: 600
      },
      style: {
        themeName: 'emerald',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoice_items',
        mappings: {
          x: 'product_name',
          y: ['quantity']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoice_items',
      columns: ['product_name', 'quantity']
    }
  },

  {
    id: 'average-invoice-value',
    name: '📊 Average Invoice Value',
    description: 'Average invoice amount across all invoices',
    category: 'sales',
    icon: '💵',
    widgetType: WidgetType.KPI,
    config: {
      settings: {
        layout: 'grid',
        showTrend: true,
        refreshInterval: 300
      },
      style: {
        themeName: 'platinum',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        filters: [],
        metric: {
          column: 'total',
          aggregations: [
            { function: 'avg', label: 'Average Invoice' }
          ],
          prefix: '$',
          decimals: 2
        }
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['total']
    }
  },

  {
    id: 'sales-by-region',
    name: '🗺️ Sales by Region',
    description: 'Revenue breakdown by geographic region',
    category: 'sales',
    icon: '🌍',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'bar',
        yColumnAggregations: {
          total: [
            { function: 'sum', label: 'Total Sales' }
          ]
        },
        refreshInterval: 600
      },
      style: {
        themeName: 'sapphire',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'region',
          y: ['total']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['region', 'total']
    }
  },

  // ==================== OPERATIONAL TEMPLATES ====================
  {
    id: 'invoice-count-kpi',
    name: '📄 Total Invoices',
    description: 'Count of all invoices issued',
    category: 'operational',
    icon: '📋',
    widgetType: WidgetType.KPI,
    config: {
      settings: {
        layout: 'grid',
        showTrend: true,
        refreshInterval: 300
      },
      style: {
        themeName: 'platinum',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        filters: [],
        metric: {
          column: 'id',
          aggregations: [
            { function: 'count', label: 'Total Invoices' }
          ],
          prefix: '',
          suffix: ' invoices',
          decimals: 0
        }
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['id']
    }
  },

  {
    id: 'recent-invoices-table',
    name: '📋 Recent Invoices',
    description: 'Table showing latest invoices',
    category: 'operational',
    icon: '📄',
    widgetType: WidgetType.TABLE,
    config: {
      settings: {
        aggregation: {
          enabled: false,
          groupBy: undefined,
          columns: [],
          showSummaryRow: false,
          showGroupTotals: false
        },
        pagination: {
          enabled: true,
          pageSize: 10
        },
        sorting: {
          enabled: true,
          defaultColumn: 'created_at',
          defaultDirection: 'desc'
        },
        showRowNumbers: true,
        showColumnHeaders: true,
        refreshInterval: 180
      },
      style: {
        themeName: 'platinum',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        columns: ['invoice_number', 'customer_name', 'total', 'status', 'created_at'],
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['invoice_number', 'customer_name', 'total', 'status', 'created_at']
    }
  },

  {
    id: 'payment-methods',
    name: '💳 Payment Methods',
    description: 'Distribution of payment methods used',
    category: 'operational',
    icon: '💰',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'pie',
        yColumnAggregations: {
          id: [
            { function: 'count', label: 'Count' }
          ]
        },
        refreshInterval: 600
      },
      style: {
        themeName: 'emerald',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'payment_method',
          y: ['id']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['payment_method', 'id']
    }
  },

  // ==================== COMPARATIVE TEMPLATES ====================
  {
    id: 'monthly-comparison',
    name: '📊 Monthly Comparison',
    description: 'Compare revenue and invoice count month over month',
    category: 'analytics',
    icon: '📈',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'bar',
        dateGrouping: {
          enabled: true,
          granularity: 'month'
        },
        yColumnAggregations: {
          total: [
            { function: 'sum', label: 'Revenue' }
          ],
          id: [
            { function: 'count', label: 'Invoice Count' }
          ]
        },
        refreshInterval: 600
      },
      style: {
        themeName: 'sapphire',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'created_at',
          y: ['total', 'id']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['created_at', 'total', 'id']
    }
  },

  {
    id: 'top-customers',
    name: '🏅 Top Customers',
    description: 'Highest spending customers by total revenue',
    category: 'sales',
    icon: '👑',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'bar',
        enableTopN: true,
        topNCount: 10,
        topNSort: 'desc',
        topNSortColumn: 'total',
        yColumnAggregations: {
          total: [
            { function: 'sum', label: 'Total Spent' }
          ]
        },
        refreshInterval: 600
      },
      style: {
        themeName: 'gold',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'customer_name',
          y: ['total']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['customer_name', 'total']
    }
  },

  // ==================== QUARTERLY TEMPLATES ====================
  {
    id: 'quarterly-revenue',
    name: '📆 Quarterly Revenue',
    description: 'Revenue aggregated by quarter for strategic planning',
    category: 'financial',
    icon: '📊',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'bar',
        dateGrouping: {
          enabled: true,
          granularity: 'quarter'
        },
        yColumnAggregations: {
          total: [
            { function: 'sum', label: 'Quarterly Revenue' }
          ]
        },
        refreshInterval: 1800
      },
      style: {
        themeName: 'platinum',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'created_at',
          y: ['total']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['created_at', 'total']
    }
  },

  // ==================== DAILY OPERATIONS ====================
  {
    id: 'daily-invoices',
    name: '📅 Daily Invoice Activity',
    description: 'Number of invoices created per day',
    category: 'operational',
    icon: '📈',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'line',
        dateGrouping: {
          enabled: true,
          granularity: 'day'
        },
        yColumnAggregations: {
          id: [
            { function: 'count', label: 'Invoices Created' }
          ]
        },
        enableTopN: true,
        topNCount: 30,
        topNSort: 'desc',
        refreshInterval: 300
      },
      style: {
        themeName: 'emerald',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'created_at',
          y: ['id']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['created_at', 'id']
    }
  },

  {
    id: 'weekly-performance',
    name: '📆 Weekly Performance',
    description: 'Revenue and invoice count by week',
    category: 'analytics',
    icon: '📊',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'bar',
        dateGrouping: {
          enabled: true,
          granularity: 'week'
        },
        yColumnAggregations: {
          total: [
            { function: 'sum', label: 'Weekly Revenue' }
          ],
          id: [
            { function: 'count', label: 'Invoice Count' }
          ]
        },
        refreshInterval: 600
      },
      style: {
        themeName: 'sapphire',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'created_at',
          y: ['total', 'id']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['created_at', 'total', 'id']
    }
  },

  // ==================== YEAR OVER YEAR ====================
  {
    id: 'yearly-comparison',
    name: '📊 Year Over Year',
    description: 'Annual revenue comparison across years',
    category: 'financial',
    icon: '📈',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'bar',
        dateGrouping: {
          enabled: true,
          granularity: 'year'
        },
        yColumnAggregations: {
          total: [
            { function: 'sum', label: 'Annual Revenue' }
          ]
        },
        refreshInterval: 1800
      },
      style: {
        themeName: 'gold',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoices',
        mappings: {
          x: 'created_at',
          y: ['total']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoices',
      columns: ['created_at', 'total']
    }
  },

  // ==================== PRODUCT ANALYTICS ====================
  {
    id: 'product-revenue',
    name: '💎 Product Revenue',
    description: 'Revenue breakdown by product',
    category: 'sales',
    icon: '📦',
    widgetType: WidgetType.CHART,
    config: {
      settings: {
        chartType: 'bar',
        enableTopN: true,
        topNCount: 15,
        topNSort: 'desc',
        topNSortColumn: 'price',
        yColumnAggregations: {
          price: [
            { function: 'sum', label: 'Total Revenue' }
          ],
          quantity: [
            { function: 'sum', label: 'Units Sold' }
          ]
        },
        refreshInterval: 600
      },
      style: {
        themeName: 'emerald',
        backgroundColor: '#FFFFFF',
        borderRadius: 12
      },
      data: {
        databaseId: null,
        tableId: 'invoice_items',
        mappings: {
          x: 'product_name',
          y: ['price', 'quantity']
        },
        filters: []
      }
    },
    requiresData: {
      table: 'invoice_items',
      columns: ['product_name', 'price', 'quantity']
    }
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: WidgetTemplate['category']): WidgetTemplate[] {
  return WIDGET_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WidgetTemplate | undefined {
  return WIDGET_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all categories
 */
export function getTemplateCategories(): Array<{ id: WidgetTemplate['category']; name: string; icon: string }> {
  return [
    { id: 'financial', name: 'Financial', icon: '💰' },
    { id: 'analytics', name: 'Analytics', icon: '📊' },
    { id: 'sales', name: 'Sales', icon: '🛒' },
    { id: 'operational', name: 'Operational', icon: '⚙️' },
    { id: 'inventory', name: 'Inventory', icon: '📦' },
  ];
}

