"use client";

import React from "react";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { useWeather } from "@/hooks/useWeather";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const location = config?.settings?.location || "London";
  const units = config?.settings?.units || "metric";
  const showForecast = config?.settings?.showForecast !== false;
  const forecastDays = config?.settings?.forecastDays || 5;

  const { data: weatherData, loading, error } = useWeather(location);

  const getWeatherIcon = (condition: string, size: 'sm' | 'lg' = 'lg') => {
    const iconSize = size === 'lg' ? 'text-4xl' : 'text-2xl';
    switch (condition.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <span className={iconSize}>☀️</span>;
      case 'partly cloudy':
      case 'partly-cloudy':
        return <span className={iconSize}>⛅</span>;
      case 'cloudy':
      case 'overcast':
        return <span className={iconSize}>☁️</span>;
      case 'rainy':
      case 'rain':
        return <span className={iconSize}>🌧️</span>;
      case 'snowy':
      case 'snow':
        return <span className={iconSize}>❄️</span>;
      case 'stormy':
      case 'storm':
      case 'thunderstorm':
        return <span className={iconSize}>⛈️</span>;
      case 'foggy':
      case 'fog':
        return <span className={iconSize}>🌫️</span>;
      default:
        return <span className={iconSize}>🌤️</span>;
    }
  };

  const formatTemperature = (temp: number) => {
    return units === 'metric' ? `${Math.round(temp)}°C` : `${Math.round(temp * 9/5 + 32)}°F`;
  };

  if (loading) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <div className="flex h-full flex-col items-center justify-center space-y-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 text-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </BaseWidget>
    );
  }

  if (error) {
    return (
      <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
        <Alert className="m-4">
          <AlertDescription>
            Unable to load weather data: {error}
          </AlertDescription>
        </Alert>
      </BaseWidget>
    );
  }

  const currentWeather = weatherData || {
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    location: location,
    icon: 'partly-cloudy',
    forecast: [
      { date: 'Tomorrow', temperature: 24, condition: 'Sunny', icon: 'sunny' },
      { date: 'Day After', temperature: 26, condition: 'Cloudy', icon: 'cloudy' },
      { date: 'Day 3', temperature: 23, condition: 'Rainy', icon: 'rainy' },
      { date: 'Day 4', temperature: 25, condition: 'Partly Cloudy', icon: 'partly-cloudy' },
      { date: 'Day 5', temperature: 27, condition: 'Sunny', icon: 'sunny' }
    ]
  };

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <div className="flex h-full flex-col items-center justify-center space-y-6">
        {/* Current Weather */}
        <div className="text-center">
          <div className="mb-4">
            {getWeatherIcon(currentWeather.condition)}
          </div>

          <div className="mb-2">
            <div className="text-4xl font-bold text-foreground">
              {formatTemperature(currentWeather.temperature)}
            </div>
            <div className="text-sm text-muted-foreground capitalize">
              {currentWeather.condition}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {currentWeather.location}
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Humidity</div>
            <div className="text-sm font-medium">{currentWeather.humidity}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Wind</div>
            <div className="text-sm font-medium">
              {units === 'metric' ? `${currentWeather.windSpeed} km/h` : `${Math.round(currentWeather.windSpeed * 0.621)} mph`}
            </div>
          </div>
        </div>

        {/* Forecast (if enabled) */}
        {showForecast && currentWeather.forecast && (
          <div className="w-full">
            <h4 className="text-sm font-medium mb-3 text-center">Forecast</h4>
            <div className="space-y-2">
              {currentWeather.forecast.slice(0, forecastDays).map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{day.date}</span>
                  <div className="flex items-center gap-2">
                    {getWeatherIcon(day.condition, 'sm')}
                    <span className="font-medium">{formatTemperature(day.temperature)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};
