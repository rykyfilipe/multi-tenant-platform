import { WidgetType } from "@/generated/prisma";
import { WidgetTemplate } from "./widget-templates";

/**
 * Dynamic Template Builder - Creates templates with REAL data from tenant's databases
 */

interface DatabaseInfo {
  id: number;
  name: string;
  tables: TableInfo[];
}

interface TableInfo {
  id: number;
  name: string;
  columns: ColumnInfo[];
}

interface ColumnInfo {
  id: number;
  name: string;
  type: string;
}

/**
 * Fetch tenant's databases, tables, and columns
 */
export async function fetchTenantData(tenantId: number): Promise<DatabaseInfo[]> {
  try {
    console.log(`🔍 [TemplateBuilder] Fetching data for tenant ${tenantId}`);
    
    // Fetch all databases
    const dbResponse = await fetch(`/api/v1/tenants/${tenantId}/databases`);
    if (!dbResponse.ok) {
      throw new Error('Failed to fetch databases');
    }
    const databases = await dbResponse.json();
    
    // Fetch tables and columns for each database
    const databasesWithTables = await Promise.all(
      databases.map(async (db: any) => {
        const tablesResponse = await fetch(`/api/v1/tenants/${tenantId}/databases/${db.id}/tables`);
        const tables = await tablesResponse.json();
        
        const tablesWithColumns = await Promise.all(
          tables.items.map(async (table: any) => {
            const columnsResponse = await fetch(`/api/v1/tenants/${tenantId}/databases/${db.id}/tables/${table.id}/columns`);
            const columns = await columnsResponse.json();
            
            return {
              id: table.id,
              name: table.name,
              columns: columns.items.map((col: any) => ({
                id: col.id,
                name: col.name,
                type: col.type
              }))
            };
          })
        );
        
        return {
          id: db.id,
          name: db.name,
          tables: tablesWithColumns
        };
      })
    );
    
    console.log(`✅ [TemplateBuilder] Fetched ${databasesWithTables.length} databases`);
    return databasesWithTables;
  } catch (error) {
    console.error('[TemplateBuilder] Failed to fetch tenant data:', error);
    return [];
  }
}

/**
 * Build dynamic templates based on actual tenant data
 */
export async function buildDynamicTemplates(tenantId: number): Promise<WidgetTemplate[]> {
  const databases = await fetchTenantData(tenantId);
  const templates: WidgetTemplate[] = [];
  
  if (databases.length === 0) {
    console.warn('[TemplateBuilder] No databases found, returning empty templates');
    return [];
  }
  
  // Find relevant tables
  for (const db of databases) {
    const invoicesTable = db.tables.find(t => t.name.toLowerCase().includes('invoice'));
    const itemsTable = db.tables.find(t => t.name.toLowerCase().includes('item') || t.name.toLowerCase().includes('product'));
    
    // ==================== REVENUE OVER TIME ====================
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      
      if (dateColumn && totalColumn) {
        templates.push({
          id: `revenue-over-time-${db.id}`,
          name: '💰 Revenue Over Time',
          description: `Monthly revenue trend from ${invoicesTable.name}`,
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
                [totalColumn.name]: [
                  { function: 'sum', label: 'Total Revenue' }
                ]
              },
              refreshInterval: 300
            },
            style: {
              themeName: 'platinum',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 300000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name]
          }
        });
      }
    }
    
    // ==================== TOTAL REVENUE KPI ====================
    if (invoicesTable) {
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      
      if (totalColumn) {
        templates.push({
          id: `total-revenue-kpi-${db.id}`,
          name: '💵 Total Revenue',
          description: `Sum of all revenue from ${invoicesTable.name}`,
          category: 'financial',
          icon: '💰',
          widgetType: WidgetType.KPI,
          config: {
            settings: {
              layout: 'grid',
              columns: 1,
              showTrend: true,
              showComparison: false,
              showTargets: false,
              refreshInterval: 300
            },
            style: {
              themeName: 'emerald',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: true, size: 'md', color: 'rgba(0, 0, 0, 0.1)' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              filters: [],
              metric: {
                field: totalColumn.name,
                label: 'Total Revenue',
                aggregations: [
                  { function: 'sum', label: 'Total Revenue' }
                ],
                format: 'currency',
                showTrend: true,
                showComparison: false
              }
            },
            metadata: {},
            refresh: { enabled: false, interval: 300000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [totalColumn.name]
          }
        });
      }
    }
    
    // ==================== INVOICES BY STATUS ====================
    if (invoicesTable) {
      const statusColumn = invoicesTable.columns.find(c => c.name.includes('status'));
      const idColumn = invoicesTable.columns.find(c => c.name === 'id');
      
      if (statusColumn && idColumn) {
        templates.push({
          id: `invoices-by-status-${db.id}`,
          name: '📊 Invoices by Status',
          description: `Distribution across ${statusColumn.name}`,
          category: 'financial',
          icon: '🥧',
          widgetType: WidgetType.CHART,
          config: {
            settings: {
              chartType: 'pie',
              yColumnAggregations: {
                [idColumn.name]: [
                  { function: 'count', label: 'Count' }
                ]
              },
              refreshInterval: 300
            },
            style: {
              themeName: 'sapphire',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: statusColumn.name,
                y: [idColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 300000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [statusColumn.name, idColumn.name]
          }
        });
      }
    }
    
    // ==================== TOP PRODUCTS ====================
    if (itemsTable) {
      const productNameColumn = itemsTable.columns.find(c => 
        c.name.includes('product') && c.name.includes('name')
      );
      const quantityColumn = itemsTable.columns.find(c => c.name.includes('quantity'));
      
      if (productNameColumn && quantityColumn) {
        templates.push({
          id: `top-products-${db.id}`,
          name: '🏆 Top Products',
          description: `Best selling products from ${itemsTable.name}`,
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
                [quantityColumn.name]: [
                  { function: 'sum', label: 'Total Sold' }
                ]
              },
              refreshInterval: 600
            },
            style: {
              themeName: 'emerald',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: itemsTable.id.toString(),
              mappings: {
                x: productNameColumn.name,
                y: [quantityColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 600000 }
          },
          requiresData: {
            table: itemsTable.name,
            columns: [productNameColumn.name, quantityColumn.name]
          }
        });
      }
    }
    
    // ==================== RECENT INVOICES TABLE ====================
    if (invoicesTable) {
      // Get first 5 visible columns
      const visibleColumns = invoicesTable.columns
        .filter(c => !c.name.includes('deleted') && !c.name.includes('password'))
        .slice(0, 5)
        .map(c => c.name);
      
      if (visibleColumns.length > 0) {
        templates.push({
          id: `recent-invoices-${db.id}`,
          name: '📋 Recent Invoices',
          description: `Latest entries from ${invoicesTable.name}`,
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
                defaultColumn: visibleColumns[0],
                defaultDirection: 'desc'
              },
              showRowNumbers: true,
              showColumnHeaders: true,
              alternateRowColors: true,
              refreshInterval: 180
            },
            style: {
              themeName: 'platinum',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: true, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              columns: visibleColumns.map(name => ({
                name,
                label: name,
                visible: true,
                sortable: true,
                filterable: true,
                format: 'text'
              })),
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 180000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: visibleColumns
          }
        });
      }
    }
    
    // ==================== TIME SERIES TEMPLATES ====================
    
    // Daily Trend - Revenue per day
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      
      if (dateColumn && totalColumn) {
        templates.push({
          id: `daily-revenue-trend-${db.id}`,
          name: '📅 Daily Revenue Trend',
          description: `Day-by-day revenue analysis from ${invoicesTable.name}`,
          category: 'analytics',
          icon: '📈',
          widgetType: WidgetType.CHART,
          config: {
            settings: {
              chartType: 'area',
              dateGrouping: {
                enabled: true,
                granularity: 'day'
              },
              yColumnAggregations: {
                [totalColumn.name]: [
                  { function: 'sum', label: 'Daily Revenue' }
                ]
              },
              enableTopN: true,
              topNCount: 30,
              topNSort: 'desc',
              refreshInterval: 180
            },
            style: {
              themeName: 'sapphire',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 180000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name]
          }
        });
      }
    }
    
    // Weekly Performance - Revenue + Count per week
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      const idColumn = invoicesTable.columns.find(c => c.name === 'id');
      
      if (dateColumn && totalColumn && idColumn) {
        templates.push({
          id: `weekly-performance-${db.id}`,
          name: '📆 Weekly Performance',
          description: `Week-by-week revenue and count from ${invoicesTable.name}`,
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
                [totalColumn.name]: [
                  { function: 'sum', label: 'Weekly Revenue' }
                ],
                [idColumn.name]: [
                  { function: 'count', label: 'Invoice Count' }
                ]
              },
              refreshInterval: 600
            },
            style: {
              themeName: 'emerald',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name, idColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 600000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name, idColumn.name]
          }
        });
      }
    }
    
    // Monthly Comparison - Month over Month
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      const idColumn = invoicesTable.columns.find(c => c.name === 'id');
      
      if (dateColumn && totalColumn && idColumn) {
        templates.push({
          id: `monthly-comparison-${db.id}`,
          name: '📊 Monthly Comparison',
          description: `Month-over-month revenue and volume from ${invoicesTable.name}`,
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
                [totalColumn.name]: [
                  { function: 'sum', label: 'Revenue' }
                ],
                [idColumn.name]: [
                  { function: 'count', label: 'Invoice Count' }
                ]
              },
              refreshInterval: 600
            },
            style: {
              themeName: 'platinum',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name, idColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 600000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name, idColumn.name]
          }
        });
      }
    }
    
    // Quarterly Revenue - Strategic overview
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      
      if (dateColumn && totalColumn) {
        templates.push({
          id: `quarterly-revenue-${db.id}`,
          name: '📆 Quarterly Revenue',
          description: `Quarterly financial performance from ${invoicesTable.name}`,
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
                [totalColumn.name]: [
                  { function: 'sum', label: 'Quarterly Revenue' }
                ]
              },
              refreshInterval: 1800
            },
            style: {
              themeName: 'gold',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 1800000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name]
          }
        });
      }
    }
    
    // Yearly Comparison - Year over Year
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      
      if (dateColumn && totalColumn) {
        templates.push({
          id: `yearly-comparison-${db.id}`,
          name: '📊 Year Over Year',
          description: `Annual revenue comparison from ${invoicesTable.name}`,
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
                [totalColumn.name]: [
                  { function: 'sum', label: 'Annual Revenue' }
                ]
              },
              refreshInterval: 1800
            },
            style: {
              themeName: 'platinum',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 1800000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name]
          }
        });
      }
    }
    
    // Hourly Activity - Intraday patterns
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const idColumn = invoicesTable.columns.find(c => c.name === 'id');
      
      if (dateColumn && idColumn) {
        templates.push({
          id: `hourly-activity-${db.id}`,
          name: '🕐 Hourly Activity Pattern',
          description: `Hour-by-hour transaction volume from ${invoicesTable.name}`,
          category: 'analytics',
          icon: '⏰',
          widgetType: WidgetType.CHART,
          config: {
            settings: {
              chartType: 'line',
              dateGrouping: {
                enabled: true,
                granularity: 'hour'
              },
              yColumnAggregations: {
                [idColumn.name]: [
                  { function: 'count', label: 'Transactions' }
                ]
              },
              enableTopN: true,
              topNCount: 24,
              topNSort: 'desc',
              refreshInterval: 300
            },
            style: {
              themeName: 'sapphire',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [idColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 300000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, idColumn.name]
          }
        });
      }
    }
    
    // Revenue Growth Rate - Percentage change over time
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      
      if (dateColumn && totalColumn) {
        templates.push({
          id: `revenue-growth-rate-${db.id}`,
          name: '📈 Revenue Growth Rate',
          description: `Monthly growth percentage from ${invoicesTable.name}`,
          category: 'financial',
          icon: '📊',
          widgetType: WidgetType.CHART,
          config: {
            settings: {
              chartType: 'line',
              dateGrouping: {
                enabled: true,
                granularity: 'month'
              },
              yColumnAggregations: {
                [totalColumn.name]: [
                  { function: 'sum', label: 'Monthly Revenue' }
                ]
              },
              refreshInterval: 600
            },
            style: {
              themeName: 'emerald',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 600000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name]
          }
        });
      }
    }
    
    // Cumulative Revenue - Running total over time
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      
      if (dateColumn && totalColumn) {
        templates.push({
          id: `cumulative-revenue-${db.id}`,
          name: '📈 Cumulative Revenue',
          description: `Running total revenue over time from ${invoicesTable.name}`,
          category: 'financial',
          icon: '💰',
          widgetType: WidgetType.CHART,
          config: {
            settings: {
              chartType: 'area',
              dateGrouping: {
                enabled: true,
                granularity: 'day'
              },
              yColumnAggregations: {
                [totalColumn.name]: [
                  { function: 'sum', label: 'Cumulative Revenue' }
                ]
              },
              refreshInterval: 600
            },
            style: {
              themeName: 'gold',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 600000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name]
          }
        });
      }
    }
    
    // Average Transaction Value Over Time
    if (invoicesTable) {
      const dateColumn = invoicesTable.columns.find(c => 
        c.name.includes('created') || c.name.includes('date') || c.name.includes('issued')
      );
      const totalColumn = invoicesTable.columns.find(c => 
        c.name.includes('total') || c.name.includes('amount')
      );
      
      if (dateColumn && totalColumn) {
        templates.push({
          id: `average-transaction-trend-${db.id}`,
          name: '💵 Average Transaction Trend',
          description: `Average invoice value over time from ${invoicesTable.name}`,
          category: 'analytics',
          icon: '📊',
          widgetType: WidgetType.CHART,
          config: {
            settings: {
              chartType: 'line',
              dateGrouping: {
                enabled: true,
                granularity: 'month'
              },
              yColumnAggregations: {
                [totalColumn.name]: [
                  { function: 'avg', label: 'Average Value' }
                ]
              },
              refreshInterval: 600
            },
            style: {
              themeName: 'sapphire',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              shadow: { enabled: false, size: 'md', color: 'rgba(0, 0, 0, 0.1)' },
              border: { enabled: false, width: 1, color: 'rgba(0, 0, 0, 0.1)', style: 'solid' }
            },
            data: {
              databaseId: db.id,
              tableId: invoicesTable.id.toString(),
              mappings: {
                x: dateColumn.name,
                y: [totalColumn.name]
              },
              filters: []
            },
            metadata: {},
            refresh: { enabled: false, interval: 600000 }
          },
          requiresData: {
            table: invoicesTable.name,
            columns: [dateColumn.name, totalColumn.name]
          }
        });
      }
    }
  }
  
  console.log(`✅ [TemplateBuilder] Built ${templates.length} dynamic templates (including time series)`);
  return templates;
}

/**
 * Get template suggestions based on available data
 */
export function suggestTemplates(databases: DatabaseInfo[]): string[] {
  const suggestions: string[] = [];
  
  for (const db of databases) {
    for (const table of db.tables) {
      const hasDateColumn = table.columns.some(c => 
        c.type.includes('date') || c.type.includes('timestamp')
      );
      const hasNumericColumn = table.columns.some(c => 
        c.type.includes('int') || c.type.includes('decimal') || c.type.includes('float')
      );
      
      if (hasDateColumn && hasNumericColumn) {
        suggestions.push(`📈 Time-series chart for ${table.name}`);
        suggestions.push(`📊 KPI aggregation from ${table.name}`);
      }
      
      if (table.columns.some(c => c.name.includes('status') || c.name.includes('category'))) {
        suggestions.push(`🥧 Distribution chart for ${table.name}`);
      }
      
      suggestions.push(`📋 Table view of ${table.name}`);
    }
  }
  
  return suggestions;
}

