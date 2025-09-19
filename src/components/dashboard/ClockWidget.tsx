'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Settings, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BaseWidget from './BaseWidget';
import { WidgetProps, BaseWidget as BaseWidgetType } from '@/types/widgets';
import { WidgetDataProvider } from './WidgetDataProvider';
import { getMinimalistStyles } from './design/MinimalistDesignSystem';

export interface ClockConfig {
  title?: string;
  dataSource?: {
    type: 'manual';
  };
  options?: {
    format: '12h' | '24h';
    timezone: string;
    showSeconds: boolean;
    showDate: boolean;
    showTimezone: boolean;
    size: 'sm' | 'md' | 'lg';
  };
}

interface ClockWidgetProps extends WidgetProps {
  widget: BaseWidgetType;
  data?: any;
  onConfigChange?: (config: ClockConfig) => void;
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York (EST)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export function ClockWidget({ widget, isEditMode, onEdit, onDelete, onConfigChange }: ClockWidgetProps) {
  const config = (widget.config || {}) as ClockConfig;
  const options = config.options || {
    format: '24h',
    timezone: 'UTC',
    showSeconds: true,
    showDate: true,
    showTimezone: true,
    size: 'md',
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);

  // Save options to config when they change
  const saveOptionsToConfig = (newOptions: Partial<ClockConfig['options']>) => {
    const updatedConfig = {
      ...config,
      options: {
        ...options,
        ...newOptions
      }
    };
    onConfigChange?.(updatedConfig);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, format: '12h' | '24h', showSeconds: boolean) => {
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: options.timezone,
      hour12: format === '12h',
      hour: '2-digit',
      minute: '2-digit',
    };

    if (showSeconds) {
      formatOptions.second = '2-digit';
    }

    return date.toLocaleTimeString('en-US', formatOptions);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      timeZone: options.timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeSize = () => {
    switch (options.size) {
      case 'sm': return getMinimalistStyles.valueStyle('md');
      case 'lg': return getMinimalistStyles.valueStyle('xl');
      default: return getMinimalistStyles.valueStyle('lg');
    }
  };

  const timeString = formatTime(currentTime, options.format, options.showSeconds);
  const dateString = formatDate(currentTime);

  return (
    <WidgetDataProvider widget={widget}>
      {({ data, isLoading, error, refetch }) => (
        <BaseWidget
          widget={widget}
          isEditMode={isEditMode}
          onEdit={onEdit}
          onDelete={onDelete}
          isLoading={isLoading}
          error={error}
          onRefresh={refetch}
          showRefresh={false}
        >
          <div className={getMinimalistStyles.contentStyle('space-y-4')}>
            {/* Header */}
            <div className={getMinimalistStyles.layout.between}>
              <h3 className={getMinimalistStyles.titleStyle('md')}>
                {config.title || 'Clock'}
              </h3>
              {isEditMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className={getMinimalistStyles.button.icon}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Settings Panel */}
            {isEditing && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={getMinimalistStyles.subtitleStyle('block mb-1')}>
                      Format
                    </label>
                    <Select
                      value={options.format}
                      onValueChange={(value: '12h' | '24h') => {
                        saveOptionsToConfig({ format: value });
                      }}
                    >
                      <SelectTrigger className={getMinimalistStyles.input.base}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12 Hour</SelectItem>
                        <SelectItem value="24h">24 Hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className={getMinimalistStyles.subtitleStyle('block mb-1')}>
                      Timezone
                    </label>
                    <Select
                      value={options.timezone}
                      onValueChange={(value) => {
                        saveOptionsToConfig({ timezone: value });
                      }}
                    >
                      <SelectTrigger className={getMinimalistStyles.input.base}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.showSeconds}
                      onChange={() => {
                        saveOptionsToConfig({ showSeconds: !options.showSeconds });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className={getMinimalistStyles.subtitleStyle()}>Show seconds</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={options.showDate}
                      onChange={() => {
                        saveOptionsToConfig({ showDate: !options.showDate });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className={getMinimalistStyles.subtitleStyle()}>Show date</span>
                  </label>
                </div>
              </div>
            )}

            {/* Clock Display */}
            <div className="text-center space-y-2 sm:space-y-3 flex flex-col h-full justify-center">
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                {options.showTimezone && (
                  <span className={getMinimalistStyles.mutedStyle()}>
                    {options.timezone}
                  </span>
                )}
              </div>
              
              <div className={`${getTimeSize()} leading-tight`}>
                {timeString}
              </div>
              
              {options.showDate && (
                <div className={`${getMinimalistStyles.subtitleStyle()} truncate`}>
                  {dateString}
                </div>
              )}
            </div>
          </div>
        </BaseWidget>
      )}
    </WidgetDataProvider>
  );
}
