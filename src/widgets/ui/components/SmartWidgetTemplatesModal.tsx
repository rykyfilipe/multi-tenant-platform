"use client";

import React, { useState, useMemo } from "react";
import { useTablesWithColumns } from "@/hooks/useTablesWithColumns";
import { useApp } from "@/contexts/AppContext";
import { useWidgetsStore } from "@/widgets/store/useWidgetsStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  DollarSign,
  BarChart3,
  Package,
  Calendar,
  Target,
  Award,
  Sparkles,
  Zap,
  Loader2,
  Clock,
  CheckCircle
} from "lucide-react";
import { WidgetType } from "@/generated/prisma";

interface SmartWidgetTemplatesModalProps {
  dashboardId?: number;
  children?: React.ReactNode;
}

export const SmartWidgetTemplatesModal: React.FC<SmartWidgetTemplatesModalProps> = ({ 
  dashboardId,
  children 
}) => {
  const { tenant, showAlert } = useApp();
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const createLocal = useWidgetsStore((state) => state.createLocal);

  // Fetch user's tables with columns loaded
  const { data: allTables, isLoading } = useTablesWithColumns(tenant?.id || 0);

  // Smart detection functions
  const detectInvoiceTables = () => {
    return allTables.filter(table => {
      const tableName = table.name.toLowerCase();
      return tableName.includes('invoice') || 
             tableName.includes('order') || 
             tableName.includes('sale') ||
             tableName.includes('factur');
    });
  };

  const detectProductTables = () => {
    return allTables.filter(table => {
      const tableName = table.name.toLowerCase();
      return tableName.includes('product') || 
             tableName.includes('item') ||
             tableName.includes('produs');
    });
  };

  const detectCustomerTables = () => {
    return allTables.filter(table => {
      const tableName = table.name.toLowerCase();
      return tableName.includes('customer') || 
             tableName.includes('client') ||
             tableName.includes('user');
    });
  };

  const findColumn = (table: any, patterns: string[], semanticTypes: string[] = []) => {
    return table.columns?.find((col: any) => {
      const colName = col.name.toLowerCase();
      const matchesPattern = patterns.some(pattern => colName.includes(pattern));
      const matchesSemantic = semanticTypes.length > 0 && 
                             semanticTypes.some(type => col.semanticType === type);
      return matchesPattern || matchesSemantic;
    });
  };

  // Find next available position in grid (to the right)
  const findNextPosition = () => {
    const widgets = useWidgetsStore.getState().widgets;
    const widgetsArray = Object.values(widgets).filter(w => w.dashboardId === dashboardId);
    
    if (widgetsArray.length === 0) {
      return { x: 0, y: 0 };
    }

    // Find rightmost widget
    let maxX = 0;
    let maxXWidget = widgetsArray[0];
    
    widgetsArray.forEach(widget => {
      const rightEdge = (widget.position?.x || 0) + (widget.position?.w || 4);
      if (rightEdge > maxX) {
        maxX = rightEdge;
        maxXWidget = widget;
      }
    });

    // Place new widget to the right of the rightmost widget
    const newX = maxX;
    const newY = maxXWidget.position?.y || 0;
    
    // If exceeds grid width (12 columns), wrap to next row
    const GRID_COLS = 12;
    if (newX >= GRID_COLS) {
      // Find the max Y position and add new widget below
      const maxY = Math.max(...widgetsArray.map(w => (w.position?.y || 0) + (w.position?.h || 4)));
      return { x: 0, y: maxY };
    }
    
    return { x: newX, y: newY };
  };

  // Create widget from template
  const createWidgetFromTemplate = (template: any) => {
    if (!tenant?.id) {
      showAlert("Please login to create widgets", "error");
      return;
    }

    setIsCreating(true);
    try {
      const tempId = Math.floor(Math.random() * 1000000) + 1000000;
      const targetDashboardId = dashboardId || 1;
      const nextPosition = findNextPosition();
      
      const newWidget = {
        id: tempId,
        title: template.title,
        description: template.description || null,
        type: template.type,
        config: template.config,
        tenantId: tenant.id,
        dashboardId: targetDashboardId,
        position: {
          x: nextPosition.x,
          y: nextPosition.y,
          w: template.type === "KPI" ? 4 : template.type === "TABLE" ? 8 : 6,
          h: template.type === "KPI" ? 4 : template.type === "TABLE" ? 8 : 6,
        },
        isVisible: true,
        sortOrder: 0,
        schemaVersion: 2,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: tenant.id,
        updatedBy: tenant.id,
      } as any;

      createLocal(newWidget);
      showAlert(`✅ Widget "${template.title}" added to pending changes!`, "success");
      setOpen(false); // Close modal
      
    } catch (error) {
      console.error("Error creating widget from template:", error);
      showAlert("Failed to create widget from template", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Generate smart templates
  const generateSmartTemplates = (): any[] => {
    const templates: any[] = [];
    const invoiceTables = detectInvoiceTables();
    const productTables = detectProductTables();
    const customerTables = detectCustomerTables();

    // Template 1: Top Selling Product
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const productCol = findColumn(invoiceTable, ['product', 'produs', 'item']);
      const quantityCol = findColumn(invoiceTable, ['quantity', 'cantitate', 'qty']);
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);

      if (productCol && quantityCol) {
        templates.push({
          id: "top-product-month",
          title: "🏆 Top Selling Product",
          description: "Product with highest sales this month",
          type: WidgetType.KPI,
          category: "billing",
          icon: Package,
          color: "bg-blue-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              metric: {
                field: quantityCol.name,
                label: "Top Product",
                aggregations: [{ function: "max", label: "Highest Quantity" }],
                format: "number",
                displayColumn: productCol.name,
                displayFormat: "text",
                showTrend: false,
                showComparison: false,
              },
              filters: dateCol ? [{
                column: dateCol.name,
                operator: ">=",
                value: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
              }] : []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 2: Most Loyal Customer
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const customerCol = findColumn(invoiceTable, ['customer', 'client', 'user']);
      const idCol = invoiceTable.columns?.find((col: any) => col.name.toLowerCase() === 'id');

      if (customerCol && idCol) {
        templates.push({
          id: "top-customer",
          title: "👑 Most Loyal Customer",
          description: "Customer with most orders",
          type: WidgetType.KPI,
          category: "billing",
          icon: Users,
          color: "bg-purple-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              metric: {
                field: idCol.name,
                label: "Top Customer",
                aggregations: [{ function: "count", label: "Total Orders" }],
                format: "number",
                groupBy: customerCol.name,
                displayColumn: customerCol.name,
                displayFormat: "text",
                showTrend: false,
                showComparison: false,
              },
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 3: Total Revenue
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma', 'revenue']);

      if (amountCol) {
        templates.push({
          id: "total-revenue",
          title: "💰 Total Revenue",
          description: "Sum of all invoices",
          type: WidgetType.KPI,
          category: "billing",
          icon: DollarSign,
          color: "bg-emerald-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              metric: {
                field: amountCol.name,
                label: "Total Revenue",
                aggregations: [{ function: "sum", label: "Total" }],
                format: "currency",
                showTrend: true,
                showComparison: false,
              },
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 4: Orders This Month
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const idCol = invoiceTable.columns?.find((col: any) => col.name.toLowerCase() === 'id');
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);

      if (idCol) {
        templates.push({
          id: "orders-this-month",
          title: "📦 Orders This Month",
          description: "Count of orders this month",
          type: WidgetType.KPI,
          category: "billing",
          icon: ShoppingCart,
          color: "bg-orange-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              metric: {
                field: idCol.name,
                label: "Orders Count",
                aggregations: [{ function: "count", label: "Total Orders" }],
                format: "number",
                showTrend: true,
                showComparison: false,
              },
              filters: dateCol ? [{
                column: dateCol.name,
                operator: ">=",
                value: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
              }] : []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 5: Average Order Value
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);

      if (amountCol) {
        templates.push({
          id: "avg-order-value",
          title: "💎 Average Order Value",
          description: "Average invoice amount",
          type: WidgetType.KPI,
          category: "billing",
          icon: Award,
          color: "bg-pink-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              metric: {
                field: amountCol.name,
                label: "Avg Order Value",
                aggregations: [{ function: "avg", label: "Average" }],
                format: "currency",
                showTrend: true,
                showComparison: false,
              },
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 6: Sales This Year
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);

      if (amountCol && dateCol) {
        templates.push({
          id: "sales-this-year",
          title: "📈 Sales This Year",
          description: "Monthly sales chart",
          type: WidgetType.CHART,
          category: "analytics",
          icon: TrendingUp,
          color: "bg-green-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              chartType: "line",
              xAxis: dateCol.name,
              yAxis: amountCol.name,
              aggregation: "sum",
              filters: [{
                column: dateCol.name,
                operator: ">=",
                value: new Date(new Date().getFullYear(), 0, 1).toISOString()
              }]
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 7: Top Product by Revenue
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const productCol = findColumn(invoiceTable, ['product', 'produs', 'item']);
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);

      if (productCol && amountCol) {
        templates.push({
          id: "top-product-revenue",
          title: "💵 Top Product by Revenue",
          description: "Product generating most revenue",
          type: WidgetType.KPI,
          category: "billing",
          icon: TrendingUp,
          color: "bg-green-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              metric: {
                field: amountCol.name,
                label: "Top Revenue Product",
                aggregations: [{ function: "sum", label: "Total Revenue" }],
                format: "currency",
                groupBy: productCol.name,
                displayColumn: productCol.name,
                displayFormat: "text",
                showTrend: false,
                showComparison: false,
              },
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 8: Pending Invoices Count
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const statusCol = findColumn(invoiceTable, ['status', 'state', 'stare']);
      const idCol = invoiceTable.columns?.find((col: any) => col.name.toLowerCase() === 'id');

      if (idCol && statusCol) {
        templates.push({
          id: "pending-invoices",
          title: "⏳ Pending Invoices",
          description: "Count of unpaid/pending invoices",
          type: WidgetType.KPI,
          category: "billing",
          icon: Clock,
          color: "bg-amber-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              metric: {
                field: idCol.name,
                label: "Pending Invoices",
                aggregations: [{ function: "count", label: "Count" }],
                format: "number",
                showTrend: true,
                showComparison: false,
              },
              filters: [{
                column: statusCol.name,
                operator: "=",
                value: "pending"
              }]
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 9: Sales Growth Chart
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);

      if (amountCol && dateCol) {
        templates.push({
          id: "sales-growth",
          title: "📊 Sales Growth Trend",
          description: "Sales performance over time",
          type: WidgetType.CHART,
          category: "analytics",
          icon: TrendingUp,
          color: "bg-emerald-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              chartType: "area",
              xAxis: dateCol.name,
              yAxis: amountCol.name,
              aggregation: "sum",
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 10: Low Stock Alert
    if (productTables.length > 0) {
      const productTable = productTables[0];
      const stockCol = findColumn(productTable, ['stock', 'quantity', 'qty', 'inventory']);
      const nameCol = findColumn(productTable, ['name', 'title', 'nume']);

      if (stockCol && nameCol) {
        templates.push({
          id: "low-stock-alert",
          title: "⚠️ Low Stock Products",
          description: "Products with low inventory",
          type: WidgetType.TABLE,
          category: "billing",
          icon: Package,
          color: "bg-red-500",
          config: {
            data: {
              databaseId: productTable.databaseId,
              tableId: productTable.id.toString(),
              columns: [
                {
                  name: nameCol.name,
                  label: "Product Name",
                  format: "text"
                },
                {
                  name: stockCol.name,
                  label: "Stock",
                  format: "number"
                }
              ],
              filters: [{
                column: stockCol.name,
                operator: "<",
                value: 10
              }]
            },
            style: {},
            settings: { 
              refreshInterval: 300,
              pagination: { enabled: true, pageSize: 10 },
              showColumnHeaders: true
            }
          }
        });
      }
    }

    // Template 11: Customer Growth
    if (customerTables.length > 0) {
      const customerTable = customerTables[0];
      const dateCol = findColumn(customerTable, ['created', 'date', 'registered', 'signup']);
      const idCol = customerTable.columns?.find((col: any) => col.name.toLowerCase() === 'id');

      if (idCol && dateCol) {
        templates.push({
          id: "customer-growth",
          title: "👥 Customer Growth",
          description: "New customers over time",
          type: WidgetType.CHART,
          category: "analytics",
          icon: Users,
          color: "bg-blue-500",
          config: {
            data: {
              databaseId: customerTable.databaseId,
              tableId: customerTable.id.toString(),
              chartType: "line",
              xAxis: dateCol.name,
              yAxis: idCol.name,
              aggregation: "count",
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 12: Paid vs Unpaid Revenue
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const statusCol = findColumn(invoiceTable, ['status', 'state', 'stare']);
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);

      if (statusCol && amountCol) {
        templates.push({
          id: "revenue-by-status",
          title: "💰 Revenue by Status",
          description: "Paid vs Pending revenue breakdown",
          type: WidgetType.CHART,
          category: "billing",
          icon: BarChart3,
          color: "bg-indigo-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              chartType: "pie",
              groupBy: statusCol.name,
              valueField: amountCol.name,
              aggregation: "sum",
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 13: Total Products
    if (productTables.length > 0) {
      const productTable = productTables[0];
      const idCol = productTable.columns?.find((col: any) => col.name.toLowerCase() === 'id');

      if (idCol) {
        templates.push({
          id: "total-products",
          title: "📦 Total Products",
          description: "Count of all products in catalog",
          type: WidgetType.KPI,
          category: "analytics",
          icon: Package,
          color: "bg-cyan-500",
          config: {
            data: {
              databaseId: productTable.databaseId,
              tableId: productTable.id.toString(),
              metric: {
                field: idCol.name,
                label: "Total Products",
                aggregations: [{ function: "count", label: "Count" }],
                format: "number",
                showTrend: true,
                showComparison: false,
              },
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 14: Sales by Customer
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const customerCol = findColumn(invoiceTable, ['customer', 'client', 'user']);
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);

      if (customerCol && amountCol) {
        templates.push({
          id: "sales-by-customer",
          title: "👤 Sales by Customer",
          description: "Revenue breakdown per customer",
          type: WidgetType.CHART,
          category: "analytics",
          icon: Users,
          color: "bg-purple-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              chartType: "bar",
              groupBy: customerCol.name,
              valueField: amountCol.name,
              aggregation: "sum",
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 15: Recent Paid Invoices
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const statusCol = findColumn(invoiceTable, ['status', 'state', 'stare']);
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'suma']);

      if (statusCol && dateCol) {
        const columns = [dateCol];
        if (amountCol) columns.push(amountCol);

        templates.push({
          id: "recent-paid-invoices",
          title: "✅ Recent Paid Invoices",
          description: "Latest paid invoices (last 7 days)",
          type: WidgetType.TABLE,
          category: "billing",
          icon: CheckCircle,
          color: "bg-green-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              columns: columns.map(col => ({
                name: col.name,
                label: col.name.charAt(0).toUpperCase() + col.name.slice(1),
                format: col.type === 'number' ? 'currency' : col.type === 'date' ? 'date' : 'text'
              })),
              filters: [
                {
                  column: statusCol.name,
                  operator: "=",
                  value: "paid"
                },
                {
                  column: dateCol.name,
                  operator: ">=",
                  value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                }
              ]
            },
            style: {},
            settings: { 
              refreshInterval: 300,
              pagination: { enabled: true, pageSize: 10 },
              showColumnHeaders: true
            }
          }
        });
      }
    }

    return templates;
  };

  const smartTemplates = useMemo(() => generateSmartTemplates(), [allTables]);

  const categories = [
    { id: "all", label: "All Templates", icon: Sparkles },
    { id: "billing", label: "Billing & Sales", icon: DollarSign },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  const filteredTemplates = selectedCategory === "all" 
    ? smartTemplates 
    : smartTemplates.filter(t => t.category === selectedCategory);

  return (
    <>
      {/* Trigger Button */}
      <div onClick={() => setOpen(true)}>
        {children || (
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Smart Templates
          </Button>
        )}
      </div>

      {/* Custom Modal Overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div 
            className="bg-background border rounded-lg shadow-2xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="flex items-center gap-3 text-2xl font-bold">
                    <Zap className="h-6 w-6 text-primary" />
                    Smart Widget Templates
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pre-configured widgets automatically adapted to your data
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
            </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading your data structure...</p>
            </div>
          </div>
        ) : smartTemplates.length === 0 ? (
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                    No templates available yet
                  </h3>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                    Smart templates are generated based on your tables. 
                    Create tables with invoices, products, or customers to see templates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-3">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={category.id} value={category.id} className="gap-2">
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={selectedCategory} className="flex-1 overflow-y-auto mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {filteredTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <Card key={template.id} className="group hover:shadow-lg transition-all duration-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${template.color} bg-opacity-10 flex-shrink-0`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base truncate">{template.title}</CardTitle>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {template.type}
                            </Badge>
                          </div>
                        </div>
                        <CardDescription className="text-xs mt-2">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {/* Configuration Preview */}
                        <div className="p-2 bg-muted/50 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Table:</span>
                            <span className="font-medium truncate ml-2">
                              {allTables.find(t => t.id === Number(template.config.data.tableId))?.name || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <Badge variant="secondary" className="text-[10px]">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Auto-configured
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          className="w-full gap-2"
                          onClick={() => createWidgetFromTemplate(template)}
                          disabled={isCreating}
                          size="sm"
                        >
                          {isCreating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4" />
                              Use Template
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No templates in this category</p>
                  <p className="text-sm mt-2">Select another category</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
          </div>
        </div>
      )}
    </>
  );
};

