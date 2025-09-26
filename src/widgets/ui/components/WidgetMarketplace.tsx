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
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  Star, 
  Download, 
  Upload, 
  Search,
  Filter,
  TrendingUp,
  Clock,
  Users,
  Heart,
  Share2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { WidgetKind } from "@/generated/prisma";

interface MarketplaceWidget {
  id: string;
  name: string;
  description: string;
  author: string;
  kind: WidgetKind;
  version: string;
  downloads: number;
  rating: number;
  price: number;
  isFree: boolean;
  isInstalled: boolean;
  isFeatured: boolean;
  tags: string[];
  category: "productivity" | "analytics" | "social" | "entertainment" | "utilities";
  lastUpdated: string;
  preview: string;
}

const marketplaceWidgets: MarketplaceWidget[] = [
  {
    id: "advanced-charts",
    name: "Advanced Charts Pro",
    description: "Professional charting widget with 20+ chart types and advanced analytics",
    author: "ChartMaster",
    kind: WidgetKind.CHART,
    version: "2.1.0",
    downloads: 15420,
    rating: 4.8,
    price: 29.99,
    isFree: false,
    isInstalled: false,
    isFeatured: true,
    tags: ["charts", "analytics", "pro", "data"],
    category: "analytics",
    lastUpdated: "2 days ago",
    preview: "chart-preview.png"
  },
  {
    id: "social-feed",
    name: "Social Media Feed",
    description: "Display social media posts from multiple platforms in one widget",
    author: "SocialWidgets",
    kind: WidgetKind.CUSTOM,
    version: "1.5.2",
    downloads: 8930,
    rating: 4.6,
    price: 0,
    isFree: true,
    isInstalled: true,
    isFeatured: false,
    tags: ["social", "feed", "twitter", "instagram"],
    category: "social",
    lastUpdated: "1 week ago",
    preview: "social-preview.png"
  },
  {
    id: "weather-pro",
    name: "Weather Pro",
    description: "Advanced weather widget with forecasts, alerts, and multiple locations",
    author: "WeatherGuru",
    kind: WidgetKind.WEATHER,
    version: "3.0.1",
    downloads: 22340,
    rating: 4.9,
    price: 9.99,
    isFree: false,
    isInstalled: false,
    isFeatured: true,
    tags: ["weather", "forecast", "alerts", "locations"],
    category: "utilities",
    lastUpdated: "3 days ago",
    preview: "weather-preview.png"
  },
  {
    id: "task-manager",
    name: "Task Manager Plus",
    description: "Complete task management with projects, deadlines, and team collaboration",
    author: "TaskMaster",
    kind: WidgetKind.TABLE,
    version: "1.8.0",
    downloads: 18750,
    rating: 4.7,
    price: 19.99,
    isFree: false,
    isInstalled: false,
    isFeatured: false,
    tags: ["tasks", "productivity", "collaboration", "projects"],
    category: "productivity",
    lastUpdated: "5 days ago",
    preview: "tasks-preview.png"
  },
  {
    id: "crypto-tracker",
    name: "Crypto Tracker",
    description: "Real-time cryptocurrency prices and portfolio tracking",
    author: "CryptoWidgets",
    kind: WidgetKind.KPI,
    version: "2.3.0",
    downloads: 12560,
    rating: 4.5,
    price: 0,
    isFree: true,
    isInstalled: false,
    isFeatured: false,
    tags: ["crypto", "bitcoin", "portfolio", "trading"],
    category: "analytics",
    lastUpdated: "1 day ago",
    preview: "crypto-preview.png"
  }
];

interface WidgetMarketplaceProps {
  onInstallWidget: (widget: MarketplaceWidget) => void;
  onUninstallWidget: (widgetId: string) => void;
}

export const WidgetMarketplace: React.FC<WidgetMarketplaceProps> = ({
  onInstallWidget,
  onUninstallWidget,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating" | "price">("popular");

  const categories = [
    { id: "all", label: "All Categories", icon: Store },
    { id: "productivity", label: "Productivity", icon: TrendingUp },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "social", label: "Social", icon: Users },
    { id: "entertainment", label: "Entertainment", icon: Heart },
    { id: "utilities", label: "Utilities", icon: Clock },
  ];

  const filteredWidgets = marketplaceWidgets
    .filter(widget => {
      const matchesSearch = widget.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           widget.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           widget.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === "all" || widget.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.downloads - a.downloads;
        case "newest":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        case "rating":
          return b.rating - a.rating;
        case "price":
          return a.price - b.price;
        default:
          return 0;
      }
    });

  const getKindIcon = (kind: WidgetKind) => {
    switch (kind) {
      case WidgetKind.CHART: return TrendingUp;
      case WidgetKind.TABLE: return TrendingUp;
      case WidgetKind.KPI: return TrendingUp;
      case WidgetKind.CLOCK: return Clock;
      case WidgetKind.WEATHER: return TrendingUp;
      case WidgetKind.CUSTOM: return TrendingUp;
      default: return TrendingUp;
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? "Free" : `$${price.toFixed(2)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Store className="h-4 w-4" />
          Marketplace
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Widget Marketplace
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search widgets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Sort: {sortBy}
            </Button>
          </div>

          {/* Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
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
                {filteredWidgets.map((widget) => {
                  const KindIcon = getKindIcon(widget.kind);
                  return (
                    <Card key={widget.id} className="group hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <KindIcon className="h-5 w-5 text-muted-foreground" />
                            <CardTitle className="text-base">{widget.name}</CardTitle>
                          </div>
                          <div className="flex items-center gap-1">
                            {widget.isFeatured && (
                              <Badge variant="secondary" className="gap-1">
                                <Star className="h-3 w-3" />
                                Featured
                              </Badge>
                            )}
                            {widget.isInstalled && (
                              <Badge variant="default" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Installed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          {widget.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>by {widget.author}</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {widget.rating}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {widget.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                              {widget.downloads.toLocaleString()} downloads
                            </div>
                            <div className="text-lg font-semibold">
                              {formatPrice(widget.price)}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {widget.isInstalled ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                onClick={() => onUninstallWidget(widget.id)}
                              >
                                <AlertCircle className="h-4 w-4" />
                                Uninstall
                              </Button>
                            ) : (
                              <Button
                                className="flex-1 gap-2"
                                onClick={() => onInstallWidget(widget)}
                              >
                                <Download className="h-4 w-4" />
                                Install
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filteredWidgets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No widgets found matching your criteria.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">Want to publish your own widget?</p>
              <p>Join our developer community and start building.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="h-4 w-4" />
                Publish Widget
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                Developer Docs
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
