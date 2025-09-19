'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Wind, 
  Droplets, 
  Eye, 
  Thermometer,
  MapPin,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BaseWidget from './BaseWidget';
import { WidgetProps, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { WidgetDataProvider } from './WidgetDataProvider';
import { getMinimalistStyles } from './design/MinimalistDesignSystem';

export interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  forecast: {
    time: string;
    temperature: number;
    condition: string;
    icon: string;
  }[];
}

export interface WeatherConfig {
  title?: string;
  dataSource?: {
    type: 'manual';
    location?: string;
    weatherData?: WeatherData;
  };
  options?: {
    unit: 'celsius' | 'fahrenheit';
    showForecast: boolean;
    showDetails: boolean;
    autoRefresh: boolean;
    refreshInterval: number; // in minutes
  };
}

interface WeatherWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
  data?: any;
}

const WEATHER_ICONS = {
  'sunny': Sun,
  'clear': Sun,
  'cloudy': Cloud,
  'partly-cloudy': Cloud,
  'rainy': CloudRain,
  'snowy': CloudSnow,
  'windy': Wind,
  'foggy': Eye,
};

const MOCK_WEATHER_DATA: WeatherData = {
  location: 'New York, NY',
  temperature: 22,
  condition: 'sunny',
  humidity: 65,
  windSpeed: 12,
  visibility: 10,
  forecast: [
    { time: '12:00', temperature: 22, condition: 'sunny', icon: 'sunny' },
    { time: '15:00', temperature: 24, condition: 'partly-cloudy', icon: 'partly-cloudy' },
    { time: '18:00', temperature: 20, condition: 'cloudy', icon: 'cloudy' },
    { time: '21:00', temperature: 18, condition: 'rainy', icon: 'rainy' },
  ],
};

export function WeatherWidget({ widget, isEditMode, onEdit, onDelete }: WeatherWidgetProps) {
  const config = (widget.config || {}) as WeatherConfig;
  const options = config.options || {
    unit: 'celsius',
    showForecast: true,
    showDetails: true,
    autoRefresh: true,
    refreshInterval: 30,
  };

  const [weatherData, setWeatherData] = useState<WeatherData>(
    config.dataSource?.weatherData || MOCK_WEATHER_DATA
  );
  const [location, setLocation] = useState(
    config.dataSource?.location || 'New York, NY'
  );
  const [isLoading, setIsLoading] = useState(false);

  const convertTemperature = (temp: number, unit: 'celsius' | 'fahrenheit') => {
    if (unit === 'fahrenheit') {
      return Math.round((temp * 9/5) + 32);
    }
    return temp;
  };

  const getWeatherIcon = (condition: string) => {
    const iconKey = condition.toLowerCase().replace(/\s+/g, '-');
    const IconComponent = WEATHER_ICONS[iconKey as keyof typeof WEATHER_ICONS] || Sun;
    return IconComponent;
  };

  const fetchWeatherData = async (location: string) => {
    setIsLoading(true);
    try {
      // In a real app, you would call a weather API here
      // For now, we'll use mock data with some randomization
      const mockData = {
        ...MOCK_WEATHER_DATA,
        location,
        temperature: Math.round(Math.random() * 20 + 10),
        humidity: Math.round(Math.random() * 40 + 40),
        windSpeed: Math.round(Math.random() * 20 + 5),
      };
      
      setWeatherData(mockData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        fetchWeatherData(location);
      }, options.refreshInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [location, options.autoRefresh, options.refreshInterval]);

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      fetchWeatherData(location.trim());
    }
  };

  const currentTemp = convertTemperature(weatherData.temperature, options.unit);
  const WeatherIcon = getWeatherIcon(weatherData.condition);

  return (
    <WidgetDataProvider widget={widget}>
      {({ data, isLoading: dataLoading, error, refetch }) => (
        <BaseWidget
          widget={widget}
          isEditMode={isEditMode}
          onEdit={onEdit}
          onDelete={onDelete}
          isLoading={dataLoading || isLoading}
          error={error}
          onRefresh={refetch}
          showRefresh={true}
        >
          <div className={getMinimalistStyles.contentStyle('space-y-4')}>
            {/* Header */}
            <div className={getMinimalistStyles.layout.between}>
              <h3 className={getMinimalistStyles.titleStyle('md')}>
                {config.title || 'Weather'}
              </h3>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className={getMinimalistStyles.mutedStyle()}>
                  {weatherData.location}
                </span>
              </div>
            </div>

            {/* Location Search */}
            <form onSubmit={handleLocationSubmit} className="flex space-x-2">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter city name"
                className={getMinimalistStyles.input.base}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className={getMinimalistStyles.button.primary}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </form>

            {/* Current Weather */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center">
                <WeatherIcon className="h-12 w-12 text-yellow-500" />
              </div>
              
              <div className={getMinimalistStyles.valueStyle('xl')}>
                {currentTemp}°{options.unit === 'celsius' ? 'C' : 'F'}
              </div>
              
              <div className={getMinimalistStyles.subtitleStyle()}>
                {weatherData.condition.charAt(0).toUpperCase() + weatherData.condition.slice(1)}
              </div>
            </div>

            {/* Weather Details */}
            {options.showDetails && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className={getMinimalistStyles.mutedStyle()}>Humidity</p>
                    <p className={getMinimalistStyles.textStyle()}>{weatherData.humidity}%</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Wind className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className={getMinimalistStyles.mutedStyle()}>Wind</p>
                    <p className={getMinimalistStyles.textStyle()}>{weatherData.windSpeed} km/h</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className={getMinimalistStyles.mutedStyle()}>Visibility</p>
                    <p className={getMinimalistStyles.textStyle()}>{weatherData.visibility} km</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <div>
                    <p className={getMinimalistStyles.mutedStyle()}>Feels like</p>
                    <p className={getMinimalistStyles.textStyle()}>
                      {convertTemperature(weatherData.temperature + 2, options.unit)}°{options.unit === 'celsius' ? 'C' : 'F'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hourly Forecast */}
            {options.showForecast && weatherData.forecast && (
              <div className="space-y-2">
                <h5 className={getMinimalistStyles.subtitleStyle()}>Hourly Forecast</h5>
                <div className="flex space-x-2 overflow-x-auto">
                  {weatherData.forecast.map((forecast, index) => {
                    const ForecastIcon = getWeatherIcon(forecast.condition);
                    const temp = convertTemperature(forecast.temperature, options.unit);
                    
                    return (
                      <div
                        key={index}
                        className="flex-shrink-0 text-center p-2 bg-gray-50 rounded-lg min-w-[60px]"
                      >
                        <p className={getMinimalistStyles.mutedStyle()}>{forecast.time}</p>
                        <ForecastIcon className="h-6 w-6 mx-auto my-1 text-gray-600" />
                        <p className={getMinimalistStyles.textStyle()}>
                          {temp}°{options.unit === 'celsius' ? 'C' : 'F'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </BaseWidget>
      )}
    </WidgetDataProvider>
  );
}
