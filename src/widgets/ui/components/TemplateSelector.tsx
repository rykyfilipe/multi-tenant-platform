"use client";

import React, { useState, useEffect } from "react";
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
import { Sparkles, Check, Loader2 } from "lucide-react";
import { 
  WIDGET_TEMPLATES, 
  getTemplatesByCategory, 
  getTemplateCategories,
  type WidgetTemplate 
} from "@/widgets/templates/widget-templates";
import { buildDynamicTemplates } from "@/widgets/templates/dynamic-template-builder";
import { cn } from "@/lib/utils";
import { useApp } from "@/contexts/AppContext";

interface TemplateSelectorProps {
  onSelectTemplate: (template: WidgetTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate }) => {
  const { tenant } = useApp();
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WidgetTemplate['category']>('financial');
  const [dynamicTemplates, setDynamicTemplates] = useState<WidgetTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const categories = getTemplateCategories();
  
  // Load dynamic templates when dialog opens
  useEffect(() => {
    if (open && tenant?.id && dynamicTemplates.length === 0) {
      loadDynamicTemplates();
    }
  }, [open, tenant?.id]);
  
  const loadDynamicTemplates = async () => {
    if (!tenant?.id) return;
    
    try {
      setIsLoadingTemplates(true);
      console.log('🔄 [TemplateSelector] Loading dynamic templates for tenant:', tenant.id);
      const templates = await buildDynamicTemplates(tenant.id);
      setDynamicTemplates(templates);
      console.log('✅ [TemplateSelector] Loaded', templates.length, 'dynamic templates');
    } catch (error) {
      console.error('[TemplateSelector] Failed to load dynamic templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };
  
  // Combine static and dynamic templates
  const allTemplates = [...dynamicTemplates, ...WIDGET_TEMPLATES];
  const templates = allTemplates.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = (template: WidgetTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="h-8 px-3 text-xs bg-primary hover:bg-primary/90"
        >
          <Sparkles className="h-3 w-3 mr-1" />
          Templates
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
            {dynamicTemplates.length > 0 ? dynamicTemplates.length : WIDGET_TEMPLATES.length}
          </Badge>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Widget Templates
            {isLoadingTemplates && <Loader2 className="h-4 w-4 animate-spin" />}
          </DialogTitle>
          <DialogDescription>
            {dynamicTemplates.length > 0 
              ? `${dynamicTemplates.length} templates with REAL data from your system`
              : 'Pre-configured widgets ready to use for your business dashboard'}
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
              {isLoadingTemplates && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading templates with real data...</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.map(template => {
                  const hasRealData = template.config.data?.databaseId !== null && template.config.data?.tableId !== null;
                  
                  return (
                    <Card 
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50",
                        "group",
                        hasRealData && "border-emerald-500/30 bg-emerald-50/10"
                      )}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <span className="text-lg">{template.icon}</span>
                              {template.name}
                              {hasRealData && (
                                <Badge variant="default" className="text-[9px] px-1 py-0 bg-emerald-600">
                                  REAL DATA
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {template.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2 shrink-0">
                            {template.widgetType}
                          </Badge>
                        </div>
                      </CardHeader>
                    <CardContent className="pt-0">
                      {template.requiresData && (
                        <div className="space-y-2">
                          <div className="text-xs text-muted-foreground">
                            <strong>Requires:</strong> {template.requiresData.table} table
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {template.requiresData.columns.map(col => (
                              <Badge key={col} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {col}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        size="sm" 
                        className="w-full mt-3 h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectTemplate(template);
                        }}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
              
              {!isLoadingTemplates && templates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No templates available in this category yet.</p>
                  <p className="text-xs mt-2">Add databases and tables to generate dynamic templates.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

