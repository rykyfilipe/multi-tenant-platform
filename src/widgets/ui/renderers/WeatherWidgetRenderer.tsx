"use client";

import React from "react";
import { motion } from "framer-motion";
import { WidgetEntity } from "@/widgets/domain/entities";
import { BaseWidget } from "../components/BaseWidget";
import { useWeather } from "@/hooks/useWeather";
import { WidgetLoadingState, WidgetErrorState } from "../components/WidgetStates";
import { PremiumWidgetContainer } from "../components/PremiumWidgetContainer";
import { getPremiumTheme } from "@/widgets/styles/premiumThemes";
import { cn } from "@/lib/utils";

interface WeatherWidgetRendererProps {
  widget: WidgetEntity;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditMode?: boolean;
}

const WeatherWidgetRendererComponent: React.FC<WeatherWidgetRendererProps> = ({
  widget,
  onEdit,
  onDelete,
  onDuplicate,
  isEditMode = false
}) => {
  const config = widget.config as any;
  const settings = config?.settings || {};
  const styleConfig = config?.style || {};
  const location = settings.location || "London";
  const units = settings.units || "metric";
  const showForecast = settings.showForecast !== false;
  const forecastDays = settings.forecastDays || 5;

  // Extract ADVANCED styling from schema
  const backgroundColor = styleConfig.backgroundColor || "#FFFFFF";
  const bgGradient = styleConfig.backgroundGradient || { enabled: false, from: "#FFFFFF", to: "#E0F2FE", direction: "to-b" };
  const borderRadius = styleConfig.borderRadius ?? 16;
  const border = styleConfig.border || { enabled: true, width: 1, color: "rgba(0, 0, 0, 0.1)", style: "solid" };
  const shadow = styleConfig.shadow || { enabled: true, size: "md" };
  const padding = styleConfig.padding || { x: 24, y: 20 };
  const layout = styleConfig.layout || "detailed";
  
  // Temperature styling
  const tempStyle = styleConfig.temperature || {};
  const tempFontSize = tempStyle.fontSize ?? 56;
  const tempFontFamily = tempStyle.fontFamily || "Inter, system-ui, sans-serif";
  const tempFontWeight = tempStyle.fontWeight || "700";
  const tempColor = tempStyle.color || "#111827";
  const tempGradient = tempStyle.gradient || { enabled: false, from: "#F59E0B", to: "#EF4444" };
  const tempShowUnit = tempStyle.showUnit ?? true;
  const tempUnitSize = tempStyle.unitSize ?? 24;
  
  // Location styling
  const locationStyle = styleConfig.location || {};
  const locationFontSize = locationStyle.fontSize ?? 18;
  const locationFontFamily = locationStyle.fontFamily || "Inter, system-ui, sans-serif";
  const locationFontWeight = locationStyle.fontWeight || "600";
  const locationColor = locationStyle.color || "#374151";
  
  // Condition styling
  const conditionStyle = styleConfig.condition || {};
  const conditionFontSize = conditionStyle.fontSize ?? 14;
  const conditionFontFamily = conditionStyle.fontFamily || "Inter, system-ui, sans-serif";
  const conditionFontWeight = conditionStyle.fontWeight || "500";
  const conditionColor = conditionStyle.color || "#6B7280";
  const conditionTextTransform = conditionStyle.textTransform || "capitalize";
  
  // Icon styling
  const iconStyle = styleConfig.icon || {};
  const iconSize = iconStyle.size ?? 80;
  const iconColor = iconStyle.color || "#3B82F6";
  const iconStyleType = iconStyle.style || "filled";
  
  // Details styling
  const detailsStyle = styleConfig.details || {};
  const detailsFontSize = detailsStyle.fontSize ?? 13;
  const detailsColor = detailsStyle.color || "#6B7280";
  const detailsIconSize = detailsStyle.iconSize ?? 16;
  const detailsIconColor = detailsStyle.iconColor || "#9CA3AF";
  
  // Forecast styling
  const forecastStyle = styleConfig.forecast || {};
  const forecastCardBg = forecastStyle.cardBackground || "#F9FAFB";
  const forecastCardRadius = forecastStyle.cardBorderRadius ?? 8;
  const forecastCardPadding = forecastStyle.cardPadding ?? 12;
  const forecastFontSize = forecastStyle.fontSize ?? 12;
  const forecastDayColor = forecastStyle.dayColor || "#374151";
  const forecastTempColor = forecastStyle.tempColor || "#111827";
  const forecastIconSize = forecastStyle.iconSize ?? 32;
  
  // Animation
  const animationConfig = styleConfig.animation || { enabled: true, duration: 500 };
  
  const getShadowClass = (size: string) => {
    const shadowMap: Record<string, string> = {
      sm: "shadow-sm",
      md: "shadow-md",
      lg: "shadow-lg",
      xl: "shadow-xl"
    };
    return shadowMap[size] || "shadow-md";
  };

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
    return <WidgetLoadingState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      variant="default"
    />;
  }

  if (error) {
    return <WidgetErrorState 
      widget={widget} 
      onEdit={onEdit} 
      onDelete={onDelete} 
      onDuplicate={onDuplicate} 
      isEditMode={isEditMode}
      error={error}
      title="Error loading weather data"
    />;
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

  // Container styles
  const containerStyle: React.CSSProperties = {
    background: bgGradient?.enabled 
      ? `linear-gradient(${bgGradient.direction}, ${bgGradient.from}, ${bgGradient.to})` 
      : backgroundColor,
    borderRadius: `${borderRadius}px`,
    border: border?.enabled ? `${border.width}px ${border.style} ${border.color}` : 'none',
    padding: `${padding?.y || 20}px ${padding?.x || 24}px`,
  };

  // Temperature style
  const tempTextStyle: React.CSSProperties = {
    fontSize: `${tempFontSize}px`,
    fontFamily: tempFontFamily,
    fontWeight: tempFontWeight,
    color: tempGradient?.enabled ? 'transparent' : tempColor,
    background: tempGradient?.enabled 
      ? `linear-gradient(to right, ${tempGradient.from}, ${tempGradient.to})`
      : undefined,
    backgroundClip: tempGradient?.enabled ? 'text' : undefined,
    WebkitBackgroundClip: tempGradient?.enabled ? 'text' : undefined,
  };

  return (
    <BaseWidget title={widget.title} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} isEditMode={isEditMode}>
      <motion.div
        initial={animationConfig.enabled ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: animationConfig.duration / 1000 }}
        className="h-full"
      >
        <div 
          className={cn(
            "flex h-full flex-col items-center justify-center",
            shadow?.enabled && getShadowClass(shadow?.size || "md")
          )}
          style={containerStyle}
        >
          <div className="space-y-6">
            {/* Current Weather */}
            <div className="text-center">
              <div className="mb-4" style={{ fontSize: `${iconSize}px` }}>
                {getWeatherIcon(currentWeather.condition)}
              </div>

              <div className="mb-2">
                <div style={tempTextStyle}>
                  {Math.round(currentWeather.temperature)}{tempShowUnit && (units === 'metric' ? '°C' : '°F')}
                </div>
                <div 
                  style={{
                    fontSize: `${conditionFontSize}px`,
                    fontFamily: conditionFontFamily,
                    fontWeight: conditionFontWeight,
                    color: conditionColor,
                    textTransform: conditionTextTransform as any,
                    marginTop: '8px',
                  }}
                >
                  {currentWeather.condition}
                </div>
              </div>

              <div 
                style={{
                  fontSize: `${locationFontSize}px`,
                  fontFamily: locationFontFamily,
                  fontWeight: locationFontWeight,
                  color: locationColor,
                }}
              >
                {currentWeather.location}
              </div>
            </div>

            {/* Weather Details */}
            {settings.showHumidity || settings.showWindSpeed ? (
              <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                {settings.showHumidity && (
                  <div className="text-center">
                    <div 
                      style={{
                        fontSize: `${detailsFontSize}px`,
                        color: detailsStyle.labelColor || "#9CA3AF",
                      }}
                    >
                      Humidity
                    </div>
                    <div 
                      style={{
                        fontSize: `${detailsFontSize}px`,
                        fontWeight: "500",
                        color: detailsColor,
                      }}
                    >
                      {currentWeather.humidity}%
                    </div>
                  </div>
                )}
                {settings.showWindSpeed && (
                  <div className="text-center">
                    <div 
                      style={{
                        fontSize: `${detailsFontSize}px`,
                        color: detailsStyle.labelColor || "#9CA3AF",
                      }}
                    >
                      Wind
                    </div>
                    <div 
                      style={{
                        fontSize: `${detailsFontSize}px`,
                        fontWeight: "500",
                        color: detailsColor,
                      }}
                    >
                      {units === 'metric' ? `${currentWeather.windSpeed} km/h` : `${Math.round(currentWeather.windSpeed * 0.621)} mph`}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Forecast (if enabled) */}
            {showForecast && currentWeather.forecast && (
              <div className="w-full">
                <h4 
                  className="font-medium mb-3 text-center"
                  style={{
                    fontSize: `${detailsFontSize + 2}px`,
                    color: locationColor,
                  }}
                >
                  Forecast
                </h4>
                <div 
                  className="space-y-2"
                  style={{ gap: `${forecastStyle.spacing ?? 8}px` }}
                >
                  {currentWeather.forecast.slice(0, forecastDays).map((day: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between rounded-lg"
                      style={{
                        backgroundColor: forecastCardBg,
                        borderRadius: `${forecastCardRadius}px`,
                        padding: `${forecastCardPadding}px`,
                      }}
                    >
                      <span 
                        style={{
                          fontSize: `${forecastFontSize}px`,
                          color: forecastDayColor,
                          fontWeight: "500",
                        }}
                      >
                        {day.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: `${forecastIconSize}px` }}>
                          {getWeatherIcon(day.condition, 'sm')}
                        </span>
                        <span 
                          style={{
                            fontSize: `${forecastFontSize}px`,
                            fontWeight: "600",
                            color: forecastTempColor,
                          }}
                        >
                          {formatTemperature(day.temperature)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </BaseWidget>
  );
};

// OPTIMISTIC RENDERING: Only re-render when location/units change, NOT style
export const WeatherWidgetRenderer = React.memo(
  WeatherWidgetRendererComponent,
  (prevProps, nextProps) => {
    const prevConfig = prevProps.widget.config as any;
    const nextConfig = nextProps.widget.config as any;
    
    if (prevProps.widget.id !== nextProps.widget.id) {
      console.log('🔄 [WeatherWidget] Re-render: widget ID changed');
      return false;
    }
    
    // Settings changed (location, units) - refetch weather
    if (JSON.stringify(prevConfig?.settings) !== JSON.stringify(nextConfig?.settings)) {
      console.log('🔄 [WeatherWidget] Re-render: settings changed (location/units)');
      return false;
    }
    
    if (prevProps.isEditMode !== nextProps.isEditMode) {
      console.log('🔄 [WeatherWidget] Re-render: edit mode changed');
      return false;
    }
    
    // Style-only change? Optimistic
    if (JSON.stringify(prevConfig?.style) !== JSON.stringify(nextConfig?.style)) {
      console.log('✨ [WeatherWidget] Style-only change - optimistic');
      return false;
    }
    
    console.log('⚡ [WeatherWidget] Props equal - SKIP re-render');
    return true;
  }
);
