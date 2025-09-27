"use client";

import React from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";

interface WeatherWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

export const WeatherWidgetRenderer: React.FC<WeatherWidgetRendererProps> = ({ 
  widget, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  isEditMode = false 
}) => {
  const config = widget.config as any;
  const location = config?.location || "London";
  const temperature = config?.temperature || 22;
  const condition = config?.condition || "Sunny";
  const humidity = config?.humidity || 65;
  const windSpeed = config?.windSpeed || 12;

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return '☀️';
      case 'cloudy':
      case 'overcast':
        return '☁️';
      case 'rainy':
      case 'rain':
        return '🌧️';
      case 'snowy':
      case 'snow':
        return '❄️';
      case 'stormy':
      case 'storm':
        return '⛈️';
      default:
        return '🌤️';
    }
  };

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <div className="text-center">
          <div className="text-4xl mb-2">
            {getWeatherIcon(condition)}
          </div>
          <div className="text-3xl font-bold text-foreground">
            {temperature}°C
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {condition}
          </div>
          <div className="text-xs text-muted-foreground/70 mt-2">
            {location}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div className="text-center">
            <div className="font-medium">Humidity</div>
            <div>{humidity}%</div>
          </div>
          <div className="text-center">
            <div className="font-medium">Wind</div>
            <div>{windSpeed} km/h</div>
          </div>
        </div>
      </div>
    </BaseWidget>
  );
};
