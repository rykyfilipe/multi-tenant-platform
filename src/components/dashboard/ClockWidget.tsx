'use client';

import { useState, useEffect } from 'react';
import { Clock, Globe, Settings } from 'lucide-react';
import BaseWidget from './BaseWidget';

export interface ClockConfig {
  title?: string;
  timezone?: string;
  format?: '12h' | '24h';
  showDate?: boolean;
  showSeconds?: boolean;
  showTimezone?: boolean;
  style?: {
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
    fontFamily?: 'mono' | 'sans' | 'serif';
    color?: string;
    backgroundColor?: string;
  };
}

interface ClockWidgetProps {
  widget: {
    id: number | string;
    title?: string | null;
    type: string;
    config?: ClockConfig;
  };
  isEditMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ClockWidget({ widget, isEditMode, onEdit, onDelete }: ClockWidgetProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState<string>('');

  const config = (widget.config || {}) as ClockConfig;
  const {
    timezone: configTimezone = 'local',
    format = '24h',
    showDate = true,
    showSeconds = true,
    showTimezone = true,
    style = {}
  } = config;

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Set timezone
  useEffect(() => {
    if (configTimezone === 'local') {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } else {
      setTimezone(configTimezone);
    }
  }, [configTimezone]);

  const formatTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: configTimezone === 'local' ? undefined : configTimezone,
      hour12: format === '12h',
      hour: '2-digit',
      minute: '2-digit',
    };

    if (showSeconds) {
      options.second = '2-digit';
    }

    return date.toLocaleTimeString('en-US', options);
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: configTimezone === 'local' ? undefined : configTimezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    return date.toLocaleDateString('en-US', options);
  };

  const getFontSizeClass = () => {
    const size = style.fontSize || '2xl';
    return `text-${size}`;
  };

  const getFontFamilyClass = () => {
    const family = style.fontFamily || 'mono';
    return `font-${family}`;
  };

  const timeDisplay = formatTime(currentTime);
  const dateDisplay = formatDate(currentTime);

  return (
    <BaseWidget
      widget={widget}
      isEditMode={isEditMode}
      onEdit={onEdit}
      onDelete={onDelete}
      isLoading={false}
      error={null}
    >
      <div className="h-full flex flex-col items-center justify-center p-4">
        <div 
          className={`${getFontSizeClass()} ${getFontFamilyClass()} text-center`}
          style={{ 
            color: style.color || 'inherit',
            backgroundColor: style.backgroundColor || 'transparent'
          }}
        >
          {/* Time Display */}
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Clock className="h-6 w-6 sm:h-8 sm:w-8" />
            <span className="font-bold">{timeDisplay}</span>
          </div>

          {/* Date Display */}
          {showDate && (
            <div className="text-sm sm:text-base text-muted-foreground mb-2">
              {dateDisplay}
            </div>
          )}

          {/* Timezone Display */}
          {showTimezone && timezone && (
            <div className="flex items-center justify-center space-x-1 text-xs sm:text-sm text-muted-foreground">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{timezone}</span>
            </div>
          )}
        </div>

        {/* Configuration hint for edit mode */}
        {isEditMode && !config.timezone && (
          <div className="mt-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-xs text-blue-600 dark:text-blue-400">
            <div className="flex items-center space-x-1">
              <Settings className="h-3 w-3" />
              <span>Click edit to configure timezone and format</span>
            </div>
          </div>
        )}
      </div>
    </BaseWidget>
  );
}
