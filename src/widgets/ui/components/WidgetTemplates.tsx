"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LayoutTemplate, 
  Star, 
  TrendingUp, 
  BarChart3, 
  Table, 
  Target,
  Clock,
  CloudSun,
  Settings,
  Plus,
  Download,
  Upload,
} from "lucide-react";
import { WidgetKind } from "@/generated/prisma";

interface WidgetTemplate {
  id: string;
  name: string;
  description: string;
  kind: WidgetKind;
  config: any;
  category: "dashboard" | "analytics" | "monitoring" | "custom";
  isPremium: boolean;
  tags: string[];
}

const templates: WidgetTemplate[] = [
  // Dashboard Templates
  {
    id: "executive-dashboard",
    name: "Executive Dashboard",
    description: "High-level KPIs and metrics for executives",
    kind: WidgetKind.KPI,
    config: {
      settings: { showTrend: true, showComparison: true },
      style: { theme: "premium-light", size: "large" },
      data: { metrics: ["revenue", "growth", "profit"] }
    },
    category: "dashboard",
    isPremium: false,
    tags: ["executive", "kpi", "overview"]
  },
  {
    id: "sales-analytics",
    name: "Sales Analytics",
    description: "Comprehensive sales performance tracking",
    kind: WidgetKind.CHART,
    config: {
      settings: { chartType: "line", showForecast: true },
      style: { theme: "premium-light", colors: ["#1f2937", "#374151"] },
      data: { metrics: ["sales", "conversions", "revenue"] }
    },
    category: "analytics",
    isPremium: true,
    tags: ["sales", "analytics", "performance"]
  },
  {
    id: "user-activity",
    name: "User Activity Monitor",
    description: "Real-time user engagement metrics",
    kind: WidgetKind.TABLE,
    config: {
      settings: { 
        columns: ["user", "activity", "duration", "status"],
        pageSize: 25,
        realTime: true
      },
      style: { theme: "premium-light", density: "comfortable" },
      data: { source: "user_activity" }
    },
    category: "monitoring",
    isPremium: false,
    tags: ["users", "activity", "monitoring"]
  },
  {
    id: "weather-widget",
    name: "Weather Display",
    description: "Current weather conditions and forecast",
    kind: WidgetKind.WEATHER,
    config: {
      settings: { 
        location: "auto",
        units: "metric",
        showForecast: true
      },
      style: { theme: "premium-light", compact: false },
      data: { provider: "openweather" }
    },
    category: "custom",
    isPremium: false,
    tags: ["weather", "forecast", "location"]
  },
  {
    id: "clock-widget",
    name: "World Clock",
    description: "Multiple timezone clock display",
    kind: WidgetKind.CLOCK,
    config: {
      settings: { 
        timezones: ["UTC", "EST", "PST"],
        format: "24h",
        showSeconds: true
      },
      style: { theme: "premium-light", layout: "grid" },
      data: { zones: ["UTC", "America/New_York", "America/Los_Angeles"] }
    },
    category: "custom",
    isPremium: false,
    tags: ["time", "timezone", "clock"]
  }
];

interface WidgetTemplatesProps {
  onSelectTemplate: (template: WidgetTemplate) => void;
}

export const WidgetTemplates: React.FC<WidgetTemplatesProps> = ({ onSelectTemplate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Templates", icon: LayoutTemplate },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "monitoring", label: "Monitoring", icon: Target },
    { id: "custom", label: "Custom", icon: Settings },
  ];

  const filteredTemplates = selectedCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const getKindIcon = (kind: WidgetKind) => {
    switch (kind) {
      case WidgetKind.CHART: return BarChart3;
      case WidgetKind.TABLE: return Table;
      case WidgetKind.KPI: return Target;
      case WidgetKind.CLOCK: return Clock;
      case WidgetKind.WEATHER: return CloudSun;
      case WidgetKind.CUSTOM: return Settings;
      default: return Settings;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" />
            Widget Templates
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
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

          <TabsContent value={selectedCategory} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => {
                const KindIcon = getKindIcon(template.kind);
                return (
                  <Card key={template.id} className="group hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <KindIcon className="h-5 w-5 text-muted-foreground" />
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </div>
                        {template.isPremium && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {template.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <Button
                          className="w-full gap-2"
                          onClick={() => {
                            onSelectTemplate(template);
                            setIsOpen(false);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No templates found in this category.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Need more templates?</p>
              <p>Create custom templates or import from the marketplace.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
