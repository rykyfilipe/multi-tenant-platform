import React from "react";
import { THEME_PRESETS, ThemePreset, getThemesByCategory } from "@/widgets/themes";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun, Sparkles } from "lucide-react";

interface ThemeSelectorProps {
  currentTheme?: string;
  onThemeSelect?: (themeName: string) => void; // Optional, deprecated - use onApplyTheme instead
  onApplyTheme: (theme: ThemePreset) => void;
  widgetType: 'chart' | 'table' | 'kpi' | 'clock' | 'weather' | 'tasks';
}

const categoryIcons = {
  dark: Moon,
  minimal: Sun,
  modern: Sparkles,
  classic: Monitor,
};

const categoryColors = {
  dark: "bg-slate-800 text-slate-200 border-slate-700",
  minimal: "bg-white text-slate-800 border-slate-200",
  modern: "bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-400",
  classic: "bg-slate-100 text-slate-700 border-slate-300",
};

export function ThemeSelector({ currentTheme, onThemeSelect, onApplyTheme, widgetType }: ThemeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<ThemePreset['category']>('modern');

  const categories = Array.from(new Set(THEME_PRESETS.map(t => t.category))) as ThemePreset['category'][];
  const filteredThemes = getThemesByCategory(selectedCategory);

  const handleThemeSelect = (themeName: string) => {
    const theme = THEME_PRESETS.find(t => t.name === themeName);
    if (theme) {
      // Apply theme immediately when selected
      onApplyTheme(theme);
    }
  };

  const renderThemePreview = (theme: ThemePreset) => {
    const widgetStyle = theme[widgetType];
    
    return (
      <div 
        className="w-full h-24 rounded-lg border-2 transition-all duration-200 hover:scale-105"
        style={{
          backgroundColor: widgetStyle.backgroundColor,
          borderColor: widgetStyle.borderColor,
          borderRadius: `${widgetStyle.borderRadius}px`,
          padding: `${widgetStyle.padding.y}px ${widgetStyle.padding.x}px`,
          boxShadow: widgetStyle.shadow.enabled ? 
            `0 4px 6px -1px ${widgetStyle.shadow.color}` : 'none',
        }}
      >
        <div className="flex flex-col justify-center h-full">
          {widgetType === 'chart' && (
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-1 rounded-full" 
                style={{ backgroundColor: theme.chart.line.color }}
              />
              <span 
                className="text-xs font-medium"
                style={{ color: widgetStyle.textColor }}
              >
                Chart Line
              </span>
            </div>
          )}
          
          {widgetType === 'table' && (
            <div className="space-y-1">
              <div 
                className="h-2 rounded"
                style={{ backgroundColor: theme.table.header.backgroundColor }}
              />
              <div className="flex gap-1">
                <div 
                  className="h-1 flex-1 rounded"
                  style={{ backgroundColor: widgetStyle.textColor, opacity: 0.6 }}
                />
                <div 
                  className="h-1 flex-1 rounded"
                  style={{ backgroundColor: widgetStyle.textColor, opacity: 0.3 }}
                />
              </div>
            </div>
          )}
          
          {widgetType === 'kpi' && (
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{ color: theme.kpi.value.color }}
              >
                1,234
              </div>
              <div 
                className="text-xs"
                style={{ color: theme.kpi.label.color }}
              >
                METRIC
              </div>
            </div>
          )}
          
          {widgetType === 'clock' && (
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{ color: theme.clock.time.color }}
              >
                14:30
              </div>
              <div 
                className="text-xs"
                style={{ color: theme.clock.date.color }}
              >
                Oct 11, 2025
              </div>
            </div>
          )}
          
          {widgetType === 'weather' && (
            <div className="text-center">
              <div 
                className="text-lg font-bold"
                style={{ color: theme.weather.temperature.color }}
              >
                22°C
              </div>
              <div 
                className="text-xs"
                style={{ color: theme.weather.location.color }}
              >
                Bucharest
              </div>
            </div>
          )}
          
          {widgetType === 'tasks' && (
            <div className="space-y-1">
              <div 
                className="h-2 rounded flex items-center gap-1"
                style={{ backgroundColor: theme.tasks.taskCard.backgroundColor }}
              >
                <div 
                  className="w-2 h-2 rounded-full ml-1"
                  style={{ backgroundColor: theme.tasks.priority.medium }}
                />
                <div 
                  className="h-1 flex-1 rounded mr-1"
                  style={{ backgroundColor: widgetStyle.textColor, opacity: 0.7 }}
                />
              </div>
              <div 
                className="h-2 rounded flex items-center gap-1"
                style={{ backgroundColor: theme.tasks.taskCard.backgroundColor }}
              >
                <div 
                  className="w-2 h-2 rounded-full ml-1"
                  style={{ backgroundColor: theme.tasks.priority.low }}
                />
                <div 
                  className="h-1 flex-1 rounded mr-1"
                  style={{ backgroundColor: widgetStyle.textColor, opacity: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => {
          const Icon = categoryIcons[category];
          return (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="flex items-center gap-2"
            >
              <Icon className="h-3 w-3" />
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          );
        })}
      </div>

      {/* Theme Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredThemes.map((theme) => {
          const isSelected = currentTheme === theme.name;
          const Icon = categoryIcons[theme.category];
          
          return (
            <Card 
              key={theme.name} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleThemeSelect(theme.name)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <CardTitle className="text-sm">{theme.name}</CardTitle>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={categoryColors[theme.category]}
                  >
                    {theme.category}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {theme.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {renderThemePreview(theme)}
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}
