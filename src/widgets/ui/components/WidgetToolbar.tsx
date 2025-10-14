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
import { WidgetType } from "@/generated/prisma";

interface WidgetToolbarProps {
  onAddWidget: (type: WidgetType) => void;
  className?: string;
}

const widgetTypes = [
  {
    type: WidgetType.CHART,
    label: "Chart",
    description: "Visualize data with charts",
    icon: BarChart3,
    color: "bg-blue-500",
  },
  {
    type: WidgetType.TABLE,
    label: "Table",
    description: "Display data in tables",
    icon: Table,
    color: "bg-green-500",
  },
  {
    type: WidgetType.KPI,
    label: "KPI",
    description: "Key performance indicators",
    icon: Target,
    color: "bg-purple-500",
  },
  {
    type: WidgetType.CLOCK,
    label: "Clock",
    description: "Display current time",
    icon: Clock,
    color: "bg-orange-500",
  },
  {
    type: WidgetType.WEATHER,
    label: "Weather",
    description: "Weather information",
    icon: Sun,
    color: "bg-yellow-500",
  },
  {
    type: WidgetType.CHART,
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
    <Card className={`p-2 sm:p-3 lg:p-4 bg-gradient-to-r from-background via-background/95 to-background/90 border-border/50 shadow-lg ${className}`}>
      {/* Mobile: Compact toolbar with dropdown only */}
      <div className="md:hidden">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-xs">Add Widget</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-[280px]">
            {widgetTypes.slice(0, 5).map((widgetType) => {
              const Icon = widgetType.icon;
              return (
                <DropdownMenuItem
                  key={widgetType.type}
                  onClick={() => {
                    onAddWidget(widgetType.type);
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-3 p-3 cursor-pointer"
                >
                  <div className={`p-2 rounded-lg ${widgetType.color} text-white flex-shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{widgetType.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {widgetType.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop: Full toolbar */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 lg:p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm">
                <Plus className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm lg:text-base font-semibold text-foreground">Add Widgets</h3>
                <p className="text-xs text-muted-foreground hidden lg:block">
                  Click to add
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs hidden lg:inline-flex">
              {widgetTypes.slice(0, 5).length} types
            </Badge>
            
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline text-xs lg:text-sm">Add Widget</span>
                  <ChevronDown className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {widgetTypes.slice(0, 5).map((widgetType) => {
                  const Icon = widgetType.icon;
                  return (
                    <DropdownMenuItem
                      key={widgetType.type}
                      onClick={() => {
                        onAddWidget(widgetType.type);
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
        
        {/* Widget Grid for Desktop - Quick Access */}
        <div className="mt-3 lg:mt-4 hidden xl:grid grid-cols-5 gap-2 lg:gap-3">
          {widgetTypes.slice(0, 5).map((widgetType) => {
            const Icon = widgetType.icon;
            return (
              <Card
                key={widgetType.type}
                className="p-2 lg:p-3 cursor-pointer hover:shadow-md transition-all duration-200 border-border/30 hover:border-primary/50 group"
                onClick={() => onAddWidget(widgetType.type)}
              >
                <div className="flex flex-col items-center space-y-1.5 lg:space-y-2">
                  <div className={`p-2 lg:p-3 rounded-lg ${widgetType.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-foreground">
                      {widgetType.label}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
