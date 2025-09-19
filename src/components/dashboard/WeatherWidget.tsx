'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Eye, Thermometer, MapPin, RefreshCw } from 'lucide-react';
import BaseWidget from './BaseWidget';

export interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  pressure: number;
  feelsLike: number;
  icon: string;
  city: string;
  country: string;
  lastUpdated: string;
}

export interface WeatherConfig {
  title?: string;
  city?: string;
  country?: string;
  units?: 'metric' | 'imperial';
  showDetails?: boolean;
  showForecast?: boolean;
  refreshInterval?: number; // in minutes
  style?: {
    showIcon?: boolean;
    compactMode?: boolean;
  };
}

interface WeatherWidgetProps {
  widget: {
    id: number | string;
    title?: string | null;
    type: string;
    config?: WeatherConfig;
  };
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function WeatherWidget({ widget, isEditMode, onEdit, onDelete }: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const config = (widget.config || {}) as WeatherConfig;
  const {
    city = 'London',
    country = 'UK',
    units = 'metric',
    showDetails = true,
    refreshInterval = 30,
    style = {}
  } = config;

  // Weather icon mapping
  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: any } = {
      '01d': Sun, '01n': Sun,
      '02d': Cloud, '02n': Cloud,
      '03d': Cloud, '03n': Cloud,
      '04d': Cloud, '04n': Cloud,
      '09d': CloudRain, '09n': CloudRain,
      '10d': CloudRain, '10n': CloudRain,
      '11d': CloudRain, '11n': CloudRain,
      '13d': CloudSnow, '13n': CloudSnow,
      '50d': Cloud, '50n': Cloud,
    };
    return iconMap[iconCode] || Cloud;
  };

  const fetchWeatherData = async () => {
    if (!city) {
      setError('Please configure a city in the widget settings');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Using OpenWeatherMap API (you'll need to add your API key)
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo';
      
      if (API_KEY === 'demo') {
        // Demo data for development
        const demoData: WeatherData = {
          temperature: 22,
          description: 'Partly Cloudy',
          humidity: 65,
          windSpeed: 12,
          visibility: 10,
          pressure: 1013,
          feelsLike: 24,
          icon: '02d',
          city,
          country,
          lastUpdated: new Date().toISOString()
        };
        setWeatherData(demoData);
        setLastFetch(new Date());
        return;
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${API_KEY}&units=${units}`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      
      const weatherInfo: WeatherData = {
        temperature: Math.round(data.main.temp),
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        visibility: data.visibility / 1000, // Convert to km
        pressure: data.main.pressure,
        feelsLike: Math.round(data.main.feels_like),
        icon: data.weather[0].icon,
        city: data.name,
        country: data.sys.country,
        lastUpdated: new Date().toISOString()
      };

      setWeatherData(weatherInfo);
      setLastFetch(new Date());
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchWeatherData();
    
    const interval = setInterval(() => {
      fetchWeatherData();
    }, refreshInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [city, country, units, refreshInterval]);

  const handleRefresh = () => {
    fetchWeatherData();
  };

  const getTemperatureUnit = () => units === 'metric' ? '°C' : '°F';
  const getSpeedUnit = () => units === 'metric' ? 'm/s' : 'mph';
  const getDistanceUnit = () => units === 'metric' ? 'km' : 'miles';

  if (error) {
    return (
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={false}
        error={error}
        onRefresh={handleRefresh}
        showRefresh={true}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center p-4">
            <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{error}</p>
            {isEditMode && (
              <p className="text-xs mt-1">Click edit to configure city</p>
            )}
          </div>
        </div>
      </BaseWidget>
    );
  }

  if (!weatherData) {
    return (
      <BaseWidget
        widget={widget}
        isEditMode={isEditMode}
        onEdit={onEdit}
        onDelete={onDelete}
        isLoading={isLoading}
        error={null}
        onRefresh={handleRefresh}
        showRefresh={true}
      >
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </BaseWidget>
    );
  }

  const WeatherIcon = getWeatherIcon(weatherData.icon);

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onEdit={onEdit}
      onDelete={onDelete}
      isLoading={isLoading}
      error={null}
      onRefresh={handleRefresh}
      showRefresh={true}
    >
      <div className="h-full flex flex-col p-2 sm:p-3">
        {/* Location */}
        <div className="flex items-center space-x-1 text-xs sm:text-sm text-muted-foreground mb-2 flex-shrink-0">
          <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>{weatherData.city}, {weatherData.country}</span>
        </div>

        {/* Main Weather Display */}
        <div className="flex-1 flex flex-col items-center justify-center space-y-2">
          {/* Temperature */}
          <div className="text-center">
            <div className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              {weatherData.temperature}{getTemperatureUnit()}
            </div>
            <div className="text-sm sm:text-base text-muted-foreground">
              Feels like {weatherData.feelsLike}{getTemperatureUnit()}
            </div>
          </div>

          {/* Weather Icon and Description */}
          <div className="flex flex-col items-center space-y-1">
            {style.showIcon !== false && (
              <WeatherIcon className="h-8 w-8 sm:h-12 sm:w-12 text-yellow-500" />
            )}
            <div className="text-sm sm:text-base text-center capitalize">
              {weatherData.description}
            </div>
          </div>
        </div>

        {/* Weather Details */}
        {showDetails && !style.compactMode && (
          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm flex-shrink-0">
            <div className="flex items-center space-x-1">
              <Droplets className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              <span>{weatherData.humidity}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wind className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
              <span>{weatherData.windSpeed} {getSpeedUnit()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
              <span>{weatherData.visibility} {getDistanceUnit()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Thermometer className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
              <span>{weatherData.pressure} hPa</span>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {lastFetch && (
          <div className="text-xs text-muted-foreground text-center mt-2 flex-shrink-0">
            Updated {lastFetch.toLocaleTimeString()}
          </div>
        )}

        {/* Configuration hint for edit mode */}
        {isEditMode && !config.city && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span>Click edit to configure city and settings</span>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
