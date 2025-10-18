"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layout, Check, AlertTriangle, CheckCircle2, Grid3x3, Grid2x2, LayoutGrid, LayoutDashboard, Monitor } from "lucide-react";
import { 
  DASHBOARD_LAYOUT_TEMPLATES,
  getLayoutTemplatesByCategory,
  getLayoutCategories,
  type DashboardLayoutTemplate 
} from "@/widgets/templates/layout-templates";
import { isTemplateSuitableForWidgets } from "@/widgets/utils/applyLayoutTemplate";
import { cn } from "@/lib/utils";

interface LayoutTemplateSelectorProps {
  onSelectLayout: (template: DashboardLayoutTemplate) => void;
  currentWidgetCount: number;
}

export const LayoutTemplateSelector: React.FC<LayoutTemplateSelectorProps> = ({ 
  onSelectLayout,
  currentWidgetCount 
}) => {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DashboardLayoutTemplate['category']>('metrics');
  const categories = getLayoutCategories();
  
  const templates = getLayoutTemplatesByCategory(selectedCategory);

  const handleSelectLayout = (template: DashboardLayoutTemplate) => {
    onSelectLayout(template);
    setOpen(false);
  };

  // Get icon component for template based on layout structure
  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'metrics-top-charts-below':
        return LayoutDashboard; // Metrics on top
      case 'executive-view':
        return Monitor; // Executive dashboard
      case 'analytics-grid':
        return Grid2x2; // 2x2 grid
      case 'operational-dashboard':
        return LayoutGrid; // Complex layout
      case 'single-focus':
        return Layout; // Simple focus layout
      default:
        return Layout;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-xs hover:bg-primary/10"
        >
          <Layout className="h-3 w-3 mr-1" />
          Apply Layout
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
            {DASHBOARD_LAYOUT_TEMPLATES.length}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Dashboard Layout Templates
          </DialogTitle>
          <DialogDescription>
            {currentWidgetCount > 0 
              ? `Rearrange your ${currentWidgetCount} widget${currentWidgetCount !== 1 ? 's' : ''} using a pre-defined layout for all screen sizes`
              : 'Choose a layout to organize your widgets across all breakpoints'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {categories.map(cat => (
              <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                <span className="mr-1">{cat.icon}</span>
                {cat.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="space-y-3 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(template => {
                  const suitability = isTemplateSuitableForWidgets(template, currentWidgetCount);
                  const isPerfectFit = suitability.reason === 'Perfect fit!';
                  const isGoodFit = suitability.reason === 'Good fit';
                  const IconComponent = getTemplateIcon(template.id);
                  
                  return (
                    <Card 
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
                        "group relative",
                        !suitability.suitable && "opacity-50 hover:opacity-75",
                        isPerfectFit && "border-emerald-500/50 bg-emerald-50/10 dark:bg-emerald-950/20",
                        isGoodFit && "border-blue-500/30 bg-blue-50/10 dark:bg-blue-950/20"
                      )}
                      onClick={() => suitability.suitable && handleSelectLayout(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <IconComponent className="h-4 w-4 text-primary" />
                              <span className="text-base">{template.icon}</span>
                              {template.name}
                              {isPerfectFit && (
                                <Badge variant="default" className="text-[9px] px-1 py-0 bg-emerald-600">
                                  <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                  PERFECT
                                </Badge>
                              )}
                              {isGoodFit && (
                                <Badge variant="default" className="text-[9px] px-1 py-0 bg-blue-600">
                                  <Check className="h-2.5 w-2.5 mr-0.5" />
                                  GOOD FIT
                                </Badge>
                              )}
                              {!suitability.suitable && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                  NOT SUITABLE
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0 space-y-3">
                        {/* Layout Info */}
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="text-[10px]">
                            {template.slots.length} slots
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            Recommended: {template.recommendedWidgetCount}
                          </Badge>
                          {template.minWidgets && (
                            <Badge variant="outline" className="text-[10px]">
                              Min: {template.minWidgets}
                            </Badge>
                          )}
                          {template.maxWidgets && (
                            <Badge variant="outline" className="text-[10px]">
                              Max: {template.maxWidgets}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Visual Preview - Simple Grid Representation */}
                        <div className="relative w-full h-24 bg-muted/30 rounded-md overflow-hidden border border-border/50">
                          <div className="absolute inset-0 p-1">
                            {/* Show first 6 slots as visual preview */}
                            {template.slots.slice(0, 6).map((slot, idx) => {
                              const pos = slot.positions.xxl;
                              return (
                                <div
                                  key={slot.id}
                                  className="absolute bg-primary/20 border border-primary/40 rounded-sm"
                                  style={{
                                    left: `${(pos.x / 24) * 100}%`,
                                    top: `${(pos.y / 20) * 100}%`,
                                    width: `${(pos.w / 24) * 100}%`,
                                    height: `${(pos.h / 20) * 100}%`,
                                  }}
                                  title={`Slot ${idx + 1}: ${pos.w}x${pos.h}`}
                                />
                              );
                            })}
                          </div>
                          <div className="absolute bottom-1 right-1 text-[8px] text-muted-foreground bg-background/80 px-1 rounded">
                            Desktop Preview
                          </div>
                        </div>
                        
                        {/* Suitability Message */}
                        {suitability.reason && (
                          <div className={cn(
                            "text-xs px-2 py-1 rounded",
                            isPerfectFit && "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
                            isGoodFit && "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
                            !suitability.suitable && "bg-destructive/10 text-destructive"
                          )}>
                            {suitability.reason}
                          </div>
                        )}
                        
                        {/* Apply Button */}
                        <Button 
                          size="sm" 
                          className="w-full h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (suitability.suitable) {
                              handleSelectLayout(template);
                            }
                          }}
                          disabled={!suitability.suitable}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Apply Layout
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {templates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No layout templates in this category yet.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
        
        {/* Warning for no widgets */}
        {currentWidgetCount === 0 && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <strong>No widgets on dashboard.</strong> Add some widgets first, then apply a layout to organize them.
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

