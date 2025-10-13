"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  Zap
} from "lucide-react";
import { WidgetType } from "@/generated/prisma";

export default function SmartWidgetTemplatesPage() {
  const router = useRouter();
  const { tenant, token, showAlert } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);
  const createLocal = useWidgetsStore((state) => state.createLocal);

  // Fetch user's tables with columns loaded
  const { data: allTables, isLoading } = useTablesWithColumns(tenant?.id || 0);

  // Smart detection of invoice/sales tables
  const detectInvoiceTables = () => {
    return allTables.filter(table => {
      const tableName = table.name.toLowerCase();
      return tableName.includes('invoice') || 
             tableName.includes('order') || 
             tableName.includes('sale') ||
             tableName.includes('factur');
    });
  };

  // Detect product tables
  const detectProductTables = () => {
    return allTables.filter(table => {
      const tableName = table.name.toLowerCase();
      return tableName.includes('product') || 
             tableName.includes('item') ||
             tableName.includes('produs');
    });
  };

  // Detect customer tables
  const detectCustomerTables = () => {
    return allTables.filter(table => {
      const tableName = table.name.toLowerCase();
      return tableName.includes('customer') || 
             tableName.includes('client') ||
             tableName.includes('user');
    });
  };

  // Find column by semantic type or name pattern
  const findColumn = (table: any, patterns: string[], semanticTypes: string[] = []) => {
    return table.columns?.find((col: any) => {
      const colName = col.name.toLowerCase();
      const matchesPattern = patterns.some(pattern => colName.includes(pattern));
      const matchesSemantic = semanticTypes.length > 0 && 
                             semanticTypes.some(type => col.semanticType === type);
      return matchesPattern || matchesSemantic;
    });
  };

  // Create widget from template using local store (pending changes)
  const createWidgetFromTemplate = (template: any, dashboardId?: number) => {
    if (!tenant?.id) {
      showAlert("Please login to create widgets", "error");
      return;
    }

    setIsCreating(true);
    try {
      // Generate temporary ID for new widget (like in duplicate function)
      const tempId = Math.floor(Math.random() * 1000000) + 1000000;
      
      // Get first dashboard ID from URL or use default
      const targetDashboardId = dashboardId || 1; // Will be overridden when added to specific dashboard
      
      // Create widget entity matching the store structure exactly
      const newWidget = {
        id: tempId,
        title: template.title,
        description: template.description || null,
        type: template.type,
        config: template.config,
        tenantId: tenant.id,
        dashboardId: targetDashboardId,
        position: {
          x: 0,
          y: 0,
          w: template.type === "KPI" ? 4 : template.type === "TABLE" ? 8 : 6,
          h: template.type === "KPI" ? 4 : template.type === "TABLE" ? 8 : 6,
        },
        isVisible: true,
        sortOrder: 0,
        schemaVersion: 2,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: tenant.id, // Use tenant ID as user ID fallback
        updatedBy: tenant.id,
      } as any; // Cast to any to avoid type conflicts

      // Add to store as pending change (like duplicate does)
      createLocal(newWidget);
      
      showAlert(`✅ Widget "${template.title}" added to pending changes!`, "success");
      
      // Redirect to dashboards where user can see it in pending changes
      setTimeout(() => {
        router.push("/home/dashboards");
      }, 500);
      
    } catch (error) {
      console.error("Error creating widget from template:", error);
      showAlert("Failed to create widget from template", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // Generate smart templates based on user's data
  const generateSmartTemplates = (): any[] => {
    const templates: any[] = [];
    const invoiceTables = detectInvoiceTables();
    const productTables = detectProductTables();
    const customerTables = detectCustomerTables();

    // Template 1: Top Selling Product This Month (KPI)
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const productCol = findColumn(invoiceTable, ['product', 'produs', 'item']);
      const quantityCol = findColumn(invoiceTable, ['quantity', 'cantitate', 'qty']);
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);

      if (productCol && quantityCol) {
        templates.push({
          id: "top-product-month",
          title: "🏆 Top Selling Product This Month",
          description: "Product with highest sales quantity in current month",
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
                aggregations: [
                  { function: "max", label: "Highest Quantity" }
                ],
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

    // Template 2: Most Loyal Customer (KPI)
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const customerCol = findColumn(invoiceTable, ['customer', 'client', 'user']);
      const idCol = invoiceTable.columns?.find((col: any) => col.name.toLowerCase() === 'id');

      if (customerCol && idCol) {
        templates.push({
          id: "top-customer",
          title: "👑 Most Loyal Customer",
          description: "Customer with most orders/invoices",
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
                aggregations: [
                  { function: "count", label: "Total Orders" }
                ],
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

    // Template 3: Sales This Year (Chart)
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);

      if (amountCol && dateCol) {
        templates.push({
          id: "sales-this-year",
          title: "📈 Sales This Year",
          description: "Monthly sales chart for current year",
          type: WidgetType.CHART,
          category: "billing",
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

    // Template 4: Total Revenue (KPI)
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma', 'revenue']);

      if (amountCol) {
        templates.push({
          id: "total-revenue",
          title: "💰 Total Revenue",
          description: "Sum of all invoices/orders",
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
                aggregations: [
                  { function: "sum", label: "Total" }
                ],
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

    // Template 5: Orders This Month (KPI)
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const idCol = invoiceTable.columns?.find((col: any) => col.name.toLowerCase() === 'id');
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);

      if (idCol) {
        templates.push({
          id: "orders-this-month",
          title: "📦 Orders This Month",
          description: "Count of orders in current month",
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
                aggregations: [
                  { function: "count", label: "Total Orders" }
                ],
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

    // Template 6: Product Performance (Table)
    if (productTables.length > 0) {
      const productTable = productTables[0];
      const nameCol = findColumn(productTable, ['name', 'title', 'nume']);
      const priceCol = findColumn(productTable, ['price', 'pret', 'amount']);
      const stockCol = findColumn(productTable, ['stock', 'quantity', 'qty']);

      if (nameCol) {
        const columns = [nameCol];
        if (priceCol) columns.push(priceCol);
        if (stockCol) columns.push(stockCol);

        templates.push({
          id: "product-performance",
          title: "📊 Product Performance",
          description: "Table view of all products with details",
          type: WidgetType.TABLE,
          category: "billing",
          icon: BarChart3,
          color: "bg-indigo-500",
          config: {
            data: {
              databaseId: productTable.databaseId,
              tableId: productTable.id.toString(),
              columns: columns.map(col => ({
                name: col.name,
                label: col.name.charAt(0).toUpperCase() + col.name.slice(1),
                format: col.type === 'number' ? 'number' : 'text'
              })),
              filters: []
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

    // Template 7: Average Order Value (KPI)
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);

      if (amountCol) {
        templates.push({
          id: "avg-order-value",
          title: "💎 Average Order Value",
          description: "Average invoice/order amount",
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
                aggregations: [
                  { function: "avg", label: "Average" }
                ],
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

    // Template 8: Revenue by Month (Chart)
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'price', 'suma']);
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);

      if (amountCol && dateCol) {
        templates.push({
          id: "revenue-by-month",
          title: "📅 Revenue by Month",
          description: "Bar chart showing monthly revenue",
          type: WidgetType.CHART,
          category: "analytics",
          icon: Calendar,
          color: "bg-cyan-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              chartType: "bar",
              xAxis: dateCol.name,
              yAxis: amountCol.name,
              aggregation: "sum",
              groupBy: "month",
              filters: []
            },
            style: {},
            settings: { refreshInterval: 300 }
          }
        });
      }
    }

    // Template 9: Total Customers (KPI)
    if (customerTables.length > 0) {
      const customerTable = customerTables[0];
      const idCol = customerTable.columns?.find((col: any) => col.name.toLowerCase() === 'id');

      if (idCol) {
        templates.push({
          id: "total-customers",
          title: "👥 Total Customers",
          description: "Count of all customers in database",
          type: WidgetType.KPI,
          category: "analytics",
          icon: Users,
          color: "bg-violet-500",
          config: {
            data: {
              databaseId: customerTable.databaseId,
              tableId: customerTable.id.toString(),
              metric: {
                field: idCol.name,
                label: "Total Customers",
                aggregations: [
                  { function: "count", label: "Count" }
                ],
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

    // Template 10: Recent Orders (Table)
    if (invoiceTables.length > 0) {
      const invoiceTable = invoiceTables[0];
      const dateCol = findColumn(invoiceTable, ['date', 'created', 'data']);
      const amountCol = findColumn(invoiceTable, ['total', 'amount', 'suma']);
      const customerCol = findColumn(invoiceTable, ['customer', 'client']);

      if (dateCol) {
        const columns = [dateCol];
        if (customerCol) columns.push(customerCol);
        if (amountCol) columns.push(amountCol);

        templates.push({
          id: "recent-orders",
          title: "🕐 Recent Orders",
          description: "Latest orders/invoices from last 30 days",
          type: WidgetType.TABLE,
          category: "analytics",
          icon: Calendar,
          color: "bg-teal-500",
          config: {
            data: {
              databaseId: invoiceTable.databaseId,
              tableId: invoiceTable.id.toString(),
              columns: columns.map(col => ({
                name: col.name,
                label: col.name.charAt(0).toUpperCase() + col.name.slice(1),
                format: col.type === 'number' ? 'currency' : col.type === 'date' ? 'date' : 'text'
              })),
              filters: [{
                column: dateCol.name,
                operator: ">=",
                value: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              }]
            },
            style: {},
            settings: { 
              refreshInterval: 300,
              pagination: { enabled: true, pageSize: 10 },
              showColumnHeaders: true,
              sorting: { enabled: true, defaultColumn: dateCol.name, defaultDirection: 'desc' }
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
    { id: "custom", label: "Custom", icon: Target },
  ];

  const filteredTemplates = selectedCategory === "all" 
    ? smartTemplates 
    : smartTemplates.filter(t => t.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Smart Widget Templates
          </h1>
          <p className="text-muted-foreground mt-2">
            Pre-configured widgets automatically adapted to your data structure
          </p>
        </div>
      </div>

      {/* Info Banner */}
      {smartTemplates.length === 0 && (
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
                  Please create tables with invoices, products, or customers to see relevant templates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates */}
      {smartTemplates.length > 0 && (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-4">
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

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                return (
                  <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${template.color} bg-opacity-10`}>
                            <Icon className={`h-6 w-6 text-${template.color.split('-')[1]}-600`} />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{template.title}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {template.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-sm mt-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Configuration Preview */}
                        <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Table:</span>
                            <span className="font-medium">
                              {allTables.find(t => t.id === Number(template.config.data.tableId))?.name || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Auto-configured:</span>
                            <Badge variant="secondary" className="text-[10px]">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Smart
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          className="w-full gap-2"
                          onClick={() => createWidgetFromTemplate(template)}
                          disabled={isCreating}
                        >
                          <Zap className="h-4 w-4" />
                          Create Widget
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No templates in this category</p>
                <p className="text-sm mt-2">Try selecting another category or create the necessary tables first.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

