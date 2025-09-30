"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  BarChart3, 
  Table, 
  Clock, 
  Sun, 
  Target,
  Settings,
  ChevronDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WidgetKind } from "@/generated/prisma";

interface WidgetToolbarProps {
  onAddWidget: (kind: WidgetKind) => void;
  className?: string;
}

const widgetTypes = [
  {
    kind: WidgetKind.CHART,
    label: "Chart",
    description: "Visualize data with charts",
    icon: BarChart3,
    color: "bg-blue-500",
  },
  {
    kind: WidgetKind.TABLE,
    label: "Table",
    description: "Display data in tables",
    icon: Table,
    color: "bg-green-500",
  },
  {
    kind: WidgetKind.KPI,
    label: "KPI",
    description: "Key performance indicators",
    icon: Target,
    color: "bg-purple-500",
  },
  {
    kind: WidgetKind.CLOCK,
    label: "Clock",
    description: "Display current time",
    icon: Clock,
    color: "bg-orange-500",
  },
  {
    kind: WidgetKind.WEATHER,
    label: "Weather",
    description: "Weather information",
    icon: Sun,
    color: "bg-yellow-500",
  },
  {
    kind: WidgetKind.CHART,
    label: "Chart",
    description: "Chart widget",
    icon: Settings,
    color: "bg-gray-500",
  },
];

export const WidgetToolbar: React.FC<WidgetToolbarProps> = ({ 
  onAddWidget, 
  className = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={`p-4 bg-gradient-to-r from-background via-background/95 to-background/90 border-border/50 shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Add Widgets</h3>
              <p className="text-sm text-muted-foreground">
                Drag widgets to canvas or click to add
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {widgetTypes.length} types
          </Badge>
          
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Widget
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {widgetTypes.map((widgetType) => {
                const Icon = widgetType.icon;
                return (
                  <DropdownMenuItem
                    key={widgetType.kind}
                    onClick={() => {
                      onAddWidget(widgetType.kind);
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-3 p-3 cursor-pointer"
                  >
                    <div className={`p-2 rounded-lg ${widgetType.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{widgetType.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {widgetType.description}
                      </div>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Widget Grid for Drag & Drop */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {widgetTypes.map((widgetType) => {
          const Icon = widgetType.icon;
          return (
            <Card
              key={widgetType.kind}
              className="p-3 cursor-pointer hover:shadow-md transition-all duration-200 border-border/30 hover:border-primary/50 group"
              onClick={() => onAddWidget(widgetType.kind)}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`p-3 rounded-lg ${widgetType.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium text-foreground">
                    {widgetType.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {widgetType.description}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
};
