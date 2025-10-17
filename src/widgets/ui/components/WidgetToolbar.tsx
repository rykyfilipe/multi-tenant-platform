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
  { type: WidgetType.CHART, label: "Chart", description: "Visualize data with charts", icon: BarChart3, color: "bg-blue-500" },
  { type: WidgetType.TABLE, label: "Table", description: "Display data in tables", icon: Table, color: "bg-green-500" },
  { type: WidgetType.KPI, label: "KPI", description: "Key performance indicators", icon: Target, color: "bg-purple-500" },
  { type: WidgetType.CLOCK, label: "Clock", description: "Display current time", icon: Clock, color: "bg-orange-500" },
  { type: WidgetType.WEATHER, label: "Weather", description: "Weather information", icon: Sun, color: "bg-yellow-500" },
  { type: WidgetType.CHART, label: "Chart", description: "Chart widget", icon: Settings, color: "bg-gray-500" },
];

export const WidgetToolbar: React.FC<WidgetToolbarProps> = ({ onAddWidget, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={`p-2 sm:p-3 bg-background border border-border/50 shadow-md ${className}`}>
      {/* Mobile Toolbar */}
      <div className="flex md:hidden justify-between items-center">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 gap-2">
              <Plus className="h-4 w-4" />
              <span className="text-xs">Add Widget</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-full max-w-xs">
            {widgetTypes.slice(0, 5).map((widget) => {
              const Icon = widget.icon;
              return (
                <DropdownMenuItem
                  key={widget.type}
                  onClick={() => { onAddWidget(widget.type); setIsOpen(false); }}
                  className="flex items-center space-x-3 p-2"
                >
                  <div className={`p-2 rounded-lg ${widget.color} text-white`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{widget.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{widget.description}</div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Toolbar */}
      <div className="hidden md:flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg shadow-sm">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">Add Widgets</h3>
              <p className="text-xs text-muted-foreground hidden lg:block">Click to add</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs hidden lg:inline-flex">{widgetTypes.slice(0, 5).length} types</Badge>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden lg:inline text-xs">Add Widget</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {widgetTypes.slice(0, 5).map((widget) => {
                  const Icon = widget.icon;
                  return (
                    <DropdownMenuItem
                      key={widget.type}
                      onClick={() => { onAddWidget(widget.type); setIsOpen(false); }}
                      className="flex items-center space-x-3 p-3 cursor-pointer"
                    >
                      <div className={`p-2 rounded-lg ${widget.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{widget.label}</div>
                        <div className="text-xs text-muted-foreground">{widget.description}</div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {widgetTypes.slice(0, 5).map((widget) => {
            const Icon = widget.icon;
            return (
              <Card
                key={widget.type}
                className="p-2 cursor-pointer hover:shadow-lg transition-all duration-200 border border-border/30 hover:border-primary/50 group"
                onClick={() => onAddWidget(widget.type)}
              >
                <div className="flex flex-col items-center space-y-1">
                  <div className={`p-2 rounded-lg ${widget.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-center text-xs font-medium text-foreground">{widget.label}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
